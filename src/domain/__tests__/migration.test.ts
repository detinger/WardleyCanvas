import { describe, it, expect, beforeEach } from 'vitest';
import legacy from '../../../tests/fixtures/legacy-ecommerce.json';
import {
  migrateFromLegacy,
  upgradeMap,
  runLegacyMigration,
  LEGACY_STORAGE_KEY,
  CURRENT_STORAGE_KEY,
} from '../migration';
import { validateMap, hasErrors } from '../validation';
import { installMemoryStorage } from '../../../tests/memory-storage';

describe('migrateFromLegacy', () => {
  const map = migrateFromLegacy(legacy as any);

  it('preserves ids, names and counts', () => {
    expect(map.id).toBe('template-ecommerce');
    expect(map.title).toBe('E-commerce Platform');
    expect(map.elements.map((e) => e.id)).toEqual(legacy.nodes.map((n) => n.id));
    expect(map.dependencies).toHaveLength(legacy.links.length);
  });

  it('converts percentage coordinates to normalized, inverting y', () => {
    const user = map.elements.find((e) => e.id === 'user')!;
    const website = map.elements.find((e) => e.id === 'website')!;
    expect(user.kind).toBe('anchor');
    expect(user.evolution).toBeCloseTo(0.05);
    expect(user.visibility).toBeCloseTo(0.9);
    expect(website.kind).toBe('component');
    expect(website.evolution).toBeCloseTo(0.35);
    expect(website.visibility).toBeCloseTo(0.75);
  });

  it('keeps link direction and referential integrity', () => {
    expect(map.dependencies[0]).toMatchObject({ fromId: 'user', toId: 'website', kind: 'dependency' });
    expect(hasErrors(validateMap(map))).toBe(false);
  });

  it('clamps out-of-range legacy coordinates', () => {
    const m = migrateFromLegacy({
      name: 'x',
      nodes: [{ id: 'n', name: 'n', x: 140, y: -20, stage: 'custom' }],
      links: [],
    });
    expect(m.elements[0].evolution).toBe(1);
    expect(m.elements[0].visibility).toBe(1);
  });
});

describe('upgradeMap', () => {
  it('routes legacy input through migration', () => {
    expect(upgradeMap(legacy).schemaVersion).toBe(1);
  });

  it('is idempotent on current-version maps', () => {
    const once = upgradeMap(legacy);
    expect(upgradeMap(once)).toEqual(once);
  });

  it('rejects non-objects and unknown versions', () => {
    expect(() => upgradeMap(null)).toThrow();
    expect(() => upgradeMap('x')).toThrow();
    expect(() => upgradeMap({ schemaVersion: 99 })).toThrow(/unsupported/);
  });
});

describe('runLegacyMigration', () => {
  let data: Map<string, string>;
  beforeEach(() => { data = installMemoryStorage(); });

  it('migrates legacy storage and leaves the legacy key as a backup', () => {
    data.set(LEGACY_STORAGE_KEY, JSON.stringify([legacy]));
    expect(runLegacyMigration()).toBe(true);
    const store = JSON.parse(data.get(CURRENT_STORAGE_KEY)!);
    expect(Object.keys(store)).toEqual(['template-ecommerce']);
    expect(store['template-ecommerce'].versions).toHaveLength(1);
    expect(data.get(LEGACY_STORAGE_KEY)).toBe(JSON.stringify([legacy]));
  });

  it('does not run twice or overwrite existing current data', () => {
    data.set(LEGACY_STORAGE_KEY, JSON.stringify([legacy]));
    data.set(CURRENT_STORAGE_KEY, '{"keep":true}');
    expect(runLegacyMigration()).toBe(false);
    expect(data.get(CURRENT_STORAGE_KEY)).toBe('{"keep":true}');
  });

  it('skips corrupt legacy entries without throwing', () => {
    data.set(LEGACY_STORAGE_KEY, JSON.stringify([{ name: 'bad' }, legacy]));
    expect(runLegacyMigration()).toBe(true);
    const store = JSON.parse(data.get(CURRENT_STORAGE_KEY)!);
    expect(Object.keys(store)).toEqual(['template-ecommerce']);
  });

  it('ignores unparseable legacy JSON', () => {
    data.set(LEGACY_STORAGE_KEY, '{not json');
    expect(runLegacyMigration()).toBe(false);
    expect(data.has(CURRENT_STORAGE_KEY)).toBe(false);
  });
});
