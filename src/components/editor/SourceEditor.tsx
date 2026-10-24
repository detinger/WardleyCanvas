'use client';

// IO-02: OWM source editor panel.
// Shows OWM text; changes are parsed and synced to the map after a debounce.
// Invalid source shows diagnostics without destroying the current map.

import * as React from 'react';
import { WardleyMap } from '@/domain/types';
import { parseOWM, serializeOWM, OWMDiagnostic } from '@/parser/owm';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface SourceEditorProps {
  map: WardleyMap;
  onMapChange: (map: WardleyMap) => void;
}

const DEBOUNCE_MS = 600;

export default function SourceEditor({ map, onMapChange }: SourceEditorProps) {
  const [source, setSource] = React.useState(() => serializeOWM(map));
  const [diagnostics, setDiagnostics] = React.useState<OWMDiagnostic[]>([]);
  const [unsupported, setUnsupported] = React.useState<string[]>([]);
  const [parseState, setParseState] = React.useState<'clean' | 'error' | 'warning'>('clean');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const externalUpdateRef = React.useRef(false);

  // When the map changes externally (visual edit), regenerate source text
  React.useEffect(() => {
    externalUpdateRef.current = true;
    setSource(serializeOWM(map));
  }, [map]);

  const handleChange = React.useCallback(
    (text: string) => {
      if (externalUpdateRef.current) {
        externalUpdateRef.current = false;
        return;
      }
      setSource(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = parseOWM(text, map.id);
        setDiagnostics(result.diagnostics);
        setUnsupported(result.unsupported);
        if (result.hasErrors) {
          setParseState('error');
          // Keep current map — do not propagate invalid parse
        } else {
          setParseState(result.diagnostics.length > 0 ? 'warning' : 'clean');
          // Merge metadata not representable in OWM (analysis, versions, etc.)
          onMapChange({
            ...result.map,
            id: map.id,
            createdAt: map.createdAt,
            revision: map.revision,
            analysis: map.analysis,
          });
        }
      }, DEBOUNCE_MS);
    },
    [map, onMapChange]
  );

  const handleTextareaChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(e.target.value);
      setSource(e.target.value);
    },
    [handleChange]
  );

  const errors   = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        background: 'var(--bg)',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 550 }}>OWM Source</span>
        <div style={{ flex: 1 }} />
        <StatusChip state={parseState} errors={errors.length} warnings={warnings.length} />
      </div>

      {/* Textarea */}
      <textarea
        value={source}
        onChange={handleTextareaChange}
        spellCheck={false}
        aria-label="OWM source editor"
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text)',
          background: 'var(--bg)',
          overflowY: 'auto',
          tabSize: 2,
          whiteSpace: 'pre',
          overflowWrap: 'normal',
        }}
      />

      {/* Diagnostics panel */}
      {diagnostics.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            maxHeight: 140,
            overflowY: 'auto',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          {diagnostics.map((d, i) => (
            <DiagRow key={i} diag={d} />
          ))}
          {unsupported.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                fontSize: 12,
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <AlertTriangle size={12} color="var(--warning)" />
              Unsupported constructs (ignored): {unsupported.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusChip({
  state,
  errors,
  warnings,
}: {
  state: 'clean' | 'error' | 'warning';
  errors: number;
  warnings: number;
}) {
  if (state === 'clean') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 11 }}>
        <CheckCircle size={11} /> Valid OWM
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)', fontSize: 11 }}>
        <AlertCircle size={11} /> {errors} error{errors !== 1 ? 's' : ''}
        {warnings > 0 && `, ${warnings} warning${warnings !== 1 ? 's' : ''}`}
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 11 }}>
      <AlertTriangle size={11} /> {warnings} warning{warnings !== 1 ? 's' : ''}
    </span>
  );
}

function DiagRow({ diag }: { diag: OWMDiagnostic }) {
  const isErr = diag.severity === 'error';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '4px 12px',
        fontSize: 12,
        color: isErr ? 'var(--error)' : 'var(--warning)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {isErr ? <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />}
      {diag.line > 0 && (
        <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          L{diag.line}
        </span>
      )}
      <span>{diag.message}</span>
    </div>
  );
}
