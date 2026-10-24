import { describe, it, expect } from 'vitest';
import { makeCommandStack, pushEdit, undo, redo, canUndo, canRedo } from '../commands';
import { sampleMap } from '../../../tests/factories';

function withTitle(title: string) {
  return { ...sampleMap(), title };
}

describe('command stack', () => {
  it('starts with nothing to undo or redo', () => {
    const s = makeCommandStack(withTitle('v0'));
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(false);
    expect(undo(s)).toBe(s);
    expect(redo(s)).toBe(s);
  });

  it('undo followed by redo restores each state', () => {
    let s = makeCommandStack(withTitle('v0'));
    s = pushEdit(s, withTitle('v1'));
    s = pushEdit(s, withTitle('v2'));
    s = undo(s);
    expect(s.present.title).toBe('v1');
    s = undo(s);
    expect(s.present.title).toBe('v0');
    expect(canUndo(s)).toBe(false);
    s = redo(s);
    s = redo(s);
    expect(s.present.title).toBe('v2');
    expect(canRedo(s)).toBe(false);
  });

  it('a new edit clears the redo stack', () => {
    let s = makeCommandStack(withTitle('v0'));
    s = pushEdit(s, withTitle('v1'));
    s = undo(s);
    s = pushEdit(s, withTitle('v1b'));
    expect(canRedo(s)).toBe(false);
    expect(undo(s).present.title).toBe('v0');
  });

  it('caps history at 50 entries, keeping the most recent', () => {
    let s = makeCommandStack(withTitle('v0'));
    for (let i = 1; i <= 60; i++) s = pushEdit(s, withTitle(`v${i}`));
    expect(s.past.length).toBe(50);
    expect(s.past[0].title).toBe('v10');
    expect(s.past[49].title).toBe('v59');
  });

  it('does not mutate the previous stack', () => {
    const s0 = makeCommandStack(withTitle('v0'));
    const s1 = pushEdit(s0, withTitle('v1'));
    undo(s1);
    expect(s0.past.length).toBe(0);
    expect(s1.present.title).toBe('v1');
    expect(s1.past.length).toBe(1);
  });
});
