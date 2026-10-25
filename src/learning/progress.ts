// LRN-01: Learning progress persistence in localStorage.
// Progress is keyed by stable module ID, survives content copy edits.

import { LearningProgress, ModuleProgress } from './types';

const PROGRESS_KEY = 'wardleyStudio.learningProgress';
const CURRENT_VERSION = 1 as const;

export function loadProgress(): LearningProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as LearningProgress;
    if (parsed.version !== CURRENT_VERSION) return emptyProgress();
    return parsed;
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: LearningProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getModuleProgress(moduleId: string): ModuleProgress {
  const p = loadProgress();
  return p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
}

export function markModuleStarted(moduleId: string): void {
  const p = loadProgress();
  const mp = p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
  if (!mp.startedAt) mp.startedAt = new Date().toISOString();
  p.moduleProgress[moduleId] = mp;
  saveProgress(p);
}

export function recordChallengeAttempt(moduleId: string, passedIds: string[]): void {
  const p = loadProgress();
  const mp = p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
  if (!mp.startedAt) mp.startedAt = new Date().toISOString();
  mp.attempts += 1;
  mp.passedValidatorIds = passedIds;
  p.moduleProgress[moduleId] = mp;
  saveProgress(p);
}

export function markModuleComplete(moduleId: string): void {
  const p = loadProgress();
  const mp = p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
  if (!mp.completedAt) mp.completedAt = new Date().toISOString();
  p.moduleProgress[moduleId] = mp;
  saveProgress(p);
}

export function revealHint(moduleId: string, level: number): void {
  const p = loadProgress();
  const mp = p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
  if (!mp.revealedHintLevels.includes(level)) mp.revealedHintLevels.push(level);
  p.moduleProgress[moduleId] = mp;
  saveProgress(p);
}

export function saveReflection(moduleId: string, notes: string): void {
  const p = loadProgress();
  const mp = p.moduleProgress[moduleId] ?? emptyModuleProgress(moduleId);
  mp.reflectionNotes = notes;
  p.moduleProgress[moduleId] = mp;
  saveProgress(p);
}

export function resetModuleProgress(moduleId: string): void {
  const p = loadProgress();
  delete p.moduleProgress[moduleId];
  saveProgress(p);
}

export function resetAllProgress(): void {
  saveProgress(emptyProgress());
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyProgress(): LearningProgress {
  return { version: CURRENT_VERSION, moduleProgress: {} };
}

function emptyModuleProgress(moduleId: string): ModuleProgress {
  return {
    moduleId,
    passedValidatorIds: [],
    revealedHintLevels: [],
    reflectionNotes: '',
    attempts: 0,
  };
}
