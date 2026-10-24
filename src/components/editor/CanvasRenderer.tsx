'use client';

// EDT-02/03/04/06: SVG-based Wardley map canvas with pan/zoom,
// element drag, dependency lines, and evolution axes.
// Coordinates: evolution (x) and visibility (y) are both normalized [0,1].
// SVG logical size: 1000 × 600 units; origin at top-left.
// Mapping: x = evolution * 1000, y = (1 - visibility) * 600

import * as React from 'react';
import { WardleyMap, MapElement, Dependency, Pipeline, EvolutionMovement, MapAnnotation, Id, Normalized } from '@/domain/types';
import { ActiveTool } from '@/hooks/use-map-editor';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LW = 1000;  // logical width
const LH = 600;   // logical height
const ELEMENT_RADIUS = 8;
const ANCHOR_HALF = 10; // half-width of anchor diamond
const LABEL_OFFSET_Y = 20;
const DEFAULT_VIEWBOX = { x: -20, y: -20, w: LW + 40, h: LH + 40 };
const AXIS_LEFT = 0;
const AXIS_BOTTOM = LH;
const Y_LABEL_GAP = 14; // px from axis

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSvgX(evolution: Normalized): number {
  return evolution * LW;
}

function toSvgY(visibility: Normalized): number {
  return (1 - visibility) * LH;
}

function fromSvgX(x: number): Normalized {
  return Math.max(0, Math.min(1, x / LW));
}

function fromSvgY(y: number): Normalized {
  return Math.max(0, Math.min(1, 1 - y / LH));
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function viewboxToString(vb: ViewBox): string {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
}

function svgCoords(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const t = svg.getScreenCTM();
  if (!t) return { x: 0, y: 0 };
  return pt.matrixTransform(t.inverse());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CanvasRendererProps {
  map: WardleyMap;
  selectedIds: string[];
  activeTool: ActiveTool;
  linkSourceId: string | null;
  onElementClick: (id: Id, addToSelection: boolean) => void;
  onDependencyClick: (id: Id) => void;
  onCanvasClick: (evolution: Normalized, visibility: Normalized) => void;
  onElementMoved: (id: Id, evolution: Normalized, visibility: Normalized) => void;
  onElementMoveCommit: (id: Id, evolution: Normalized, visibility: Normalized) => void;
  onLinkCreate: (fromId: Id, toId: Id) => void;
  onFitRequested?: (fit: () => void) => void;
  onZoomInRequested?: (fn: () => void) => void;
  onZoomOutRequested?: (fn: () => void) => void;
  svgRefCallback?: (el: SVGSVGElement | null) => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CanvasRenderer({
  map,
  selectedIds,
  activeTool,
  linkSourceId,
  onElementClick,
  onDependencyClick,
  onCanvasClick,
  onElementMoved,
  onElementMoveCommit,
  onLinkCreate,
  onFitRequested,
  onZoomInRequested,
  onZoomOutRequested,
  svgRefCallback,
}: CanvasRendererProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    svgRefCallback?.(svgRef.current);
  });
  const [viewBox, setViewBox] = React.useState<ViewBox>(DEFAULT_VIEWBOX);

  // Drag state (no React state — mutated in event handlers for perf)
  const dragRef = React.useRef<{
    elementId: Id;
    startSvgX: number;
    startSvgY: number;
    startEv: number;
    startVis: number;
  } | null>(null);

  // Pan state
  const panRef = React.useRef<{
    startClientX: number;
    startClientY: number;
    startViewBox: ViewBox;
  } | null>(null);

  // Expose fit/zoom to parent via callbacks
  const fit = React.useCallback(() => setViewBox(DEFAULT_VIEWBOX), []);
  const zoomIn = React.useCallback(() =>
    setViewBox((vb) => {
      const factor = 0.75;
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      const nw = vb.w * factor;
      const nh = vb.h * factor;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    }), []);
  const zoomOut = React.useCallback(() =>
    setViewBox((vb) => {
      const factor = 1 / 0.75;
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      const nw = vb.w * factor;
      const nh = vb.h * factor;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    }), []);

  React.useEffect(() => { onFitRequested?.(fit); }, [fit, onFitRequested]);
  React.useEffect(() => { onZoomInRequested?.(zoomIn); }, [zoomIn, onZoomInRequested]);
  React.useEffect(() => { onZoomOutRequested?.(zoomOut); }, [zoomOut, onZoomOutRequested]);

  // Keyboard shortcuts for zoom/fit
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') fit();
      if (e.key === '=' || e.key === '+') zoomIn();
      if (e.key === '-') zoomOut();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fit, zoomIn, zoomOut]);

  // Mouse wheel zoom
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((vb) => {
      const nw = vb.w * factor;
      const nh = vb.h * factor;
      const nx = svgX - (svgX - vb.x) * (nw / vb.w);
      const ny = svgY - (svgY - vb.y) * (nh / vb.h);
      return { x: nx, y: ny, w: nw, h: nh };
    });
  }, []);

  // Canvas pointer down: start pan or add-element
  const handleCanvasPointerDown = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      // Only handle clicks on the background/axis elements
      if (
        !target.classList.contains('canvas-bg') &&
        !target.classList.contains('axis-line') &&
        !target.classList.contains('stage-line') &&
        !target.classList.contains('axis-label')
      ) {
        return;
      }

      if (activeTool === 'pan') {
        panRef.current = {
          startClientX: e.clientX,
          startClientY: e.clientY,
          startViewBox: viewBox,
        };
        (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
        return;
      }

      // add-anchor / add-component: place on click
      if (activeTool === 'add-anchor' || activeTool === 'add-component') {
        const svg = svgRef.current;
        if (!svg) return;
        const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);
        onCanvasClick(fromSvgX(svgX), fromSvgY(svgY));
        return;
      }

      // Default: deselect on background click
      if (activeTool === 'select') {
        const svg = svgRef.current;
        if (!svg) return;
        const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);
        onCanvasClick(fromSvgX(svgX), fromSvgY(svgY));
      }
    },
    [activeTool, viewBox, onCanvasClick]
  );

  const handleCanvasPointerMove = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Pan
      if (panRef.current) {
        const dx = e.clientX - panRef.current.startClientX;
        const dy = e.clientY - panRef.current.startClientY;
        const { startViewBox } = panRef.current;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleX = startViewBox.w / rect.width;
        const scaleY = startViewBox.h / rect.height;
        setViewBox({
          ...startViewBox,
          x: startViewBox.x - dx * scaleX,
          y: startViewBox.y - dy * scaleY,
        });
        return;
      }

      // Element drag
      if (dragRef.current) {
        const svg = svgRef.current;
        if (!svg) return;
        const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);
        const dx = svgX - dragRef.current.startSvgX;
        const dy = svgY - dragRef.current.startSvgY;
        const newEv = Math.max(0, Math.min(1, dragRef.current.startEv + dx / LW));
        const newVis = Math.max(0, Math.min(1, dragRef.current.startVis - dy / LH));
        onElementMoved(dragRef.current.elementId, newEv, newVis);
      }
    },
    [onElementMoved]
  );

  const handleCanvasPointerUp = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (panRef.current) {
        panRef.current = null;
        (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
        return;
      }
      if (dragRef.current) {
        const svg = svgRef.current;
        if (svg) {
          const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);
          const dx = svgX - dragRef.current.startSvgX;
          const dy = svgY - dragRef.current.startSvgY;
          const newEv = Math.max(0, Math.min(1, dragRef.current.startEv + dx / LW));
          const newVis = Math.max(0, Math.min(1, dragRef.current.startVis - dy / LH));
          onElementMoveCommit(dragRef.current.elementId, newEv, newVis);
        }
        dragRef.current = null;
      }
    },
    [onElementMoveCommit]
  );

  const handleElementPointerDown = React.useCallback(
    (e: React.PointerEvent, el: MapElement) => {
      if (activeTool !== 'select') return;
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;
      const { x: svgX, y: svgY } = svgCoords(svg, e.clientX, e.clientY);

      dragRef.current = {
        elementId: el.id,
        startSvgX: svgX,
        startSvgY: svgY,
        startEv: el.evolution,
        startVis: el.visibility,
      };
      svg.setPointerCapture(e.pointerId);
    },
    [activeTool]
  );

  const handleElementClick = React.useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, el: MapElement) => {
      e.stopPropagation();

      if (activeTool === 'add-dependency') {
        if (!linkSourceId) {
          onElementClick(el.id, false);
        } else if (linkSourceId === el.id) {
          // Clicking the same element again cancels
          onElementClick(el.id, false);
        } else {
          onLinkCreate(linkSourceId, el.id);
        }
        return;
      }

      onElementClick(el.id, e.metaKey || e.ctrlKey || e.shiftKey);
    },
    [activeTool, linkSourceId, onElementClick, onLinkCreate]
  );

  const cursor = activeTool === 'pan'
    ? 'grab'
    : activeTool === 'add-anchor' || activeTool === 'add-component'
    ? 'crosshair'
    : activeTool === 'add-dependency'
    ? 'cell'
    : 'default';

  const [boundaries] = React.useState(() => map.stageBoundaries);
  const evLabels = map.evolutionLabels;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={viewboxToString(viewBox)}
      style={{ background: 'var(--canvas-bg)', cursor, userSelect: 'none', display: 'block' }}
      aria-label="Wardley map canvas"
      role="img"
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
    >
      {/* Canvas background hit area */}
      <rect
        className="canvas-bg"
        x={-9999}
        y={-9999}
        width={19998}
        height={19998}
        fill="transparent"
      />

      {/* Stage boundary lines */}
      {boundaries.map((b, i) => (
        <line
          key={i}
          className="stage-line"
          x1={b * LW}
          y1={-20}
          x2={b * LW}
          y2={LH + 20}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}

      {/* Y axis line (left) */}
      <line
        className="axis-line"
        x1={AXIS_LEFT}
        y1={-20}
        x2={AXIS_LEFT}
        y2={LH}
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />

      {/* X axis line (bottom) */}
      <line
        className="axis-line"
        x1={AXIS_LEFT}
        y1={AXIS_BOTTOM}
        x2={LW + 20}
        y2={AXIS_BOTTOM}
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />

      {/* Y axis label — Visible */}
      <text
        className="axis-label"
        x={AXIS_LEFT - Y_LABEL_GAP}
        y={12}
        fontSize={11}
        fill="var(--text-subtle)"
        textAnchor="end"
        dominantBaseline="middle"
      >
        Visible
      </text>

      {/* Y axis title */}
      <text
        className="axis-label"
        transform={`rotate(-90) translate(${-(LH / 2)}, ${AXIS_LEFT - 36})`}
        fontSize={11}
        fill="var(--text-subtle)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Value Chain
      </text>

      {/* Y axis label — Invisible */}
      <text
        className="axis-label"
        x={AXIS_LEFT - Y_LABEL_GAP}
        y={LH - 4}
        fontSize={11}
        fill="var(--text-subtle)"
        textAnchor="end"
        dominantBaseline="middle"
      >
        Invisible
      </text>

      {/* Evolution stage labels */}
      {evLabels.map((label, i) => {
        const prev = i === 0 ? 0 : boundaries[i - 1];
        const next = i < boundaries.length ? boundaries[i] : 1;
        const mid = (prev + next) / 2;
        return (
          <text
            key={label}
            className="axis-label"
            x={mid * LW}
            y={LH + 18}
            fontSize={11}
            fill="var(--text-subtle)"
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {label}
          </text>
        );
      })}

      {/* Pipelines */}
      {map.pipelines.map((pip) => (
        <PipelineShape key={pip.id} pipeline={pip} elements={map.elements} />
      ))}

      {/* Evolution movements (evolve arrows) */}
      {map.evolutions.map((ev) => (
        <EvolveArrow key={ev.id} evolution={ev} elements={map.elements} />
      ))}

      {/* Dependencies */}
      {map.dependencies.map((dep) => (
        <DependencyLine
          key={dep.id}
          dep={dep}
          elements={map.elements}
          isSelected={selectedIds.includes(dep.id)}
          onClick={(e) => {
            e.stopPropagation();
            onDependencyClick(dep.id);
          }}
        />
      ))}

      {/* Elements */}
      {map.elements.map((el) => (
        <MapElementShape
          key={el.id}
          element={el}
          isSelected={selectedIds.includes(el.id)}
          isLinkSource={el.id === linkSourceId}
          activeTool={activeTool}
          onPointerDown={(e) => handleElementPointerDown(e, el)}
          onClick={(e) => handleElementClick(e, el)}
        />
      ))}

      {/* Annotations */}
      {map.annotations.map((ann) => (
        <AnnotationMark key={ann.id} annotation={ann} />
      ))}

      {/* Pending link indicator: line from source to mouse */}
      {linkSourceId && (
        <LinkGhost sourceId={linkSourceId} elements={map.elements} svgRef={svgRef} />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DependencyLine
// ---------------------------------------------------------------------------

function DependencyLine({
  dep,
  elements,
  isSelected,
  onClick,
}: {
  dep: Dependency;
  elements: MapElement[];
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const from = elements.find((el) => el.id === dep.fromId);
  const to = elements.find((el) => el.id === dep.toId);
  if (!from || !to) return null;

  const x1 = toSvgX(from.evolution);
  const y1 = toSvgY(from.visibility);
  const x2 = toSvgX(to.evolution);
  const y2 = toSvgY(to.visibility);

  return (
    <g>
      {/* Wide invisible hit area */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
      />
      {/* Visible line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isSelected ? 'var(--primary)' : 'var(--text-subtle)'}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={dep.kind === 'flow' ? '5 3' : undefined}
        markerEnd="url(#arrowhead)"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// MapElementShape
// ---------------------------------------------------------------------------

function MapElementShape({
  element,
  isSelected,
  isLinkSource,
  activeTool,
  onPointerDown,
  onClick,
}: {
  element: MapElement;
  isSelected: boolean;
  isLinkSource: boolean;
  activeTool: ActiveTool;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  const cx = toSvgX(element.evolution);
  const cy = toSvgY(element.visibility);

  const cursor =
    activeTool === 'select'
      ? 'grab'
      : activeTool === 'add-dependency'
      ? 'pointer'
      : 'default';

  const strokeColor = isLinkSource
    ? 'var(--accent)'
    : isSelected
    ? 'var(--primary)'
    : 'var(--wardley-stroke)';

  const fillColor = isLinkSource
    ? 'var(--accent-soft)'
    : isSelected
    ? 'var(--primary-soft)'
    : 'var(--wardley-fill)';

  const strokeWidth = isSelected || isLinkSource ? 2.5 : 1.5;

  return (
    <g
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={(e) => {
        // Keyboard parity with click: select, or pick a dependency endpoint
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }}
      aria-label={element.name}
      aria-pressed={isSelected}
      role="button"
      tabIndex={0}
    >
      {/* Selection glow */}
      {(isSelected || isLinkSource) && (
        element.kind === 'anchor' ? (
          <polygon
            points={diamondPoints(cx, cy, ANCHOR_HALF + 6)}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={4}
            strokeOpacity={0.25}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <circle
            cx={cx}
            cy={cy}
            r={ELEMENT_RADIUS + 6}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={4}
            strokeOpacity={0.25}
            style={{ pointerEvents: 'none' }}
          />
        )
      )}

      {/* Inertia indicator */}
      {element.inertia && (
        <circle
          cx={cx}
          cy={cy}
          r={ELEMENT_RADIUS + 4}
          fill="none"
          stroke="var(--warning)"
          strokeWidth={1.5}
          strokeDasharray="3 2"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Shape */}
      {element.kind === 'anchor' ? (
        <polygon
          points={diamondPoints(cx, cy, ANCHOR_HALF)}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={ELEMENT_RADIUS}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Label */}
      <text
        x={cx}
        y={cy + (element.kind === 'anchor' ? ANCHOR_HALF : ELEMENT_RADIUS) + LABEL_OFFSET_Y}
        fontSize={12}
        fill="var(--wardley-label)"
        textAnchor="middle"
        dominantBaseline="hanging"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {element.name}
      </text>

      {/* Arrow for defs */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="var(--text-subtle)" />
        </marker>
      </defs>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Pipeline shape — horizontal band showing evolution range at a visibility level
// ---------------------------------------------------------------------------

function PipelineShape({
  pipeline,
  elements,
}: {
  pipeline: Pipeline;
  elements: MapElement[];
}) {
  const parent = elements.find((e) => e.id === pipeline.parentElementId);
  if (!parent) return null;

  const cy = toSvgY(parent.visibility);
  const x1 = toSvgX(pipeline.startEvolution);
  const x2 = toSvgX(pipeline.endEvolution);
  const h = 28;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={x1}
        y={cy - h / 2}
        width={x2 - x1}
        height={h}
        rx={6}
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth={1}
        strokeDasharray="4 2"
        opacity={0.6}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Evolve arrow — dashed arrow from current to target evolution
// ---------------------------------------------------------------------------

function EvolveArrow({
  evolution,
  elements,
}: {
  evolution: EvolutionMovement;
  elements: MapElement[];
}) {
  const el = elements.find((e) => e.id === evolution.elementId);
  if (!el) return null;

  const y = toSvgY(el.visibility);
  const x1 = toSvgX(el.evolution);
  const x2 = toSvgX(evolution.targetEvolution);

  if (Math.abs(x2 - x1) < 2) return null;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        markerEnd="url(#arrowhead-evolve)"
        opacity={0.8}
      />
      <defs>
        <marker id="arrowhead-evolve" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="var(--accent)" />
        </marker>
      </defs>
      {evolution.targetName && (
        <text
          x={(x1 + x2) / 2}
          y={y - 8}
          fontSize={10}
          fill="var(--accent)"
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ userSelect: 'none' }}
        >
          {evolution.targetName}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Annotation mark — note pin with text
// ---------------------------------------------------------------------------

function AnnotationMark({ annotation }: { annotation: MapAnnotation }) {
  const cx = toSvgX(annotation.x);
  const cy = toSvgY(annotation.y);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {annotation.number != null ? (
        <>
          <circle cx={cx} cy={cy} r={9} fill="var(--info)" opacity={0.85} />
          <text
            x={cx}
            y={cy}
            fontSize={10}
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="central"
            fontWeight="600"
            style={{ userSelect: 'none' }}
          >
            {annotation.number}
          </text>
        </>
      ) : (
        <>
          <rect
            x={cx - 1}
            y={cy - 14}
            width={2}
            height={10}
            fill="var(--text-subtle)"
          />
          <circle cx={cx} cy={cy - 20} r={6} fill="var(--bg-elevated)" stroke="var(--text-subtle)" strokeWidth={1.5} />
        </>
      )}
      <text
        x={cx + 10}
        y={cy - 14}
        fontSize={11}
        fill="var(--text-muted)"
        dominantBaseline="middle"
        style={{ userSelect: 'none' }}
      >
        {annotation.text.length > 40 ? annotation.text.slice(0, 40) + '…' : annotation.text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Ghost line during dependency creation
// ---------------------------------------------------------------------------

function LinkGhost({
  sourceId,
  elements,
  svgRef,
}: {
  sourceId: Id;
  elements: MapElement[];
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const source = elements.find((el) => el.id === sourceId);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgCoords(svg, e.clientX, e.clientY);
      setMousePos({ x, y });
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [svgRef]);

  if (!source) return null;

  return (
    <line
      x1={toSvgX(source.evolution)}
      y1={toSvgY(source.visibility)}
      x2={mousePos.x}
      y2={mousePos.y}
      stroke="var(--accent)"
      strokeWidth={1.5}
      strokeDasharray="5 3"
      style={{ pointerEvents: 'none' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function diamondPoints(cx: number, cy: number, half: number): string {
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
}
