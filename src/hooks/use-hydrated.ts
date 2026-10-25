'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during server rendering and the hydration render, true afterwards.
 * Pages whose content comes from localStorage render a neutral state until
 * hydrated so server and client markup always match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
