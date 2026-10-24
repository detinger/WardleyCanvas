'use client';

// IO-03: Import dialog — paste OWM text or upload .owm/.json file.
// Import is atomic: cancel or error leaves the current map unchanged.
// Shows a preview summary with element counts, warnings, and lossiness notes.

import * as React from 'react';
import { WardleyMap } from '@/domain/types';
import { prepareImport, ImportPreview as ImportPreviewData, MAX_IMPORT_CHARS } from '@/parser/import';
import DialogOverlay from './DialogOverlay';
import { Upload, X, AlertCircle, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface ImportDialogProps {
  currentMap: WardleyMap;
  /** Called only after the user confirms a preview without errors */
  onImport: (preview: ImportPreviewData) => void;
  onClose: () => void;
}

type ImportState = 'idle' | 'preview';

export default function ImportDialog({ currentMap, onImport, onClose }: ImportDialogProps) {
  const [source, setSource] = React.useState('');
  const [fileName, setFileName] = React.useState<string | undefined>();
  const [importState, setImportState] = React.useState<ImportState>('idle');
  const [preview, setPreview] = React.useState<ImportPreviewData | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Preview is pure: nothing reaches the editor until Confirm
  const showPreview = React.useCallback((text: string, name?: string) => {
    if (!text.trim()) return;
    setPreview(prepareImport(text, currentMap, name));
    setImportState('preview');
  }, [currentMap]);

  const handleParse = React.useCallback(() => showPreview(source, fileName), [showPreview, source, fileName]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (file.size > MAX_IMPORT_CHARS * 4) {
        // Refuse before reading a huge file into memory
        setPreview(prepareImport('x'.repeat(MAX_IMPORT_CHARS + 1), currentMap, file.name));
        setImportState('preview');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = String(ev.target?.result ?? '');
        // JSON files are not shown in the OWM text box; OWM files are, for editing
        setSource(file.name.toLowerCase().endsWith('.json') ? '' : text);
        setFileName(file.name);
        showPreview(text, file.name);
      };
      reader.readAsText(file);
    },
    [currentMap, showPreview]
  );

  const handleConfirm = React.useCallback(() => {
    if (!preview || preview.hasErrors) return;
    onImport(preview);
    onClose();
  }, [preview, onImport, onClose]);

  return (
    <DialogOverlay labelledBy="import-dialog-title" onClose={onClose}>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          width: 'min(560px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <Upload size={16} style={{ marginRight: 8, color: 'var(--primary)' }} />
          <h2 id="import-dialog-title" style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text)' }}>
            Import map
          </h2>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* File upload */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".owm,.txt,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 14px',
                borderRadius: 6,
                border: '1px dashed var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <FileText size={14} />
              Choose .owm or .json file…
            </button>
          </div>

          {fileName && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Selected file: <span style={{ fontFamily: 'var(--font-mono)' }}>{fileName}</span>
            </div>
          )}

          <label htmlFor="import-source" style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)' }}>
            or paste OWM source or native JSON below
          </label>

          {/* Paste area */}
          <textarea
            id="import-source"
            value={source}
            onChange={(e) => { setSource(e.target.value); setFileName(undefined); setImportState('idle'); setPreview(null); }}
            placeholder={`title My Map\n\nanchor User [0.95, 0.1]\ncomponent Tea Cup [0.8, 0.6]\n\nUser->Tea Cup`}
            rows={8}
            spellCheck={false}
            style={{
              resize: 'vertical',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.6,
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--bg)',
              color: 'var(--text)',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {/* Preview */}
          {preview && <ImportPreview result={preview} />}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <div style={{ flex: 1 }} />
          {importState !== 'preview' ? (
            <button
              onClick={handleParse}
              disabled={!source.trim()}
              style={{ ...primaryBtn, opacity: !source.trim() ? 0.5 : 1 }}
            >
              Preview import
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!!preview?.hasErrors}
              style={{ ...primaryBtn, opacity: preview?.hasErrors ? 0.5 : 1 }}
            >
              Confirm import
            </button>
          )}
        </div>
      </div>
    </DialogOverlay>
  );
}

// ---------------------------------------------------------------------------
// Preview summary
// ---------------------------------------------------------------------------

function ImportPreview({ result }: { result: ImportPreviewData }) {
  const { map, diagnostics, unsupported, lossNotes, hasErrors, format } = result;
  const errors   = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const anchors   = map.elements.filter((e) => e.kind === 'anchor').length;
  const comps     = map.elements.filter((e) => e.kind !== 'anchor').length;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${hasErrors ? 'var(--error)' : warnings.length > 0 ? 'var(--warning)' : 'var(--success)'}`,
        overflow: 'hidden',
        fontSize: 13,
      }}
    >
      {/* Status bar */}
      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: hasErrors ? 'var(--error-soft, rgba(220,38,38,0.08))' : warnings.length > 0 ? 'var(--warning-soft)' : 'var(--success-soft)',
          color: hasErrors ? 'var(--error)' : warnings.length > 0 ? 'var(--warning)' : 'var(--success)',
          fontWeight: 550,
        }}
      >
        {hasErrors ? <AlertCircle size={14} /> : warnings.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
        {hasErrors
          ? `${errors.length} error${errors.length !== 1 ? 's' : ''} — cannot import`
          : warnings.length > 0
          ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''} — will import with notes`
          : 'Ready to import'}
      </div>

      {/* Stats */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        <Stat label="Title" value={map.title} />
        <Stat label="Anchors" value={anchors} />
        <Stat label="Components" value={comps} />
        <Stat label="Dependencies" value={map.dependencies.length} />
        {map.evolutions.length > 0 && <Stat label="Evolve" value={map.evolutions.length} />}
        {map.pipelines.length > 0 && <Stat label="Pipelines" value={map.pipelines.length} />}
        {map.annotations.length > 0 && <Stat label="Notes" value={map.annotations.length} />}
      </div>

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
          {diagnostics.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                padding: '4px 12px',
                fontSize: 12,
                color: d.severity === 'error' ? 'var(--error)' : 'var(--warning)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {d.severity === 'error' ? <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 2 }} />}
              {d.line > 0 && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>L{d.line}</span>}
              <span>{d.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Loss report (unsupported constructs, ignored lines, replaced analysis) */}
      {!hasErrors && lossNotes.length > 0 && (
        <ul aria-label="What will not carry over" style={{ margin: 0, padding: '6px 12px 6px 28px', fontSize: 12, color: 'var(--text-subtle)' }}>
          {lossNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
      {unsupported.length > 0 && lossNotes.length === 0 && (
        <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-subtle)' }}>
          Unsupported constructs (skipped): {unsupported.join(', ')}
        </div>
      )}

      {!hasErrors && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-subtle)', borderTop: '1px solid var(--border)' }}>
          {format === 'json' ? 'Native JSON' : 'OWM'} import replaces the current map&apos;s elements, dependencies and notes.
          Components with the same name keep their details and analysis links. You can undo the import.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontWeight: 550, color: 'var(--text)' }}>{value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const closeBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)',
};
const primaryBtn: React.CSSProperties = {
  height: 34, padding: '0 16px', borderRadius: 6, background: 'var(--primary)',
  color: 'var(--text-on-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 550,
};
const secondaryBtn: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 6, background: 'none',
  color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
};
