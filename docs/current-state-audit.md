# Current-State Audit

**AUD-01 gate deliverable — required before schema replacement, editor rewrite, or persistence migration.**

---

## Framework and Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 15.5.9 |
| Language | TypeScript | ^5 |
| Rendering | HTML/CSS absolute positioning + inline SVG for links | — |
| Drag-and-drop | @dnd-kit/core | ^6.1.0 |
| State management | React useState (component-local) | ^19.2.1 |
| Persistence | localStorage (`wardleyMaps` key) | browser |
| UI primitives | shadcn/ui (Radix UI + Tailwind CSS) | Radix ^2 |
| Styling | Tailwind CSS v3 | ^3.4.1 |
| Fonts | Inter (Google Fonts), Space Grotesk (Google Fonts) | — |
| AI integration | Genkit + Google GenAI (unused in main flow) | ^1.28.0 |
| Test runner | None | — |
| Build | Next.js Turbopack (`next dev --turbopack`) | — |

No test runner is configured. AUD-02 (behavioral baseline) requires adding one before any refactor gate.

---

## Current Routes and Principal Workflows

Single route: `/` (`src/app/page.tsx`)

### Workflows

1. **New map** — clears the canvas to an empty map named "New Map".
2. **Load template** — `TemplatesGallery` dialog replaces current map with a static template.
3. **Save map** — `SaveMapDialog` prompts for a name; `useWardleyMaps.saveMap` writes to localStorage.
4. **Load map** — `LoadMapDialog` lists all localStorage maps; selecting one loads it into state.
5. **Add component** — drag from the `EditorSidebar` toolbox onto the canvas drop zone.
6. **Move component** — drag an existing node with @dnd-kit.
7. **Connect components** — click one node (selects it), then click another (creates a link).
8. **Rename component** — double-click a node label to edit in place.
9. **Delete map** — available in the Load dialog only.

No undo/redo, no validation, no analysis, no keyboard-only flows, no dark-theme toggle.

---

## Current Map Data Model

Stored in `src/lib/types.ts`:

```ts
type MapNode = {
  id: string;
  name: string;
  x: number;  // 0-100 percentage from left
  y: number;  // 0-100 percentage from top
  stage: 'genesis' | 'custom' | 'product' | 'commodity';
};

type MapLink = {
  from: string; // node id
  to: string;   // node id
};

type WardleyMap = {
  id?: string;
  name: string;
  nodes: MapNode[];
  links: MapLink[];
};
```

localStorage key: `wardleyMaps` — JSON array of `WardleyMap[]`.

**Migration needed:**
- `x` (0–100 %) → `evolution` (0–1 normalized) = `x / 100`
- `y` (0–100 %, top=0) → `visibility` (0–1 normalized, top=1) = `1 - y / 100`
- `stage` (4-value enum) → derived from `evolution` range; drop after migration
- `links[].from/to` → `dependencies[].fromId/toId` with new `id` field
- `name` → `title`
- No version/revision field — set `revision: 1`, `schemaVersion: 1`

---

## Current Editor Capabilities and Gaps

### Capabilities
- Drag components to the canvas.
- Click-to-select + click-to-connect creates a dependency line.
- Double-click to rename in place.
- Save/load to localStorage.
- 8 static templates.
- Concepts guide (modal).

### Gaps (required for Phase 1)
- No undo/redo.
- No autosave/draft recovery.
- No structural validation.
- No dark theme.
- No keyboard-only creation or editing.
- No delete component or delete dependency.
- No version history.
- No pan/zoom on canvas.
- No inspector panel.
- No normalized coordinate system.
- No named anchor element type.

---

## Migrations Needed to Preserve Existing Maps

All data in `localStorage['wardleyMaps']` follows the `WardleyMap[]` (old) schema.

Migration strategy (implemented in `src/domain/migration.ts`):
1. Read old `wardleyMaps` key on first load of the new app.
2. Convert each map through `migrateFromLegacy(old) → WardleyMap` (canonical).
3. Write to new key `wardleyStudio.maps`.
4. Leave `wardleyMaps` in place as a recoverable backup for one release.
5. Provide "Export all data" to let users save a copy before clearing the old key.

---

## Accessibility, Performance, and Responsive Layout

### Accessibility findings
- Canvas has no accessible name or ARIA role.
- No keyboard shortcut to add/move/delete components.
- No live region for state changes.
- Labels use `backdrop-blur-sm` which may fail WCAG 1.4.3 contrast in some themes.
- No visible focus styles on canvas nodes.

### Performance
- Canvas re-renders every `ResizeObserver` tick.
- SVG link positions are re-computed on every render via `getBoundingClientRect`.
- No virtualization (acceptable for current map sizes).

### Responsive layout
- Single breakpoint: `md:p-8`; no tablet/mobile adaptation beyond that.
- Canvas breaks at small viewports: SVG links do not move with the resize.

---

## Style Variable Mapping to Section 4 Tokens

| Current ShadCN variable | Current value | Plan token | Plan value (light) |
|---|---|---|---|
| `--background` | `213 27% 94%` | `--bg` | `#f4f6f9` |
| `--foreground` | `222 47% 11%` | `--text` | `#17202c` |
| `--card` | `0 0% 100%` | `--bg-elevated` | `#ffffff` |
| `--primary` | `211 80% 41%` | `--primary` | `#1f5f8b` |
| `--accent` | `180 60% 60%` (teal) | `--accent` | `#d9822b` (orange) ← **breaking change** |
| `--border` | `214.3 31.8% 80%` | `--border` | `#d6dce5` |
| `--destructive` | `0 84.2% 60.2%` | `--error` | `#c0392b` |
| `--radius` | `0.5rem` (8px) | `--radius` | `10px` ← **breaking change** |

The accent color change (teal → orange) is intentional per section 4.1. All existing components using `accent` will shift to orange.

---

## Third-party Packages Relevant to Map Parsing / Rendering / Export

| Package | Role | License |
|---|---|---|
| @dnd-kit/core | Drag-and-drop (canvas) | MIT |
| lucide-react | Icons | ISC |
| recharts | Charts (unused in map flow) | MIT |
| firebase | Backend (not wired to maps) | Apache-2.0 |
| next | Framework + Image optimization | MIT |

No OWM parser or SVG/PDF export library is present. Phase 2 (IO-01) will need one.

---

## Baseline Test Results

_Original audit:_ no test suite was configured.

_Update 2026-10-25 (AUD-02 complete):_

| Suite | Command | Scope |
| --- | --- | --- |
| Vitest | `npm test` | domain commands/editing/migration/validation, editor reducer, OWM parser + round trip, import preview/commit, SVG export, viewport geometry, persistence, scenarios |
| Playwright | `npm run test:e2e` | Phase 1 slice (create, connect, autosave, save/reopen, draft recovery, keyboard), drag/nudge/duplicate, keyboard dependencies, responsive 1440/1100/820/600/375, themes, import preview/cancel, hostile input, deterministic SVG/JSON/PNG export |

The E2E suite starts its own dev server on port 9003 with `NEXT_DIST_DIR=.next-e2e`, so it can run beside `npm run dev`.
Fixtures live in `tests/fixtures/` (`legacy-ecommerce.json`, `tea-shop.owm`).

---

## Representative Map Fixture

One template serves as the canonical baseline fixture (`template-ecommerce` in `src/lib/templates.ts`):

```json
{
  "id": "template-ecommerce",
  "name": "E-commerce Platform",
  "nodes": [
    {"id":"user","name":"User","x":5,"y":10,"stage":"genesis"},
    {"id":"website","name":"Website","x":35,"y":25,"stage":"custom"},
    {"id":"product_db","name":"Product DB","x":60,"y":45,"stage":"product"},
    {"id":"payments","name":"Payments","x":80,"y":48,"stage":"commodity"},
    {"id":"platform","name":"Platform","x":65,"y":70,"stage":"product"},
    {"id":"compute","name":"Compute","x":85,"y":90,"stage":"commodity"}
  ],
  "links": [
    {"from":"user","to":"website"},
    {"from":"website","to":"product_db"},
    {"from":"website","to":"payments"},
    {"from":"website","to":"platform"},
    {"from":"platform","to":"compute"},
    {"from":"product_db","to":"compute"}
  ]
}
```

Migrated canonical form (schemaVersion 1):
- `user` node → element with `kind: 'anchor'`, `evolution: 0.05`, `visibility: 0.90`
- `website` node → element with `kind: 'component'`, `evolution: 0.35`, `visibility: 0.75`
- Each link → dependency with generated ID, `kind: 'dependency'`
