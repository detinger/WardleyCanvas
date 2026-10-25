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

export interface DeletionImpactItem {
  kind: 'dependency' | 'evolve' | 'pipeline' | 'assessment' | 'evidence-link';
  description: string;
}

/**
 * Section 15.2: everything that refers to the elements about to be deleted.
 * Dependencies *between* deleted elements are not listed; dependencies from
 * remaining elements are (those elements lose part of their value chain).
 */
export function deletionImpact(map: WardleyMap, ids: Id[]): DeletionImpactItem[] {
  const del = new Set(ids);
  const name = (id: Id) => map.elements.find((e) => e.id === id)?.name ?? id;
  const items: DeletionImpactItem[] = [];

  for (const d of map.dependencies) {
    const fromDeleted = del.has(d.fromId);
    const toDeleted = del.has(d.toId);
    if (toDeleted && !fromDeleted) {
      items.push({ kind: 'dependency', description: `${name(d.fromId)} depends on ${name(d.toId)}` });
    } else if (fromDeleted && !toDeleted) {
      items.push({ kind: 'dependency', description: `${name(d.fromId)} depends on ${name(d.toId)}` });
    }
  }
  for (const ev of map.evolutions) {
    if (del.has(ev.elementId)) items.push({ kind: 'evolve', description: `Evolve arrow on ${name(ev.elementId)}` });
  }
  for (const p of map.pipelines) {
    if (del.has(p.parentElementId)) items.push({ kind: 'pipeline', description: `Pipeline of ${name(p.parentElementId)}` });
    else if (p.memberElementIds.some((m) => del.has(m))) {
      items.push({ kind: 'pipeline', description: `Membership in the ${name(p.parentElementId)} pipeline` });
    }
  }
  const layers: [string, { appliesToIds: Id[] }[]][] = [
    ['climate', map.analysis.climate],
    ['doctrine', map.analysis.doctrine],
    ['gameplay', map.analysis.gameplay],
  ];
  for (const [layer, list] of layers) {
    const n = list.filter((a) => a.appliesToIds.some((id) => del.has(id))).length;
    if (n) items.push({ kind: 'assessment', description: `${n} ${layer} assessment${n === 1 ? ' refers' : 's refer'} to it (the reference is removed)` });
  }
  const evidenced = map.elements.filter((e) => del.has(e.id) && e.evidenceIds?.length).length;
  if (evidenced) items.push({ kind: 'evidence-link', description: 'Its evidence links (evidence records themselves are kept)' });
  return items;
}
