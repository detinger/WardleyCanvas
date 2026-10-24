import { describe, it, expect, beforeEach } from 'vitest';
import { installMemoryStorage } from '../../../tests/memory-storage';
import {
  createMap, loadMap, saveMap, listMaps, deleteMap,
  commitVersion, listVersions,
  saveDraft, loadDraft, hasDraft, clearDraft, resolveRecovery,
} from '../use-persistence';
import { sampleMap } from '../../../tests/factories';

beforeEach(() => { installMemoryStorage(); });

describe('map store', () => {
  it('create → load → list → delete', () => {
    const m = createMap('Hello');
    expect(loadMap(m.id)?.title).toBe('Hello');
    expect(listMaps()).toEqual([expect.objectContaining({ id: m.id, title: 'Hello', elementCount: 0 })]);
    deleteMap(m.id);
    expect(loadMap(m.id)).toBeNull();
    expect(listMaps()).toEqual([]);
  });

  it('saveMap keeps existing versions', () => {
    const m = sampleMap();
    commitVersion(m, 'first');
    saveMap({ ...m, title: 'edited' });
    expect(loadMap(m.id)?.title).toBe('edited');
    expect(listVersions(m.id)).toHaveLength(1);
  });

  it('reload survives a corrupt store without throwing', () => {
    (globalThis as any).window.localStorage.setItem('wardleyStudio.maps', '{broken');
    expect(listMaps()).toEqual([]);
    expect(loadMap('x')).toBeNull();
  });
});

describe('versions', () => {
  it('commit increments revision and appends an immutable snapshot', () => {
    const m = sampleMap();
    const v1 = commitVersion(m, 'one');
    const v2 = commitVersion({ ...v1, title: 'changed' }, 'two');
    expect([v1.revision, v2.revision]).toEqual([1, 2]);
    const versions = listVersions(m.id);
    expect(versions.map((v) => v.note)).toEqual(['one', 'two']);
    expect(versions[0].map.title).toBe('Sample');
    // Later edits to the working copy never alter a committed version
    saveMap({ ...v2, title: 'working' });
    expect(listVersions(m.id)[1].map.title).toBe('changed');
  });

  it('commit clears the draft', () => {
    const m = sampleMap();
    saveDraft(m);
    commitVersion(m);
    expect(hasDraft(m.id)).toBe(false);
  });
});

describe('drafts and recovery', () => {
  it('drafts are stored separately from saved maps', () => {
    const m = sampleMap();
    saveMap(m);
    saveDraft({ ...m, title: 'draft title' });
    expect(loadMap(m.id)?.title).toBe('Sample');
    expect(loadDraft(m.id)?.title).toBe('draft title');
    clearDraft(m.id);
    expect(loadDraft(m.id)).toBeNull();
  });

  it('resolveRecovery covers every combination', () => {
    const saved = sampleMap();
    const same = { ...saved, updatedAt: '2030-01-01T00:00:00.000Z' };
    const changed = { ...saved, title: 'changed' };
    expect(resolveRecovery(null, null).kind).toBe('not-found');
    expect(resolveRecovery(null, changed)).toEqual({ kind: 'draft-only', map: changed });
    expect(resolveRecovery(saved, null)).toEqual({ kind: 'saved', map: saved });
    expect(resolveRecovery(saved, same).kind).toBe('saved');
    expect(resolveRecovery(saved, changed)).toEqual({ kind: 'offer-draft', saved, draft: changed });
  });
});
