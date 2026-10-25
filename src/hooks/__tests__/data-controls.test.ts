import { describe, it, expect, beforeEach } from 'vitest';
import { installMemoryStorage } from '../../../tests/memory-storage';
import { exportAllData, deleteAllData, describeLocalData, DATA_KEYS } from '../data-controls';
import { commitVersion } from '../use-persistence';
import { createScenario, createDecisionRecord } from '../use-scenarios';
import { markModuleComplete } from '@/learning/progress';
import { sampleMap } from '../../../tests/factories';

let data: Map<string, string>;
beforeEach(() => { data = installMemoryStorage(); });

function seed() {
  const map = sampleMap();
  commitVersion(map, 'v1');
  createScenario(map.id, 1, 'A', undefined, map);
  createDecisionRecord({ baselineMapId: map.id, baselineRevision: 1, rejectedScenarioIds: [], rationale: 'r', decidedAt: '2026-01-01', expectedSignals: [], stopConditions: [] });
  markModuleComplete('purpose-users-needs');
  data.set('wardleyStudio.theme', 'dark');
}

describe('data controls', () => {
  it('describes what is stored', () => {
    seed();
    expect(describeLocalData()).toEqual({ maps: 1, scenarios: 1, decisions: 1, learningModules: 1 });
  });

  it('exports every content key in one versioned file', () => {
    seed();
    data.set(DATA_KEYS.drafts, '{broken');
    const backup = exportAllData('2026-10-25T00:00:00.000Z');
    expect(backup.format).toBe('wardley-canvas-backup');
    expect(Object.keys(backup.data)).toEqual(Object.keys(DATA_KEYS));
    expect((backup.data.maps as Record<string, unknown>)[sampleMap().id]).toBeTruthy();
    expect(backup.data.drafts).toEqual({ unparseable: '{broken' });
    expect(backup.data.practiceMaps).toBeNull();
  });

  it('deletes content but keeps preferences unless asked', () => {
    seed();
    deleteAllData();
    expect(describeLocalData()).toEqual({ maps: 0, scenarios: 0, decisions: 0, learningModules: 0 });
    expect(data.get('wardleyStudio.theme')).toBe('dark');
    deleteAllData({ includePreferences: true });
    expect(data.has('wardleyStudio.theme')).toBe(false);
  });
});
