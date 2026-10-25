// QA-02: performance budgets (Section 12.6) for the pure parts of the editor,
// measured on the representative 200-component / 400-dependency fixture.
// Each budget is the p95 of repeated runs on the plan's numbers.

import { describe, it, expect } from 'vitest';
import { largeMap } from '../../tests/fixtures/large-map';
import { validateMap } from '@/domain/validation';
import { parseOWM, serializeOWM, mergeParsedMap } from '@/parser/owm';
import { renderMapSVG } from '@/renderer/svg-export';
import { reducer, EditorState } from '@/hooks/use-map-editor';
import { makeCommandStack } from '@/domain/commands';
import { summarizeAnalysis } from '@/analysis/summary';

function p95(fn: () => void, runs = 30): number {
  fn(); // warm up
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(runs * 0.95) - 1];
}

const map = largeMap();
const source = serializeOWM(map);
const report: Record<string, number> = {};

describe('performance budgets (200 components / 400 dependencies)', () => {
  it('fixture has the documented size', () => {
    expect(map.elements).toHaveLength(200);
    expect(map.dependencies).toHaveLength(400);
  });

  it('full validation <= 500ms', () => {
    report.validate = p95(() => validateMap(map));
    expect(report.validate).toBeLessThan(500);
  });

  it('cheap validation update <= 100ms (validation after a single move)', () => {
    let i = 0;
    report.validateAfterMove = p95(() => {
      const moved = { ...map, elements: map.elements.map((e, k) => (k === (i++ % 200) ? { ...e, evolution: 0.5 } : e)) };
      validateMap(moved);
    });
    expect(report.validateAfterMove).toBeLessThan(100);
  });

  it('source parse + merge <= 100ms (stays on the main thread)', () => {
    report.parseMerge = p95(() => mergeParsedMap(map, parseOWM(source).map));
    expect(report.parseMerge).toBeLessThan(100);
  });

  it('serialize and render export <= 100ms', () => {
    report.serialize = p95(() => serializeOWM(map));
    report.renderSvg = p95(() => renderMapSVG(map));
    expect(report.serialize).toBeLessThan(100);
    expect(report.renderSvg).toBeLessThan(100);
  });

  it('undo/redo commit <= 100ms and history stays bounded', () => {
    let s: EditorState = {
      stack: makeCommandStack(map), selectedIds: ['c10'], activeTool: 'select', linkSourceId: null,
      saveState: 'clean', nudging: false, previewBase: null, highlightIds: [],
    };
    report.commit = p95(() => { s = reducer(s, { type: 'NUDGE', dEvolution: 0.01, dVisibility: 0 }); });
    report.undo = p95(() => { s = reducer(s, { type: 'UNDO' }); });
    for (let i = 0; i < 200; i++) s = reducer(s, { type: 'NUDGE', dEvolution: 0.001, dVisibility: 0 });
    expect(s.stack.past.length).toBeLessThanOrEqual(50);
    expect(report.commit).toBeLessThan(100);
    expect(report.undo).toBeLessThan(100);
  });

  it('analysis summary <= 100ms', () => {
    report.summary = p95(() => summarizeAnalysis(map, '2026-10-25'));
    expect(report.summary).toBeLessThan(100);
    // Printed for docs/release/performance.md
    console.log('PERF_REPORT', JSON.stringify(Object.fromEntries(Object.entries(report).map(([k, v]) => [k, Math.round(v * 100) / 100]))));
  });
});
