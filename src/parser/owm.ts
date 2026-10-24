// IO-01: OWM (OnlineWardleyMaps) parser and serializer.
// Spec: https://docs.onlinewardleymaps.com/docs/dsl-reference/
// Coordinates in OWM: [visibility, maturity] both 0..1.
// visibility 1=top/visible, maturity 0=genesis, 1=commodity — matches our domain model exactly.

import {
  WardleyMap,
  MapElement,
  Dependency,
  EvolutionMovement,
  Pipeline,
  MapAnnotation,
  Id,
  Normalized,
  clampNormalized,
  generateId,
  makeNewMap,
  makeEmptyAnalysis,
  DEFAULT_EVOLUTION_LABELS,
  DEFAULT_STAGE_BOUNDARIES,
} from '@/domain/types';

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export interface OWMDiagnostic {
  line: number;    // 1-based
  col: number;     // 1-based
  message: string;
  severity: 'error' | 'warning';
}

export interface OWMParseResult {
  map: WardleyMap;           // best-effort partial map (may be incomplete on errors)
  diagnostics: OWMDiagnostic[];
  unsupported: string[];     // construct names we skipped
  hasErrors: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFloat2(s: string): number | null {
  const n = parseFloat(s.trim());
  return isNaN(n) ? null : n;
}

function warn(diags: OWMDiagnostic[], line: number, message: string): void {
  diags.push({ line, col: 1, message, severity: 'warning' });
}

function err(diags: OWMDiagnostic[], line: number, message: string): void {
  diags.push({ line, col: 1, message, severity: 'error' });
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

// Line-pattern regexes
const RE_COMMENT    = /^\s*\/\//;
const RE_BLANK      = /^\s*$/;
const RE_TITLE      = /^title\s+(.+)$/i;
const RE_STYLE      = /^style\s+/i;
const RE_SIZE       = /^size\s+/i;
const RE_ANCHOR     = /^anchor\s+(.+?)\s*\[([^\]]+)\](?:\s+label\s+\[([^\]]+)\])?$/i;
const RE_COMPONENT  = /^component\s+(.+?)\s*\[([^\]]+)\](?:\s+label\s+\[([^\]]+)\])?$/i;
// Second name is greedy to handle names with spaces (labels not supported in current DSL subset)
const RE_DEP        = /^(.+?)\s*->\s*(.+)$/;
const RE_FLOW       = /^(.+?)\s*\+>\s*(.+)$/;
const RE_EVOLVE     = /^evolve\s+(.+?)\s+([\d.]+)(?:\s+as\s+(.+))?$/i;
const RE_INERTIA    = /^inertia\s+(.+)$/i;
const RE_BUILD      = /^build\s+(.+)$/i;
const RE_BUY        = /^buy\s+(.+)$/i;
const RE_OUTSOURCE  = /^outsource\s+(.+)$/i;
const RE_NOTE       = /^note\s+(.+?)\s*\[([^\]]+)\]$/i;
const RE_ANNOTATION = /^annotation\s+(\d+)\s+\[([^\]]+)\]\s+(.+)$/i;
const RE_PIPELINE   = /^pipeline\s+(.+?)\s*\[([^\]]+)\]$/i;
const RE_MARKET     = /^market\s+(.+?)\s*\[([^\]]+)\]$/i;
const RE_SUBMAP     = /^submap\s+(.+?)\s*\[([^\]]+)\](?:\s+url\s*\[([^\]]+)\])?$/i;

function parseCoords(raw: string, diags: OWMDiagnostic[], line: number): [Normalized, Normalized] | null {
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length < 2) {
    err(diags, line, `Expected [visibility, maturity] coordinates, got: [${raw}]`);
    return null;
  }
  const vis = parseFloat2(parts[0]);
  const mat = parseFloat2(parts[1]);
  if (vis === null || mat === null) {
    err(diags, line, `Non-numeric coordinates: [${raw}]`);
    return null;
  }
  return [clampNormalized(vis), clampNormalized(mat)];
}

function parseLabelOffset(raw: string): { x: number; y: number } | undefined {
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length < 2) return undefined;
  const x = parseFloat2(parts[0]);
  const y = parseFloat2(parts[1]);
  if (x === null || y === null) return undefined;
  return { x, y };
}

export function parseOWM(source: string, existingId?: Id): OWMParseResult {
  const diags: OWMDiagnostic[] = [];
  const unsupported: string[] = [];

  const mapId = existingId ?? generateId('map');
  const now = new Date().toISOString();

  // Working state
  let title = 'Untitled Map';
  const elementsByName = new Map<string, MapElement>();
  const elements: MapElement[] = [];
  const dependencies: Dependency[] = [];
  const evolutions: EvolutionMovement[] = [];
  const pipelines: Pipeline[] = [];
  const annotations: MapAnnotation[] = [];

  // Deferred: inertia / sourcing / evolve may reference elements not yet parsed
  const pendingInertia: Array<{ name: string; line: number }> = [];
  const pendingSourced: Array<{ name: string; sourcing: 'build' | 'buy' | 'outsource'; line: number }> = [];

  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    // Strip inline comments and trim
    const raw = lines[i].replace(/\/\/.*$/, '').trim();
    if (RE_BLANK.test(raw) || RE_COMMENT.test(lines[i])) continue;

    // title
    let m = RE_TITLE.exec(raw);
    if (m) { title = m[1].trim(); continue; }

    // style / size — accepted, ignored
    if (RE_STYLE.test(raw) || RE_SIZE.test(raw)) continue;

    // anchor
    m = RE_ANCHOR.exec(raw);
    if (m) {
      const name = m[1].trim();
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      const el: MapElement = {
        id: generateId('el'),
        kind: 'anchor',
        name,
        componentType: 'unspecified',
        visibility: coords[0],
        evolution: coords[1],
      };
      if (m[3]) el.labelOffset = parseLabelOffset(m[3]);
      if (elementsByName.has(name)) {
        warn(diags, lineNum, `Duplicate name "${name}" — later definition used`);
      }
      elementsByName.set(name, el);
      elements.push(el);
      continue;
    }

    // component
    m = RE_COMPONENT.exec(raw);
    if (m) {
      const name = m[1].trim();
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      const el: MapElement = {
        id: generateId('el'),
        kind: 'component',
        name,
        componentType: 'unspecified',
        visibility: coords[0],
        evolution: coords[1],
      };
      if (m[3]) el.labelOffset = parseLabelOffset(m[3]);
      if (elementsByName.has(name)) {
        warn(diags, lineNum, `Duplicate name "${name}" — later definition used`);
      }
      elementsByName.set(name, el);
      elements.push(el);
      continue;
    }

    // market
    m = RE_MARKET.exec(raw);
    if (m) {
      const name = m[1].trim();
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      const el: MapElement = {
        id: generateId('el'),
        kind: 'market',
        name,
        componentType: 'unspecified',
        visibility: coords[0],
        evolution: coords[1],
      };
      elementsByName.set(name, el);
      elements.push(el);
      continue;
    }

    // submap
    m = RE_SUBMAP.exec(raw);
    if (m) {
      const name = m[1].trim();
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      const el: MapElement = {
        id: generateId('el'),
        kind: 'submap',
        name,
        componentType: 'unspecified',
        visibility: coords[0],
        evolution: coords[1],
      };
      if (m[3]) el.submapRef = { url: m[3].trim() };
      elementsByName.set(name, el);
      elements.push(el);
      continue;
    }

    // flow (must come before dep because `+>` might not appear in dep re, but let's be safe)
    m = RE_FLOW.exec(raw);
    if (m && raw.includes('+>')) {
      const fromName = m[1].trim();
      const toName = m[2].trim();
      const dep: Dependency = {
        id: generateId('dep'),
        fromId: fromName, // resolved below
        toId: toName,     // resolved below
        kind: 'flow',
      };
      (dep as any)._fromName = fromName;
      (dep as any)._toName = toName;
      dependencies.push(dep);
      continue;
    }

    // dependency
    m = RE_DEP.exec(raw);
    if (m && raw.includes('->')) {
      const fromName = m[1].trim();
      const toName = m[2].trim();
      const dep: Dependency = {
        id: generateId('dep'),
        fromId: fromName,
        toId: toName,
        kind: 'dependency',
      };
      (dep as any)._fromName = fromName;
      (dep as any)._toName = toName;
      dependencies.push(dep);
      continue;
    }

    // evolve
    m = RE_EVOLVE.exec(raw);
    if (m) {
      const name = m[1].trim();
      const target = parseFloat2(m[2]);
      if (target === null) {
        err(diags, lineNum, `Invalid evolve target: "${m[2]}"`);
        continue;
      }
      evolutions.push({
        id: generateId('ev'),
        elementId: name, // resolved below
        targetEvolution: clampNormalized(target),
        ...(m[3] ? { targetName: m[3].trim() } : {}),
      });
      (evolutions[evolutions.length - 1] as any)._elementName = name;
      continue;
    }

    // inertia
    m = RE_INERTIA.exec(raw);
    if (m) {
      pendingInertia.push({ name: m[1].trim(), line: lineNum });
      continue;
    }

    // sourcing
    m = RE_BUILD.exec(raw);
    if (m) { pendingSourced.push({ name: m[1].trim(), sourcing: 'build', line: lineNum }); continue; }
    m = RE_BUY.exec(raw);
    if (m) { pendingSourced.push({ name: m[1].trim(), sourcing: 'buy', line: lineNum }); continue; }
    m = RE_OUTSOURCE.exec(raw);
    if (m) { pendingSourced.push({ name: m[1].trim(), sourcing: 'outsource', line: lineNum }); continue; }

    // note
    m = RE_NOTE.exec(raw);
    if (m) {
      const text = m[1].trim();
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      annotations.push({
        id: generateId('ann'),
        text,
        x: coords[1], // OWM note coords: [y, x] — stored as [vis, mat] same as elements
        y: coords[0],
      });
      continue;
    }

    // numbered annotation
    m = RE_ANNOTATION.exec(raw);
    if (m) {
      const num = parseInt(m[1], 10);
      const coords = parseCoords(m[2], diags, lineNum);
      if (!coords) continue;
      annotations.push({
        id: generateId('ann'),
        number: num,
        text: m[3].trim(),
        x: coords[1],
        y: coords[0],
      });
      continue;
    }

    // pipeline
    m = RE_PIPELINE.exec(raw);
    if (m) {
      const name = m[1].trim();
      const parts = m[2].split(',').map((s) => s.trim());
      const lo = parseFloat2(parts[0]);
      const hi = parseFloat2(parts[1]);
      if (lo === null || hi === null) {
        err(diags, lineNum, `Invalid pipeline range for "${name}"`);
        continue;
      }
      pipelines.push({
        id: generateId('pip'),
        parentElementId: name, // resolved below
        memberElementIds: [],
        startEvolution: clampNormalized(Math.min(lo, hi)),
        endEvolution: clampNormalized(Math.max(lo, hi)),
      });
      (pipelines[pipelines.length - 1] as any)._parentName = name;
      continue;
    }

    // unrecognised — record as unsupported if it looks intentional
    if (raw.length > 0) {
      const kw = raw.split(/\s+/)[0].toLowerCase();
      const knownUnsupported = ['accelerator', 'deaccelerator', 'pioneer', 'settler', 'townplanner', 'pioneers', 'settlers'];
      if (knownUnsupported.includes(kw)) {
        if (!unsupported.includes(kw)) unsupported.push(kw);
      } else {
        warn(diags, lineNum, `Unrecognised construct: "${raw.slice(0, 60)}"`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Resolve name references to IDs
  // -------------------------------------------------------------------------

  // Inertia
  for (const { name, line } of pendingInertia) {
    const el = elementsByName.get(name);
    if (!el) { warn(diags, line, `inertia: element "${name}" not found`); continue; }
    el.inertia = true;
  }

  // Sourcing
  for (const { name, sourcing, line } of pendingSourced) {
    const el = elementsByName.get(name);
    if (!el) { warn(diags, line, `${sourcing}: element "${name}" not found`); continue; }
    el.sourcing = sourcing;
  }

  // Dependencies
  for (const dep of dependencies) {
    const fromName = (dep as any)._fromName as string;
    const toName = (dep as any)._toName as string;
    const fromEl = elementsByName.get(fromName);
    const toEl = elementsByName.get(toName);
    if (!fromEl) { err(diags, 0, `Dependency from "${fromName}" not found`); dep.fromId = ''; continue; }
    if (!toEl)   { err(diags, 0, `Dependency to "${toName}" not found`); dep.toId = ''; continue; }
    dep.fromId = fromEl.id;
    dep.toId = toEl.id;
    delete (dep as any)._fromName;
    delete (dep as any)._toName;
  }

  // Evolutions
  for (const ev of evolutions) {
    const name = (ev as any)._elementName as string;
    const el = elementsByName.get(name);
    if (!el) { warn(diags, 0, `evolve: element "${name}" not found`); ev.elementId = ''; continue; }
    ev.elementId = el.id;
    delete (ev as any)._elementName;
  }

  // Pipelines
  for (const pip of pipelines) {
    const name = (pip as any)._parentName as string;
    const el = elementsByName.get(name);
    if (!el) { warn(diags, 0, `pipeline: element "${name}" not found`); continue; }
    pip.parentElementId = el.id;
    // Assign member elements whose evolution falls within the pipeline range
    for (const candidate of elements) {
      if (candidate.id !== el.id &&
          candidate.evolution >= pip.startEvolution &&
          candidate.evolution <= pip.endEvolution &&
          Math.abs(candidate.visibility - el.visibility) < 0.1) {
        pip.memberElementIds.push(candidate.id);
      }
    }
    delete (pip as any)._parentName;
  }

  // Remove deps with unresolved endpoints
  const resolvedDeps = dependencies.filter((d) => d.fromId && d.toId);

  const map: WardleyMap = {
    schemaVersion: 1,
    id: mapId,
    title,
    evolutionLabels: DEFAULT_EVOLUTION_LABELS,
    stageBoundaries: DEFAULT_STAGE_BOUNDARIES,
    elements,
    dependencies: resolvedDeps,
    evolutions: evolutions.filter((e) => e.elementId),
    pipelines: pipelines.filter((p) => p.parentElementId && !((p as any)._parentName)),
    annotations,
    analysis: makeEmptyAnalysis(),
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };

  return {
    map,
    diagnostics: diags,
    unsupported,
    hasErrors: diags.some((d) => d.severity === 'error'),
  };
}

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

function escapeName(name: string): string {
  // OWM names shouldn't contain newlines; otherwise they're used as-is
  return name.replace(/\n/g, ' ');
}

function fmtCoord(n: number): string {
  // 2 decimal places, no trailing zeros beyond 2
  return n.toFixed(2);
}

export function serializeOWM(map: WardleyMap): string {
  const lines: string[] = [];

  lines.push(`title ${map.title}`);
  if (map.purpose) lines.push(`// ${map.purpose}`);
  lines.push('');

  // Anchors first
  const anchors = map.elements.filter((e) => e.kind === 'anchor');
  const others  = map.elements.filter((e) => e.kind !== 'anchor');

  if (anchors.length > 0) {
    for (const el of anchors) {
      let line = `anchor ${escapeName(el.name)} [${fmtCoord(el.visibility)}, ${fmtCoord(el.evolution)}]`;
      if (el.labelOffset) line += ` label [${fmtCoord(el.labelOffset.x)}, ${fmtCoord(el.labelOffset.y)}]`;
      lines.push(line);
    }
    lines.push('');
  }

  // Components / markets / submaps
  for (const el of others) {
    const kw = el.kind === 'market' ? 'market'
             : el.kind === 'submap' ? 'submap'
             : 'component';
    let line = `${kw} ${escapeName(el.name)} [${fmtCoord(el.visibility)}, ${fmtCoord(el.evolution)}]`;
    if (el.labelOffset) line += ` label [${fmtCoord(el.labelOffset.x)}, ${fmtCoord(el.labelOffset.y)}]`;
    if (el.kind === 'submap' && el.submapRef?.url) line += ` url [${el.submapRef.url}]`;
    lines.push(line);
  }

  if (others.length > 0) lines.push('');

  // Build index for name lookup
  const nameById = new Map(map.elements.map((e) => [e.id, e.name]));

  // Dependencies
  for (const dep of map.dependencies) {
    const from = nameById.get(dep.fromId);
    const to   = nameById.get(dep.toId);
    if (!from || !to) continue;
    const arrow = dep.kind === 'flow' ? '+>' : '->';
    let line = `${escapeName(from)}${arrow}${escapeName(to)}`;
    if (dep.label) line += ` ${dep.label}`;
    lines.push(line);
  }
  if (map.dependencies.length > 0) lines.push('');

  // Evolutions
  for (const ev of map.evolutions) {
    const name = nameById.get(ev.elementId);
    if (!name) continue;
    let line = `evolve ${escapeName(name)} ${fmtCoord(ev.targetEvolution)}`;
    if (ev.targetName) line += ` as ${ev.targetName}`;
    lines.push(line);
  }
  if (map.evolutions.length > 0) lines.push('');

  // Inertia
  const inertiaEls = map.elements.filter((e) => e.inertia);
  for (const el of inertiaEls) {
    lines.push(`inertia ${escapeName(el.name)}`);
  }
  if (inertiaEls.length > 0) lines.push('');

  // Sourcing
  const sourcedEls = map.elements.filter((e) => e.sourcing && e.sourcing !== 'unspecified');
  for (const el of sourcedEls) {
    lines.push(`${el.sourcing} ${escapeName(el.name)}`);
  }
  if (sourcedEls.length > 0) lines.push('');

  // Pipelines
  for (const pip of map.pipelines) {
    const name = nameById.get(pip.parentElementId);
    if (!name) continue;
    lines.push(`pipeline ${escapeName(name)} [${fmtCoord(pip.startEvolution)}, ${fmtCoord(pip.endEvolution)}]`);
  }
  if (map.pipelines.length > 0) lines.push('');

  // Annotations / notes
  for (const ann of map.annotations) {
    if (ann.number != null) {
      lines.push(`annotation ${ann.number} [${fmtCoord(ann.y)}, ${fmtCoord(ann.x)}] ${ann.text}`);
    } else {
      lines.push(`note ${ann.text} [${fmtCoord(ann.y)}, ${fmtCoord(ann.x)}]`);
    }
  }

  // Trim trailing blank lines, keep one
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Round-trip helper (for tests / validation)
// ---------------------------------------------------------------------------

export function roundTripOWM(map: WardleyMap): OWMParseResult {
  const owm = serializeOWM(map);
  return parseOWM(owm, map.id);
}
