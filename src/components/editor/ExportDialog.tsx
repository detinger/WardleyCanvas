'use client';

// IO-04: Export dialog — JSON, OWM, SVG downloads.

import * as React from 'react';
import { WardleyMap } from '@/domain/types';
import { serializeOWM } from '@/parser/owm';
import { Download, X, FileJson, FileCode2, Image, BarChart2 } from 'lucide-react';
import { CLIMATE_CATALOG } from '@/analysis/climate-catalog';
import { DOCTRINE_CATALOG } from '@/analysis/doctrine-catalog';
import { GAMEPLAY_CATALOG } from '@/analysis/gameplay-catalog';

interface ExportDialogProps {
  map: WardleyMap;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onClose: () => void;
}

export default function ExportDialog({ map, svgRef, onClose }: ExportDialogProps) {
  const [exporting, setExporting] = React.useState<string | null>(null);

  const exportJSON = React.useCallback(() => {
    setExporting('json');
    try {
      const json = JSON.stringify(map, null, 2);
      downloadText(json, `${slug(map.title)}.wardley.json`, 'application/json');
    } finally {
      setExporting(null);
    }
  }, [map]);

  const exportOWM = React.useCallback(() => {
    setExporting('owm');
    try {
      const owm = serializeOWM(map);
      downloadText(owm, `${slug(map.title)}.owm`, 'text/plain');
    } finally {
      setExporting(null);
    }
  }, [map]);

  const exportSVG = React.useCallback(() => {
    setExporting('svg');
    try {
      const svg = svgRef.current;
      if (!svg) return;
      const clone = svg.cloneNode(true) as SVGElement;
      // Inline computed styles for portability
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      // Replace CSS variables with computed values
      inlineCssVars(clone, svg);
      const serializer = new XMLSerializer();
      const svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
      downloadText(svgStr, `${slug(map.title)}.svg`, 'image/svg+xml');
    } finally {
      setExporting(null);
    }
  }, [map, svgRef]);

  const exportAnalysis = React.useCallback(() => {
    setExporting('analysis');
    try {
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
    } finally {
      setExporting(null);
    }
  }, [map]);

  const exportPNG = React.useCallback(() => {
    setExporting('png');
    const svg = svgRef.current;
    if (!svg) { setExporting(null); return; }

    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    inlineCssVars(clone, svg);
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new window.Image();
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${slug(map.title)}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        setExporting(null);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); setExporting(null); };
    img.src = url;
  }, [map, svgRef]);

  return (
    <Overlay onClose={onClose}>
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          width: 380,
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
          }}
        >
          <h2 style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text)' }}>
            Export map
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={closeBtn}
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ExportOption
            icon={<FileJson size={20} />}
            title="Wardley JSON"
            description="Lossless native format — preserves all data including analysis"
            ext=".wardley.json"
            busy={exporting === 'json'}
            onClick={exportJSON}
          />
          <ExportOption
            icon={<FileCode2 size={20} />}
            title="OWM source"
            description="Plain-text DSL compatible with OnlineWardleyMaps"
            ext=".owm"
            busy={exporting === 'owm'}
            onClick={exportOWM}
          />
          <ExportOption
            icon={<Image size={20} />}
            title="SVG"
            description="Vector image — scalable, embeddable in presentations and docs"
            ext=".svg"
            busy={exporting === 'svg'}
            onClick={exportSVG}
          />
          <ExportOption
            icon={<Download size={20} />}
            title="PNG"
            description="Raster image at 2× resolution for sharing"
            ext=".png"
            busy={exporting === 'png'}
            onClick={exportPNG}
          />
          <ExportOption
            icon={<BarChart2 size={20} />}
            title="Analysis JSON"
            description="Climate, doctrine, gameplay assessments with catalog provenance and attribution"
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
          }}
        >
          Exports are deterministic for unchanged input. JSON is lossless; OWM omits analysis layers. Analysis export includes catalog attribution (CC BY-SA 4.0).
        </div>
      </div>
    </Overlay>
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

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
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
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getComputedStyleValue(el: Element, prop: string): string {
  return getComputedStyle(el).getPropertyValue(prop).trim();
}

const CSS_VAR_RE = /var\(--[^)]+\)/g;

function resolveCssVar(value: string, sourceEl: Element): string {
  return value.replace(CSS_VAR_RE, (match) => {
    const varName = match.slice(4, -1).trim();
    return getComputedStyle(sourceEl).getPropertyValue(varName).trim() || match;
  });
}

function inlineCssVars(clone: Element, source: Element) {
  // Walk all elements and inline style attributes with var() references
  const walk = (cloneEl: Element, sourceEl: Element) => {
    const style = cloneEl.getAttribute('style');
    if (style && style.includes('var(')) {
      cloneEl.setAttribute('style', resolveCssVar(style, sourceEl));
    }
    // Inline fill/stroke attributes that use var()
    for (const attr of ['fill', 'stroke']) {
      const val = cloneEl.getAttribute(attr);
      if (val && val.includes('var(')) {
        cloneEl.setAttribute(attr, resolveCssVar(val, sourceEl));
      }
    }
    const cloneChildren = Array.from(cloneEl.children);
    const srcChildren = Array.from(sourceEl.children);
    cloneChildren.forEach((c, i) => {
      if (srcChildren[i]) walk(c, srcChildren[i]);
    });
  };
  walk(clone, source);

  // Also inline the background on the root SVG
  const bg = getComputedStyleValue(source, '--canvas-bg');
  if (bg) {
    clone.setAttribute('style', `background:${bg};` + (clone.getAttribute('style') ?? ''));
  }
}
