'use client';

// EDT-05: Editor state management with command-based undo/redo.
// Separates document state (the map) from UI state (selection, tool, viewport).

import { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  WardleyMap,
  MapElement,
  Dependency,
  Id,
  Normalized,
  clampNormalized,
  generateId,
  Evidence,
  PatternAssessment,
  DoctrineAssessment,
  GameplayHypothesis,
  AnalysisLayer,
} from '@/domain/types';
import {
  CommandStack,
  makeCommandStack,
  pushEdit,
  undo as undoCmd,
  redo as redoCmd,
  canUndo,
  canRedo,
} from '@/domain/commands';
import { scheduleAutosave } from './use-persistence';
import { nudgeElements, duplicateElements, NUDGE_STEP, NUDGE_STEP_LARGE } from '@/domain/editing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveTool =
  | 'select'
  | 'pan'
  | 'add-anchor'
  | 'add-component'
  | 'add-dependency';

export type SaveState = 'clean' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface EditorState {
  /** Undo/redo document history */
  stack: CommandStack;
  /** Currently selected element/dependency IDs */
  selectedIds: string[];
  /** Active canvas tool */
  activeTool: ActiveTool;
  /** For two-click dependency creation: the first element clicked */
  linkSourceId: string | null;
  /** Autosave/version state */
  saveState: SaveState;
  /** Whether the canvas is in keyboard-nudge mode */
  nudging: boolean;
  /** Document before an in-progress drag; the drag commits as one undo step */
  previewBase: WardleyMap | null;
  /** Elements to call attention to on the canvas (e.g. the open assessment) */
  highlightIds: Id[];
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

type Action =
  | { type: 'LOAD_MAP'; map: WardleyMap }
  | { type: 'REPLACE_MAP'; map: WardleyMap }
  | { type: 'MOVE_PREVIEW'; id: Id; evolution: Normalized; visibility: Normalized }
  | { type: 'MOVE_COMMIT'; id: Id; evolution: Normalized; visibility: Normalized }
  | { type: 'NUDGE'; dEvolution: number; dVisibility: number }
  | { type: 'DUPLICATE' }
  | { type: 'PATCH_MAP'; changes: Partial<Pick<WardleyMap, 'evolutions' | 'pipelines' | 'annotations' | 'evolutionLabels' | 'stageBoundaries'>> }
  | { type: 'SET_HIGHLIGHT'; ids: Id[] }
  | { type: 'ADD_ELEMENT'; element: MapElement }
  | { type: 'UPDATE_ELEMENT'; id: Id; changes: Partial<MapElement> }
  | { type: 'REMOVE_ELEMENTS'; ids: Id[] }
  | { type: 'ADD_DEPENDENCY'; dep: Dependency }
  | { type: 'REMOVE_DEPENDENCY'; id: Id }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_PURPOSE'; purpose: string }
  | { type: 'UPDATE_ANALYSIS'; analysis: AnalysisLayer }
  /** Functional update against the current analysis, so consecutive edits never overwrite each other */
  | { type: 'MAP_ANALYSIS'; fn: (analysis: AnalysisLayer) => AnalysisLayer }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_TOOL'; tool: ActiveTool }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'DESELECT' }
  | { type: 'SET_LINK_SOURCE'; id: string | null }
  | { type: 'SET_SAVE_STATE'; state: SaveState }
  | { type: 'MARK_CLEAN' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withUpdatedMap(state: EditorState, next: WardleyMap): EditorState {
  return {
    ...state,
    stack: pushEdit(state.stack, {
      ...next,
      updatedAt: new Date().toISOString(),
    }),
    saveState: 'unsaved',
  };
}

function removeElementsFromMap(map: WardleyMap, ids: Id[]): WardleyMap {
  const idSet = new Set(ids);
  return {
    ...map,
    elements: map.elements.filter((el) => !idSet.has(el.id)),
    // Selected dependency ids are deleted directly; element deletion removes attached ones
    dependencies: map.dependencies.filter(
      (dep) => !idSet.has(dep.id) && !idSet.has(dep.fromId) && !idSet.has(dep.toId)
    ),
    evolutions: map.evolutions.filter((ev) => !idSet.has(ev.elementId)),
    pipelines: map.pipelines
      .filter((p) => !idSet.has(p.parentElementId))
      .map((p) => ({ ...p, memberElementIds: p.memberElementIds.filter((id) => !idSet.has(id)) })),
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function setCoords(map: WardleyMap, id: Id, evolution: Normalized, visibility: Normalized): WardleyMap {
  return {
    ...map,
    elements: map.elements.map((el) =>
      el.id === id
        ? { ...el, evolution: clampNormalized(evolution), visibility: clampNormalized(visibility) }
        : el
    ),
  };
}

export function reducer(state: EditorState, action: Action): EditorState {
  const map = state.stack.present;

  switch (action.type) {
    case 'LOAD_MAP':
      return {
        ...state,
        stack: makeCommandStack(action.map),
        selectedIds: [],
        saveState: 'clean',
        linkSourceId: null,
        previewBase: null,
      };

    // Undoable whole-document replacement (source edits, import)
    case 'REPLACE_MAP': {
      const ids = new Set(action.map.elements.map((e) => e.id));
      return {
        ...withUpdatedMap(state, action.map),
        selectedIds: state.selectedIds.filter((id) => ids.has(id)),
        linkSourceId: null,
      };
    }

    // Drag preview: replace the present document without an undo entry
    case 'MOVE_PREVIEW': {
      const base = state.previewBase ?? map;
      return {
        ...state,
        previewBase: base,
        stack: { ...state.stack, present: setCoords(map, action.id, action.evolution, action.visibility) },
      };
    }

    // Drop: one undo step from the pre-drag document (none if nothing moved)
    case 'MOVE_COMMIT': {
      const base = state.previewBase ?? map;
      const before = base.elements.find((el) => el.id === action.id);
      const restored = { ...state, previewBase: null, stack: { ...state.stack, present: base } };
      if (!before) return restored;
      const next = setCoords(base, action.id, action.evolution, action.visibility);
      const after = next.elements.find((el) => el.id === action.id)!;
      if (after.evolution === before.evolution && after.visibility === before.visibility) return restored;
      return withUpdatedMap(restored, next);
    }

    case 'NUDGE': {
      const ids = state.selectedIds.filter((id) => map.elements.some((el) => el.id === id));
      if (ids.length === 0) return state;
      return withUpdatedMap(state, nudgeElements(map, ids, action.dEvolution, action.dVisibility));
    }

    case 'DUPLICATE': {
      const ids = state.selectedIds.filter((id) => map.elements.some((el) => el.id === id));
      if (ids.length === 0) return state;
      const result = duplicateElements(map, ids);
      return { ...withUpdatedMap(state, result.map), selectedIds: result.newIds };
    }

    case 'PATCH_MAP':
      return withUpdatedMap(state, { ...map, ...action.changes });

    case 'SET_HIGHLIGHT':
      return { ...state, highlightIds: action.ids };

    case 'ADD_ELEMENT':
      return withUpdatedMap(state, {
        ...map,
        elements: [...map.elements, action.element],
      });

    case 'UPDATE_ELEMENT':
      return withUpdatedMap(state, {
        ...map,
        elements: map.elements.map((el) =>
          el.id === action.id ? { ...el, ...action.changes } : el
        ),
      });

    case 'REMOVE_ELEMENTS': {
      const next = removeElementsFromMap(map, action.ids);
      return {
        ...withUpdatedMap(state, next),
        selectedIds: state.selectedIds.filter((id) => !action.ids.includes(id)),
        linkSourceId: action.ids.includes(state.linkSourceId ?? '')
          ? null
          : state.linkSourceId,
      };
    }

    case 'ADD_DEPENDENCY':
      return withUpdatedMap(state, {
        ...map,
        dependencies: [...map.dependencies, action.dep],
      });

    case 'REMOVE_DEPENDENCY':
      return withUpdatedMap(state, {
        ...map,
        dependencies: map.dependencies.filter((d) => d.id !== action.id),
      });

    case 'SET_TITLE':
      return withUpdatedMap(state, { ...map, title: action.title });

    case 'SET_PURPOSE':
      return withUpdatedMap(state, { ...map, purpose: action.purpose });

    case 'UPDATE_ANALYSIS':
      return withUpdatedMap(state, { ...map, analysis: action.analysis });

    case 'MAP_ANALYSIS':
      return withUpdatedMap(state, { ...map, analysis: action.fn(map.analysis) });

    case 'UNDO':
      return canUndo(state.stack)
        ? { ...state, stack: undoCmd(state.stack), saveState: 'unsaved', previewBase: null }
        : state;

    case 'REDO':
      return canRedo(state.stack)
        ? { ...state, stack: redoCmd(state.stack), saveState: 'unsaved', previewBase: null }
        : state;

    case 'SET_TOOL':
      return { ...state, activeTool: action.tool, linkSourceId: null };

    case 'SELECT':
      return { ...state, selectedIds: action.ids };

    case 'TOGGLE_SELECT':
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.id)
          ? state.selectedIds.filter((id) => id !== action.id)
          : [...state.selectedIds, action.id],
      };

    case 'DESELECT':
      return { ...state, selectedIds: [], linkSourceId: null };

    case 'SET_LINK_SOURCE':
      return { ...state, linkSourceId: action.id };

    case 'SET_SAVE_STATE':
      return { ...state, saveState: action.state };

    case 'MARK_CLEAN':
      return { ...state, saveState: 'clean' };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMapEditor(
  initialMap: WardleyMap,
  options: { autosave?: boolean; onDeleteRequest?: (ids: Id[]) => void } = {}
) {
  const onDeleteRequestRef = useRef(options.onDeleteRequest);
  onDeleteRequestRef.current = options.onDeleteRequest;
  const [state, dispatch] = useReducer(reducer, null, () => ({
    stack: makeCommandStack(initialMap),
    selectedIds: [],
    activeTool: 'select' as ActiveTool,
    linkSourceId: null,
    saveState: 'clean' as SaveState,
    nudging: false,
    previewBase: null,
    highlightIds: [],
  }));

  const map = state.stack.present;
  const stateRef = useRef(state);
  stateRef.current = state;
  // Practice maps (learning challenges) must not write into the map draft store
  const autosaveEnabled = useRef(options.autosave !== false);

  // Autosave when map changes
  useEffect(() => {
    if (!autosaveEnabled.current) return;
    if (state.saveState === 'unsaved' && state.previewBase === null) {
      scheduleAutosave(map);
    }
  }, [map, state.saveState, state.previewBase]);

  /** Add an element at a sensible default position and select it (keyboard creation). */
  const placeElement = useCallback((kind: 'anchor' | 'component') => {
    const count = stateRef.current.stack.present.elements.length;
    const el: MapElement = {
      id: generateId('el'),
      kind,
      name: kind === 'anchor' ? 'User' : `Component ${count + 1}`,
      componentType: 'unspecified',
      // Anchors at the top; components stepped down so they do not overlap
      visibility: kind === 'anchor' ? 0.92 : Math.max(0.1, 0.75 - (count % 6) * 0.1),
      evolution: kind === 'anchor' ? 0.5 : 0.35 + (count % 4) * 0.1,
    };
    dispatch({ type: 'ADD_ELEMENT', element: el });
    dispatch({ type: 'SELECT', ids: [el.id] });
    dispatch({ type: 'SET_TOOL', tool: 'select' });
    return el;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Shortcuts belong to the canvas, not to an open dialog
      if ((e.target as HTMLElement).closest?.('[role="dialog"]')) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          // The host may confirm deletions that affect other parts of the map
          if (onDeleteRequestRef.current) onDeleteRequestRef.current(state.selectedIds);
          else dispatch({ type: 'REMOVE_ELEMENTS', ids: state.selectedIds });
        }
      } else if (meta && (e.key === 'd' || e.key === 'D')) {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          dispatch({ type: 'DUPLICATE' });
        }
      } else if (e.key.startsWith('Arrow') && !meta && !e.altKey) {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
          const dEvolution = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
          const dVisibility = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
          dispatch({ type: 'NUDGE', dEvolution, dVisibility });
        }
      } else if (!meta && !e.altKey && !e.shiftKey && ['s', 'h', 'a', 'c'].includes(e.key.toLowerCase())) {
        // Tool shortcuts shown in the toolbar tooltips; A/C place an element immediately
        // so creation never requires a pointer (EDT-03 keyboard parity)
        const key = e.key.toLowerCase();
        e.preventDefault();
        if (key === 's') dispatch({ type: 'SET_TOOL', tool: 'select' });
        else if (key === 'h') dispatch({ type: 'SET_TOOL', tool: 'pan' });
        else placeElement(key === 'a' ? 'anchor' : 'component');
      } else if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT' });
        dispatch({ type: 'SET_TOOL', tool: 'select' });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.selectedIds]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const loadMap = useCallback((map: WardleyMap) => {
    dispatch({ type: 'LOAD_MAP', map });
  }, []);

  const replaceMap = useCallback((map: WardleyMap) => {
    dispatch({ type: 'REPLACE_MAP', map });
  }, []);

  const addElement = useCallback(
    (
      kind: MapElement['kind'],
      name: string,
      evolution: Normalized,
      visibility: Normalized
    ) => {
      const el: MapElement = {
        id: generateId('el'),
        kind,
        name,
        componentType: 'unspecified',
        evolution: clampNormalized(evolution),
        visibility: clampNormalized(visibility),
      };
      dispatch({ type: 'ADD_ELEMENT', element: el });
      dispatch({ type: 'SELECT', ids: [el.id] });
      dispatch({ type: 'SET_TOOL', tool: 'select' });
      return el;
    },
    []
  );

  const updateElement = useCallback(
    (id: Id, changes: Partial<MapElement>) => {
      const sanitized = { ...changes };
      if (sanitized.evolution !== undefined)
        sanitized.evolution = clampNormalized(sanitized.evolution);
      if (sanitized.visibility !== undefined)
        sanitized.visibility = clampNormalized(sanitized.visibility);
      dispatch({ type: 'UPDATE_ELEMENT', id, changes: sanitized });
    },
    []
  );

  const moveElement = useCallback(
    (id: Id, evolution: Normalized, visibility: Normalized) => {
      dispatch({
        type: 'UPDATE_ELEMENT',
        id,
        changes: {
          evolution: clampNormalized(evolution),
          visibility: clampNormalized(visibility),
        },
      });
    },
    []
  );

  const previewMove = useCallback((id: Id, evolution: Normalized, visibility: Normalized) => {
    dispatch({ type: 'MOVE_PREVIEW', id, evolution, visibility });
  }, []);

  const commitMove = useCallback((id: Id, evolution: Normalized, visibility: Normalized) => {
    dispatch({ type: 'MOVE_COMMIT', id, evolution, visibility });
  }, []);

  const nudge = useCallback((dEvolution: number, dVisibility: number) => {
    dispatch({ type: 'NUDGE', dEvolution, dVisibility });
  }, []);

  const duplicateSelected = useCallback(() => {
    dispatch({ type: 'DUPLICATE' });
  }, []);

  const patchMap = useCallback(
    (changes: Partial<Pick<WardleyMap, 'evolutions' | 'pipelines' | 'annotations' | 'evolutionLabels' | 'stageBoundaries'>>) => {
      dispatch({ type: 'PATCH_MAP', changes });
    },
    []
  );

  const setHighlight = useCallback((ids: Id[]) => {
    dispatch({ type: 'SET_HIGHLIGHT', ids });
  }, []);

  const removeElements = useCallback((ids: Id[]) => {
    dispatch({ type: 'REMOVE_ELEMENTS', ids });
  }, []);

  const createDependency = useCallback((fromId: Id, toId: Id) => {
    if (fromId === toId) return;
    const existing = state.stack.present.dependencies.find(
      (d) =>
        (d.fromId === fromId && d.toId === toId) ||
        (d.fromId === toId && d.toId === fromId)
    );
    if (existing) return;
    const dep: Dependency = {
      id: generateId('dep'),
      fromId,
      toId,
      kind: 'dependency',
    };
    dispatch({ type: 'ADD_DEPENDENCY', dep });
    dispatch({ type: 'SET_LINK_SOURCE', id: null });
    dispatch({ type: 'SET_TOOL', tool: 'select' });
  }, [state.stack.present.dependencies]);

  const removeDependency = useCallback((id: Id) => {
    dispatch({ type: 'REMOVE_DEPENDENCY', id });
  }, []);

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', title });
  }, []);

  const setPurpose = useCallback((purpose: string) => {
    dispatch({ type: 'SET_PURPOSE', purpose });
  }, []);

  const select = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT', ids });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_SELECT', id });
  }, []);

  const deselect = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, []);

  const setTool = useCallback((tool: ActiveTool) => {
    dispatch({ type: 'SET_TOOL', tool });
  }, []);

  const setLinkSource = useCallback((id: string | null) => {
    dispatch({ type: 'SET_LINK_SOURCE', id });
  }, []);

  const undoAction = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redoAction = useCallback(() => dispatch({ type: 'REDO' }), []);

  const markClean = useCallback(() => dispatch({ type: 'MARK_CLEAN' }), []);
  const setSaveState = useCallback((s: SaveState) => {
    dispatch({ type: 'SET_SAVE_STATE', state: s });
  }, []);

  // Analysis layer helpers
  // Analysis actions use functional updates: callers may chain them (add evidence, then link it)
  const mapAnalysis = useCallback((fn: (a: AnalysisLayer) => AnalysisLayer) => {
    dispatch({ type: 'MAP_ANALYSIS', fn });
  }, []);

  const upsertById = <T extends { id: Id }>(list: T[], item: T): T[] =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

  const addEvidence = useCallback((ev: Evidence) => {
    mapAnalysis((a) => ({ ...a, evidence: [...a.evidence, ev] }));
  }, [mapAnalysis]);

  const updateEvidence = useCallback((id: Id, changes: Partial<Evidence>) => {
    mapAnalysis((a) => ({ ...a, evidence: a.evidence.map((e) => (e.id === id ? { ...e, ...changes } : e)) }));
  }, [mapAnalysis]);

  const removeEvidence = useCallback((id: Id) => {
    // Also unlink it from every assessment so no dangling references remain
    const unlink = <T extends { evidenceIds: Id[] }>(x: T): T => ({ ...x, evidenceIds: x.evidenceIds.filter((e) => e !== id) });
    mapAnalysis((a) => ({
      ...a,
      evidence: a.evidence.filter((e) => e.id !== id),
      climate: a.climate.map(unlink),
      doctrine: a.doctrine.map(unlink),
      gameplay: a.gameplay.map(unlink),
    }));
  }, [mapAnalysis]);

  const upsertClimateAssessment = useCallback((assessment: PatternAssessment) => {
    mapAnalysis((a) => ({ ...a, climate: upsertById(a.climate, assessment) }));
  }, [mapAnalysis]);

  const removeClimateAssessment = useCallback((id: Id) => {
    mapAnalysis((a) => ({ ...a, climate: a.climate.filter((x) => x.id !== id) }));
  }, [mapAnalysis]);

  const upsertDoctrineAssessment = useCallback((assessment: DoctrineAssessment) => {
    mapAnalysis((a) => ({ ...a, doctrine: upsertById(a.doctrine, assessment) }));
  }, [mapAnalysis]);

  const removeDoctrineAssessment = useCallback((id: Id) => {
    mapAnalysis((a) => ({ ...a, doctrine: a.doctrine.filter((x) => x.id !== id) }));
  }, [mapAnalysis]);

  const upsertGameplayHypothesis = useCallback((hypothesis: GameplayHypothesis) => {
    mapAnalysis((a) => ({ ...a, gameplay: upsertById(a.gameplay, hypothesis) }));
  }, [mapAnalysis]);

  const removeGameplayHypothesis = useCallback((id: Id) => {
    mapAnalysis((a) => ({ ...a, gameplay: a.gameplay.filter((x) => x.id !== id) }));
  }, [mapAnalysis]);

  return {
    map,
    state,
    // document actions
    loadMap,
    replaceMap,
    addElement,
    updateElement,
    moveElement,
    previewMove,
    commitMove,
    nudge,
    duplicateSelected,
    patchMap,
    placeElement,
    setHighlight,
    highlightIds: state.highlightIds,
    removeElements,
    createDependency,
    removeDependency,
    setTitle,
    setPurpose,
    // analysis
    addEvidence,
    updateEvidence,
    removeEvidence,
    upsertClimateAssessment,
    removeClimateAssessment,
    upsertDoctrineAssessment,
    removeDoctrineAssessment,
    upsertGameplayHypothesis,
    removeGameplayHypothesis,
    // undo/redo
    undo: undoAction,
    redo: redoAction,
    canUndo: canUndo(state.stack),
    canRedo: canRedo(state.stack),
    // selection
    select,
    toggleSelect,
    deselect,
    selectedIds: state.selectedIds,
    // tool
    setTool,
    activeTool: state.activeTool,
    // dependency creation
    setLinkSource,
    linkSourceId: state.linkSourceId,
    // persistence
    saveState: state.saveState,
    setSaveState,
    markClean,
  };
}
