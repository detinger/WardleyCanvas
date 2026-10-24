import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prepareImport, commitImport, detectFormat, owmLossReport, MAX_IMPORT_CHARS } from '../import';
import { parseOWM, sanitizeUrl } from '../owm';
import legacy from '../../../tests/fixtures/legacy-ecommerce.json';
import { sampleMap } from '../../../tests/factories';

const teaShop = readFileSync(path.resolve(__dirname, '../../../tests/fixtures/tea-shop.owm'), 'utf8');

describe('detectFormat', () => {
  it('uses the extension, then the content', () => {
    expect(detectFormat('{}', 'm.owm')).toBe('owm');
    expect(detectFormat('title x', 'm.json')).toBe('json');
    expect(detectFormat('  {"a":1}')).toBe('json');
    expect(detectFormat('title x')).toBe('owm');
  });
});

describe('prepareImport is atomic', () => {
  it('never mutates the current map, whatever the input', () => {
    const current = sampleMap();
    const snapshot = structuredClone(current);
    for (const text of [teaShop, '{bad json', JSON.stringify(legacy), 'A->Missing', 'x'.repeat(10)]) {
      prepareImport(text, current);
    }
    expect(current).toEqual(snapshot);
  });

  it('a failed preview commits nothing', () => {
    const current = sampleMap();
    const preview = prepareImport('{bad json', current);
    expect(preview.hasErrors).toBe(true);
    expect(commitImport(current, preview)).toBe(current);
  });
});

describe('OWM import', () => {
  it('previews the fixture with totals and keeps the current map id', () => {
    const current = sampleMap();
    const p = prepareImport(teaShop, current, 'tea.owm');
    expect(p.hasErrors).toBe(false);
    expect(p.format).toBe('owm');
    expect(p.map.id).toBe(current.id);
    expect(p.map.elements).toHaveLength(10);
  });

  it('reports unsupported and unrecognised constructs as loss', () => {
    const p = prepareImport('component A [0.5,0.5]\naccelerator X [0.1,0.1]\nwibble', sampleMap());
    expect(p.lossNotes.join(' ')).toMatch(/accelerator/);
    expect(p.lossNotes.join(' ')).toMatch(/1 unrecognised line/);
  });

  it('commit merges by name so analysis links survive', () => {
    const current = sampleMap();
    current.analysis.climate = [{ id: 'c', catalogId: 'x', appliesToIds: ['a'], state: 'applies', rationale: '', evidenceIds: [], confidence: 'low' }];
    const p = prepareImport('anchor User [0.9,0.4]\ncomponent A [0.3,0.3]\nUser->A', current);
    const committed = commitImport(current, p);
    expect(committed.elements.find((e) => e.name === 'A')?.id).toBe('a');
    expect(committed.analysis).toBe(current.analysis);
  });
});

describe('JSON import', () => {
  it('migrates legacy files', () => {
    const p = prepareImport(JSON.stringify(legacy), sampleMap(), 'old.json');
    expect(p.hasErrors).toBe(false);
    expect(p.map.elements).toHaveLength(6);
  });

  it('round-trips a native export losslessly (apart from identity)', () => {
    const source = sampleMap();
    source.id = 'other';
    source.elements[2].description = 'desc';
    source.analysis.evidence = [{ id: 'e', claim: 'c', confidence: 'high' }];
    const current = sampleMap();
    const committed = commitImport(current, prepareImport(JSON.stringify(source), current));
    expect(committed.id).toBe(current.id);
    expect(committed.elements).toEqual(source.elements);
    expect(committed.analysis.evidence).toEqual(source.analysis.evidence);
  });

  it('rejects files with structural errors', () => {
    const bad = sampleMap();
    bad.dependencies[0].toId = 'ghost';
    const p = prepareImport(JSON.stringify(bad), sampleMap());
    expect(p.hasErrors).toBe(true);
    expect(p.diagnostics[0].message).toMatch(/missing element/);
  });

  it('rejects unknown shapes and future versions', () => {
    expect(prepareImport('{"hello":1}', sampleMap()).hasErrors).toBe(true);
    expect(prepareImport('{"schemaVersion":99,"elements":[]}', sampleMap()).hasErrors).toBe(true);
    expect(prepareImport('[1,2,3]', sampleMap(), 'x.json').hasErrors).toBe(true);
  });

  it('skips malformed elements with a warning', () => {
    const m = sampleMap();
    (m.elements as unknown[]).push({ id: 'x' });
    const p = prepareImport(JSON.stringify(m), sampleMap());
    expect(p.hasErrors).toBe(false);
    expect(p.map.elements).toHaveLength(4);
    expect(p.diagnostics[0].severity).toBe('warning');
  });
});

describe('hostile input', () => {
  it('rejects oversized input before parsing', () => {
    const p = prepareImport('x'.repeat(MAX_IMPORT_CHARS + 1), sampleMap());
    expect(p.hasErrors).toBe(true);
    expect(p.diagnostics[0].message).toMatch(/too large/);
  });

  it('removes non-http URLs from OWM submaps and JSON files', () => {
    const owm = parseOWM('submap S [0.5,0.5] url [javascript:alert(1)]');
    expect(owm.map.elements[0].submapRef).toBeUndefined();
    expect(owm.diagnostics[0].message).toMatch(/removed/);

    const m = sampleMap();
    m.elements[2].submapRef = { url: 'javascript:alert(1)' };
    m.analysis.evidence = [{ id: 'e', claim: 'c', confidence: 'low', sourceUrl: 'data:text/html,<script>' }];
    const p = prepareImport(JSON.stringify(m), sampleMap());
    expect(p.map.elements[2].submapRef?.url).toBeUndefined();
    expect(p.map.analysis.evidence[0].sourceUrl).toBeUndefined();
  });

  it('sanitizeUrl allows only absolute http(s)', () => {
    expect(sanitizeUrl('https://a.b/c')).toBe('https://a.b/c');
    expect(sanitizeUrl('http://a.b')).toBe('http://a.b/');
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:x', 'data:text/html,x', 'vbscript:x', '/relative', 'file:///etc/passwd', '']) {
      expect(sanitizeUrl(bad)).toBeNull();
    }
  });

  it('keeps markup in labels as plain text', () => {
    const p = prepareImport('component <img src=x onerror=alert(1)> [0.5,0.5]', sampleMap());
    expect(p.map.elements[0].name).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('owmLossReport', () => {
  it('is empty for a plain OWM-representable map', () => {
    expect(owmLossReport(parseOWM(teaShop).map)).toEqual([]);
  });

  it('lists what an OWM export would drop', () => {
    const m = sampleMap();
    m.elements[1].description = 'x';
    m.elements[2].componentType = 'data';
    m.elements[3].name = 'A';
    m.analysis.evidence = [{ id: 'e', claim: 'c', confidence: 'low' }];
    const report = owmLossReport(m).join('; ');
    expect(report).toMatch(/1 component description/);
    expect(report).toMatch(/1 component type/);
    expect(report).toMatch(/1 evidence record/);
    expect(report).toMatch(/duplicate name/);
  });
});
