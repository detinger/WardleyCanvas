// IO-03: Import preparation — a pure, atomic preview of an OWM or native JSON import.
// Nothing here touches the current map: the caller commits `preview.map` only
// after the user confirms, so cancel or error always leaves the map unchanged.

import { WardleyMap, MapElement, makeEmptyAnalysis, DEFAULT_EVOLUTION_LABELS, DEFAULT_STAGE_BOUNDARIES } from '@/domain/types';
import { upgradeMap } from '@/domain/migration';
import { validateMap } from '@/domain/validation';
import { parseOWM, sanitizeUrl, mergeParsedMap, OWMDiagnostic } from './owm';

/** Hard limits that keep a hostile or accidental file from freezing the tab. */
export const MAX_IMPORT_CHARS = 2_000_000;
const MAX_IMPORT_ELEMENTS = 2_000;

export type ImportFormat = 'owm' | 'json';

export interface ImportPreview {
  format: ImportFormat;
  /** Candidate map; only meaningful when hasErrors is false */
  map: WardleyMap;
  diagnostics: OWMDiagnostic[];
  unsupported: string[];
  /** Plain-language notes about information that will not carry over */
  lossNotes: string[];
  hasErrors: boolean;
}

export function detectFormat(text: string, fileName?: string): ImportFormat {
  if (fileName?.toLowerCase().endsWith('.json')) return 'json';
  if (fileName && /\.(owm|txt)$/i.test(fileName)) return 'owm';
  return text.trimStart().startsWith('{') ? 'json' : 'owm';
}

export function prepareImport(text: string, currentMap: WardleyMap, fileName?: string): ImportPreview {
  const format = detectFormat(text, fileName);
  const fail = (message: string): ImportPreview => ({
    format,
    map: currentMap,
    diagnostics: [{ line: 0, col: 1, message, severity: 'error' }],
    unsupported: [],
    lossNotes: [],
    hasErrors: true,
  });

  if (text.length > MAX_IMPORT_CHARS) {
    return fail(`File is too large to import (${Math.round(text.length / 1000)} KB; limit ${MAX_IMPORT_CHARS / 1000} KB).`);
  }

  const preview = format === 'json' ? prepareJson(text, currentMap) : prepareOwm(text, currentMap);
  if (preview.hasErrors) return preview;

  if (preview.map.elements.length > MAX_IMPORT_ELEMENTS) {
    return fail(`Map has ${preview.map.elements.length} elements; the limit is ${MAX_IMPORT_ELEMENTS}.`);
  }
  // Structural errors (dangling references, out-of-range coordinates) block the import
  for (const f of validateMap(preview.map)) {
    if (f.severity === 'error') {
      preview.diagnostics.push({ line: 0, col: 1, message: f.message, severity: 'error' });
      preview.hasErrors = true;
    }
  }
  return preview;
}

function prepareOwm(text: string, currentMap: WardleyMap): ImportPreview {
  const result = parseOWM(text, currentMap.id);
  const lossNotes: string[] = [];
  if (result.unsupported.length > 0) {
    lossNotes.push(`Skipped unsupported constructs: ${result.unsupported.join(', ')}.`);
  }
  const ignored = result.diagnostics.filter((d) => d.message.startsWith('Unrecognised')).length;
  if (ignored > 0) lossNotes.push(`${ignored} unrecognised line${ignored === 1 ? '' : 's'} will be ignored.`);
  return { format: 'owm', map: result.map, diagnostics: result.diagnostics, unsupported: result.unsupported, lossNotes, hasErrors: result.hasErrors };
}

function prepareJson(text: string, currentMap: WardleyMap): ImportPreview {
  const diagnostics: OWMDiagnostic[] = [];
  const error = (message: string): ImportPreview => ({
    format: 'json',
    map: currentMap,
    diagnostics: [{ line: 0, col: 1, message, severity: 'error' }],
    unsupported: [],
    lossNotes: [],
    hasErrors: true,
  });

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return error(`Not valid JSON: ${(e as Error).message}`);
  }

  let upgraded: WardleyMap;
  try {
    upgraded = upgradeMap(raw);
  } catch (e) {
    return error(`Not a recognised Wardley map file: ${(e as Error).message.replace(/^upgradeMap: /, '')}`);
  }

  const obj = upgraded as Partial<WardleyMap>;
  if (!Array.isArray(obj.elements)) return error('Map file has no "elements" list.');

  // Coerce to a well-formed document: never trust optional structure from a file
  const elements: MapElement[] = [];
  for (const el of obj.elements as unknown[]) {
    if (!isElementLike(el)) {
      diagnostics.push({ line: 0, col: 1, message: 'Skipped an element with missing id, name or coordinates', severity: 'warning' });
      continue;
    }
    const clean: MapElement = { ...el, name: String(el.name), componentType: el.componentType ?? 'unspecified' };
    if (clean.submapRef?.url) {
      const url = sanitizeUrl(clean.submapRef.url);
      if (url) clean.submapRef = { ...clean.submapRef, url };
      else {
        clean.submapRef = { ...clean.submapRef, url: undefined };
        diagnostics.push({ line: 0, col: 1, message: `Submap URL for "${clean.name}" was removed: only http(s) links are allowed`, severity: 'warning' });
      }
    }
    elements.push(clean);
  }

  const analysis = { ...makeEmptyAnalysis(), ...(obj.analysis ?? {}) };
  analysis.evidence = analysis.evidence.map((ev) =>
    ev.sourceUrl && !sanitizeUrl(ev.sourceUrl) ? { ...ev, sourceUrl: undefined } : ev
  );

  const map: WardleyMap = {
    ...currentMap,
    ...obj,
    // The import replaces the content of the map being edited, not its identity
    id: currentMap.id,
    createdAt: currentMap.createdAt,
    revision: currentMap.revision,
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title : currentMap.title,
    evolutionLabels: Array.isArray(obj.evolutionLabels) && obj.evolutionLabels.length === 4 ? obj.evolutionLabels : DEFAULT_EVOLUTION_LABELS,
    stageBoundaries: Array.isArray(obj.stageBoundaries) && obj.stageBoundaries.length === 3 ? obj.stageBoundaries : DEFAULT_STAGE_BOUNDARIES,
    elements,
    dependencies: Array.isArray(obj.dependencies) ? obj.dependencies : [],
    evolutions: Array.isArray(obj.evolutions) ? obj.evolutions : [],
    pipelines: Array.isArray(obj.pipelines) ? obj.pipelines : [],
    annotations: Array.isArray(obj.annotations) ? obj.annotations : [],
    analysis,
  };

  const lossNotes: string[] = [];
  const hasAnalysis = ['climate', 'doctrine', 'gameplay', 'evidence', 'decisions'].some(
    (k) => (analysis[k as keyof typeof analysis] as unknown[]).length > 0
  );
  if (hasAnalysis) lossNotes.push("The file's analysis layers will replace the current map's analysis.");

  return { format: 'json', map, diagnostics, unsupported: [], lossNotes, hasErrors: false };
}

/**
 * The map to commit once the user confirms. A native file that carries its own
 * analysis is taken whole (its analysis references its own IDs); otherwise the
 * import is merged by name so the current analysis stays linked.
 */
export function commitImport(current: WardleyMap, preview: ImportPreview): WardleyMap {
  if (preview.hasErrors) return current;
  const a = preview.map.analysis;
  const fileHasAnalysis = preview.format === 'json' &&
    a.climate.length + a.doctrine.length + a.gameplay.length + a.evidence.length + a.decisions.length > 0;
  if (fileHasAnalysis) return preview.map;
  const merged = mergeParsedMap(current, preview.map);
  return preview.format === 'json'
    ? { ...merged, evolutionLabels: preview.map.evolutionLabels, stageBoundaries: preview.map.stageBoundaries, extensions: preview.map.extensions }
    : merged;
}

function isElementLike(v: unknown): v is MapElement {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.id === 'string' && e.id.length > 0 &&
    (typeof e.name === 'string' || typeof e.name === 'number') &&
    typeof e.visibility === 'number' && typeof e.evolution === 'number' &&
    typeof e.kind === 'string';
}

// ---------------------------------------------------------------------------
// Export loss report (OWM is a subset of the native model)
// ---------------------------------------------------------------------------

/** What an OWM export of this map would leave out, in plain language. */
export function owmLossReport(map: WardleyMap): string[] {
  const notes: string[] = [];
  const count = (pred: (e: MapElement) => boolean) => map.elements.filter(pred).length;
  const described = count((e) => !!e.description);
  if (described) notes.push(`${described} component description${described === 1 ? '' : 's'}`);
  const typed = count((e) => e.componentType !== 'unspecified');
  if (typed) notes.push(`${typed} component type${typed === 1 ? '' : 's'}`);
  const tagged = count((e) => !!e.tags?.length);
  if (tagged) notes.push(`tags on ${tagged} component${tagged === 1 ? '' : 's'}`);
  const evidenced = count((e) => !!e.evidenceIds?.length);
  if (evidenced) notes.push(`evidence links on ${evidenced} component${evidenced === 1 ? '' : 's'}`);
  const ecosystems = count((e) => e.kind === 'ecosystem');
  if (ecosystems) notes.push(`${ecosystems} ecosystem${ecosystems === 1 ? '' : 's'} (exported as components)`);
  const rationale = map.evolutions.filter((e) => e.rationale || e.sourcing).length;
  if (rationale) notes.push(`rationale/sourcing on ${rationale} evolve arrow${rationale === 1 ? '' : 's'}`);
  const a = map.analysis;
  const assessments = a.climate.length + a.doctrine.length + a.gameplay.length;
  if (assessments) notes.push(`${assessments} climate/doctrine/gameplay assessment${assessments === 1 ? '' : 's'}`);
  if (a.evidence.length) notes.push(`${a.evidence.length} evidence record${a.evidence.length === 1 ? '' : 's'}`);
  if (a.decisions.length) notes.push(`${a.decisions.length} decision record${a.decisions.length === 1 ? '' : 's'}`);
  if (map.evolutionLabels.join('|') !== DEFAULT_EVOLUTION_LABELS.join('|')) notes.push('custom evolution stage labels');
  if (map.stageBoundaries.join('|') !== DEFAULT_STAGE_BOUNDARIES.join('|')) notes.push('custom stage boundaries');
  const names = new Set<string>();
  let dupes = 0;
  for (const e of map.elements) { if (names.has(e.name)) dupes++; names.add(e.name); }
  if (dupes) notes.push(`${dupes} element${dupes === 1 ? '' : 's'} with a duplicate name (OWM identifies elements by name)`);
  return notes;
}
