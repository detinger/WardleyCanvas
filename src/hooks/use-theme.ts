'use client';

// Light, dark or follow the system (Section 14.3 scenario 6). A tiny shared
// store so the sidebar toggle and the settings page always agree.

import { useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'wardleyStudio.theme';
export const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' };

type Snapshot = { preference: ThemePreference; theme: 'light' | 'dark' };
const SERVER_SNAPSHOT: Snapshot = { preference: 'system', theme: 'light' };
let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(preference: ThemePreference) {
  const theme = preference === 'system' ? systemTheme() : preference;
  document.documentElement.setAttribute('data-theme', theme);
  // Also set class for ShadCN compatibility
  document.documentElement.classList.toggle('dark', theme === 'dark');
  snapshot = { preference, theme };
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  let saved: ThemePreference = 'system';
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') saved = raw;
  } catch { /* storage blocked: follow the system */ }
  apply(saved);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (snapshot.preference === 'system') apply('system');
  });
}

export function setThemePreference(preference: ThemePreference) {
  try { localStorage.setItem(THEME_KEY, preference); } catch { /* ignore */ }
  apply(preference);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  // Loaded after mount; server and hydration renders use the neutral snapshot
  useEffect(load, []);
  const { preference, theme } = useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
  return {
    preference,
    theme,
    setPreference: setThemePreference,
    toggle: () => setThemePreference(NEXT_PREFERENCE[preference]),
  };
}
