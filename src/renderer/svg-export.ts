// IO-04: Deterministic, self-contained SVG rendering of a map for export.
// Pure function of (map, options): no DOM, no viewport, no selection state,
// so unchanged input always yields byte-identical output.
// All user text is XML-escaped; nothing imported is ever emitted as markup.

import { WardleyMap, MapElement } from '@/domain/types';
import { LW, LH, toSvgX, toSvgY, trimLineEnd } from './geometry';

export type ExportTheme = 'light' | 'dark';

export interface SvgExportOptions {
  theme?: ExportTheme;
  /** Draw the theme background; false leaves it transparent */
  background?: boolean;
  /** Include the map title above the plot */
  includeTitle?: boolean;
}

// Exact values of the section 4.2 tokens used by the canvas (globals.css)
const PALETTES: Record<ExportTheme, Record<string, string>> = {
  light: {
    bg: '#ffffff', stroke: '#22242a', fill: '#ffffff', label: '#22242a',
    border: '#d6dce5', borderStrong: '#b7c1cf', subtle: '#6b7787', muted: '#4b5867',
    accent: '#d9822b', warning: '#b7791f', primary: '#1f5f8b', primarySoft: '#e3eef7',
    info: '#5a6779', elevated: '#ffffff', text: '#17202c',
  },
  dark: {
    bg: '#141a22', stroke: '#d7dee8', fill: '#1b232d', label: '#e6ebf1',
    border: '#2b3645', borderStrong: '#3b4a5e', subtle: '#8a97a8', muted: '#b2bdcb',
    accent: '#f0a457', warning: '#e8b45a', primary: '#5aa7d8', primarySoft: '#16314a',
    info: '#a3afbf', elevated: '#171e27', text: '#e6ebf1',
  },
};

const ELEMENT_RADIUS = 8;
const ANCHOR_HALF = 10;
const MARGIN = { top: 40, right: 40, bottom: 50, left: 70 };
const TITLE_HEIGHT = 36;

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Strip characters that are illegal in XML 1.0
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** Fixed-precision number formatting keeps output stable across platforms. */
function n(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

export function exportSize(options: SvgExportOptions = {}): { width: number; height: number } {
  const titleH = options.includeTitle === false ? 0 : TITLE_HEIGHT;
  return { width: LW + MARGIN.left + MARGIN.right, height: LH + MARGIN.top + MARGIN.bottom + titleH };
}

export function renderMapSVG(map: WardleyMap, options: SvgExportOptions = {}): string {
  const theme = options.theme ?? 'light';
  const c = PALETTES[theme];
  const includeTitle = options.includeTitle !== false;
  const titleH = includeTitle ? TITLE_HEIGHT : 0;
  const { width, height } = exportSize(options);
  const byId = new Map(map.elements.map((e) => [e.id, e]));
  const out: string[] = [];

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
      `font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" role="img" aria-label="${escapeXml(map.title)}">`
  );
  out.push(`<title>${escapeXml(map.title)}</title>`);
  if (map.purpose) out.push(`<desc>${escapeXml(map.purpose)}</desc>`);
  out.push(
    '<defs>' +
      `<marker id="dep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${c.subtle}"/></marker>` +
      `<marker id="evolve-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${c.accent}"/></marker>` +
      '</defs>'
  );
  if (options.background !== false) {
    out.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${c.bg}"/>`);
  }
  if (includeTitle) {
    out.push(`<text x="${MARGIN.left}" y="${n(MARGIN.top / 2 + 10)}" font-size="18" font-weight="650" fill="${c.text}">${escapeXml(map.title)}</text>`);
  }

  out.push(`<g transform="translate(${MARGIN.left} ${MARGIN.top + titleH})">`);

  // Axes and stage boundaries
  for (const b of map.stageBoundaries) {
    out.push(`<line x1="${n(b * LW)}" y1="0" x2="${n(b * LW)}" y2="${LH}" stroke="${c.border}" stroke-width="1" stroke-dasharray="4 4"/>`);
  }
  out.push(`<line x1="0" y1="0" x2="0" y2="${LH}" stroke="${c.borderStrong}" stroke-width="1.5"/>`);
  out.push(`<line x1="0" y1="${LH}" x2="${LW}" y2="${LH}" stroke="${c.borderStrong}" stroke-width="1.5"/>`);
  out.push(`<text x="-14" y="12" font-size="11" fill="${c.subtle}" text-anchor="end">Visible</text>`);
  out.push(`<text x="-14" y="${LH - 4}" font-size="11" fill="${c.subtle}" text-anchor="end">Invisible</text>`);
  out.push(`<text transform="rotate(-90) translate(${-LH / 2} -50)" font-size="11" fill="${c.subtle}" text-anchor="middle">Value Chain</text>`);
  map.evolutionLabels.forEach((label, i) => {
    const prev = i === 0 ? 0 : map.stageBoundaries[i - 1];
    const next = i < map.stageBoundaries.length ? map.stageBoundaries[i] : 1;
    out.push(`<text x="${n(((prev + next) / 2) * LW)}" y="${LH + 22}" font-size="11" fill="${c.subtle}" text-anchor="middle">${escapeXml(label)}</text>`);
  });
  out.push(`<text x="${LW}" y="${LH + 40}" font-size="11" fill="${c.subtle}" text-anchor="end">Evolution →</text>`);

  // Pipelines
  for (const pip of map.pipelines) {
    const parent = byId.get(pip.parentElementId);
    if (!parent) continue;
    const y = toSvgY(parent.visibility);
    out.push(
      `<rect x="${n(toSvgX(pip.startEvolution))}" y="${n(y - 14)}" width="${n(toSvgX(pip.endEvolution) - toSvgX(pip.startEvolution))}" height="28" rx="6" ` +
        `fill="${c.primarySoft}" stroke="${c.primary}" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>`
    );
  }

  // Evolve arrows
  for (const ev of map.evolutions) {
    const el = byId.get(ev.elementId);
    if (!el) continue;
    const y = toSvgY(el.visibility);
    const x1 = toSvgX(el.evolution);
    const x2 = toSvgX(ev.targetEvolution);
    if (Math.abs(x2 - x1) < 2) continue;
    out.push(`<line x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}" stroke="${c.accent}" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#evolve-arrow)"/>`);
    if (ev.targetName) {
      out.push(`<text x="${n((x1 + x2) / 2)}" y="${n(y - 8)}" font-size="10" fill="${c.accent}" text-anchor="middle">${escapeXml(ev.targetName)}</text>`);
    }
  }

  // Dependencies (A depends on B: arrow points at B)
  for (const dep of map.dependencies) {
    const from = byId.get(dep.fromId);
    const to = byId.get(dep.toId);
    if (!from || !to) continue;
    const dash = dep.kind === 'flow' ? ' stroke-dasharray="5 3"' : '';
    const x1 = toSvgX(from.evolution);
    const y1 = toSvgY(from.visibility);
    const end = trimLineEnd(x1, y1, toSvgX(to.evolution), toSvgY(to.visibility), (to.kind === 'anchor' ? ANCHOR_HALF : ELEMENT_RADIUS) + 3);
    out.push(
      `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(end.x)}" y2="${n(end.y)}" ` +
        `stroke="${c.subtle}" stroke-width="1.5"${dash} marker-end="url(#dep-arrow)"/>`
    );
    if (dep.label) {
      const mx = (toSvgX(from.evolution) + toSvgX(to.evolution)) / 2;
      const my = (toSvgY(from.visibility) + toSvgY(to.visibility)) / 2;
      out.push(`<text x="${n(mx + 4)}" y="${n(my - 4)}" font-size="10" fill="${c.muted}">${escapeXml(dep.label)}</text>`);
    }
  }

  // Elements
  for (const el of map.elements) out.push(renderElement(el, c));

  // Annotations
  for (const ann of map.annotations) {
    const x = toSvgX(ann.x);
    const y = toSvgY(ann.y);
    if (ann.number != null) {
      out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="9" fill="${c.info}"/>`);
      out.push(`<text x="${n(x)}" y="${n(y + 3.5)}" font-size="10" font-weight="600" fill="#ffffff" text-anchor="middle">${ann.number}</text>`);
    } else {
      out.push(`<circle cx="${n(x)}" cy="${n(y - 20)}" r="6" fill="${c.elevated}" stroke="${c.subtle}" stroke-width="1.5"/>`);
    }
    out.push(`<text x="${n(x + 12)}" y="${n(y - 10)}" font-size="11" fill="${c.muted}">${escapeXml(ann.text)}</text>`);
  }

  out.push('</g>');
  out.push('</svg>');
  return out.join('\n') + '\n';
}

function renderElement(el: MapElement, c: Record<string, string>): string {
  const x = toSvgX(el.evolution);
  const y = toSvgY(el.visibility);
  const parts: string[] = [];
  if (el.inertia) {
    parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${ELEMENT_RADIUS + 4}" fill="none" stroke="${c.warning}" stroke-width="1.5" stroke-dasharray="3 2"/>`);
  }
  if (el.kind === 'anchor') {
    const h = ANCHOR_HALF;
    parts.push(`<polygon points="${n(x)},${n(y - h)} ${n(x + h)},${n(y)} ${n(x)},${n(y + h)} ${n(x - h)},${n(y)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
  } else if (el.kind === 'submap') {
    parts.push(`<rect x="${n(x - ELEMENT_RADIUS)}" y="${n(y - ELEMENT_RADIUS)}" width="${ELEMENT_RADIUS * 2}" height="${ELEMENT_RADIUS * 2}" rx="3" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
  } else {
    parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${ELEMENT_RADIUS}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
  }
  const labelY = y + (el.kind === 'anchor' ? ANCHOR_HALF : ELEMENT_RADIUS) + 16;
  parts.push(`<text x="${n(x)}" y="${n(labelY)}" font-size="12" fill="${c.label}" text-anchor="middle">${escapeXml(el.name)}</text>`);
  return `<g>${parts.join('')}</g>`;
}
