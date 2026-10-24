// EDT-05: Pure multi-element edits used by the editor's keyboard commands.
// Each returns a new map; the input is never mutated.

import { WardleyMap, MapElement, Dependency, Id, clampNormalized, generateId } from './types';

/** Fine and coarse arrow-key nudge steps, in normalized units. */
export const NUDGE_STEP = 0.01;
export const NUDGE_STEP_LARGE = 0.05;

/** Offset applied to duplicates so they do not sit exactly on the original. */
const DUPLICATE_OFFSET = 0.03;

export function nudgeElements(
  map: WardleyMap,
  ids: Id[],
  dEvolution: number,
  dVisibility: number
): WardleyMap {
  const idSet = new Set(ids);
  return {
    ...map,
    elements: map.elements.map((el) =>
      idSet.has(el.id)
        ? {
            ...el,
            evolution: round4(clampNormalized(el.evolution + dEvolution)),
            visibility: round4(clampNormalized(el.visibility + dVisibility)),
          }
        : el
    ),
  };
}

/**
 * Copy the given elements (and dependencies between them) with new IDs.
 * Dependencies to elements outside the selection are not copied.
 */
export function duplicateElements(
  map: WardleyMap,
  ids: Id[]
): { map: WardleyMap; newIds: Id[] } {
  const idSet = new Set(ids);
  const idMap = new Map<Id, Id>();
  const copies: MapElement[] = [];

  for (const el of map.elements) {
    if (!idSet.has(el.id)) continue;
    const newId = generateId('el');
    idMap.set(el.id, newId);
    copies.push({
      ...structuredClone(el),
      id: newId,
      name: `${el.name} copy`,
      evolution: round4(clampNormalized(el.evolution + DUPLICATE_OFFSET)),
      visibility: round4(clampNormalized(el.visibility - DUPLICATE_OFFSET)),
    });
  }

  const depCopies: Dependency[] = map.dependencies
    .filter((d) => idMap.has(d.fromId) && idMap.has(d.toId))
    .map((d) => ({ ...d, id: generateId('dep'), fromId: idMap.get(d.fromId)!, toId: idMap.get(d.toId)! }));

  return {
    map: {
      ...map,
      elements: [...map.elements, ...copies],
      dependencies: [...map.dependencies, ...depCopies],
    },
    newIds: copies.map((c) => c.id),
  };
}

/** Plain-language reading of a dependency, shown before it is committed. */
export function describeDependency(fromName: string, toName: string): string {
  return `${fromName} depends on ${toName}`;
}

// Avoid float noise like 0.30000000000000004 accumulating through repeated nudges
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
