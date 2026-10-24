import { MapElement, WardleyMap, makeNewMap } from '@/domain/types';

export function el(id: string, overrides: Partial<MapElement> = {}): MapElement {
  return {
    id,
    kind: 'component',
    name: id,
    componentType: 'unspecified',
    visibility: 0.5,
    evolution: 0.5,
    ...overrides,
  };
}

/** A small valid map: user -> need -> a, need -> b, spanning several stages. */
export function sampleMap(): WardleyMap {
  const map = makeNewMap('map_test', 'Sample');
  map.purpose = 'Test purpose';
  map.elements = [
    el('user', { kind: 'anchor', name: 'User', visibility: 0.95, evolution: 0.4 }),
    el('need', { name: 'Need', visibility: 0.8, evolution: 0.3 }),
    el('a', { name: 'A', visibility: 0.5, evolution: 0.6 }),
    el('b', { name: 'B', visibility: 0.2, evolution: 0.9 }),
  ];
  map.dependencies = [
    { id: 'd1', fromId: 'user', toId: 'need', kind: 'dependency' },
    { id: 'd2', fromId: 'need', toId: 'a', kind: 'dependency' },
    { id: 'd3', fromId: 'need', toId: 'b', kind: 'dependency' },
  ];
  return map;
}
