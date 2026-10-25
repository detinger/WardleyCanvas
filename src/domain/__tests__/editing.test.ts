import { describe, it, expect } from 'vitest';
import { nudgeElements, duplicateElements, describeDependency } from '../editing';
import { validateMap, hasErrors } from '../validation';
import { sampleMap } from '../../../tests/factories';

describe('nudgeElements', () => {
  it('moves only the selected elements and clamps to [0, 1]', () => {
    const map = sampleMap();
    const out = nudgeElements(map, ['a', 'b'], 0.2, -0.3);
    const get = (id: string) => out.elements.find((e) => e.id === id)!;
    expect(get('a')).toMatchObject({ evolution: 0.8, visibility: 0.2 });
    expect(get('b')).toMatchObject({ evolution: 1, visibility: 0 });
    expect(get('need')).toEqual(map.elements[1]);
  });

  it('does not accumulate float noise over repeated nudges', () => {
    let map = sampleMap();
    for (let i = 0; i < 10; i++) map = nudgeElements(map, ['need'], 0.01, 0);
    expect(map.elements[1].evolution).toBe(0.4);
  });

  it('does not mutate the input', () => {
    const map = sampleMap();
    const snapshot = structuredClone(map);
    nudgeElements(map, ['a'], 0.1, 0.1);
    expect(map).toEqual(snapshot);
  });
});

describe('duplicateElements', () => {
  it('copies elements with new ids and internal dependencies only', () => {
    const map = sampleMap();
    const { map: out, newIds } = duplicateElements(map, ['need', 'a']);
    expect(newIds).toHaveLength(2);
    expect(out.elements).toHaveLength(6);
    const copies = out.elements.filter((e) => newIds.includes(e.id));
    expect(copies.map((c) => c.name)).toEqual(['Need copy', 'A copy']);
    // need->a is internal and copied; user->need and need->b are not
    const newDeps = out.dependencies.slice(map.dependencies.length);
    expect(newDeps).toEqual([expect.objectContaining({ fromId: newIds[0], toId: newIds[1] })]);
    expect(hasErrors(validateMap(out))).toBe(false);
  });

  it('copies are independent of the originals', () => {
    const map = sampleMap();
    map.elements[2].tags = ['x'];
    const { map: out, newIds } = duplicateElements(map, ['a']);
    out.elements.find((e) => e.id === newIds[0])!.tags!.push('y');
    expect(map.elements[2].tags).toEqual(['x']);
  });
});

it('describeDependency states the direction in words', () => {
  expect(describeDependency('Website', 'Payments')).toBe('Website depends on Payments');
});

describe('deletionImpact', async () => {
  const { deletionImpact } = await import('../editing');

  it('is empty for an element nothing refers to', () => {
    const map = sampleMap();
    map.dependencies = map.dependencies.filter((d) => d.toId !== 'b');
    expect(deletionImpact(map, ['b'])).toEqual([]);
  });

  it('lists dependencies, evolve arrows, pipelines and assessments', () => {
    const map = sampleMap();
    map.evolutions = [{ id: 'ev', elementId: 'a', targetEvolution: 0.9 }];
    map.pipelines = [{ id: 'p', parentElementId: 'need', memberElementIds: ['a'], startEvolution: 0.2, endEvolution: 0.8 }];
    map.analysis.climate = [{ id: 'c', catalogId: 'cp-001', appliesToIds: ['a'], state: 'applies', rationale: 'r', evidenceIds: [], confidence: 'low' }];
    const items = deletionImpact(map, ['a']).map((i) => i.description);
    expect(items).toEqual([
      'Need depends on A',
      'Evolve arrow on A',
      'Membership in the Need pipeline',
      '1 climate assessment refers to it (the reference is removed)',
    ]);
  });

  it('ignores dependencies between elements deleted together', () => {
    const map = sampleMap();
    const items = deletionImpact(map, ['need', 'a', 'b']).map((i) => i.description);
    expect(items).toEqual(['User depends on Need']);
  });
});
