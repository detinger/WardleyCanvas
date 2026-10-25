# Visual Regression Matrix

**Quality gate:** Section 14.4  
**Baseline date:** 2026-10-25

## Result

Ten reviewed Chromium golden images pass across the five required viewport widths and both themes. The visual project runs after the functional and performance projects so screenshots are not taken while other browser workers compete for resources.

| State | Theme | Viewport |
| --- | --- | ---: |
| Overview with recent map, hover, and keyboard focus | Light | 1440 × 900 |
| Map collection and card hover | Dark | 1100 × 900 |
| Empty editor, focused creation control, disabled undo/redo | Light | 900 × 900 |
| 200-component dense editor, selection, inspector reflow | Dark | 820 × 1000 |
| First-map challenge failure feedback | Light | 375 × 900 |
| Six-case IT tutorial track and independent milestone | Light | 1440 × 900 |
| Import error dialog and disabled confirmation | Light | 1440 × 900 |
| Split editor with invalid source diagnostics | Light | 1440 × 900 |
| Analysis summary, attention callout, and tables | Light | 1440 × 900 |
| Scenario changes and overlay comparison | Dark | 1100 × 900 |

The fixtures use deterministic content and stable scenario dates. Map-card timestamps are created when the test worker starts so the visible relative label remains “just now.” Animations and carets are disabled for capture.

## Reproduction

```sh
npm run test:visual
```

The command creates the isolated production build, starts it on port 9003, and compares the visual project with one worker. `npm run test:e2e` runs the same project after the functional and performance gates.

Baselines live in `e2e/visual.spec.ts-snapshots/`. Their paths are platform-neutral so Linux CI compares against the reviewed images. A maximum 3% differing-pixel ratio accommodates operating-system font rasterization while retaining sensitivity to component, spacing, colour, reflow, and visibility changes. Functional layout assertions continue to enforce exact dimensions and overflow behavior.

Update baselines only after reviewing every changed image:

```sh
npm run test:visual -- --update-snapshots
```

On failure, Playwright writes the actual image and diff into `test-results/`; CI uploads that directory as an artifact.
