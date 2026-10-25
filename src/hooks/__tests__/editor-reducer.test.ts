import { describe, it, expect } from 'vitest';
import { reducer, EditorState } from '../use-map-editor';
import { makeCommandStack } from '@/domain/commands';
import { sampleMap } from '../../../tests/factories';

function initial(): EditorState {
  return {
    stack: makeCommandStack(sampleMap()),
    selectedIds: [],
    activeTool: 'select',
    linkSourceId: null,
    saveState: 'clean',
    nudging: false,
    previewBase: null,
    highlightIds: [],
  };
}

const a = (s: EditorState) => s.stack.present.elements.find((e) => e.id === 'a')!;

describe('drag preview and commit', () => {
  it('a drag with many moves is a single undo step', () => {
    let s = initial();
    for (let i = 1; i <= 30; i++) {
      s = reducer(s, { type: 'MOVE_PREVIEW', id: 'a', evolution: 0.6 + i * 0.01, visibility: 0.5 });
    }
    expect(s.stack.past).toHaveLength(0);
    expect(a(s).evolution).toBeCloseTo(0.9);
    s = reducer(s, { type: 'MOVE_COMMIT', id: 'a', evolution: 0.9, visibility: 0.5 });
    expect(s.stack.past).toHaveLength(1);
    expect(s.previewBase).toBeNull();
    expect(s.saveState).toBe('unsaved');
    s = reducer(s, { type: 'UNDO' });
    expect(a(s).evolution).toBe(0.6);
  });

  it('a click without movement adds no undo step', () => {
    let s = initial();
    s = reducer(s, { type: 'MOVE_COMMIT', id: 'a', evolution: 0.6, visibility: 0.5 });
    expect(s.stack.past).toHaveLength(0);
    expect(s.saveState).toBe('clean');
  });

  it('a drag that returns to its start adds no undo step', () => {
    let s = initial();
    s = reducer(s, { type: 'MOVE_PREVIEW', id: 'a', evolution: 0.8, visibility: 0.5 });
    s = reducer(s, { type: 'MOVE_COMMIT', id: 'a', evolution: 0.6, visibility: 0.5 });
    expect(s.stack.past).toHaveLength(0);
    expect(a(s).evolution).toBe(0.6);
  });

  it('a drag preserves earlier history', () => {
    let s = initial();
    s = reducer(s, { type: 'SET_TITLE', title: 'renamed' });
    s = reducer(s, { type: 'MOVE_PREVIEW', id: 'a', evolution: 0.7, visibility: 0.5 });
    s = reducer(s, { type: 'MOVE_COMMIT', id: 'a', evolution: 0.7, visibility: 0.5 });
    s = reducer(reducer(s, { type: 'UNDO' }), { type: 'UNDO' });
    expect(s.stack.present.title).toBe('Sample');
  });
});

describe('nudge and duplicate', () => {
  it('nudge moves the selection as one undo step and ignores empty selection', () => {
    let s = initial();
    expect(reducer(s, { type: 'NUDGE', dEvolution: 0.01, dVisibility: 0 })).toBe(s);
    s = reducer(s, { type: 'SELECT', ids: ['a', 'd1'] });
    s = reducer(s, { type: 'NUDGE', dEvolution: 0.05, dVisibility: 0 });
    expect(a(s).evolution).toBeCloseTo(0.65);
    expect(s.stack.past).toHaveLength(1);
  });

  it('duplicate selects the copies; undo removes them', () => {
    let s = reducer(initial(), { type: 'SELECT', ids: ['a'] });
    s = reducer(s, { type: 'DUPLICATE' });
    expect(s.stack.present.elements).toHaveLength(5);
    expect(s.selectedIds).toHaveLength(1);
    expect(s.selectedIds[0]).not.toBe('a');
    s = reducer(s, { type: 'UNDO' });
    expect(s.stack.present.elements).toHaveLength(4);
  });

  it('deleting an element also cleans pipeline references', () => {
    let s = initial();
    s = { ...s, stack: makeCommandStack({ ...s.stack.present, pipelines: [{ id: 'p', parentElementId: 'need', memberElementIds: ['a', 'b'], startEvolution: 0.2, endEvolution: 0.9 }] }) };
    s = reducer(s, { type: 'REMOVE_ELEMENTS', ids: ['a'] });
    expect(s.stack.present.pipelines[0].memberElementIds).toEqual(['b']);
    s = reducer(s, { type: 'REMOVE_ELEMENTS', ids: ['need'] });
    expect(s.stack.present.pipelines).toEqual([]);
  });
});
