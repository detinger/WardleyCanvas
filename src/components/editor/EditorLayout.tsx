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
  const editor = useMapEditor(initialMap, { autosave: !practice });
  const { map, state, saveState } = editor;
  const { toast } = useToast();
  const [editorMode, setEditorMode] = React.useState<EditorMode>('visual');
  const [showExport, setShowExport] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);

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

  const handleSaveVersion = React.useCallback(() => {
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
    const committed = commitVersion(map);
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

  return (
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
        onDelete={() => editor.removeElements(editor.selectedIds)}
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
        onSaveVersion={practice ? practice.onPrimary : handleSaveVersion}
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
      <div className="editor-main">
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
    </div>
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
