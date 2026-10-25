// Shared provenance for the adapted Wardley reference catalogs. Keep this
// structured so every catalog entry and every export carries the same notice.

export interface CatalogProvenance {
  license: 'CC BY-SA 4.0';
  sourceUrl: string;
  adaptationNotice: string;
  lastReviewed: string;
}

export const WARDLEY_CATALOG_PROVENANCE: CatalogProvenance = {
  license: 'CC BY-SA 4.0',
  sourceUrl: 'https://archive.learnwardleymapping.com/book.html',
  adaptationNotice:
    'Adapted and rewritten for Wardley Canvas from Wardley Maps by Simon Wardley; no endorsement is implied.',
  lastReviewed: '2026-10-25',
};
