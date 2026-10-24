import { describe, it, expect } from 'vitest';
import { validateMap, hasErrors, countBySeverity } from '../validation';
import { sampleMap, el } from '../../../tests/factories';

const ids = (map: ReturnType<typeof sampleMap>) => validateMap(map).map((f) => f.ruleId);

describe('validateMap — structural errors', () => {
  it('a well-formed map has no errors or warnings', () => {
    const findings = validateMap(sampleMap());
    expect(hasErrors(findings)).toBe(false);
    expect(countBySeverity(findings).warning).toBe(0);
  });

  it.each([
    ['E001', (m: any) => m.elements.push(el('a'))],
    ['E002', (m: any) => (m.elements[1].visibility = 1.5)],
    ['E002', (m: any) => (m.elements[1].visibility = NaN)],
    ['E003', (m: any) => (m.elements[1].evolution = -0.1)],
    ['E004', (m: any) => m.dependencies.push({ ...m.dependencies[0], fromId: 'a', toId: 'b' })],
    ['E005', (m: any) => (m.dependencies[0].fromId = 'ghost')],
    ['E006', (m: any) => (m.dependencies[0].toId = 'ghost')],
    ['E007', (m: any) => m.evolutions.push({ id: 'ev', elementId: 'ghost', targetEvolution: 0.5 })],
    ['E008', (m: any) => m.evolutions.push({ id: 'ev', elementId: 'a', targetEvolution: 2 })],
  ])('catches corrupt fixture %s', (ruleId, corrupt) => {
    const map = sampleMap();
    corrupt(map);
    const findings = validateMap(map);
    expect(findings.map((f) => f.ruleId)).toContain(ruleId);
    expect(hasErrors(findings)).toBe(true);
  });
});

describe('validateMap — warnings and guidance', () => {
  it('W001 when there is no anchor', () => {
    const map = sampleMap();
    map.elements[0].kind = 'component';
    expect(ids(map)).toContain('W001');
  });

  it('W002 for isolated elements', () => {
    const map = sampleMap();
    map.elements.push(el('lonely'));
    const f = validateMap(map).find((x) => x.ruleId === 'W002');
    expect(f?.affectedIds).toEqual(['lonely']);
  });

  it('W003 for two-node cycles', () => {
    const map = sampleMap();
    map.dependencies.push({ id: 'd4', fromId: 'a', toId: 'need', kind: 'dependency' });
    expect(ids(map)).toContain('W003');
  });

  it('W004 for case-insensitive duplicate names', () => {
    const map = sampleMap();
    map.elements[3].name = ' a ';
    expect(ids(map)).toContain('W004');
  });

  it('G002 for leftward evolve arrows, G003 for sourcing mismatches', () => {
    const map = sampleMap();
    map.evolutions.push({ id: 'ev', elementId: 'b', targetEvolution: 0.1 });
    map.elements[3].sourcing = 'build';
    expect(ids(map)).toEqual(expect.arrayContaining(['G002', 'G003']));
  });

  it('G005 terminates on cyclic graphs', () => {
    const map = sampleMap();
    for (let i = 0; i < 4; i++) map.elements.push(el(`x${i}`));
    map.dependencies.push({ id: 'c1', fromId: 'a', toId: 'need', kind: 'dependency' });
    expect(() => validateMap(map)).not.toThrow();
  });

  it('suppressed rules are filtered out', () => {
    const map = sampleMap();
    map.elements.push(el('lonely'));
    expect(validateMap(map, new Set(['W002'])).map((f) => f.ruleId)).not.toContain('W002');
  });

  it('subjective guidance never has error severity', () => {
    const map = sampleMap();
    map.purpose = undefined;
    map.elements.forEach((e) => { e.evolution = 0.1; e.inertia = true; e.sourcing = 'buy'; });
    const subjective = validateMap(map).filter((f) => /^[RG]/.test(f.ruleId));
    expect(subjective.length).toBeGreaterThan(0);
    expect(subjective.every((f) => f.severity !== 'error')).toBe(true);
  });
});
