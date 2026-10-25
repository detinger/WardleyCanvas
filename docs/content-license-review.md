# Content and Licence Review

**Work package:** `QA-04`  
**Review date:** 2026-10-25

## Result

The bundled climate, doctrine, and gameplay catalogs now carry structured source, licence, modification, and review-date metadata on every exported entry. The in-product reference page identifies the source, links the licence, says that the text was adapted and rewritten, and disclaims endorsement.

The project owner confirmed that the learning modules and six fictional IT case studies received human review. They are marked `reviewed` with the review date and reviewer attribution in their validated metadata.

## Reviewed sources

| Material | Use | Source and treatment |
| --- | --- | --- |
| Wardley Maps by Simon Wardley | Concepts, climate, doctrine, and gameplay reference material | Adapted and rewritten; attributed to Simon Wardley; CC BY-SA 4.0; no endorsement implied |
| Learn Wardley Mapping glossary | Terminology cross-check | Reference only; no glossary copied wholesale |
| OnlineWardleyMaps DSL reference | Syntax and interoperability behavior | Compatibility reference; no OnlineWardleyMaps implementation code is copied |
| Repository-authored learning modules and fictional IT case studies | Lessons, examples, challenges, and rubrics | Shared as CC BY-SA 4.0; human-reviewed with versioned metadata |

Primary links:

- Wardley Maps book: <https://archive.learnwardleymapping.com/book.html>
- Wardley Mapping glossary: <https://learnwardleymapping.com/glossary/>
- OnlineWardleyMaps DSL: <https://docs.onlinewardleymaps.com/docs/dsl-reference/>
- CC BY-SA 4.0: <https://creativecommons.org/licenses/by-sa/4.0/>

## CC BY-SA checklist

- **Credit:** Simon Wardley is named in the reference UI, catalog records, exports, learning metadata, and the repository notice.
- **Licence link:** the canonical CC BY-SA 4.0 URL is present in the UI, exports, and notice.
- **Changes indicated:** the UI and catalog metadata describe the material as adapted and rewritten.
- **Share alike:** the adapted catalog and repository-authored learning content are identified as CC BY-SA 4.0.
- **No endorsement:** the product explicitly says it is not affiliated with or endorsed by Simon Wardley.

## Software review

Direct runtime and development dependencies were checked against their installed package manifests. Their declared licences are recorded in `THIRD_PARTY_NOTICES.md`; the lockfile remains the authoritative version inventory. No third-party parser or renderer source was copied into this repository.

Inter and JetBrains Mono are loaded through Google Fonts and are covered by the SIL Open Font License 1.1. Their upstream projects and the runtime-request caveat are recorded in the notice.

## Review record

- **Status:** Reviewed
- **Reviewer attribution:** Project owner
- **Review date:** 2026-10-25

CI rejects reviewed content without reviewer attribution, and the content-integrity suite verifies the review state across all modules and case studies.
