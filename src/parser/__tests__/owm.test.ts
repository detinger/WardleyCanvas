import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseOWM, serializeOWM, roundTripOWM } from '../owm';
import { WardleyMap } from '@/domain/types';
import { validateMap, hasErrors } from '@/domain/validation';
import { sampleMap } from '../../../tests/factories';

const teaShop = readFileSync(path.resolve(__dirname, '../../../tests/fixtures/tea-shop.owm'), 'utf8');

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Name-keyed, id-free view of the OWM-representable semantics of a map. */
function semantics(map: WardleyMap) {
  const name = new Map(map.elements.map((e) => [e.id, e.name]));
  return {
    title: map.title,
    elements: map.elements
      .map((e) => ({
        name: e.name, kind: e.kind, vis: r2(e.visibility), evo: r2(e.evolution),
        inertia: !!e.inertia, sourcing: e.sourcing ?? null,
        label: e.labelOffset ?? null, url: e.submapRef?.url ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    dependencies: map.dependencies
      .map((d) => `${name.get(d.fromId)}|${d.kind}|${name.get(d.toId)}|${d.label ?? ''}`)
      .sort(),
    evolutions: map.evolutions.map((e) => `${name.get(e.elementId)}|${r2(e.targetEvolution)}|${e.targetName ?? ''}`).sort(),
    pipelines: map.pipelines.map((p) => `${name.get(p.parentElementId)}|${r2(p.startEvolution)}|${r2(p.endEvolution)}`).sort(),
    annotations: map.annotations.map((a) => `${a.number ?? ''}|${a.text}|${r2(a.x)}|${r2(a.y)}`).sort(),
  };
}

describe('parseOWM — representative fixture', () => {
  const result = parseOWM(teaShop);
  const byName = (n: string) => result.map.elements.find((e) => e.name === n)!;

  it('parses without errors or warnings', () => {
    expect(result.diagnostics).toEqual([]);
    expect(result.hasErrors).toBe(false);
    expect(result.unsupported).toEqual([]);
  });

  it('reads title, anchors, components and coordinates', () => {
    expect(result.map.title).toBe('Tea Shop');
    expect(result.map.elements).toHaveLength(10);
    expect(byName('Business').kind).toBe('anchor');
    expect(byName('Cup of Tea')).toMatchObject({ visibility: 0.79, evolution: 0.61, labelOffset: { x: 19, y: -4 } });
  });

  it('resolves dependencies, flows, decorators and evolve', () => {
    expect(result.map.dependencies).toHaveLength(9);
    expect(result.map.dependencies.filter((d) => d.kind === 'flow')).toHaveLength(1);
    expect(byName('Kettle')).toMatchObject({ inertia: true, sourcing: 'build' });
    expect(byName('Power').sourcing).toBe('outsource');
    expect(result.map.evolutions.find((e) => e.elementId === byName('Kettle').id)?.targetName).toBe('Electric Kettle');
  });

  it('keeps submap URLs intact (// inside a URL is not a comment)', () => {
    expect(byName('Supply Chain').submapRef?.url).toBe('https://example.com/maps/supply');
  });

  it('produces a structurally valid map', () => {
    expect(hasErrors(validateMap(result.map))).toBe(false);
  });
});

describe('parseOWM — diagnostics', () => {
  it('reports the source line of unresolved dependencies', () => {
    const r = parseOWM('component A [0.5, 0.5]\n\nA->Missing');
    expect(r.hasErrors).toBe(true);
    expect(r.diagnostics[0]).toMatchObject({ line: 3, severity: 'error' });
    expect(r.map.dependencies).toHaveLength(0);
  });

  it('reports non-numeric coordinates with line numbers', () => {
    const r = parseOWM('title T\ncomponent A [x, 0.5]');
    expect(r.diagnostics[0]).toMatchObject({ line: 2, severity: 'error' });
  });

  it('warns on unknown constructs and lists known-unsupported ones', () => {
    const r = parseOWM('frobnicate the map\naccelerator Fast [0.5, 0.5]');
    expect(r.diagnostics.map((d) => d.line)).toEqual([1]);
    expect(r.unsupported).toEqual(['accelerator']);
  });

  it('tolerates CRLF line endings', () => {
    const r = parseOWM('title T\r\ncomponent A [0.5, 0.5]\r\ncomponent B [0.2, 0.2]\r\nA->B\r\n');
    expect(r.diagnostics).toEqual([]);
    expect(r.map.elements.map((e) => e.name)).toEqual(['A', 'B']);
    expect(r.map.dependencies).toHaveLength(1);
  });

  it('never throws on arbitrary input', () => {
    const junk = ['', '[]', '->', 'component [', 'pipeline X [a]', 'evolve', 'annotation x [1] y', '\u0000\u0001', 'A->B->C'];
    for (const s of junk) expect(() => parseOWM(s)).not.toThrow();
  });
});

describe('OWM round trip', () => {
  it('fixture: parse → serialize → parse is semantically stable', () => {
    const first = parseOWM(teaShop).map;
    const second = parseOWM(serializeOWM(first)).map;
    expect(semantics(second)).toEqual(semantics(first));
  });

  it('serialize(parse(serialize(map))) is a fixed point', () => {
    const once = serializeOWM(parseOWM(teaShop).map);
    const twice = serializeOWM(parseOWM(once).map);
    expect(twice).toBe(once);
  });

  it('preserves dependency and flow labels', () => {
    const map = sampleMap();
    map.dependencies[1].label = 'uses API';
    map.dependencies[2] = { ...map.dependencies[2], kind: 'flow', label: 'money' };
    const back = roundTripOWM(map);
    expect(back.diagnostics).toEqual([]);
    expect(semantics(back.map)).toEqual(semantics(map));
  });

  it('domain map round trip keeps the map id and the purpose', () => {
    const map = sampleMap();
    const back = roundTripOWM(map).map;
    expect(back.id).toBe(map.id);
    expect(back.purpose).toBe(map.purpose);
    expect(semantics(back)).toEqual(semantics(map));
  });

  it('serializer output is deterministic', () => {
    const map = parseOWM(teaShop).map;
    expect(serializeOWM(map)).toBe(serializeOWM(structuredClone(map)));
  });
});
