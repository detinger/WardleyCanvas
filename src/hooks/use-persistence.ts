'use client';

// EDT-07: localStorage persistence with draft recovery and version history.
// Keeps map store + drafts in separate keys so a crash never corrupts saved data.

import { useCallback, useEffect } from 'react';
import {
  WardleyMap,
  MapSummary,
  MapVersion,
  Id,
  makeNewMap,
  generateId,
} from '@/domain/types';
import { runLegacyMigration, CURRENT_STORAGE_KEY } from '@/domain/migration';

const DRAFTS_KEY = 'wardleyStudio.drafts';
const DRAFT_DEBOUNCE_MS = 1500;

// ---------------------------------------------------------------------------
// Low-level storage helpers
// ---------------------------------------------------------------------------

type MapEntry = {
  current: WardleyMap;
  versions: MapVersion[];
};

type StoreShape = Record<Id, MapEntry>;

function readStore(): StoreShape {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CURRENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StoreShape): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(store));
}

function readDrafts(): Record<Id, WardleyMap> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDrafts(drafts: Record<Id, WardleyMap>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// ---------------------------------------------------------------------------
// Public API — pure functions (no hooks needed)
// ---------------------------------------------------------------------------

/** Migrate legacy maps on first run, if any exist. */
function ensureMigrated(): void {
  runLegacyMigration();
}

export function listMaps(): MapSummary[] {
  const store = readStore();
  return Object.values(store).map((entry) => ({
    id: entry.current.id,
    title: entry.current.title,
    updatedAt: entry.current.updatedAt,
    revision: entry.current.revision,
    elementCount: entry.current.elements.length,
  }));
}

export function loadMap(id: Id): WardleyMap | null {
  const store = readStore();
  return store[id]?.current ?? null;
}

export function saveMap(map: WardleyMap): void {
  const store = readStore();
  const entry = store[map.id];
  store[map.id] = {
    current: { ...map, updatedAt: new Date().toISOString() },
    versions: entry?.versions ?? [],
  };
  writeStore(store);
}

export function commitVersion(map: WardleyMap, note?: string): WardleyMap {
  const store = readStore();
  const nextRevision = (store[map.id]?.current.revision ?? 0) + 1;
  const committed: WardleyMap = {
    ...map,
    revision: nextRevision,
    updatedAt: new Date().toISOString(),
  };
  const existing = store[map.id];
  store[committed.id] = {
    current: committed,
    versions: [
      ...(existing?.versions ?? []),
      { map: committed, note, savedAt: committed.updatedAt },
    ],
  };
  writeStore(store);
  clearDraft(committed.id);
  return committed;
}

export function listVersions(id: Id): MapVersion[] {
  const store = readStore();
  return store[id]?.versions ?? [];
}

export function deleteMap(id: Id): void {
  const store = readStore();
  delete store[id];
  writeStore(store);
  clearDraft(id);
}

/** Create and persist a brand-new map, returning its ID. */
export function createMap(title = 'Untitled Map'): WardleyMap {
  const map = makeNewMap(generateId('map'), title);
  saveMap(map);
  return map;
}

// ---------------------------------------------------------------------------
// Drafts (autosave)
// ---------------------------------------------------------------------------

/** Save a working draft.  Does not update revision or updatedAt. */
export function saveDraft(map: WardleyMap): void {
  const drafts = readDrafts();
  drafts[map.id] = map;
  writeDrafts(drafts);
}

export function loadDraft(id: Id): WardleyMap | null {
  const drafts = readDrafts();
  return drafts[id] ?? null;
}

export function clearDraft(id: Id): void {
  const drafts = readDrafts();
  delete drafts[id];
  writeDrafts(drafts);
}

export function hasDraft(id: Id): boolean {
  const drafts = readDrafts();
  return id in drafts;
}

/** Content equality ignoring the timestamp that saveMap rewrites. */
function sameContent(a: WardleyMap, b: WardleyMap): boolean {
  return JSON.stringify({ ...a, updatedAt: '' }) === JSON.stringify({ ...b, updatedAt: '' });
}

export type RecoveryDecision =
  | { kind: 'not-found' }
  | { kind: 'saved'; map: WardleyMap }
  | { kind: 'draft-only'; map: WardleyMap }
  | { kind: 'offer-draft'; saved: WardleyMap; draft: WardleyMap };

/** Decide what to open: only offer recovery when the draft actually differs. */
export function resolveRecovery(saved: WardleyMap | null, draft: WardleyMap | null): RecoveryDecision {
  if (!saved && !draft) return { kind: 'not-found' };
  if (!saved) return { kind: 'draft-only', map: draft! };
  if (!draft || sameContent(saved, draft)) return { kind: 'saved', map: saved };
  return { kind: 'offer-draft', saved, draft };
}

// ---------------------------------------------------------------------------
// React hook — exposes autosave with debounce
// ---------------------------------------------------------------------------

let _draftTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutosave(map: WardleyMap): void {
  if (_draftTimer) clearTimeout(_draftTimer);
  _draftTimer = setTimeout(() => saveDraft(map), DRAFT_DEBOUNCE_MS);
}

export function useMigrationEffect(): void {
  useEffect(() => {
    ensureMigrated();
  }, []);
}
