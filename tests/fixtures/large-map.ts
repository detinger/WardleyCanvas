// Representative performance fixture (Section 12.6): 200 components, 400
// dependencies, deterministic so measurements are comparable run to run.

import { WardleyMap, MapElement, Dependency, makeNewMap } from '@/domain/types';

export function largeMap(components = 200, dependencies = 400, seed = 42): WardleyMap {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
  const map = makeNewMap('map_large', 'Large fixture');
  map.purpose = 'Performance fixture';
  const elements: MapElement[] = [
    { id: 'anchor', kind: 'anchor', name: 'User', componentType: 'unspecified', visibility: 0.97, evolution: 0.5 },
  ];
  for (let i = 1; i < components; i++) {
    elements.push({
      id: `c${i}`,
      kind: 'component',
      name: `Component ${i}`,
      componentType: 'unspecified',
      // Deeper components are less visible
      visibility: Math.round((0.95 - (i / components) * 0.9) * 1000) / 1000,
      evolution: Math.round(rand() * 1000) / 1000,
      inertia: i % 37 === 0,
    });
  }
  const deps: Dependency[] = [];
  const seen = new Set<string>();
  // A spanning tree first so everything is connected, then extra edges downward
  for (let i = 1; i < components; i++) {
    const parent = i === 1 ? 0 : Math.floor(rand() * i);
    deps.push({ id: `d${deps.length}`, fromId: elements[parent].id, toId: elements[i].id, kind: 'dependency' });
    seen.add(`${parent}>${i}`);
  }
  while (deps.length < dependencies) {
    const a = Math.floor(rand() * (components - 1));
    const b = a + 1 + Math.floor(rand() * (components - a - 1));
    if (seen.has(`${a}>${b}`)) continue;
    seen.add(`${a}>${b}`);
    deps.push({ id: `d${deps.length}`, fromId: elements[a].id, toId: elements[b].id, kind: 'dependency' });
  }
  map.elements = elements;
  map.dependencies = deps;
  map.evolutions = elements.filter((_, i) => i % 25 === 5).map((e, i) => ({ id: `ev${i}`, elementId: e.id, targetEvolution: Math.min(1, e.evolution + 0.2) }));
  return map;
}
