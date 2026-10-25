'use client';

// EDT-01: Editor shell — toolbar + canvas + 420px inspector.
// IO-02: Split/Source mode toggle.
// Responsive: inspector moves below canvas at ≤820px.

import * as React from 'react';
import { WardleyMap, MapElement, Id, Normalized } from '@/domain/types';
import { useMapEditor, ActiveTool } from '@/hooks/use-map-editor';
import { commitVersion, saveMap } from '@/hooks/use-persistence';
import { validateMap } from '@/domain/validation';
import EditorToolbar from './EditorToolbar';
import CanvasRenderer from './CanvasRenderer';
import MapInspector from './MapInspector';
import SourceEditor from './SourceEditor';
import { commitImport } from '@/parser/import';
import ExportDialog from './ExportDialog';
import ImportDialog from './ImportDialog';
import { useToast } from '@/hooks/use-toast';
import MapOutline from './MapOutline';
import { DeleteConfirmDialog, ShortcutsDialog, SaveVersionDialog, DeleteRequestContext } from './EditorDialogs';
import { deletionImpact } from '@/domain/editing';
import { countBySeverity } from '@/domain/validation';

type EditorMode = 'visual' | 'split' | 'source';

/**
 * Practice mode embeds the editor in a learning challenge: nothing is written
 * to the map store, and the primary action is supplied by the host.
 */
export interface PracticeOptions {
  onChange: (map: WardleyMap) => void;
  primaryLabel: string;
  onPrimary: () => void;
}

interface EditorLayoutProps {
  initialMap: WardleyMap;
  practice?: PracticeOptions;
}

export default function EditorLayout({ initialMap, practice }: EditorLayoutProps) {
  const requestDeleteRef = React.useRef<(ids: Id[]) => void>(() => {});
  const editor = useMapEditor(initialMap, {
    autosave: !practice,
    onDeleteRequest: (ids) => requestDeleteRef.current(ids),
  });
  const { map, state, saveState } = editor;
  const { toast } = useToast();
  const [editorMode, setEditorMode] = React.useState<EditorMode>('visual');
  const [showExport, setShowExport] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showOutline, setShowOutline] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showSave, setShowSave] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Id[] | null>(null);
  const [announcement, setAnnouncement] = React.useState('');

  // Section 15.2: deleting something other parts of the map rely on is previewed first
  const requestDelete = React.useCallback((ids: Id[]) => {
    if (ids.length === 0) return;
    if (deletionImpact(editor.map, ids).length === 0) editor.removeElements(ids);
    else setPendingDelete(ids);
  }, [editor]);
  requestDeleteRef.current = requestDelete;

  // '?' opens the shortcut reference
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.closest?.('[role="dialog"]')) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Callbacks for viewport control (passed down to CanvasRenderer)
  const fitRef = React.useRef<() => void>(() => {});
  const zoomInRef = React.useRef<() => void>(() => {});
  const zoomOutRef = React.useRef<() => void>(() => {});

  // --------------------------------------------------------------------------
  // Canvas interactions
  // --------------------------------------------------------------------------

  const handleCanvasClick = React.useCallback(
    (evolution: Normalized, visibility: Normalized) => {
      if (editor.activeTool === 'add-anchor') {
        editor.addElement('anchor', 'User', evolution, visibility);
      } else if (editor.activeTool === 'add-component') {
        editor.addElement('component', `Component ${map.elements.length + 1}`, evolution, visibility);
      } else {
        editor.deselect();
      }
    },
    [editor, map.elements.length]
  );

  const handleElementClick = React.useCallback(
    (id: Id, addToSelection: boolean) => {
      if (editor.activeTool === 'add-dependency') {
        if (!editor.linkSourceId) {
          editor.setLinkSource(id);
        } else {
          editor.createDependency(editor.linkSourceId, id);
        }
        return;
      }
      if (addToSelection) {
        editor.toggleSelect(id);
      } else {
        editor.select([id]);
      }
    },
    [editor]
  );

  const handleLinkCreate = React.useCallback(
    (fromId: Id, toId: Id) => {
      editor.createDependency(fromId, toId);
    },
    [editor]
  );

  const handleDependencyClick = React.useCallback(
    (id: Id) => {
      editor.select([id]);
    },
    [editor]
  );

  const handleElementMoved = React.useCallback(
    (id: Id, evolution: Normalized, visibility: Normalized) => {
      // Live preview during drag — update without pushing to undo
      editor.previewMove(id, evolution, visibility);
    },
    [editor]
  );

  const handleElementMoveCommit = React.useCallback(
    (id: Id, evolution: Normalized, visibility: Normalized) => {
      editor.commitMove(id, evolution, visibility);
    },
    [editor]
  );

  // --------------------------------------------------------------------------
  // Save
  // --------------------------------------------------------------------------

  const handleSaveVersion = React.useCallback((note?: string) => {
    const findings = validateMap(map);
    const errors = findings.filter((f) => f.severity === 'error');
    if (errors.length > 0) {
      toast({
        title: 'Cannot save — structural errors',
        description: `Fix ${errors.length} error(s) before saving a version.`,
        variant: 'destructive',
      });
      return;
    }
    const committed = commitVersion(map, note || undefined);
    editor.loadMap(committed);
    editor.markClean();
    toast({ title: 'Version saved', description: `Revision ${committed.revision} saved.` });
  }, [map, editor, toast]);

  // Autosave on change (not on every pointer move of a drag in progress)
  const dragging = state.previewBase !== null;
  React.useEffect(() => {
    if (practice) return;
    if (state.saveState === 'unsaved' && !dragging) {
      saveMap(map);
    }
  }, [map, state.saveState, dragging, practice]);

  // Practice hosts receive every committed change instead
  const onPracticeChange = practice?.onChange;
  React.useEffect(() => {
    if (onPracticeChange && !dragging) onPracticeChange(map);
  }, [map, dragging, onPracticeChange]);

  // Section 6.5: announce selection, creation/deletion, validation totals and save state
  const prevRef = React.useRef({ ids: editor.selectedIds, count: map.elements.length, errors: -1, save: saveState });
  React.useEffect(() => {
    if (dragging) return;
    const prev = prevRef.current;
    const msgs: string[] = [];
    const nameOf = (id: Id) =>
      map.elements.find((e) => e.id === id)?.name ??
      (map.dependencies.some((d) => d.id === id) ? 'dependency' : null);
    if (map.elements.length > prev.count) {
      const added = map.elements.slice(prev.count).map((e) => e.name);
      msgs.push(`Added ${added.join(', ')}.`);
    } else if (map.elements.length < prev.count) {
      const n = prev.count - map.elements.length;
      msgs.push(`Deleted ${n} element${n === 1 ? '' : 's'}.`);
    }
    if (editor.selectedIds.join() !== prev.ids.join()) {
      const names = editor.selectedIds.map(nameOf).filter(Boolean);
      msgs.push(names.length ? `Selected ${names.join(', ')}.` : 'Selection cleared.');
    }
    const errors = countBySeverity(validateMap(map)).error;
    if (prev.errors !== -1 && errors !== prev.errors) {
      msgs.push(errors === 0 ? 'No structural errors.' : `${errors} structural error${errors === 1 ? '' : 's'}.`);
    }
    if (saveState !== prev.save && (saveState === 'saved' || saveState === 'error')) {
      msgs.push(saveState === 'saved' ? 'Saved.' : 'Could not save.');
    }
    prevRef.current = { ids: editor.selectedIds, count: map.elements.length, errors, save: saveState };
    if (msgs.length) setAnnouncement(msgs.join(' '));
  }, [map, editor.selectedIds, saveState, dragging]);

  return (
    <DeleteRequestContext.Provider value={requestDelete}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* Toolbar */}
      <EditorToolbar
        title={map.title}
        saveState={saveState}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        activeTool={editor.activeTool}
        hasSelection={editor.selectedIds.length > 0}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onDelete={() => requestDelete(editor.selectedIds)}
        outlineOpen={showOutline}
        onToggleOutline={() => setShowOutline((v) => !v)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onSetTool={(tool, viaKeyboard) => {
          if (viaKeyboard && (tool === 'add-anchor' || tool === 'add-component')) {
            editor.placeElement(tool === 'add-anchor' ? 'anchor' : 'component');
          } else {
            editor.setTool(tool);
          }
        }}
        onFitMap={() => fitRef.current()}
        onZoomIn={() => zoomInRef.current()}
        onZoomOut={() => zoomOutRef.current()}
        onSaveVersion={practice ? practice.onPrimary : () => setShowSave(true)}
        variant={practice ? 'practice' : 'map'}
        primaryLabel={practice?.primaryLabel}
        linkSourceId={editor.linkSourceId}
        editorMode={editorMode}
        onSetEditorMode={setEditorMode}
        onImport={() => setShowImport(true)}
        onExport={() => setShowExport(true)}
        mapId={map.id}
      />

      {/* Canvas + Inspector (visual/split/source modes) */}
      {/* Polite live region for editor announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="editor-announcer">
        {announcement}
      </div>

      <div className="editor-main">
        {showOutline && editorMode !== 'source' && (
          <MapOutline map={map} selectedIds={editor.selectedIds} onSelect={(id) => editor.select([id])} />
        )}
        {/* Canvas pane — hidden in source-only mode */}
        {editorMode !== 'source' && (
          <div className="editor-canvas">
            {map.elements.length === 0 && editorMode === 'visual' && (
              <CanvasEmptyState activeTool={editor.activeTool} onSetTool={editor.setTool} />
            )}
            <CanvasRenderer
              map={map}
              selectedIds={editor.selectedIds}
              highlightIds={editor.highlightIds}
              activeTool={editor.activeTool}
              linkSourceId={editor.linkSourceId}
              onElementClick={handleElementClick}
              onDependencyClick={handleDependencyClick}
              onCanvasClick={handleCanvasClick}
              onElementMoved={handleElementMoved}
              onElementMoveCommit={handleElementMoveCommit}
              onLinkCreate={handleLinkCreate}
              onFitRequested={(fn) => { fitRef.current = fn; }}
              onZoomInRequested={(fn) => { zoomInRef.current = fn; }}
              onZoomOutRequested={(fn) => { zoomOutRef.current = fn; }}
            />
          </div>
        )}

        {/* Source pane — shown in split and source modes */}
        {editorMode !== 'visual' && (
          <div className={editorMode === 'split' ? 'editor-source editor-source--split' : 'editor-source'}>
            <SourceEditor
              map={map}
              onMapChange={(updated) => editor.replaceMap(updated)}
            />
          </div>
        )}

        {/* Inspector — only in visual mode */}
        {editorMode === 'visual' && (
          <MapInspector
            map={map}
            selectedIds={editor.selectedIds}
            editor={editor}
          />
        )}
      </div>


      {/* Dialogs */}
      {showExport && (
        <ExportDialog
          map={map}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportDialog
          currentMap={map}
          onImport={(preview) => {
            editor.replaceMap(commitImport(map, preview));
          }}
          onClose={() => setShowImport(false)}
        />
      )}
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
      {showSave && (
        <SaveVersionDialog
          onSave={(note) => {
            setShowSave(false);
            handleSaveVersion(note);
          }}
          onCancel={() => setShowSave(false)}
        />
      )}
      {pendingDelete && (
        <DeleteConfirmDialog
          names={pendingDelete.map((id) => map.elements.find((e) => e.id === id)?.name ?? 'dependency')}
          impact={deletionImpact(map, pendingDelete)}
          onConfirm={() => {
            editor.removeElements(pendingDelete);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
    </DeleteRequestContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Empty state overlay
// ---------------------------------------------------------------------------

function CanvasEmptyState({
  activeTool,
  onSetTool,
}: {
  activeTool: ActiveTool;
  onSetTool: (tool: ActiveTool) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
        gap: 12,
      }}
    >
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Start by adding an anchor (user or stakeholder)
      </p>
      {activeTool !== 'add-anchor' && (
        <button
          style={{
            height: 34,
            padding: '0 16px',
            borderRadius: 6,
            background: 'var(--primary)',
            color: 'var(--text-on-primary)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 550,
            pointerEvents: 'all',
          }}
          onClick={() => onSetTool('add-anchor')}
        >
          Add anchor
        </button>
      )}
    </div>
  );
}
