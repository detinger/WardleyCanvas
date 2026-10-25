import { describe, it, expect, beforeEach } from 'vitest';
import { installMemoryStorage } from '../../../tests/memory-storage';
import {
  loadProgress, markModuleStarted, recordChallengeAttempt, markModuleComplete, revealHint,
  saveReflection, resetModuleProgress, resetAllProgress, getModuleProgress,
} from '../progress';
import { savePracticeMap, loadPracticeMap, clearAllPracticeMaps } from '../practice';
import { ALL_MODULES } from '../content';
import { sampleMap } from '../../../tests/factories';

let data: Map<string, string>;
beforeEach(() => { data = installMemoryStorage(); });

describe('learning progress', () => {
  it('records attempts, hints, reflection and completion by stable module id', () => {
    markModuleStarted('m1');
    recordChallengeAttempt('m1', ['v1']);
    recordChallengeAttempt('m1', ['v1', 'v2']);
    revealHint('m1', 1);
    revealHint('m1', 1);
    saveReflection('m1', 'notes');
    markModuleComplete('m1');
    const p = getModuleProgress('m1');
    expect(p.attempts).toBe(2);
    expect(p.passedValidatorIds).toEqual(['v1', 'v2']);
    expect(p.revealedHintLevels).toEqual([1]);
    expect(p.reflectionNotes).toBe('notes');
    expect(p.completedAt).toBeTruthy();
  });

  it('survives copy edits: progress is keyed by id, not by title or text', () => {
    const mod = ALL_MODULES[0];
    markModuleComplete(mod.id);
    const edited = { ...mod, title: 'Renamed', explanation: 'Rewritten text' };
    expect(getModuleProgress(edited.id).completedAt).toBeTruthy();
  });

  it('every module id is stable kebab-case (renaming one would orphan progress)', () => {
    for (const m of ALL_MODULES) expect(m.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('corrupt storage yields empty progress instead of throwing', () => {
    data.set('wardleyStudio.learningProgress', '{nope');
    expect(loadProgress().moduleProgress).toEqual({});
  });

  it('reset clears one module or everything, and never touches saved maps', () => {
    data.set('wardleyStudio.maps', '{"keep":1}');
    markModuleComplete('a');
    markModuleComplete('b');
    resetModuleProgress('a');
    expect(Object.keys(loadProgress().moduleProgress)).toEqual(['b']);
    resetAllProgress();
    expect(loadProgress().moduleProgress).toEqual({});
    expect(data.get('wardleyStudio.maps')).toBe('{"keep":1}');
  });
});

describe('practice maps', () => {
  it('are stored apart from saved maps and can be cleared', () => {
    savePracticeMap('m1', sampleMap());
    expect(loadPracticeMap('m1')?.title).toBe('Sample');
    expect(data.has('wardleyStudio.maps')).toBe(false);
    clearAllPracticeMaps();
    expect(loadPracticeMap('m1')).toBeNull();
  });
});
