// Authoring helpers for learning content.

import { WardleyMap, Id } from '@/domain/types';
import { parseOWM } from '@/parser/owm';
import { ContentMeta } from '../types';

/**
 * Build a sample solution from OWM plus optional decorations that OWM cannot
 * express (descriptions, rationale, analysis). `id(name)` resolves an element.
 */
export function solution(
  owm: string,
  decorate?: (map: WardleyMap, id: (name: string) => Id) => void
): () => WardleyMap {
  return () => {
    const map = parseOWM(owm, 'sample-solution').map;
    const id = (name: string) => {
      const el = map.elements.find((e) => e.name === name);
      if (!el) throw new Error(`Sample solution has no element named "${name}"`);
      return el.id;
    };
    decorate?.(map, id);
    return map;
  };
}

/** Shared metadata for content authored in this repository and awaiting review. */
export const DRAFT_META: Omit<ContentMeta, 'version'> = {
  author: 'Wardley Maps Studio contributors',
  reviewStatus: 'draft',
  lastReviewed: '2026-10-25',
  license: 'CC BY-SA 4.0',
  sources: [
    { label: 'Simon Wardley — Wardley Maps (CC BY-SA 4.0)', url: 'https://medium.com/wardleymaps' },
  ],
};
