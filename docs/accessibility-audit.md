# Accessibility Audit

**Work package:** `QA-03`  
**Audit date:** 2026-10-25  
**Target:** WCAG 2.1 AA; no known critical or serious defect in a core flow

## Result

No critical or serious accessibility violation is known in the tested core flows. The automated axe gate passed in light and dark themes, and the editor has a DOM outline that provides a non-canvas route to its elements and dependencies.

This result is a release gate, not a claim of full WCAG conformance. The assistive-technology sessions listed under “Release follow-ups” still require people using the named platform combinations.

## Automated evidence

Command:

```sh
npx playwright test e2e/accessibility.spec.ts
```

Result on 2026-10-25: **6 passed** in Chromium.

The axe scan uses the WCAG 2.0/2.1 A and AA rule sets and fails on serious or critical findings. It covers these states in both themes:

- overview, maps collection, editor, and editor analysis;
- learning path, lesson, and challenge runner;
- reference, challenges index, scenarios index, settings, and help.

The same suite verifies:

- the map outline mirrors the SVG and can select an element;
- dependency direction is available as text in the outline;
- the live region announces selection and deletion;
- a deletion with dependants names the affected relationship and asks for confirmation;
- the keyboard shortcut dialog opens with `?` and closes with Escape;
- keyboard-focused SVG elements receive a visible outline.

Related end-to-end coverage verifies keyboard-only first-map completion, keyboard dependency creation, focus movement to challenge feedback, dialog focus trapping and restoration, narrow layouts at 820/600/375 px, and theme changes that preserve editor state.

## Implementation review

| Area | Evidence | Result |
| --- | --- | --- |
| Page navigation | Skip link and semantic page landmarks | Pass |
| Map alternative | `MapOutline` exposes elements and relationships as lists and buttons | Pass |
| Canvas operation | Focusable SVG controls, keyboard selection, nudge, duplicate, connect, delete, zoom, and fit | Pass |
| Status changes | Polite editor live region and focused challenge results | Pass |
| Dialogs | Labelled dialog, Escape close, focus trap, opener focus restoration | Pass |
| Focus visibility | Global tokenized focus ring plus SVG and forced-colors fallbacks | Pass |
| Motion | `prefers-reduced-motion` removes nonessential animation and smooth scrolling | Pass by stylesheet inspection |
| Reflow | Inspector moves below the map at 820 px; collection and scenario layouts stack | Pass in automated layout checks |
| Colour | Axe checks both themes; selection and scenario deltas also use text/icons | Pass for tested states |

## Release follow-ups

These checks cannot be represented faithfully by DOM automation and must be recorded before claiming broad assistive-technology support:

1. VoiceOver with the current Safari release on macOS: create, connect, inspect, save, recover, and export a map.
2. NVDA with the current Firefox or Chrome release on Windows: repeat the same core flow.
3. Browser zoom at 200% with keyboard-only operation and no loss of content.
4. Windows forced-colors mode and a physical touch-target review at the smallest supported device.

Any critical or serious issue found in those sessions blocks release. Moderate and minor findings require a tracked owner and target release.

