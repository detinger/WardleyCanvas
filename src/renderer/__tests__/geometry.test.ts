import { describe, it, expect } from 'vitest';
import { toSvgX, toSvgY, fromSvgX, fromSvgY, zoomViewBox, panViewBox, screenToSvg, svgToScreen, ViewBox } from '../geometry';

const TOL = 1e-9;

// Small deterministic PRNG so the property test is reproducible
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

describe('domain ↔ SVG mapping', () => {
  it('round-trips every normalized coordinate', () => {
    const r = rng(1);
    for (let i = 0; i < 1000; i++) {
      const ev = r(), vis = r();
      expect(Math.abs(fromSvgX(toSvgX(ev)) - ev)).toBeLessThan(TOL);
      expect(Math.abs(fromSvgY(toSvgY(vis)) - vis)).toBeLessThan(TOL);
    }
  });

  it('puts visible things at the top and commodity on the right', () => {
    expect(toSvgY(1)).toBe(0);
    expect(toSvgY(0)).toBe(600);
    expect(toSvgX(1)).toBe(1000);
  });

  it('clamps points outside the plot', () => {
    expect(fromSvgX(-50)).toBe(0);
    expect(fromSvgY(-50)).toBe(1);
    expect(fromSvgX(5000)).toBe(1);
  });
});

describe('viewport transforms never drift domain coordinates', () => {
  it('zoom keeps the anchor point fixed and inverts exactly', () => {
    const vb: ViewBox = { x: -20, y: -20, w: 1040, h: 640 };
    const z = zoomViewBox(vb, 0.75, 300, 200);
    // the anchor point maps to the same screen position before and after
    const before = svgToScreen(vb, 300, 200, 800, 500);
    const after = svgToScreen(z, 300, 200, 800, 500);
    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
    const back = zoomViewBox(z, 1 / 0.75, 300, 200);
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(back[k]).toBeCloseTo(vb[k], 9);
  });

  it('screen → SVG → domain → SVG → screen is stable across random pan/zoom/resizes', () => {
    const r = rng(7);
    for (let i = 0; i < 500; i++) {
      let vb: ViewBox = { x: -20, y: -20, w: 1040, h: 640 };
      const width = 300 + r() * 1500;
      const height = 200 + r() * 900;
      for (let k = 0; k < 10; k++) {
        vb = r() < 0.5
          ? zoomViewBox(vb, 0.5 + r(), r() * 1000, r() * 600)
          : panViewBox(vb, (r() - 0.5) * 400, (r() - 0.5) * 400, width, height);
      }
      const ev = r(), vis = r();
      const screen = svgToScreen(vb, toSvgX(ev), toSvgY(vis), width, height);
      const svg = screenToSvg(vb, screen.x, screen.y, width, height);
      expect(Math.abs(fromSvgX(svg.x) - ev)).toBeLessThan(1e-9);
      expect(Math.abs(fromSvgY(svg.y) - vis)).toBeLessThan(1e-9);
    }
  });
});

describe('trimLineEnd', async () => {
  const { trimLineEnd } = await import('../geometry');
  it('pulls the end back along the line by the inset', () => {
    const p = trimLineEnd(0, 0, 100, 0, 10);
    expect(p).toEqual({ x: 90, y: 0 });
    const q = trimLineEnd(0, 0, 30, 40, 5);
    expect(Math.hypot(q.x - 30, q.y - 40)).toBeCloseTo(5, 9);
  });
  it('leaves very short lines alone', () => {
    expect(trimLineEnd(0, 0, 3, 0, 10)).toEqual({ x: 3, y: 0 });
  });
});
