# ADR 0002: Privacy-Safe Telemetry

- **Status:** Accepted
- **Date:** 2026-10-25
- **Work package:** `TEL-01`

## Context

Maps can contain confidential strategy, supplier names, evidence, risks, URLs, decisions, and personal names. Conventional analytics that capture page URLs, DOM text, session replay, console payloads, or form values would expose this content. The current application has no product telemetry.

## Decision

Version 1 keeps telemetry disabled. A future deployment may enable aggregate product telemetry only after explicit consent and only through a typed allowlist reviewed under this ADR.

The allowlist may contain:

| Event | Allowed fields |
| --- | --- |
| `route_view` | route template such as `/maps/:mapId`, never the concrete URL |
| `editor_command` | command kind and coarse element-count bucket |
| `import_result` | format, success/failure, stable diagnostic code, coarse size bucket |
| `export_result` | format and success/failure |
| `challenge_check` | stable module ID and aggregate pass/fail count |
| `scenario_compare` | coarse scenario-count and change-count buckets |

The following are forbidden in telemetry, logs, crash reports, and replay tools:

- map, scenario, element, dependency, evidence, or decision content;
- titles, labels, rationale, notes, source text, URLs, filenames, or exported payloads;
- stable map IDs, user-entered IDs, full route URLs, local-storage values, or DOM text;
- pointer trails, screenshots, session replay, keystrokes, clipboard data, or form values;
- exact coordinates or timestamps when a coarse bucket is sufficient.

Consent must be off by default, reversible in Settings, and separate from necessary local persistence. Before consent, no telemetry library or endpoint request may load. Withdrawal stops new events; the UI links to deletion and retention instructions.

If enabled, the client uses a random, rotating installation identifier that cannot be joined to map data. Events are aggregated, raw events are retained for at most 30 days, access is limited, and IP addresses are not retained beyond transport security needs. A deployment must publish its processor, region, retention, and deletion policy before collection starts.

Non-telemetry network dependencies require a separate privacy review. The current Google Fonts stylesheet request can disclose ordinary request metadata to that provider; a deployment that promises no third-party runtime requests must self-host the licensed fonts first.

## Consequences

- Product questions that require content inspection cannot be answered with telemetry.
- Route templates and stable diagnostic codes must be produced locally before an event is built.
- Third-party session replay and automatic DOM/error breadcrumbs are prohibited.
- The absence of an analytics client is the correct version-1 implementation.

## Tests required before enabling telemetry

1. A network test proves zero analytics requests before consent.
2. Schema tests reject unknown event names and fields.
3. Fixtures containing sentinel secrets prove that serialized events, logs, and error payloads never contain those strings.
4. Revoking consent stops events immediately and persists the preference locally.
5. Concrete `/maps/<id>` and `/scenarios/<id>` URLs are reduced to route templates.
6. Data export/deletion documentation names the telemetry processor and explains that local map deletion and remote analytics deletion are separate scopes.
