# Browser and Device Support

**Work package:** `QA-01`  
**Statement date:** 2026-10-25

## Current tested support

The automated release matrix supports current Chromium desktop behavior. Playwright runs the complete suite using its bundled Chromium at 1440 × 900, with explicit responsive checks at 1100, 820, 600, and 375 px.

The application requires JavaScript, SVG, `localStorage`, `structuredClone`, `ResizeObserver`, and modern download APIs. Private-browsing or storage policies that disable `localStorage` prevent durable map storage; users should export a backup before clearing browser data.

| Environment | Evidence | Release status |
| --- | --- | --- |
| Chromium desktop | Full Playwright suite; axe in both themes | Supported |
| Chromium responsive layouts | Automated at 1440/1100/820/600/375 px | Supported |
| Chrome/Edge stable | Same engine; vendor smoke run still recommended | Provisional |
| Safari stable on macOS/iOS | Manual functional and VoiceOver run required | Not yet release-qualified |
| Firefox stable | Manual functional and NVDA/keyboard run required | Not yet release-qualified |

“Provisional” is deliberately not presented as tested support. A release that promises Safari or Firefox must attach its browser/OS version and the result of the core-flow matrix below.

## Core-flow matrix

Each supported browser must pass:

1. create a map, add and move elements, connect a dependency, undo, and redo;
2. commit, reload, distinguish a draft from a committed version, and restore history as a new version;
3. import OWM, make a source error without losing the visual map, and export OWM/SVG/PNG;
4. complete the first learning challenge by keyboard;
5. add one climate, doctrine, and gameplay assessment with evidence;
6. create and compare two scenarios, record a decision, and export its packet;
7. switch light/dark/system themes at desktop and 820 px;
8. reject hostile or oversized input without changing the current map;
9. finish with no console error or unhandled rejection.

The smallest layout under automated test is 375 CSS px. No claim is made below that width.

