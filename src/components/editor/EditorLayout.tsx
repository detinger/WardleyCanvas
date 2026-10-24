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
import { mergeParsedMap } from '@/parser/owm';
import ExportDialog from './ExportDialog';
import ImportDialog from './ImportDialog';
import { useToast } from '@/hooks/use-toast';

type EditorMode = 'visual' | 'split' | 'source';

interface EditorLayoutProps {
  initialMap: WardleyMap;
}

export default function EditorLayout({ initialMap }: EditorLayoutProps) {
  const editor = useMapEditor(initialMap);
  const { map, state, saveState } = editor;
  const { toast } = useToast();
  const [editorMode, setEditorMode] = React.useState<EditorMode>('visual');
  const [showExport, setShowExport] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const canvasSvgRef = React.useRef<SVGSVGElement | null>(null);

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
      editor.updateElement(id, { evolution, visibility });
    },
    [editor]
  );

  const handleElementMoveCommit = React.useCallback(
    (id: Id, evolution: Normalized, visibility: Normalized) => {
      editor.updateElement(id, { evolution, visibility });
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

  // Autosave on change
  React.useEffect(() => {
    if (state.saveState === 'unsaved') {
      saveMap(map);
    }
  }, [map, state.saveState]);

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
        onSetTool={editor.setTool}
        onFitMap={() => fitRef.current()}
        onZoomIn={() => zoomInRef.current()}
        onZoomOut={() => zoomOutRef.current()}
        onSaveVersion={handleSaveVersion}
        linkSourceId={editor.linkSourceId}
        editorMode={editorMode}
        onSetEditorMode={setEditorMode}
        onImport={() => setShowImport(true)}
        onExport={() => setShowExport(true)}
        mapId={map.id}
      />

      {/* Canvas + Inspector (visual/split/source modes) */}
      <div
        style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}
        className="editor-main"
      >
        {/* Canvas pane — hidden in source-only mode */}
        {editorMode !== 'source' && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              minWidth: 0,
              minHeight: 0,
              position: 'relative',
            }}
          >
            {map.elements.length === 0 && editorMode === 'visual' && (
              <CanvasEmptyState activeTool={editor.activeTool} onSetTool={editor.setTool} />
            )}
            <CanvasRenderer
              map={map}
              selectedIds={editor.selectedIds}
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
              svgRefCallback={(el) => { canvasSvgRef.current = el; }}
            />
          </div>
        )}

        {/* Source pane — shown in split and source modes */}
        {editorMode !== 'visual' && (
          <div
            style={{
              width: editorMode === 'split' ? 380 : undefined,
              flex: editorMode === 'source' ? 1 : undefined,
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: editorMode === 'split' ? '1px solid var(--border)' : 'none',
            }}
          >
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

      {/* Responsive: inspector below canvas at ≤820px */}
      <style>{`
        @media (max-width: 820px) {
          .editor-main {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* Dialogs */}
      {showExport && (
        <ExportDialog
          map={map}
          svgRef={canvasSvgRef}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportDialog
          currentMapId={map.id}
          onImport={(imported) => {
            editor.replaceMap(mergeParsedMap(map, imported));
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
