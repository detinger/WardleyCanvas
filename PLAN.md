# Wardley Maps Studio Improvement Plan

**Status:** Agent-ready implementation specification  
**Version:** 1.0  
**Audience:** Product, design, engineering, content, and QA agents  
**Binding visual source:** `STYLE(1).md` (BPMN Studio design language)  
**Primary outcome:** Turn the existing application into a coherent Wardley Mapping learning, editing, analysis, and strategy-simulation workspace without losing the source design language.

---

## 1. How to use this plan

This document is the implementation contract. In this document:

- **MUST** means required for the release gate.
- **SHOULD** means expected unless the repository or user research supplies a documented reason not to.
- **MAY** means optional and must not delay a higher-priority requirement.
- A task is not complete until its tests and acceptance criteria pass.
- Preserve working behavior in the existing product unless a task explicitly replaces it.
- Prefer incremental migration over a rewrite. Reuse the existing framework, router, state management, persistence, test runner, and build system when they meet the requirements.
- When this plan conflicts with an incidental current style, the exact design tokens and layout rules in section 4 win.
- When product behavior is ambiguous, preserve user data, make the least destructive choice, and record the decision in an ADR.

### 1.1 Agent execution protocol

Every implementation agent MUST:

1. Read this complete plan and the repository's contributor/agent instructions.
2. Audit the current implementation before editing it.
3. Map the assigned task IDs to existing files and tests.
4. State assumptions in the pull request or change summary.
5. Keep domain logic independent from rendering and persistence.
6. Add or update tests in the same change as behavior.
7. Check light and dark themes, keyboard use, and the documented breakpoints.
8. Avoid unrelated refactors and preserve user-created maps.
9. Record deviations from this plan with rationale and migration impact.
10. Hand off with completed task IDs, test evidence, screenshots for visual changes, and known follow-ups.

### 1.2 Required discovery before implementation

Create a short `docs/current-state-audit.md` containing:

- framework, language, routing, state, persistence, rendering, and test technologies;
- current routes and principal workflows;
- current map data model and every persisted/imported format;
- current editor capabilities and gaps;
- migrations needed to preserve existing maps;
- accessibility, performance, and responsive-layout findings;
- a mapping from existing style variables to the binding tokens in section 4;
- a list of third-party packages and licenses relevant to map parsing/rendering/export;
- baseline test results and at least one representative map fixture.

**Discovery gate:** no schema replacement, editor rewrite, or persistence migration begins until the audit proves how existing data will be read, migrated, and rolled back.

---

## 2. Product definition

### 2.1 Product promise

Wardley Maps Studio helps a learner or strategy team move through a complete loop:

1. define purpose, users, and user needs;
2. build a value chain of components and dependencies;
3. position each component by visibility and evolution;
4. examine climatic patterns and organizational doctrine;
5. propose context-specific gameplay;
6. compare explicit scenarios and assumptions;
7. decide, export, revisit, and learn from outcomes.

The editor and learning system MUST teach the reasoning behind a map rather than reward diagram decoration.

### 2.2 Target users

| User | Primary job | Required support |
| --- | --- | --- |
| First-time learner | Understand and make a first useful map | Guided challenges, plain-language definitions, examples, progressive disclosure |
| Practitioner | Create and revise maps quickly | Visual editor, map-as-code, keyboard flow, validation, version-safe import/export |
| Facilitator | Run a mapping or strategy session | Focus mode, annotations, scenario comparison, presentation-ready export |
| Strategy team | Connect landscape, climate, doctrine, and action | Evidence-backed overlays, gameplay hypotheses, decision log, scenario deltas |
| Reviewer/educator | Assess reasoning and give feedback | Rubrics, challenge results, validation explanations, shareable artifacts |

### 2.3 Success outcomes

- A new user can create a minimum viable map with one anchor/user, one need, three to five components, dependencies, and evolution positions without external documentation.
- An experienced user can create or edit the same map visually or as text without loss of supported information.
- Import followed by export preserves supported map semantics and reports every unsupported or lossy construct.
- Users can explain which climatic patterns, doctrine principles, and gameplays apply, with evidence and uncertainty.
- Scenario comparisons expose assumptions and changed components; they never imply a guaranteed forecast.
- All core workflows work in light and dark themes, by keyboard, at the supported breakpoints, and with reduced motion.

### 2.4 Non-goals for the first release

- Predicting market outcomes or assigning a single “correct strategy” score.
- Treating evolution as elapsed time, adoption percentage, or an objectively precise measurement.
- Real-time multi-user co-editing. Design boundaries for it, but do not block the core release on it.
- A full project-management suite, financial-planning suite, or generic whiteboard.
- Automatically applying competitive or ethically sensitive gameplays without human review.
- Replacing qualitative strategic discussion with generated recommendations.

---

## 3. Information architecture and core journeys

### 3.1 Application shell

Use a full-height shell with these navigation groups:

1. **Workspace** — Overview, Maps, Recent.
2. **Learn** — Learning path, Challenges, Reference.
3. **Strategy** — Climate, Doctrine, Gameplay, Scenarios.
4. **Library** — Templates, Imports/Exports.
5. Bottom utilities — Theme, Settings, Help.

Replace the BPMN brand mark with a compact Wardley-appropriate mark while retaining its proportions and outline treatment. Suggested mark: a simple value-chain line descending across a four-stage horizontal field. Do not reuse BPMN notation.

### 3.2 Route model

Adapt route names to the existing router, but preserve these responsibilities:

| Route | Responsibility |
| --- | --- |
| `/` | Overview, continue-learning action, recent maps, progress |
| `/maps` | Searchable/sortable map collection, templates, create/import |
| `/maps/:mapId` | Primary editor and inspector |
| `/maps/:mapId/history` | Version timeline, comparison, restore-as-new-version |
| `/learn` | Learning path and progress |
| `/learn/challenges/:challengeId` | Challenge workspace, hints, validation, reflection |
| `/reference` | Wardley concepts, notation, climate, doctrine, gameplay catalog |
| `/scenarios/:scenarioId` | Scenario configuration, comparison, assumptions, decision record |
| `/settings` | Theme, editor preferences, accessibility, data controls |

### 3.3 Core journey A — first useful map

1. Start from “Create map” or the introductory challenge.
2. Name the map and state its purpose.
3. Add a user or stakeholder anchor and the need being served.
4. Add three to five relevant components.
5. Connect the value chain from visible need to supporting components.
6. position components vertically by visibility and horizontally by evolution.
7. Review warnings, explain at least one uncertain placement, and save.
8. Export or continue into climate/doctrine/gameplay analysis.

The interface MUST show one clear next action at each guided step while keeping the underlying map editable.

### 3.4 Core journey B — practitioner editing

1. Open a map or import `.owm`/text.
2. Edit visually, in source mode, or in synchronized split mode.
3. Inspect a component's meaning, type, position, evidence, dependencies, evolution, inertia, and sourcing decision.
4. Resolve validation findings or explicitly acknowledge soft warnings.
5. Save a version with a short change note.
6. Compare/export the result.

### 3.5 Core journey C — strategy review

1. Freeze or select a baseline map version.
2. Apply climate, doctrine, and gameplay overlays separately.
3. Attach evidence, owner, confidence, and review date to assertions.
4. Create two or more named scenarios from the baseline.
5. Change only explicit variables or positions and record the rationale.
6. Compare map deltas, consequences, dependencies, risks, and assumptions.
7. Record a decision and observable signals that would invalidate it.

---

## 4. Binding design-language contract

The values and patterns in this section are copied from the supplied style guide and are binding. Agents MUST use semantic variables rather than scattering literals. Product-specific content and the BPMN mark are replaced; density, hierarchy, geometry, and interaction roles are preserved.

### 4.1 Character

- Keep the map, explanations, forms, and results prominent.
- Use compact controls in grouped toolbars and larger gaps between sections.
- Let borders and spacing establish hierarchy before shadows.
- Blue means action/selection; orange is reserved for special activity, active simulation, and milestones; semantic colors explain outcomes.
- Put guidance, validation, empty states, and next steps beside the relevant task.
- Treat light and dark themes as complete designs.
- Do not add decorative gradients, glass effects, oversized marketing headings, pervasive heavy shadows, or pill-shaped primary buttons.
- Pills are limited to badges, filters, progress tracks, and lesson steps.

### 4.2 Exact color tokens

```css
:root,
[data-theme="light"] {
  --bg: #f4f6f9;
  --bg-elevated: #ffffff;
  --bg-subtle: #eef1f5;
  --bg-sunken: #e6eaf0;
  --bg-hover: #e9eef5;
  --border: #d6dce5;
  --border-strong: #b7c1cf;
  --text: #17202c;
  --text-muted: #4b5867;
  --text-subtle: #6b7787;
  --text-on-primary: #ffffff;

  --primary: #1f5f8b;
  --primary-hover: #184d72;
  --primary-soft: #e3eef7;
  --primary-strong: #123b59;
  --accent: #d9822b;
  --accent-soft: #fbeedd;

  --error: #c0392b;
  --error-soft: #fbe9e7;
  --warning: #b7791f;
  --warning-soft: #fdf3dc;
  --recommendation: #2b6cb0;
  --recommendation-soft: #e6f0fa;
  --info: #5a6779;
  --info-soft: #eef1f5;
  --success: #2f855a;
  --success-soft: #e3f4ea;

  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow: 0 2px 8px rgba(16, 24, 40, 0.08),
    0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0 12px 32px rgba(16, 24, 40, 0.16);
  --focus-ring: 0 0 0 3px rgba(31, 95, 139, 0.35);

  --chart-1: #2a78d6;
  --chart-2: #eb6834;
  --chart-3: #1baf7a;
  --chart-grid: #e1e0d9;
  --chart-axis: #c3c2b7;
  --chart-muted: #898781;
  --chart-surface: #ffffff;

  --canvas-bg: #ffffff;
  --bpmn-stroke: #22242a;
  --bpmn-fill: #ffffff;
  --bpmn-label: #22242a;
  --wardley-stroke: var(--bpmn-stroke);
  --wardley-fill: var(--bpmn-fill);
  --wardley-label: var(--bpmn-label);
}

[data-theme="dark"] {
  --bg: #0f141b;
  --bg-elevated: #171e27;
  --bg-subtle: #1c2430;
  --bg-sunken: #121821;
  --bg-hover: #233042;
  --border: #2b3645;
  --border-strong: #3b4a5e;
  --text: #e6ebf1;
  --text-muted: #b2bdcb;
  --text-subtle: #8a97a8;
  --text-on-primary: #0b1520;

  --primary: #5aa7d8;
  --primary-hover: #7ab9e3;
  --primary-soft: #16314a;
  --primary-strong: #a8d3ef;
  --accent: #f0a457;
  --accent-soft: #3a2a17;

  --error: #f2776a;
  --error-soft: #3b1d1a;
  --warning: #e8b45a;
  --warning-soft: #3a2d14;
  --recommendation: #79b2ec;
  --recommendation-soft: #172a40;
  --info: #a3afbf;
  --info-soft: #1f2833;
  --success: #6fcf97;
  --success-soft: #16301f;

  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.6);
  --focus-ring: 0 0 0 3px rgba(90, 167, 216, 0.45);

  --chart-1: #3987e5;
  --chart-2: #d95926;
  --chart-3: #199e70;
  --chart-grid: #2c2c2a;
  --chart-axis: #383835;
  --chart-muted: #898781;
  --chart-surface: #171e27;

  --canvas-bg: #141a22;
  --bpmn-stroke: #d7dee8;
  --bpmn-fill: #1b232d;
  --bpmn-label: #e6ebf1;
  --wardley-stroke: var(--bpmn-stroke);
  --wardley-fill: var(--bpmn-fill);
  --wardley-label: var(--bpmn-label);
}

:root {
  --status-good: #0ca30c;
  --status-warning: #fab219;
  --status-serious: #ec835a;
  --status-critical: #d03b3b;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
}
```

Solid accent buttons and active-simulation banners MUST use `#1d1205` text in both themes. Do not assume saturated backgrounds always take white text. Informational callouts use the recommendation blue pair; neutral informational badges use the gray info pair. Status and category colors MUST also have text or icon labels.

The three `--bpmn-*` variables are retained exactly as supplied so a direct port has no token drift. Wardley components consume the product-appropriate `--wardley-*` aliases. Remove the legacy names only in a later, explicitly approved migration with token snapshot coverage.

### 4.3 Typography

```css
--font-sans: 'Inter', 'IBM Plex Sans', system-ui, -apple-system,
  'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace,
  SFMono-Regular, Menlo, monospace;
```

| Element | Size | Weight | Other |
| --- | --- | --- | --- |
| Body | `14px` | 400 | line-height 1.5 |
| Home hero | `32px` | 650 | tracking `-0.02em` |
| Page h1 | `26px` | 650 | tracking `-0.01em` |
| Section h2 | `20px` | 650 | tracking `-0.01em` |
| Card h3 | `16px` | 650 | tracking `-0.01em` |
| Subheading h4 | `14px` | 650 | tracking `-0.01em` |
| Dialog heading | `17px` | 650 | no bottom margin |
| Hero description | `15px` | 400 | muted |
| Compact/panel/table content | `13px` | 400 | compact use |
| Label/table heading | `12px` | 600 | muted |
| Hint | `12px` | 400 | subtle |
| Metadata/badge | `11px` | 400/650 | secondary |
| KPI value | `22px` | 700 | tracking `-0.02em`, tabular numerals |
| Eyebrow | `12px` | 600 | uppercase, tracking `0.08em`, primary |
| Navigation group | `11px` | 400 | uppercase, tracking `0.06em` |

Headings use 1.25 line-height and `0.5em` bottom margin. Paragraphs use `0.75em`. Limit prose to `76ch` and page-header descriptions to `72ch`. Use monospace for OWM source, IDs, traces, and keyboard shortcuts. Use tabular numerals for coordinates, zoom, metrics, and comparisons. Self-host Inter and the selected monospace font if consistent rendering across machines is required.

### 4.4 Spacing, shape, and elevation

Preserve the practical scale: `2–4px` tight grouping, `6px` icon/label gaps, `8px` row gaps, `10–12px` compact/form spacing, `14–16px` panel/card-grid spacing, `18px` card/dialog padding, `20–24px` large layout gaps, `28–32px` desktop insets, `40–48px` page-bottom breathing room.

- Controls and callouts: `6px` radius.
- Cards and KPI tiles: `10px` radius.
- Dialogs: `14px` radius.
- Keyboard keys, focus-outline shape, chart bar ends: `4px` local radius.
- Badges, chips, progress tracks, lesson steps: `999px`.
- Most separations use a 1px border.
- Standard cards use `--shadow-sm`; linked-card hover and toasts use `--shadow`; menus/dialogs use `--shadow-lg`.

### 4.5 Layout contract

- Expanded navigation: `232px`; collapsed: `64px`.
- Brand row and workspace toolbar: `56px` height; toolbar MAY wrap and grow.
- Standard page padding: `28px 32px 48px`.
- Narrow centered content: maximum `1080px`.
- Page headers: content left, actions right, wrapping with `16px` gap.
- Card collections: auto-fill at minimum `260px`, `16px` gaps.
- Editor: toolbar, flexible map canvas, `420px` inspector.
- Configuration/results: `380px` plus flexible results, `20px` gap.
- Reference: `280px` sticky index plus flexible article, `24px` gap.
- Dashboard: KPI grid, chart cards, detailed tables.
- Flexible regions MUST use `minmax(0, 1fr)`, `min-width: 0`, and `min-height: 0` where needed.

Breakpoints:

| Maximum width | Required adaptation |
| --- | --- |
| `1100px` | Inspector becomes `340px`; configuration/results becomes one column |
| `960px` | Two-column home hero becomes one column |
| `900px` | Two-/three-column utility grids become one; reference index moves above content |
| `820px` | Sidebar becomes horizontal scrollable nav; labels/group headings hidden; page padding `18px 16px 40px`; inspector below canvas |

At the smallest editor breakpoint, map and inspector rows are `minmax(320px, 1fr)` and `minmax(280px, 45vh)`. Verify this against the actual smallest supported viewport and avoid nested-scroll traps.

### 4.6 Shared component recipes

- Default button: `34px` high, `0 12px` padding, `6px` gap/radius, 1px border, weight 550.
- Small button: `28px` high, `0 8px`, 13px text.
- Icon buttons: square `34px`; small square `28px`; every icon-only control has an accessible name.
- Input/select: `34px` high, `0 10px`, 6px radius, elevated background, 1px border.
- Small input/select: `28px`, `0 6px`, 13px text.
- Textarea: `8px 10px`, vertically resizable.
- Standard card: elevated surface, 1px border, 10px radius, 18px padding, small shadow.
- Tabs: `9px 12px`, 6px gap, weight 550, selected primary text plus 2px bottom border.
- Inspector tabs: 13px text, `10px 8px`; strip scrolls horizontally when necessary.
- Chips: `3px 9px`, 12px text, pill radius, 1px border.
- Badges: `20px` high, `0 7px`, 11px/650, pill radius.
- Callouts: `10px 12px`, 6px radius, 18px icon, 10px content gap.
- Empty states: centered, `36px 16px`, short next step.
- Progress: 8px high, pill, sunken track, primary fill.
- Toasts: bottom-right 16px inset, 8px gap, `10px 14px`, 6px radius, 4px semantic left border, `260–420px` width.
- Tables: scroll wrapper, 1px border, 6px radius; cells `7px 10px`; 13px body; 12px/600 sticky header.
- Dialog: backdrop `rgba(10, 16, 24, 0.5)`, 24px viewport padding, width `min(960px, 100%)`, max-height `calc(100vh - 48px)`, 14px radius.
- Menu: minimum `230px`, 6px radius, 4px outer padding, items `7px 10px`.

### 4.7 Map canvas adaptation

- Map canvas MUST use `--canvas-bg`, `--wardley-stroke`, `--wardley-fill`, and `--wardley-label`.
- These are semantic Wardley aliases of the supplied workspace values; the values MUST remain exact.
- Keep the canvas quiet. Dense explanations belong in the inspector.
- Use orange outlines only to call attention to a selected explanation, active scenario change, or issue location—not as a general component color.
- Preserve user-assigned colors where supported. Theme defaults apply only to elements without explicit user colors.
- Embedded previews use a 1px border, 6px radius, and 260px typical height or 360px tall height.
- Use Lucide outline icons: 16px in buttons, 18px in navigation/callouts, 13–14px for small inline actions.
- Canvas overlays MUST remain understandable without color and maintain adequate contrast in both themes.

### 4.8 Chart, layer, motion, and accessibility rules

- Charts use category tokens, never semantic meaning by color alone; include a table view.
- Use one value axis, light grid lines, no tick marks, 11px axis text, and 12px categorical labels.
- Horizontal bars: maximum 24px; paired bars 18px; exposed ends 4px radius.
- Lines: 2px; area fill: 10% opacity; step curves for discrete changes.
- Layer order: watermark 10, canvas controls 15, canvas overlay 20, menus 30, dialogs 50, toasts 60, skip link 100.
- Motion: button/card transitions 120ms, toast 180ms ease-out from 8px below, progress width 250ms, spinner 1s linear.
- Add `prefers-reduced-motion` handling that removes nonessential movement.
- Dialogs MUST trap focus, close on Escape, and restore previous focus.
- Tabs MUST implement arrow-key navigation and correct ARIA relationships.
- Include a visible skip link, semantic navigation, persistent focus visibility, zoom/reflow support, and no keyboard traps.

---

## 5. Canonical Wardley domain model

Use stable IDs for identity and names only for display. Keep the canonical model renderer- and storage-independent. Coordinates are normalized in `[0, 1]`; serialization adapters transform to or from external formats.

### 5.1 Core types

```ts
type Id = string;
type Normalized = number; // inclusive 0..1
type Confidence = 'low' | 'medium' | 'high';

interface WardleyMap {
  schemaVersion: number;
  id: Id;
  title: string;
  purpose?: string;
  perspective?: string;
  evolutionLabels: [string, string, string, string];
  stageBoundaries: [Normalized, Normalized, Normalized];
  elements: MapElement[];
  dependencies: Dependency[];
  evolutions: EvolutionMovement[];
  pipelines: Pipeline[];
  annotations: MapAnnotation[];
  analysis: AnalysisLayer;
  createdAt: string;
  updatedAt: string;
  revision: number;
  extensions?: Record<string, unknown>;
}

type MapElementKind = 'anchor' | 'component' | 'market' | 'ecosystem' | 'submap';
type ComponentType = 'activity' | 'practice' | 'data' | 'knowledge' | 'unspecified';

interface MapElement {
  id: Id;
  kind: MapElementKind;
  name: string;
  description?: string;
  componentType: ComponentType;
  visibility: Normalized;
  evolution: Normalized;
  labelOffset?: { x: number; y: number };
  inertia?: boolean;
  sourcing?: 'build' | 'buy' | 'outsource' | 'unspecified';
  tags?: string[];
  evidenceIds?: Id[];
  submapRef?: { mapId?: Id; url?: string };
}

interface Dependency {
  id: Id;
  fromId: Id;
  toId: Id;
  kind: 'dependency' | 'flow';
  label?: string;
  flowDirection?: 'forward' | 'reverse' | 'bidirectional';
}

interface EvolutionMovement {
  id: Id;
  elementId: Id;
  targetEvolution: Normalized;
  targetName?: string;
  sourcing?: 'build' | 'buy' | 'outsource';
  rationale?: string;
}

interface Pipeline {
  id: Id;
  parentElementId: Id;
  memberElementIds: Id[];
  startEvolution: Normalized;
  endEvolution: Normalized;
}
```

### 5.2 Analysis types

```ts
interface Evidence {
  id: Id;
  claim: string;
  sourceLabel?: string;
  sourceUrl?: string;
  confidence: Confidence;
  observedAt?: string;
  reviewAt?: string;
}

interface PatternAssessment {
  id: Id;
  catalogId: string;
  appliesToIds: Id[];
  state: 'considering' | 'applies' | 'does-not-apply' | 'uncertain';
  rationale: string;
  evidenceIds: Id[];
  confidence: Confidence;
  owner?: string;
  reviewAt?: string;
}

interface DoctrineAssessment extends PatternAssessment {
  capabilityState: 'not-started' | 'emerging' | 'practiced' | 'embedded' | 'not-applicable';
}

interface GameplayHypothesis extends PatternAssessment {
  category: string;
  intendedEffect: string;
  leadingSignals: string[];
  risks: string[];
  ethicalNotes?: string;
}

interface DecisionRecord {
  id: Id;
  baselineMapId: Id;
  baselineRevision: number;
  selectedScenarioId?: Id;
  rejectedScenarioIds: Id[];
  rationale: string;
  owner?: string;
  decidedAt: string;
  reviewAt?: string;
  expectedSignals: string[];
  stopConditions: string[];
  supersedesId?: Id;
}

interface AnalysisLayer {
  climate: PatternAssessment[];
  doctrine: DoctrineAssessment[];
  gameplay: GameplayHypothesis[];
  evidence: Evidence[];
  decisions: DecisionRecord[];
}
```

### 5.3 Invariants

- IDs are unique and immutable within a map.
- `visibility`, `evolution`, evolution targets, and pipeline ranges remain within `0..1`.
- Default axis labels are **Genesis**, **Custom built**, **Product (+rental)**, and **Commodity (+utility)**.
- A map has at least one anchor or user/stakeholder element before it can be marked ready for analysis.
- Every dependency endpoint exists. Removing a component requires explicit confirmation and a preview of affected dependencies, pipelines, evidence, assessments, and scenarios.
- A component name need not be globally unique; visual/source adapters that require unique references MUST disambiguate safely and visibly.
- Circular dependencies are permitted to load but produce a warning for human review; they are not silently deleted.
- Unsupported imported constructs are retained in an extension payload when safe, or reported as lossy before save/export.
- Analysis assertions require rationale; recommendations MUST distinguish observation, interpretation, and hypothesis.
- Scenario data references a baseline version and stores deltas rather than mutating the baseline.

---

## 6. Map editor

### 6.1 Workspace composition

Desktop editor:

```text
56px workspace toolbar
┌──────────────────────── flexible map ───────────────────────┬── 420px inspector ──┐
│ canvas, axes, map elements, selection and overlays          │ tabs and properties  │
└──────────────────────────────────────────────────────────────┴───────────────────────┘
```

Inspector tabs: **Details**, **Connections**, **Evolution**, **Evidence**, **Analysis**, and **Validation**. Hide unavailable content through empty states, not disabled mystery controls.

Toolbar groups:

1. map/file: back, title/status, save state;
2. create: anchor, component, dependency/flow, pipeline, annotation;
3. edit: undo, redo, duplicate, delete;
4. view: select/pan, fit, zoom, grid/snap, overlays;
5. mode: Visual, Source, Split;
6. primary action: Save version or Finish challenge.

### 6.2 Canvas behaviors

- Render the vertical axis as **Visibility** with visible/user-facing needs toward the top and less visible supporting components below.
- Render the horizontal **Evolution** axis left-to-right using the four default stages.
- Keep normalized coordinates stable across resize, zoom, theme, and export.
- Use viewport transforms for pan/zoom; never rewrite domain coordinates merely because the viewport changed.
- Dragging updates a preview continuously and commits one undoable command on drop.
- Optional snap guides show alignment, stage boundaries, and nearby component coordinates. Snapping MUST be togglable and MUST not imply that stage boundaries make evolution objectively precise.
- Allow multi-select, marquee selection, keyboard nudging, duplicate, align, and distribute.
- Prevent accidental movement while panning. Clearly distinguish select and pan modes.
- Preserve selected element and viewport when switching Visual/Source/Split mode where possible.
- Selection in the canvas and inspector is bidirectional.
- Selected issue locations use the permitted orange attention outline.

### 6.3 Elements and dependencies

- Create an anchor with a clear “Who needs what?” prompt.
- Create components with name, component type, description, visibility, evolution, evidence, inertia, and sourcing metadata.
- A dependency from A to B means A depends on B. The UI MUST repeat that relationship in words before committing a keyboard-created connection.
- Flows have explicit direction and optional label; they do not replace dependency semantics.
- Dependency lines remain selectable, readable at common zoom levels, and visually distinct from evolution movement.
- Pipelines group related components across evolution while sharing the parent visibility semantics. Collapsing a pipeline MUST not delete members.
- Evolution movements show current and proposed/expected position, optional rename, sourcing, and rationale.
- Notes, numbered annotations, accelerators/deaccelerators, markets/ecosystems, inertia, and submaps are supported after the foundational editor is stable.

### 6.4 Editing resilience

- Command-based undo/redo covers all map mutations, including source-mode transactions.
- Autosave writes debounced drafts locally and indicates **Saving**, **Saved**, or **Could not save** with text, not color alone.
- A saved version is immutable; restoring creates a new version.
- On parse errors in Source/Split mode, retain the last valid rendered map, show line/column diagnostics, and never discard the invalid source draft.
- Navigation with unsaved non-autosaved changes prompts the user.
- Recover the last draft after a crash/reload and clearly distinguish it from the last saved version.

### 6.5 Keyboard and assistive technology

- Provide a non-canvas outline/tree view of map elements and dependencies synchronized with selection.
- All creation and property-editing tasks work without pointer drag.
- Minimum shortcuts: undo/redo, delete, duplicate, fit map, zoom, search, and arrow-key nudge. Display them in a shortcut dialog and tooltips.
- Do not rely on canvas/SVG geometry as the sole accessible representation.
- Announce selection changes, element creation/deletion, validation totals, parse errors, and save state through appropriately scoped live regions.
- Offer high-precision numeric coordinate fields in the inspector.

---

## 7. Wardley analysis layers

Climate, doctrine, and gameplay MUST be distinct layers. They may reference the same components, but they answer different questions:

- **Climate:** external rules and patterns that affect the landscape.
- **Doctrine:** generally applicable operating principles that reduce unforced error.
- **Gameplay:** context-specific strategic actions intended to influence the landscape.

### 7.1 Climatic patterns

Build a versioned catalog with stable IDs, category, short description, full explanation, prompts, related concepts, attribution/license, and source link. Initial categories SHOULD cover competitors, components, finance, inertia, prediction, and speed.

Interaction:

1. User opens the Climate overlay.
2. App proposes questions, never automatic facts.
3. User marks a pattern as considering/applies/does not apply/uncertain.
4. User selects affected components/relationships and adds rationale/evidence/confidence.
5. Canvas highlights only the selected assessment; a summary panel lists all assessments.

Required safeguards:

- Do not infer “all components evolve rightward at a fixed rate.”
- Do not convert qualitative evolution into a calendar forecast.
- Show the difference between a catalog definition and a map-specific assertion.
- Require human confirmation before generated suggestions become map analysis.

### 7.2 Doctrine

Provide a doctrine self-assessment organized by stable phases/categories from the selected licensed source. Each principle includes:

- definition and why it matters;
- observable behaviors and counter-signals;
- assessment state: not started, emerging, practiced, embedded, not applicable;
- rationale, evidence, owner, confidence, and review date;
- affected components or organizational areas;
- suggested reflection questions, not a prescriptive maturity score.

The doctrine dashboard uses KPI tiles only for transparent counts such as “8 assessed” or “3 need review.” Do not collapse doctrine into a vanity percentage. A chart always has a table alternative.

### 7.3 Gameplay

Provide a searchable/filterable catalog with categories such as basic operations, user perception, accelerators, deaccelerators, toxicity, market, defensive, attacking, ecosystem, competitor, positional, and poison. Catalog entries MUST include source/attribution, context, intended effect, prerequisites, risks, counterplays, and ethical/legal review prompts.

A gameplay added to a map becomes a **hypothesis**, not an instruction. Require:

- affected map elements;
- intended change in the landscape;
- supporting climate/doctrine observations;
- assumptions and confidence;
- leading signals and stop conditions;
- risks, harms, and legal/ethical notes;
- owner and review date.

The product MUST not present manipulative, deceptive, regulatory, anti-competitive, or otherwise sensitive plays as unqualified recommendations. Place cautionary context beside the play and require deliberate human review.

### 7.4 Evidence and provenance

- Claims can link to one or more evidence records.
- URLs render safely and never execute imported markup/scripts.
- Show stale/review-due evidence.
- Exports include analysis provenance and catalog version.
- When source content is licensed under CC BY-SA or another license, include required attribution and share-alike notices in bundled reference content and exports that reproduce it.

---

## 8. Strategy scenarios and simulation

Use the label **Scenario comparison** in ordinary UI. “Simulation” may appear in explanatory copy, but the product MUST state that results are conditional consequences of explicit assumptions, not predictions.

### 8.1 Scenario model

```ts
interface Scenario {
  id: Id;
  name: string;
  baselineMapId: Id;
  baselineRevision: number;
  description?: string;
  horizonLabel?: string;
  assumptions: ScenarioAssumption[];
  changes: ScenarioChange[];
  consequences: ScenarioConsequence[];
  createdAt: string;
  updatedAt: string;
}

interface ScenarioAssumption {
  id: Id;
  statement: string;
  confidence: Confidence;
  evidenceIds: Id[];
  invalidationSignals: string[];
}

interface ScenarioConsequence {
  id: Id;
  affectedIds: Id[];
  description: string;
  direction: 'improves' | 'worsens' | 'mixed' | 'unknown';
  magnitude: 'small' | 'medium' | 'large' | 'unknown';
  confidence: Confidence;
  evidenceIds: Id[];
  uncertaintyNotes?: string;
}

type ScenarioChange =
  | { kind: 'move-evolution'; elementId: Id; from: number; to: number; rationale: string }
  | { kind: 'move-visibility'; elementId: Id; from: number; to: number; rationale: string }
  | { kind: 'add-element'; element: MapElement; rationale: string }
  | { kind: 'remove-element'; elementId: Id; rationale: string }
  | { kind: 'change-dependency'; before?: Dependency; after?: Dependency; rationale: string }
  | { kind: 'toggle-inertia'; elementId: Id; value: boolean; rationale: string }
  | { kind: 'apply-gameplay'; gameplayHypothesisId: Id; rationale: string };
```

### 8.2 Scenario workflow

- Create a scenario by branching from an immutable map revision.
- Configure assumptions in a `380px` column and show results in the flexible region.
- Provide side-by-side, overlay, and delta-list comparisons.
- Mark added, removed, moved, and changed relationships with icons/labels plus color.
- Show downstream dependency impact and unresolved validation introduced by the scenario.
- Let users attach consequences with direction, magnitude band, confidence, evidence, and uncertainty notes.
- Compare at least two scenarios against the same baseline.
- Export a scenario packet containing baseline identity, assumptions, changes, consequences, risks, signals, and decision record.

### 8.3 Rules engine

- Keep rules deterministic, inspectable, versioned, and separate from presentation.
- A rule produces a finding and explanation, not an opaque strategy score.
- Each derived result identifies its rule ID, inputs, output, and limitations.
- Users can disable a rule and see how that changes results.
- No random values in production calculations unless a future probabilistic module is explicitly introduced, seeded, explained, and independently tested.
- Generated text MUST be visually labeled, editable, and excluded from trusted evidence until confirmed.

### 8.4 Decision records

Each decision record stores selected scenario, rejected alternatives, rationale, owner, decision date, review date, expected signals, stop/reversal conditions, and linked map revision. Historical records are immutable; corrections create superseding records.

---

## 9. Educational system and challenges

### 9.1 Learning path

Use progressive modules:

1. Purpose, users, and needs.
2. Components and value chains.
3. Visibility and evolution.
4. Reading a complete map.
5. Climate and inertia.
6. Doctrine and operating context.
7. Gameplay hypotheses.
8. Scenario comparison and decisions.

Each module contains a short explanation, annotated example, guided practice, challenge, reflection, and reference links. Learners may skip ahead; progress is not a lock on product capability.

### 9.2 Challenge schema

```ts
interface ChallengeDefinition {
  id: string;
  version: number;
  title: string;
  objective: string;
  conceptIds: string[];
  starterMap?: WardleyMap;
  instructions: ChallengeStep[];
  validators: ChallengeValidator[];
  hints: ChallengeHint[];
  rubric: RubricCriterion[];
  reflectionPrompts: string[];
}
```

Challenge validators MUST test observable structure without pretending there is one strategically correct map. Examples:

- at least one anchor and one explicitly described need;
- three or more connected components;
- every required component reachable from the anchor;
- components positioned in more than one evolution stage;
- a rationale recorded for a deliberately ambiguous placement;
- a climate/doctrine/gameplay assessment with evidence.

### 9.3 Feedback pattern

- Validation explains the issue, why it matters, and one possible next move.
- Hints are progressive: question, concept reminder, focused clue, worked explanation.
- Do not automatically reveal the final map after the first error.
- Correctness uses words/icons and semantic color.
- Completion records objective criteria separately from qualitative reflection.
- Learners can compare their reasoning to an example while seeing that alternatives may be valid.
- Progress can be reset or exported; it is never mixed irreversibly with map data.

### 9.4 Content governance

- Store lessons, catalogs, challenges, and rubrics as versioned content, not hard-coded component markup.
- Validate content schemas in CI.
- Every concept has a stable ID so progress survives copy edits.
- Record author, reviewer, source, license, version, and last-reviewed date.
- Use direct instructional language and replace implementation jargon in user flows.

---

## 10. Validation and guidance

### 10.1 Severity model

| Severity | Meaning | Save/export behavior |
| --- | --- | --- |
| Error | Corrupt, unrenderable, unsafe, or referentially invalid data | Block commit/export that would lose or corrupt data |
| Warning | Likely modeling issue requiring judgment | Allow with acknowledgment |
| Recommendation | Improvement or learning prompt | Never blocks |
| Info | Neutral fact or metadata | Never blocks |

Validation rows use the design recipe: 3px inset semantic stripe, icon, short title, expandable explanation, affected-element action, and possible fix.

### 10.2 Validation rules

**Structural errors**

- duplicate or missing stable IDs;
- non-finite/out-of-range coordinates;
- dependency/evolution/pipeline references to missing elements;
- invalid pipeline bounds or members;
- malformed schema version or unsafe imported content;
- source text that cannot produce a valid transaction.

**Modeling warnings**

- no anchor/user or no articulated need;
- orphan component or anchor-unreachable component;
- circular dependency;
- duplicate-looking names likely to confuse text formats;
- dependency that contradicts the chosen top-to-bottom convention;
- extreme overlap/label collision;
- pipeline member outside its range;
- evolution target not rightward, unless intentionally acknowledged;
- analysis claim without rationale/evidence;
- scenario change without rationale;
- stale evidence or review date.

**Recommendations**

- map may be too large for one useful conversation;
- components use a single evolution stage without explanation;
- sourcing method appears mismatched with evolution characteristics;
- inertia is asserted without explaining source;
- gameplay lacks success signals or stop conditions;
- user need is framed as an internal solution rather than a need.

### 10.3 Validation architecture

- Implement pure rules over the canonical model.
- Return stable rule ID, severity, short message, explanation, affected IDs, suggested action, and optional autofix descriptor.
- Autofix is previewed, undoable, and never used for subjective strategy choices.
- Run cheap rules incrementally after edits; run the full suite on save, import, challenge check, and export.
- Suppressions require rule ID, scope, rationale, actor, and timestamp. Suppression never hides structural errors.

---

## 11. Import, export, and interoperability

### 11.1 Native format

Use versioned UTF-8 JSON as the lossless native interchange format. Include map data, analysis, evidence, scenarios (optionally), content/catalog versions, and extension data. Publish a JSON Schema and migration functions.

File extension MAY be product-specific, but the MIME/type label and version MUST be clear. Never serialize executable code, access tokens, or local absolute paths.

### 11.2 OWM maps-as-code

Support `.owm`/plain-text interoperability through an adapter. Target this order:

| Construct | Import | Export | Priority |
| --- | --- | --- | --- |
| title, size/style metadata | yes | yes where representable | P0 |
| anchor, component, coordinates, label offset | yes | yes | P0 |
| dependency `->`, flow `+>` and label/context | yes | yes | P0 |
| inertia and evolve/rename | yes | yes | P0 |
| build/buy/outsource decorators | yes | yes | P1 |
| notes and numbered annotations | yes | yes | P1 |
| pipelines | yes | yes | P1 |
| markets/ecosystems | yes | yes | P1 |
| submaps and URLs | yes, sanitized | yes | P1 |
| accelerators/deaccelerators | yes | yes | P2 |
| pioneers/settlers/town planners | yes | yes | P2 |
| app-only analysis/scenarios | retain in native model | companion JSON or documented omission | P1 |

Parser rules:

- Keep a concrete-syntax representation or source map so comments and harmless formatting can round-trip where feasible.
- Parsing is isolated, deterministic, and tested with external fixtures.
- Never use `eval`, execute URLs, or inject imported labels as HTML.
- Diagnostics include line, column, offending construct, and recovery guidance.
- Preview before committing an import. Show totals, warnings, renamed collisions, unsupported constructs, and lossiness.
- Import is atomic: cancel or error leaves the current map unchanged.

### 11.3 Visual/document exports

- SVG: preferred scalable map export, sanitized and self-contained where practical.
- PNG: explicit scale/background controls and minimum readable text at common export sizes.
- PDF: map plus optional title, legend, assumptions, analysis summary, attribution, and generated date.
- JSON: lossless native data.
- OWM/text: interoperable supported subset with a loss report.
- CSV: analysis/validation tables only; not a substitute for a map.

Every export dialog states what is included, theme/background, privacy implications, and unsupported/lossy fields. Exports MUST be deterministic for unchanged input aside from explicit generated timestamps.

### 11.4 Data migrations and backup

- Schema migrations are sequential, idempotent, and fixture-tested from every supported historical version.
- Before an irreversible local migration, create a recoverable backup and tell the user.
- Keep at least one release of read compatibility for the preceding schema when practical.
- Provide “Export all data” and “Delete local data” controls with clear scope and confirmation.

---

## 12. Architecture

### 12.1 Module boundaries

Use equivalent directories/modules in the current stack:

```text
app/                 shell, routes, theme, composition root
domain/              canonical types, commands, invariants, migrations
editor/              editor orchestration, commands, selection, viewport
renderer/            canvas/SVG rendering, hit testing, export rendering
parser/              OWM lexer/parser/serializer and diagnostics
validation/          pure structural and advisory rules
analysis/            climate, doctrine, gameplay, evidence
simulation/          scenarios, deltas, rules, comparisons, decisions
learning/            content schemas, challenges, progress, rubrics
persistence/         repositories, drafts, versions, backup/import transactions
components/          shared accessible UI primitives
styles/              exact theme tokens, shared recipes, feature layouts
test-fixtures/       canonical maps, OWM samples, migrations, visual cases
```

Dependency direction:

```text
UI/routes ──> application services ──> domain
renderer ────────────────────────────> domain read models
parser/persistence <── adapters ─────> domain DTOs
validation/simulation ───────────────> domain
domain ──X──> UI, renderer, browser storage, network
```

### 12.2 State separation

- **Document state:** canonical map, scenario, history revision.
- **Editor state:** selection, tool, viewport, open inspector tab, draft source.
- **UI state:** dialog/menu/toast/theme.
- **Derived state:** validation, collisions, stage labels, scenario deltas; never persist unless needed for audit.
- **Content state:** versioned catalogs and challenges.

Use commands for document mutations. Each command validates input, produces the next document state, and supplies an inverse or transaction snapshot for undo.

### 12.3 Persistence contract

Define repositories rather than calling browser storage from components:

```ts
interface MapRepository {
  list(): Promise<MapSummary[]>;
  load(id: Id): Promise<WardleyMap | null>;
  saveDraft(map: WardleyMap): Promise<void>;
  commitVersion(map: WardleyMap, note?: string): Promise<MapVersion>;
  listVersions(id: Id): Promise<MapVersion[]>;
}
```

Initial persistence MAY remain local/offline-first. If a backend exists, retain optimistic concurrency through revision/ETag checks and never overwrite a newer version silently.

### 12.4 Renderer decision

Choose SVG, Canvas, or a hybrid after the current-state audit:

- Prefer SVG for accessible labels, crisp export, DOM hit targets, and moderate map sizes.
- Prefer Canvas only if measured map size/performance requires it; pair it with an accessible DOM outline.
- A hybrid may render the map in Canvas while keeping selection handles/labels in SVG/DOM, but only if coordinate and export consistency are tested.
- Isolate the rendering engine behind a scene/read-model interface so domain data is not coupled to D3, React, Konva, or another library.

### 12.5 Security and privacy

- Sanitize SVG, URLs, labels, Markdown, and any imported rich text.
- Block `javascript:` and unsafe data URLs.
- Add size/depth/count limits to imports and parsers; fail with a helpful message.
- Do not fetch external URLs during import or export without explicit action.
- Avoid sending map contents or evidence to analytics or AI services by default.
- If AI-assisted suggestions are later added, require opt-in, disclose transmitted content, label outputs, and keep them outside trusted evidence until confirmed.

### 12.6 Performance budgets

Measure on the project's supported baseline device/browser:

- editor route interactive in <= 2.5 seconds on a warm local load;
- pan/zoom/drag sustains a median 55+ FPS on the representative 200-component fixture;
- pointer-to-preview latency <= 50ms at p95 for that fixture;
- cheap validation update <= 100ms at p95; full validation <= 500ms for 200 components/400 dependencies;
- undo/redo commit <= 100ms at p95;
- no unbounded history growth; cap or compact undo entries while retaining saved versions;
- source parsing runs off the main thread if measured input produces >100ms blocking.

Budgets are release gates after the audit records reproducible measurement conditions.

---

## 13. Implementation priorities and work packages

Agents MUST respect dependency order. Parallelize only packages whose prerequisites are complete.

### Phase 0 — Preserve and measure (P0)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `AUD-01` | Current-state and data audit | `docs/current-state-audit.md`, baseline fixtures | Reviewed; existing-data path known |
| `AUD-02` | Behavioral baseline | Smoke/E2E coverage for current create/open/edit/save/export | Green before refactor |
| `ARC-01` | Canonical schema and ADR | types, JSON Schema, invariants, extension strategy | Fixture validates; ADR approved |
| `ARC-02` | Migration/backup harness | sequential migrations, backups, rollback test | Old fixtures load without loss |
| `DES-01` | Exact theme foundation | tokens, reset, light/dark/system theme | Token snapshot and visual check pass |
| `DES-02` | Shared primitives | buttons, fields, cards, tabs, callouts, dialog, table, toast | Accessibility/component tests pass |

### Phase 1 — Useful map editor (P0)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `EDT-01` | Editor shell/layout | responsive toolbar/canvas/inspector | 420/340/below-canvas layouts pass |
| `EDT-02` | Canvas transform | stable coordinates, pan, zoom, fit | No coordinate drift test |
| `EDT-03` | Anchor/component CRUD | visual + inspector editing | Keyboard/pointer parity |
| `EDT-04` | Dependencies/flows | create, label, select, delete | Direction explained and tested |
| `EDT-05` | Selection/commands | multi-select, nudge, duplicate, undo/redo | Command property tests pass |
| `EDT-06` | Evolution axis | stages, coordinate editing, proposed movement | Labels and normalized coordinates persist |
| `EDT-07` | Draft/version recovery | autosave, recovery, immutable commit | Crash/reload E2E passes |
| `VAL-01` | Structural validation | incremental rules and issue navigation | All corrupt fixtures caught |

**Phase 1 release slice:** a user can create, connect, position, validate, save, reopen, and recover a useful map in both themes and without a mouse.

### Phase 2 — Interoperability and full notation (P1)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `IO-01` | OWM parser/serializer | P0 construct support and diagnostics | Golden/round-trip suite passes |
| `IO-02` | Source/Split editor | synchronized transaction model | Invalid source never destroys map |
| `IO-03` | Import preview | atomic preview, warnings, loss report | Cancel/error leaves data unchanged |
| `IO-04` | Exports | native JSON, OWM, SVG, PNG | Determinism and visual tests pass |
| `EDT-08` | Full notation | pipeline, evolve, inertia, sourcing, notes, annotations | Inspector and serialization tests pass |
| `EDT-09` | Submaps/markets/forces | P1/P2 constructs by support table | Safe URL/import tests pass |
| `VAL-02` | Modeling guidance | warnings, recommendations, suppression | Never blocks on subjective advice |

### Phase 3 — Learning experience (P1)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `LRN-01` | Versioned content engine | schema, loader, CI validation | Invalid content fails CI |
| `LRN-02` | Learning-path UI | progress, lesson, example, reference | Progress survives copy edits |
| `LRN-03` | Challenge runner | starter maps, validators, hints, rubric | Alternative valid solutions accepted |
| `LRN-04` | First-map onboarding | minimum viable map journey | Usability acceptance scenario passes |
| `LRN-05` | Accessible feedback | live summaries, issue focus, reflection | Screen-reader/keyboard QA passes |

### Phase 4 — Strategic analysis (P1)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `ANL-01` | Evidence/provenance | evidence records and stale-review UI | Export retains provenance |
| `ANL-02` | Climate catalog/overlay | versioned patterns and assessments | Definition/assertion distinction clear |
| `ANL-03` | Doctrine assessment | principles, observable signals, table/chart | No opaque doctrine score |
| `ANL-04` | Gameplay hypotheses | catalog, filters, hypothesis form, safeguards | Risks/ethics/review required |
| `ANL-05` | Analysis export | attributable summary and tables | Catalog/license metadata included |

### Phase 5 — Scenario comparison (P2)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `SIM-01` | Baseline/delta engine | immutable baseline and typed changes | Baseline cannot be mutated |
| `SIM-02` | Comparison UI | overlay, side-by-side, delta list | Changes readable without color |
| `SIM-03` | Inspectable rules | versioned findings with inputs/limits | Rule explainability test passes |
| `SIM-04` | Consequences/signals | confidence, evidence, stop conditions | No prediction language violations |
| `SIM-05` | Decision records | decision/review workflow and packet export | Historical record immutable |

### Phase 6 — Hardening and optional expansion (P2/P3)

| ID | Work | Deliverable | Gate |
| --- | --- | --- | --- |
| `QA-01` | Cross-browser/device matrix | tested support statement | Critical flows green |
| `QA-02` | Performance | profiling and budget fixes | Section 12.6 budgets met |
| `QA-03` | Accessibility audit | automated + manual report | No critical/serious core-flow issue |
| `QA-04` | Content/license review | verified sources/attribution | Release notices complete |
| `COL-01` | Collaboration readiness | presence/comment/version design ADR | No implementation required for v1 |
| `TEL-01` | Privacy-safe telemetry | opt-in or aggregate event plan | No map content captured |

---

## 14. Test strategy

### 14.1 Unit and property tests

- coordinate clamps, transformations, stage lookup, and viewport round trips;
- domain invariants and every command/inverse pair;
- add/remove/rename behavior with references;
- validation rule positives, negatives, and stable IDs;
- scenario delta application and baseline immutability;
- schema migrations, including repeated migration idempotence;
- content schema validation and challenge validators;
- parser tokenization, syntax diagnostics, escaping, size/depth limits;
- serializer determinism and parse/serialize semantic round trips;
- theme token resolver and chart-token refresh.

Property tests SHOULD generate valid maps and assert:

- serialize(parse(serialize(map))) is semantically stable for the supported OWM subset;
- command followed by inverse restores the prior document;
- viewport-to-domain-to-viewport transforms remain within documented numeric tolerance;
- migration preserves stable IDs and referential integrity.

### 14.2 Integration tests

- canvas selection updates inspector and outline, and vice versa;
- visual edits update source without losing supported metadata;
- source transaction updates visual map only after valid parse;
- save/reload/recover/version/restore workflows;
- import preview and atomic commit/cancel;
- full validation navigates to the affected element;
- theme changes update canvas, controls, charts, and exports appropriately;
- scenario change updates delta list, overlay, consequences, and export;
- challenge edits trigger scoped feedback and persisted progress.

### 14.3 End-to-end scenarios

1. New learner completes the minimum viable map challenge by keyboard.
2. Practitioner imports a representative OWM map, edits visually, fixes a source error, and exports semantically equivalent OWM and SVG.
3. User reloads after an interrupted edit and recovers a draft without overwriting the last version.
4. Strategist assesses one climate pattern, one doctrine principle, and one gameplay hypothesis with evidence.
5. Strategist branches two scenarios, compares deltas, records a decision, and exports a decision packet.
6. User switches light/dark/system themes at desktop and `820px` layouts without losing editor state.
7. User imports malicious/oversized content; the app rejects or sanitizes it without executing content or losing the current map.

### 14.4 Visual regression matrix

Capture representative states in light and dark at widths 1440, 1100, 900, 820, and the smallest supported viewport:

- overview, maps collection, editor empty map, editor dense map;
- hover, selection, focus, disabled, loading, error, and save status;
- inspector tabs, validation list, import dialog, source error;
- learning lesson/challenge feedback;
- climate/doctrine/gameplay screens;
- scenario configuration and comparison;
- dialog, menu, toast, chart plus table.

Token snapshots MUST fail when binding values change unintentionally. Intentional changes require a design ADR and explicit approval.

### 14.5 Manual accessibility checks

- complete core journeys with keyboard only;
- VoiceOver on macOS/Safari and at least one additional supported screen reader/browser pairing;
- focus order and restoration for toolbar, inspector, menus, and dialogs;
- 200% zoom and narrow reflow;
- reduced-motion mode;
- forced-colors/high-contrast behavior where supported;
- touch target review on the smallest supported viewport;
- canvas has an equivalent outline/list path and understandable announcements.

---

## 15. Acceptance criteria

### 15.1 Design-system acceptance

- Given either theme, when any core route renders, then every surface, text role, border, primary/accent, semantic state, shadow, chart, and canvas default resolves through the exact tokens in section 4.
- Given desktop width, the shell is 232px expanded/64px collapsed and the editor inspector is 420px.
- Given <=1100px, the inspector is 340px; given <=820px, navigation becomes the specified horizontal row and the inspector moves below the map.
- Given keyboard focus, every interactive element has a visible focus ring using `--focus-ring`.
- Given reduced-motion preference, nonessential animations are removed without hiding state changes.

### 15.2 Editor acceptance

- Given an empty map, a user can add an anchor, need/context, components, dependencies, and positions; save; reload; and see the same semantic document.
- Given a component drag at any zoom, only its normalized domain coordinates change, and resize/theme changes do not move it.
- Given a dependency, the UI exposes “A depends on B” in text and allows keyboard editing.
- Given an invalid deletion with dependents, the app previews all affected references and does not delete until confirmed.
- Given a sequence of supported edits, undo then redo restores exact document state.
- Given a crash/reload, the last recoverable draft and last committed version remain distinguishable.

### 15.3 Evolution and analysis acceptance

- The default axis reads Genesis, Custom built, Product (+rental), Commodity (+utility) from left to right.
- A user can inspect/edit exact `0..1` visibility/evolution values without being told they are objective measurements or elapsed time.
- Climate, doctrine, and gameplay use separate overlays, catalogs, states, and explanations.
- A map-specific assessment cannot be saved without rationale; gameplay also requires intended effect, risk, and review signals.
- Generated or suggested analysis is visibly unconfirmed until a person accepts/edits it.

### 15.4 Scenario acceptance

- Given a committed baseline, creating and editing a scenario does not mutate the baseline.
- Comparing scenarios identifies added, removed, moved, and relationship changes with text/icons as well as color.
- Every derived finding exposes its rule, input, explanation, and limitation.
- The UI and exports call results assumptions/consequences/scenarios, not forecasts or guaranteed outcomes.
- A decision record retains rejected alternatives, signals, review date, and baseline revision.

### 15.5 Learning acceptance

- A first-time user can complete the first-map journey without outside documentation.
- Challenge feedback names the observed issue, explains why it matters, and suggests a next action.
- At least one alternative but structurally valid map passes each qualitative challenge fixture.
- Hints reveal progressively and do not disclose the worked solution immediately.
- Content edits that preserve concept IDs do not erase learner progress.

### 15.6 Import/export acceptance

- Import of a supported OWM fixture produces the expected canonical model and a matching rendered map.
- Export and reimport preserve every supported construct semantically.
- Unsupported or app-only content appears in a loss report before a lossy export.
- Invalid input reports actionable line/column diagnostics and leaves the current document unchanged.
- SVG/PNG/PDF exports remain legible and correctly themed; imported text/URLs cannot execute scripts.
- Native JSON migrates from every supported historical fixture without broken references.

### 15.7 Quality acceptance

- All unit, property, integration, E2E, schema, migration, and visual-regression suites pass.
- Core flows have no known critical or serious accessibility defects.
- The representative 200-component/400-dependency map meets the documented performance budgets.
- No console errors, unhandled promise rejections, corrupted drafts, or silent export loss occur in the release matrix.
- Source/license attribution for bundled Wardley reference content is present and reviewed.

---

## 16. Definition of done

A work package is done only when:

- implementation, migration, loading, empty, error, and recovery states are complete;
- tests cover normal, edge, and failure cases;
- light/dark and relevant breakpoints have been visually checked;
- keyboard and screen-reader implications have been checked;
- user-facing copy follows the direct instructional voice;
- persistence/import/export compatibility has been considered;
- analytics, if any, contain no map content or sensitive evidence;
- documentation and fixtures are updated;
- no new unexplained token, one-off color, or layout pattern bypasses section 4;
- the assigned acceptance criteria have evidence;
- remaining risk is documented with an owner and follow-up ID.

---

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing maps become unreadable | Data loss and loss of trust | Audit, fixtures, migration backup, versioned schema, rollback |
| Visual and source modes diverge | Silent semantic loss | One canonical model, transactions, golden round-trip tests, explicit loss reports |
| Diagram library leaks into domain | Rewrite and export difficulty | Renderer interface and independent canonical model |
| Strategy features imply certainty | Poor decisions | Explicit assumptions/confidence, inspectable rules, no composite strategy score |
| Subjective validation blocks work | Frustration and false authority | Errors only for integrity/safety; acknowledgeable warnings/recommendations |
| Dense editor harms accessibility | Excludes keyboard/AT users | Synchronized outline, numeric editor, focus management, manual AT tests |
| Large maps become unusable | Lag and interaction errors | Representative fixtures, viewport culling if measured, worker parsing, budgets |
| Imported content executes code | Security/privacy issue | Sanitization, protocol allowlist, atomic parsing, limits, no external fetch |
| Reference content violates licensing | Release/legal risk | Versioned provenance, attribution, review before bundling/export |
| Sensitive gameplays are normalized | Ethical/legal harm | Caution context, risk/ethics fields, human review, no automatic application |

---

## 18. Decision log required before Phase 1 completion

Create ADRs for:

1. canonical coordinate orientation and numeric tolerance;
2. renderer choice and accessible equivalent;
3. canonical schema, extension payload, and migration support window;
4. OWM parser implementation/reuse and license;
5. local versus server persistence and conflict handling;
6. catalog/content source, version, attribution, and license;
7. supported browser/device and smallest viewport;
8. map-size performance target and measurement device;
9. native export file extension/MIME behavior;
10. whether PDF export is client-side or service-side.

None of these decisions may weaken the exact visual contract, user-data preservation, accessibility equivalent, or explicit-loss requirements without stakeholder approval.

---

## 19. Reference terminology and sources

Use these references to verify domain content and interoperability; do not copy large bodies of content without checking the applicable license and attribution requirements.

- [Learn Wardley Mapping glossary](https://learnwardleymapping.com/glossary/) — context, component, anchor, need, movement, climate, doctrine, strategy, interface, and flow terminology.
- [Learn Wardley Mapping climate reference](https://learnwardleymapping.com/climate/) — climatic pattern categories and evolution-characteristic framing.
- [OnlineWardleyMaps DSL reference](https://docs.onlinewardleymaps.com/docs/dsl-reference/) — components, normalized visibility/maturity coordinates, dependencies, flows, evolution, pipelines, notes, annotations, submaps, and forces.
- [OnlineWardleyMaps quick reference](https://docs.onlinewardleymaps.com/docs/dsl-overview/) — maps-as-code syntax and ecosystem interoperability.
- [Wardley Maps gameplay glossary](https://www.wardleymaps.com/glossary/gameplay) — gameplay purpose and catalog categories.
- [Simon Wardley's book index at Learn Wardley Mapping](https://archive.learnwardleymapping.com/book.html) — mapping, doctrine, and gameplay context; attributed there under CC BY-SA 4.0.

The supplied `STYLE(1).md` remains the binding source for all visual values and layout patterns in this plan.

