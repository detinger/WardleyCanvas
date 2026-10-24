// Command-based undo/redo for document mutations.
// Uses a snapshot-based stack: each edit pushes the previous state onto `past`.
// History is capped at MAX_HISTORY entries to prevent unbounded growth.

import { WardleyMap } from './types';

const MAX_HISTORY = 50;

export interface CommandStack {
  past: WardleyMap[];
  present: WardleyMap;
  future: WardleyMap[];
}

export function makeCommandStack(initial: WardleyMap): CommandStack {
  return { past: [], present: initial, future: [] };
}

/** Push a new map state, creating an undo point. */
export function pushEdit(stack: CommandStack, next: WardleyMap): CommandStack {
  return {
    past: [...stack.past.slice(-(MAX_HISTORY - 1)), stack.present],
    present: next,
    future: [],
  };
}

export function canUndo(stack: CommandStack): boolean {
  return stack.past.length > 0;
}

export function canRedo(stack: CommandStack): boolean {
  return stack.future.length > 0;
}

export function undo(stack: CommandStack): CommandStack {
  if (stack.past.length === 0) return stack;
  const past = [...stack.past];
  const previous = past.pop()!;
  return {
    past,
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

export function redo(stack: CommandStack): CommandStack {
  if (stack.future.length === 0) return stack;
  const [next, ...remaining] = stack.future;
  return {
    past: [...stack.past, stack.present],
    present: next,
    future: remaining,
  };
}
