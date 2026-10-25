# Wardley Canvas

Wardley Canvas is a local-first workspace for learning, editing, analyzing, and comparing Wardley Maps. It keeps the map as the primary artifact while making assumptions, evidence, uncertainty, scenarios, and decisions explicit.

## What it includes

- SVG visual editor with normalized coordinates, pan/zoom/fit, multi-select, keyboard editing, undo/redo, and an accessible map outline.
- Synchronized visual, source, and split editing for the supported OnlineWardleyMaps syntax.
- Draft recovery, immutable committed versions, migration of legacy browser data, and full local-data backup/deletion controls.
- Native JSON and OWM import/export, plus SVG, PNG, and printable PDF export with diagnostics and loss reporting.
- Structural validation and non-blocking modeling guidance.
- Eight foundation modules plus six progressive IT case studies, with guided challenges, an independent capstone, hints, rubrics, and durable progress.
- Evidence-backed climate, doctrine, and gameplay assessments without composite strategy scores.
- Immutable scenario baselines, delta comparison, inspectable findings, decision records, and decision-packet export.
- Light, dark, and system themes with responsive layouts down to 375 CSS px in the automated matrix.

All user maps and learning progress stay in the current browser’s `localStorage`. There is no account, server sync, collaboration, or product telemetry in version 1. Export a backup before clearing browser data.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Overview, recent maps, and learning progress |
| `/maps` | Map collection, templates, create, and import |
| `/maps/:mapId` | Primary editor and analysis inspector |
| `/maps/:mapId/history` | Immutable version history and restore-as-new-version |
| `/maps/:mapId/scenarios` | Scenario collection for a map |
| `/maps/:mapId/scenarios/:scenarioId` | Scenario editing, comparison, consequences, and decisions |
| `/learn` | Learning path |
| `/learn/:moduleId` | Lesson and challenge workspace |
| `/learn/challenges` | Challenge index |
| `/reference` | Notation, climate, doctrine, gameplay, sources, and licence |
| `/scenarios` | Scenario index |
| `/settings` | Theme, accessibility notes, and local-data controls |
| `/help` | Editor and keyboard help |

## Development

Requirements: Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

The development server listens on <http://localhost:9002>.
If that port is already occupied, stop the existing process or run `npm run dev -- -p 9004`.

Useful checks:

```sh
npm audit --audit-level=moderate
npm run check
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run test:performance
npm run test:visual
```

The Playwright npm lifecycle builds and starts an isolated production server on port 9003 using `.next-e2e`, so it can run alongside `npm run dev`.

## Deployment

No environment variables, database, Firebase SDK, or external API are required. Build and start a production instance with:

```sh
npm ci
npm run check
npm start
```

Run `npm run test:e2e` for the complete Chromium, Firefox, WebKit, accessibility, performance, and visual release gate. The repository includes `apphosting.yaml` for Firebase App Hosting, while any platform that supports a standard Next.js 16 application and Node.js 20.9+ can host it.

The application is browser-local. Each browser profile keeps its own maps and learning progress in `localStorage`; deployments do not provide accounts, synchronization, or server-side persistence.

## Architecture

- Next.js App Router, React, and TypeScript
- SVG renderer with independent domain geometry and deterministic export
- Pure domain commands, validation, parsers, scenario rules, and analysis summaries
- Browser-local persistence with sequential legacy migration and recoverable backups
- Vitest for domain/integration tests and a Chromium/WebKit/Firefox Playwright + axe-core release matrix
- GitHub Actions gates dependency security, type checking, unit tests, production build, accessibility, performance, and visual regression on every pull request and push to `main`

The implementation contract is [PLAN.md](PLAN.md). Release evidence and decisions live in `docs/`, including the [accessibility audit](docs/accessibility-audit.md), [browser support statement](docs/browser-support.md), [performance report](docs/performance-report.md), [visual-regression matrix](docs/visual-regression.md), [content/licence review](docs/content-license-review.md), [collaboration ADR](docs/adr/0001-collaboration-readiness.md), and [telemetry ADR](docs/adr/0002-privacy-safe-telemetry.md).

## Attribution and licences

Wardley reference and learning content is adapted and rewritten from Wardley Maps by Simon Wardley under CC BY-SA 4.0. The application is not affiliated with or endorsed by Simon Wardley. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for content attribution and direct dependency licences.
