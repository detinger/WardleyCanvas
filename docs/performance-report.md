# Performance Report

**Work package:** `QA-02`  
**Measurement date:** 2026-10-25  
**Fixture:** 200 components and 400 dependencies, deterministic seed 42

## Result

The editor meets the Section 12.6 browser-interaction and pure-operation budgets on the documented baseline. The release suite runs the browser benchmark only after the functional browser projects finish, so competing test workers do not distort the measurements.

| Budget | Gate | Observed worst of 3 consecutive runs | Result |
| --- | ---: | ---: | --- |
| Warm editor readiness, p95 | <= 2,500 ms | 96.6 ms | Pass |
| Dense pan/zoom/drag, median | >= 55 FPS | 59.88 FPS | Pass |
| Pointer-to-preview latency, p95 | <= 50 ms | 4.4 ms | Pass |

Each run sampled five warm route reloads, at least 60 animation frames across pan, wheel zoom, and component drag, and 30 pointer-to-preview updates. Readiness means that the hydrated toolbar, canvas, and all 200 interactive map elements are present.

## Reproduction

```sh
npm run test:performance
```

The command creates an isolated production build in `.next-e2e`, starts it on port 9003, and runs the benchmark with one Playwright worker. `npm run test:e2e` also runs this project after the functional browser matrix.

Recorded environment:

- macOS 27.0.1, arm64;
- Node.js 26.12.1 and npm 11.20.0;
- Next.js 15.5.9;
- Playwright 1.64.1 bundled headless Chromium;
- viewport 1440 × 900;
- local production server, warm browser cache, no CPU or network throttling.

These figures qualify this baseline, not every device. CI enforces the same absolute gates; material runner changes should record a new environment and investigate regressions rather than relaxing thresholds without review.

## Pure-operation coverage

`src/__tests__/performance.test.ts` separately enforces p95 budgets for validation, parse/merge, serialization, SVG rendering, undo/redo, and analysis summaries against the same fixture. It also verifies that editor history remains capped at 50 entries and that the source path stays below the 100 ms threshold that would require moving parsing off the main thread.
