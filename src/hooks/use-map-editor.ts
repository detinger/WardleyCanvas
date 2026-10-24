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
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

type Action =
  | { type: 'LOAD_MAP'; map: WardleyMap }
  | { type: 'ADD_ELEMENT'; element: MapElement }
  | { type: 'UPDATE_ELEMENT'; id: Id; changes: Partial<MapElement> }
  | { type: 'REMOVE_ELEMENTS'; ids: Id[] }
  | { type: 'ADD_DEPENDENCY'; dep: Dependency }
  | { type: 'REMOVE_DEPENDENCY'; id: Id }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_PURPOSE'; purpose: string }
  | { type: 'UPDATE_ANALYSIS'; analysis: AnalysisLayer }
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
    dependencies: map.dependencies.filter(
      (dep) => !idSet.has(dep.fromId) && !idSet.has(dep.toId)
    ),
    evolutions: map.evolutions.filter((ev) => !idSet.has(ev.elementId)),
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: EditorState, action: Action): EditorState {
  const map = state.stack.present;

  switch (action.type) {
    case 'LOAD_MAP':
      return {
        ...state,
        stack: makeCommandStack(action.map),
        selectedIds: [],
        saveState: 'clean',
        linkSourceId: null,
      };

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

    case 'UNDO':
      return canUndo(state.stack)
        ? { ...state, stack: undoCmd(state.stack), saveState: 'unsaved' }
        : state;

    case 'REDO':
      return canRedo(state.stack)
        ? { ...state, stack: redoCmd(state.stack), saveState: 'unsaved' }
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

export function useMapEditor(initialMap: WardleyMap) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    stack: makeCommandStack(initialMap),
    selectedIds: [],
    activeTool: 'select' as ActiveTool,
    linkSourceId: null,
    saveState: 'clean' as SaveState,
    nudging: false,
  }));

  const map = state.stack.present;
  const autosaveEnabled = useRef(true);

  // Autosave when map changes
  useEffect(() => {
    if (!autosaveEnabled.current) return;
    if (state.saveState === 'unsaved') {
      scheduleAutosave(map);
    }
  }, [map, state.saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
          dispatch({ type: 'REMOVE_ELEMENTS', ids: state.selectedIds });
        }
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
  const addEvidence = useCallback((ev: Evidence) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, evidence: [...analysis.evidence, ev] } });
  }, [state.stack.present.analysis]);

  const updateEvidence = useCallback((id: Id, changes: Partial<Evidence>) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, evidence: analysis.evidence.map((e) => e.id === id ? { ...e, ...changes } : e) } });
  }, [state.stack.present.analysis]);

  const removeEvidence = useCallback((id: Id) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, evidence: analysis.evidence.filter((e) => e.id !== id) } });
  }, [state.stack.present.analysis]);

  const upsertClimateAssessment = useCallback((assessment: PatternAssessment) => {
    const analysis = state.stack.present.analysis;
    const existing = analysis.climate.findIndex((a) => a.id === assessment.id);
    const climate = existing >= 0
      ? analysis.climate.map((a) => a.id === assessment.id ? assessment : a)
      : [...analysis.climate, assessment];
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, climate } });
  }, [state.stack.present.analysis]);

  const removeClimateAssessment = useCallback((id: Id) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, climate: analysis.climate.filter((a) => a.id !== id) } });
  }, [state.stack.present.analysis]);

  const upsertDoctrineAssessment = useCallback((assessment: DoctrineAssessment) => {
    const analysis = state.stack.present.analysis;
    const existing = analysis.doctrine.findIndex((a) => a.id === assessment.id);
    const doctrine = existing >= 0
      ? analysis.doctrine.map((a) => a.id === assessment.id ? assessment : a)
      : [...analysis.doctrine, assessment];
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, doctrine } });
  }, [state.stack.present.analysis]);

  const removeDoctrineAssessment = useCallback((id: Id) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, doctrine: analysis.doctrine.filter((a) => a.id !== id) } });
  }, [state.stack.present.analysis]);

  const upsertGameplayHypothesis = useCallback((hypothesis: GameplayHypothesis) => {
    const analysis = state.stack.present.analysis;
    const existing = analysis.gameplay.findIndex((g) => g.id === hypothesis.id);
    const gameplay = existing >= 0
      ? analysis.gameplay.map((g) => g.id === hypothesis.id ? hypothesis : g)
      : [...analysis.gameplay, hypothesis];
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, gameplay } });
  }, [state.stack.present.analysis]);

  const removeGameplayHypothesis = useCallback((id: Id) => {
    const analysis = state.stack.present.analysis;
    dispatch({ type: 'UPDATE_ANALYSIS', analysis: { ...analysis, gameplay: analysis.gameplay.filter((g) => g.id !== id) } });
  }, [state.stack.present.analysis]);

  return {
    map,
    state,
    // document actions
    loadMap,
    addElement,
    updateElement,
    moveElement,
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
