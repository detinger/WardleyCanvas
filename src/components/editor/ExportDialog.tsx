'use client';

// IO-04: Export dialog — native JSON, OWM, SVG, PNG and analysis downloads.
// SVG/PNG are rendered from the map data (renderer/svg-export), not copied from
// the screen, so they are deterministic and independent of zoom and selection.

import * as React from 'react';
import { WardleyMap } from '@/domain/types';
import { serializeOWM } from '@/parser/owm';
import { owmLossReport } from '@/parser/import';
import { renderMapSVG, exportSize, ExportTheme } from '@/renderer/svg-export';
import DialogOverlay from './DialogOverlay';
import { Download, X, FileJson, FileCode2, Image, BarChart2 } from 'lucide-react';
import { CLIMATE_CATALOG } from '@/analysis/climate-catalog';
import { DOCTRINE_CATALOG } from '@/analysis/doctrine-catalog';
import { GAMEPLAY_CATALOG } from '@/analysis/gameplay-catalog';

interface ExportDialogProps {
  map: WardleyMap;
  onClose: () => void;
}

export default function ExportDialog({ map, onClose }: ExportDialogProps) {
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<ExportTheme>('light');
  const [background, setBackground] = React.useState(true);
  const [pngScale, setPngScale] = React.useState(2);
  const owmLoss = React.useMemo(() => owmLossReport(map), [map]);

  const exportJSON = React.useCallback(() => {
    downloadText(JSON.stringify(map, null, 2), `${slug(map.title)}.wardley.json`, 'application/json');
  }, [map]);

  const exportOWM = React.useCallback(() => {
    downloadText(serializeOWM(map), `${slug(map.title)}.owm`, 'text/plain');
  }, [map]);

  const exportSVG = React.useCallback(() => {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + renderMapSVG(map, { theme, background });
    downloadText(svg, `${slug(map.title)}.svg`, 'image/svg+xml');
  }, [map, theme, background]);

  const exportAnalysis = React.useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mapId: map.id,
      mapTitle: map.title,
      mapRevision: map.revision,
      catalogVersions: {
        climate: CLIMATE_CATALOG.map((e) => ({ id: e.id, version: e.version })),
        doctrine: DOCTRINE_CATALOG.map((e) => ({ id: e.id, version: e.version })),
        gameplay: GAMEPLAY_CATALOG.map((e) => ({ id: e.id, version: e.version })),
      },
      analysis: map.analysis,
      attribution: 'Catalog content: Wardley Maps — Simon Wardley (CC BY-SA 4.0). Assessments are map-specific human observations.',
    };
    downloadText(JSON.stringify(payload, null, 2), `${slug(map.title)}.analysis.json`, 'application/json');
  }, [map]);

  const exportPNG = React.useCallback(() => {
    setExporting('png');
    const { width, height } = exportSize();
    const svg = renderMapSVG(map, { theme, background });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * pngScale;
      canvas.height = height * pngScale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(pngScale, pngScale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        setExporting(null);
        if (!pngBlob) return;
        downloadBlob(pngBlob, `${slug(map.title)}.png`);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); setExporting(null); };
    img.src = url;
  }, [map, theme, background, pngScale]);

  const { width, height } = exportSize();

  return (
    <DialogOverlay labelledBy="export-dialog-title" onClose={onClose}>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          width: 'min(440px, 100%)',
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
          <h2 id="export-dialog-title" style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text)' }}>
            Export map
          </h2>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ExportOption
            icon={<FileJson size={20} />}
            title="Wardley JSON"
            description="Lossless native format: elements, notes, analysis and evidence"
            ext=".wardley.json"
            busy={exporting === 'json'}
            onClick={exportJSON}
          />
          <ExportOption
            icon={<FileCode2 size={20} />}
            title="OWM source"
            description="Plain-text maps-as-code compatible with OnlineWardleyMaps"
            ext=".owm"
            busy={exporting === 'owm'}
            onClick={exportOWM}
          />
          <div aria-label="OWM loss report" style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 4px 4px' }}>
            {owmLoss.length === 0 ? (
              'Everything in this map is representable in OWM.'
            ) : (
              <>
                OWM leaves out:
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {owmLoss.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </>
            )}
          </div>

          {/* Image options */}
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', margin: '4px 0', display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 13, color: 'var(--text)' }}>
            <legend style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>Image options (SVG and PNG)</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value as ExportTheme)} style={selectStyle}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={background} onChange={(e) => setBackground(e.target.checked)} />
              Background
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              PNG scale
              <select value={pngScale} onChange={(e) => setPngScale(Number(e.target.value))} style={selectStyle}>
                <option value={1}>1× ({width}×{height})</option>
                <option value={2}>2× ({width * 2}×{height * 2})</option>
                <option value={3}>3× ({width * 3}×{height * 3})</option>
              </select>
            </label>
          </fieldset>

          <ExportOption
            icon={<Image size={20} />}
            title="SVG"
            description="Scalable vector image of the whole map, independent of zoom"
            ext=".svg"
            busy={exporting === 'svg'}
            onClick={exportSVG}
          />
          <ExportOption
            icon={<Download size={20} />}
            title="PNG"
            description={`Raster image at ${pngScale}× resolution`}
            ext=".png"
            busy={exporting === 'png'}
            onClick={exportPNG}
          />
          <ExportOption
            icon={<BarChart2 size={20} />}
            title="Analysis JSON"
            description="Climate, doctrine and gameplay assessments with catalog versions and attribution"
            ext=".analysis.json"
            busy={exporting === 'analysis'}
            onClick={exportAnalysis}
          />
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-subtle)',
            flexShrink: 0,
          }}
        >
          Files are generated in your browser; nothing is uploaded. Exports are identical for an unchanged map
          (the analysis file adds a generated timestamp). Images show the whole map without selection highlights.
        </div>
      </div>
    </DialogOverlay>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExportOption({
  icon,
  title,
  description,
  ext,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ext: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        cursor: busy ? 'wait' : 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 120ms, background 120ms',
        opacity: busy ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!busy) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-soft)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
      }}
    >
      <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 550, color: 'var(--text)' }}>
          {title}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', marginLeft: 6 }}>{ext}</span>
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {description}
        </span>
      </span>
      <Download size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const closeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--text-subtle)',
};

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'map';
}

function downloadText(content: string, filename: string, mime: string) {
  downloadBlob(new Blob([content], { type: mime }), filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const selectStyle: React.CSSProperties = {
  height: 28,
  padding: '0 6px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13,
};
