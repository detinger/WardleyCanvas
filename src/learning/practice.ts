// Practice maps for learning challenges. Stored apart from real maps and from
// learning progress so neither is ever mixed irreversibly with the other (Section 9.3).

import { WardleyMap } from '@/domain/types';

const PRACTICE_KEY = 'wardleyStudio.practiceMaps';

function readAll(): Record<string, WardleyMap> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PRACTICE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, WardleyMap>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRACTICE_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: practice still works for this session
  }
}

export function loadPracticeMap(moduleId: string): WardleyMap | null {
  return readAll()[moduleId] ?? null;
}

export function savePracticeMap(moduleId: string, map: WardleyMap): void {
  const all = readAll();
  all[moduleId] = map;
  writeAll(all);
}

export function clearPracticeMap(moduleId: string): void {
  const all = readAll();
  delete all[moduleId];
  writeAll(all);
}

export function clearAllPracticeMaps(): void {
  writeAll({});
}
