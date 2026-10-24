// ARC-02: Migration from legacy localStorage format → canonical WardleyMap.
// Migrations are sequential and idempotent.  Read the old key, migrate,
// write to new key, leave old key intact as a recoverable backup.

import {
  WardleyMap,
  MapElement,
  Dependency,
  AnalysisLayer,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_EVOLUTION_LABELS,
  DEFAULT_STAGE_BOUNDARIES,
  generateId,
  makeEmptyAnalysis,
} from './types';

// ---------------------------------------------------------------------------
// Legacy types (from src/lib/types.ts)
// ---------------------------------------------------------------------------

interface LegacyMapNode {
  id: string;
  name: string;
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  stage: 'genesis' | 'custom' | 'product' | 'commodity';
}

interface LegacyMapLink {
  from: string;
  to: string;
}

interface LegacyWardleyMap {
  id?: string;
  name: string;
  nodes: LegacyMapNode[];
  links: LegacyMapLink[];
}

// ---------------------------------------------------------------------------
// v0 → v1 migration
// ---------------------------------------------------------------------------

export function migrateFromLegacy(old: LegacyWardleyMap): WardleyMap {
  const now = new Date().toISOString();

  const elements: MapElement[] = old.nodes.map((node) => ({
    id: node.id,
    // First node tends to represent the user/anchor in templates
    kind: node.stage === 'genesis' && old.nodes.indexOf(node) === 0
      ? 'anchor'
      : 'component',
    name: node.name,
    componentType: 'unspecified',
    // x (0-100%, left=0) → evolution (0-1, left=0): divide by 100
    evolution: Math.max(0, Math.min(1, node.x / 100)),
    // y (0-100%, top=0) → visibility (0-1, top=1): invert
    visibility: Math.max(0, Math.min(1, 1 - node.y / 100)),
  }));

  const dependencies: Dependency[] = old.links.map((link) => ({
    id: generateId('dep'),
    fromId: link.from,
    toId: link.to,
    kind: 'dependency',
  }));

  return {
    schemaVersion: 1,
    id: old.id ?? generateId('map'),
    title: old.name,
    evolutionLabels: DEFAULT_EVOLUTION_LABELS,
    stageBoundaries: DEFAULT_STAGE_BOUNDARIES,
    elements,
    dependencies,
    evolutions: [],
    pipelines: [],
    annotations: [],
    analysis: makeEmptyAnalysis(),
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
}

// ---------------------------------------------------------------------------
// Schema version upgrade router
// ---------------------------------------------------------------------------

export function upgradeMap(raw: unknown): WardleyMap {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('upgradeMap: input is not an object');
  }

  const obj = raw as Record<string, unknown>;

  // Detect legacy format (no schemaVersion)
  if (obj.schemaVersion === undefined && Array.isArray(obj.nodes)) {
    return migrateFromLegacy(obj as unknown as LegacyWardleyMap);
  }

  const version = Number(obj.schemaVersion);

  if (version === CURRENT_SCHEMA_VERSION) {
    return raw as WardleyMap;
  }

  // Future migrations would be chained here:
  // if (version === 2) return upgradeV2toV3(upgradeV1toV2(raw));

  throw new Error(`upgradeMap: unsupported schemaVersion ${version}`);
}

// ---------------------------------------------------------------------------
// Bulk migration of legacy localStorage
// ---------------------------------------------------------------------------

export const LEGACY_STORAGE_KEY = 'wardleyMaps';
export const CURRENT_STORAGE_KEY = 'wardleyStudio.maps';

/** Returns true if migration ran and produced at least one map. */
export function runLegacyMigration(): boolean {
  if (typeof window === 'undefined') return false;

  const legacyJson = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyJson) return false;

  // Already migrated if new key exists
  const alreadyMigrated = window.localStorage.getItem(CURRENT_STORAGE_KEY);
  if (alreadyMigrated) return false;

  let legacyMaps: LegacyWardleyMap[];
  try {
    legacyMaps = JSON.parse(legacyJson);
    if (!Array.isArray(legacyMaps)) return false;
  } catch {
    return false;
  }

  const store: Record<
    string,
    { current: WardleyMap; versions: { map: WardleyMap; note: string; savedAt: string }[] }
  > = {};

  for (const old of legacyMaps) {
    try {
      const migrated = migrateFromLegacy(old);
      store[migrated.id] = {
        current: migrated,
        versions: [{ map: migrated, note: 'Migrated from legacy format', savedAt: migrated.createdAt }],
      };
    } catch {
      // Skip corrupt maps; they remain in the legacy key
    }
  }

  if (Object.keys(store).length === 0) return false;

  window.localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(store));
  return true;
}
