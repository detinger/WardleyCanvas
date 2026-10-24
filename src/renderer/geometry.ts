// Shared map geometry for the interactive canvas and export rendering.
// Domain coordinates are normalized [0,1]; the SVG logical plane is LW × LH.
// Mapping: x = evolution * LW, y = (1 - visibility) * LH.
// Viewport pan/zoom only changes the SVG viewBox, never these mappings.

import { Normalized } from '@/domain/types';

export const LW = 1000; // logical width
export const LH = 600;  // logical height

export function toSvgX(evolution: Normalized): number {
  return evolution * LW;
}

export function toSvgY(visibility: Normalized): number {
  return (1 - visibility) * LH;
}

export function fromSvgX(x: number): Normalized {
  return Math.max(0, Math.min(1, x / LW));
}

export function fromSvgY(y: number): Normalized {
  return Math.max(0, Math.min(1, 1 - y / LH));
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Zoom a viewBox by `factor` (<1 zooms in) keeping the SVG point (px, py) fixed. */
export function zoomViewBox(vb: ViewBox, factor: number, px = vb.x + vb.w / 2, py = vb.y + vb.h / 2): ViewBox {
  const w = vb.w * factor;
  const h = vb.h * factor;
  return { x: px - (px - vb.x) * factor, y: py - (py - vb.y) * factor, w, h };
}

/** Pan a viewBox by a screen-pixel delta given the rendered element size. */
export function panViewBox(vb: ViewBox, dxPx: number, dyPx: number, widthPx: number, heightPx: number): ViewBox {
  return { ...vb, x: vb.x - dxPx * (vb.w / widthPx), y: vb.y - dyPx * (vb.h / heightPx) };
}

/** Screen point → SVG point for a viewBox rendered into a widthPx × heightPx box (no letterboxing). */
export function screenToSvg(vb: ViewBox, sx: number, sy: number, widthPx: number, heightPx: number) {
  return { x: vb.x + (sx / widthPx) * vb.w, y: vb.y + (sy / heightPx) * vb.h };
}

export function svgToScreen(vb: ViewBox, x: number, y: number, widthPx: number, heightPx: number) {
  return { x: ((x - vb.x) / vb.w) * widthPx, y: ((y - vb.y) / vb.h) * heightPx };
}

/** Pull a line's end point back by `inset` units so an arrowhead stops at the target's edge. */
export function trimLineEnd(x1: number, y1: number, x2: number, y2: number, inset: number) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len <= inset) return { x: x2, y: y2 };
  const t = (len - inset) / len;
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
}
