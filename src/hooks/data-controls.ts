// Section 11.4: "Export all data" and "Delete local data" with clear scope.
// Everything the app stores lives in this browser's localStorage.

export const DATA_KEYS = {
  maps: 'wardleyStudio.maps',
  drafts: 'wardleyStudio.drafts',
  scenarios: 'wardleyStudio.scenarios',
  decisions: 'wardleyStudio.decisions',
  learningProgress: 'wardleyStudio.learningProgress',
  practiceMaps: 'wardleyStudio.practiceMaps',
  suppressedRules: 'wardleyStudio.suppressedRules',
  /** Kept by migration as a recoverable backup of pre-v1 maps */
  legacyMaps: 'wardleyMaps',
} as const;

/** Preferences that are not user content; kept unless explicitly included. */
const PREFERENCE_KEYS = ['wardleyStudio.theme', 'wardleyStudio.sidebarExpanded'] as const;

const EXPORT_FORMAT = 'wardley-canvas-backup';
const EXPORT_VERSION = 1;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key: string): unknown {
  const raw = storage()?.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Keep unparseable data visible in the backup rather than dropping it
    return { unparseable: raw };
  }
}

export interface DataBackup {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  data: Record<keyof typeof DATA_KEYS, unknown>;
}

export function exportAllData(now = new Date().toISOString()): DataBackup {
  const data = Object.fromEntries(
    Object.entries(DATA_KEYS).map(([name, key]) => [name, readJson(key)])
  ) as DataBackup['data'];
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now, data };
}

/** Counts shown before deletion so the scope is clear. */
export function describeLocalData(): { maps: number; scenarios: number; decisions: number; learningModules: number } {
  const maps = readJson(DATA_KEYS.maps) as Record<string, unknown> | null;
  const scenarios = readJson(DATA_KEYS.scenarios) as Record<string, unknown[]> | null;
  const decisions = readJson(DATA_KEYS.decisions) as unknown[] | null;
  const progress = readJson(DATA_KEYS.learningProgress) as { moduleProgress?: Record<string, unknown> } | null;
  return {
    maps: maps && typeof maps === 'object' ? Object.keys(maps).length : 0,
    scenarios: scenarios && typeof scenarios === 'object' ? Object.values(scenarios).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0) : 0,
    decisions: Array.isArray(decisions) ? decisions.length : 0,
    learningModules: progress?.moduleProgress ? Object.keys(progress.moduleProgress).length : 0,
  };
}

export function deleteAllData(options: { includePreferences?: boolean } = {}): void {
  const s = storage();
  if (!s) return;
  for (const key of Object.values(DATA_KEYS)) s.removeItem(key);
  if (options.includePreferences) for (const key of PREFERENCE_KEYS) s.removeItem(key);
}
