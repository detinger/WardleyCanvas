'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Anchor,
  Circle,
  Link2,
  Trash2,
  Undo2,
  Redo2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  MousePointer2,
  Hand,
  Eye,
  Code2,
  Columns2,
  Upload,
  Download,
  GitBranch,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActiveTool, SaveState } from '@/hooks/use-map-editor';

type EditorMode = 'visual' | 'split' | 'source';

interface EditorToolbarProps {
  title: string;
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  activeTool: ActiveTool;
  hasSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onSetTool: (tool: ActiveTool) => void;
  onFitMap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSaveVersion: () => void;
  linkSourceId: string | null;
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  onImport: () => void;
  onExport: () => void;
  mapId: string;
}

export default function EditorToolbar({
  title,
  saveState,
  canUndo,
  canRedo,
  activeTool,
  hasSelection,
  onUndo,
  onRedo,
  onDelete,
  onSetTool,
  onFitMap,
  onZoomIn,
  onZoomOut,
  onSaveVersion,
  linkSourceId,
  editorMode,
  onSetEditorMode,
  onImport,
  onExport,
  mapId,
}: EditorToolbarProps) {
  const router = useRouter();

  return (
    <div
      role="toolbar"
      aria-label="Map editor toolbar"
      style={{
        minHeight: 56,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        rowGap: 4,
        padding: '6px 12px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Group 1: back + title + save state */}
      <ToolbarButton
        icon={<ArrowLeft size={16} />}
        label="Back to maps"
        onClick={() => router.push('/maps')}
      />
      <div
        style={{
          padding: '0 8px',
          fontSize: 14,
          fontWeight: 550,
          color: 'var(--text)',
          maxWidth: 240,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {title || 'Untitled Map'}
      </div>
      <SaveIndicator state={saveState} />

      <Divider />

      {/* Group 2: tools */}
      <ToolbarButton
        icon={<MousePointer2 size={16} />}
        label="Select tool (S)"
        active={activeTool === 'select'}
        onClick={() => onSetTool('select')}
      />
      <ToolbarButton
        icon={<Hand size={16} />}
        label="Pan tool (H)"
        active={activeTool === 'pan'}
        onClick={() => onSetTool('pan')}
      />

      <Divider />

      {/* Group 3: create */}
      <ToolbarButton
        icon={<Anchor size={16} />}
        label="Add anchor/user (A)"
        active={activeTool === 'add-anchor'}
        onClick={() => onSetTool('add-anchor')}
      />
      <ToolbarButton
        icon={<Circle size={16} />}
        label="Add component (C)"
        active={activeTool === 'add-component'}
        onClick={() => onSetTool('add-component')}
      />
      <ToolbarButton
        icon={<Link2 size={16} />}
        label={
          linkSourceId
            ? 'Click a target to connect (Esc to cancel)'
            : 'Add dependency (D)'
        }
        active={activeTool === 'add-dependency'}
        onClick={() => onSetTool('add-dependency')}
        highlight={!!linkSourceId}
      />

      <Divider />

      {/* Group 4: edit */}
      <ToolbarButton
        icon={<Undo2 size={16} />}
        label="Undo (⌘Z)"
        disabled={!canUndo}
        onClick={onUndo}
      />
      <ToolbarButton
        icon={<Redo2 size={16} />}
        label="Redo (⌘⇧Z)"
        disabled={!canRedo}
        onClick={onRedo}
      />
      <ToolbarButton
        icon={<Trash2 size={16} />}
        label="Delete selected (Del)"
        disabled={!hasSelection}
        onClick={onDelete}
      />

      <Divider />

      {/* Group 5: view */}
      <ToolbarButton
        icon={<Maximize2 size={16} />}
        label="Fit map (F)"
        onClick={onFitMap}
      />
      <ToolbarButton
        icon={<ZoomIn size={16} />}
        label="Zoom in (=)"
        onClick={onZoomIn}
      />
      <ToolbarButton
        icon={<ZoomOut size={16} />}
        label="Zoom out (-)"
        onClick={onZoomOut}
      />

      <Divider />

      {/* Group 6: editor mode */}
      <ToolbarButton
        icon={<Eye size={16} />}
        label="Visual mode"
        active={editorMode === 'visual'}
        onClick={() => onSetEditorMode('visual')}
      />
      <ToolbarButton
        icon={<Columns2 size={16} />}
        label="Split mode"
        active={editorMode === 'split'}
        onClick={() => onSetEditorMode('split')}
      />
      <ToolbarButton
        icon={<Code2 size={16} />}
        label="Source mode"
        active={editorMode === 'source'}
        onClick={() => onSetEditorMode('source')}
      />

      <Divider />

      {/* Group 7: import/export */}
      <ToolbarButton icon={<Upload size={16} />} label="Import OWM or JSON" onClick={onImport} />
      <ToolbarButton icon={<Download size={16} />} label="Export map" onClick={onExport} />

      <Divider />

      {/* Group 8: scenarios */}
      <ToolbarButton
        icon={<GitBranch size={16} />}
        label="Scenario comparison"
        onClick={() => router.push(`/maps/${mapId}/scenarios`)}
      />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Primary action */}
      <button
        onClick={onSaveVersion}
        style={{
          height: 34,
          padding: '0 12px',
          borderRadius: 6,
          background: 'var(--primary)',
          color: 'var(--text-on-primary)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 550,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          transition: 'background 120ms',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)';
        }}
      >
        <Save size={14} />
        Save version
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolbarButton({
  icon,
  label,
  active,
  disabled,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active
          ? 'var(--primary-soft)'
          : highlight
          ? 'var(--accent-soft)'
          : 'none',
        color: active
          ? 'var(--primary)'
          : highlight
          ? 'var(--accent)'
          : disabled
          ? 'var(--text-subtle)'
          : 'var(--text-muted)',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 120ms, color 120ms',
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 20,
        background: 'var(--border)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { icon: React.ReactNode; label: string; color: string }> = {
    clean: { icon: null, label: '', color: 'transparent' },
    unsaved: { icon: null, label: 'Unsaved changes', color: 'var(--text-subtle)' },
    saving: {
      icon: <Loader2 size={12} className="animate-spin-slow" />,
      label: 'Saving…',
      color: 'var(--text-subtle)',
    },
    saved: {
      icon: <CheckCircle size={12} />,
      label: 'Saved',
      color: 'var(--success)',
    },
    error: {
      icon: <AlertCircle size={12} />,
      label: 'Could not save',
      color: 'var(--error)',
    },
  };

  const { icon, label, color } = map[state];
  if (!label) return null;

  return (
    <div
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color,
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </div>
  );
}
