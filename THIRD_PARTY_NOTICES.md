# Third-Party Notices

Reviewed 2026-10-25. The exact installed versions are recorded in `package-lock.json`; upstream licence and copyright files in each package remain authoritative.

## Wardley reference and learning content

Catalog definitions and learning material are adapted and rewritten from **Wardley Maps** by Simon Wardley: <https://archive.learnwardleymapping.com/book.html>.

The source material is licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). The adaptations in this project are shared under the same licence. Changes were made for concise in-product teaching, assessment prompts, examples, risk notes, and accessible presentation. Wardley Maps Studio is not affiliated with or endorsed by Simon Wardley.

OnlineWardleyMaps documentation (<https://docs.onlinewardleymaps.com/docs/dsl-reference/>) is used as an interoperability reference. This repository contains an independent parser and does not copy OnlineWardleyMaps implementation code.

## Fonts

| Font | Copyright/source | Licence |
| --- | --- | --- |
| Inter | Rasmus Andersson and Inter contributors — <https://github.com/rsms/inter> | SIL Open Font License 1.1 |
| JetBrains Mono | The JetBrains Mono Project Authors — <https://github.com/JetBrains/JetBrainsMono> | SIL Open Font License 1.1 |

The application currently requests these fonts from Google Fonts at runtime and falls back to system fonts if they are unavailable. A deployment with a strict no-third-party-request policy should self-host the font files and retain their OFL notices.

## Direct runtime dependencies

| Packages | Declared licence |
| --- | --- |
| `@radix-ui/react-toast`, `next`, `react`, `react-dom` | MIT |
| `lucide-react` | ISC |

## Direct development dependencies

| Packages | Declared licence |
| --- | --- |
| `@axe-core/playwright` | MPL-2.0 |
| `@playwright/test`, `typescript` | Apache-2.0 |
| `@types/node`, `@types/react`, `@types/react-dom`, `vitest` | MIT |

SPDX licence texts are available at <https://spdx.org/licenses/>. Redistribution must retain the copyright and licence notices supplied by each upstream package and font.
