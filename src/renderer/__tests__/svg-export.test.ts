import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderMapSVG, escapeXml, exportSize } from '../svg-export';
import { parseOWM } from '@/parser/owm';
import { sampleMap } from '../../../tests/factories';

const teaShop = parseOWM(readFileSync(path.resolve(__dirname, '../../../tests/fixtures/tea-shop.owm'), 'utf8')).map;

describe('renderMapSVG', () => {
  it('is deterministic for unchanged input', () => {
    expect(renderMapSVG(teaShop)).toBe(renderMapSVG(structuredClone(teaShop)));
    expect(renderMapSVG(teaShop, { theme: 'dark' })).toBe(renderMapSVG(teaShop, { theme: 'dark' }));
  });

  it('does not depend on updatedAt or revision', () => {
    const later = { ...teaShop, updatedAt: '2099-01-01T00:00:00Z', revision: 42 };
    expect(renderMapSVG(later)).toBe(renderMapSVG(teaShop));
  });

  it('is well-formed, self-contained XML', () => {
    const svg = renderMapSVG(teaShop);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).not.toMatch(/var\(--/);
    expect(svg).not.toMatch(/<script|on\w+=|href=/i);
    // every element is drawn
    for (const el of teaShop.elements) expect(svg).toContain(`>${escapeXml(el.name)}</text>`);
  });

  it('escapes hostile labels', () => {
    const m = sampleMap();
    m.title = '</title><script>alert(1)</script>';
    m.elements[2].name = '<img src=x onerror=alert(1)> & "q"';
    const svg = renderMapSVG(m);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<img');
    expect(svg).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;');
  });

  it('applies theme and background options', () => {
    expect(renderMapSVG(teaShop, { theme: 'light' })).toContain('fill="#ffffff"/>');
    expect(renderMapSVG(teaShop, { theme: 'dark' })).toContain('fill="#141a22"/>');
    expect(renderMapSVG(teaShop, { background: false })).not.toMatch(/<rect x="0" y="0"/);
  });

  it('places elements by normalized coordinates', () => {
    const m = sampleMap();
    m.elements = [{ ...m.elements[2], evolution: 0.25, visibility: 0.5 }];
    m.dependencies = [];
    m.pipelines = [];
    // translate(70, 40+36): x = 0.25*1000, y = (1-0.5)*600
    expect(renderMapSVG(m)).toContain('<circle cx="250" cy="300" r="8"');
  });

  it('reports a fixed export size', () => {
    expect(exportSize()).toEqual({ width: 1110, height: 726 });
    expect(exportSize({ includeTitle: false }).height).toBe(690);
  });
});

describe('overlay comparison', () => {
  it('labels moved, added and removed elements in text', () => {
    const baseline = sampleMap();
    const scenario = structuredClone(baseline);
    scenario.elements = scenario.elements.filter((e) => e.id !== 'b');
    scenario.elements.find((e) => e.id === 'a')!.evolution = 0.9;
    scenario.elements.push({ ...scenario.elements[2], id: 'c', name: 'C' });
    const svg = renderMapSVG(scenario, { ghost: baseline });
    expect(svg).toContain('>B (removed)</text>');
    expect(svg).toContain('>C (new)</text>');
    expect(svg).toContain('>was</text>');
    expect(svg).not.toContain('>Need (new)</text>');
  });

  it('draws nothing extra when nothing changed', () => {
    const m = sampleMap();
    expect(renderMapSVG(m, { ghost: structuredClone(m) })).toBe(renderMapSVG(m));
  });
});
