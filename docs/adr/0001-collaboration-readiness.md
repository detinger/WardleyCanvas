# ADR 0001: Collaboration Readiness

- **Status:** Accepted
- **Date:** 2026-10-25
- **Work package:** `COL-01`

## Context

Version 1 is a local-first, single-user application. Maps, drafts, immutable versions, scenarios, decisions, and learning progress are stored in browser `localStorage`. Real-time multi-user editing is explicitly outside the first release, but a future collaboration layer must not weaken offline recovery, stable IDs, scenario baselines, or decision history.

## Decision

Collaboration will be added behind a repository and sync boundary; it will not be embedded in the map renderer or domain commands.

1. The canonical `WardleyMap` and its stable element, dependency, evidence, scenario, and decision IDs remain the shared document contract.
2. Local commands remain deterministic and produce a new document state. A sync adapter may submit commands or snapshots with `mapId`, base revision, actor ID, and client operation ID.
3. The server accepts a commit only against the expected base revision. On conflict, the client keeps its local draft and performs a visible three-way rebase. It never silently overwrites either version.
4. Immutable map versions and decision records remain append-only. Restoring an old version creates a new revision.
5. Presence, cursors, and selections are ephemeral transport state. They are not written into the canonical map and are safe to drop.
6. Comments are separate records keyed by stable target ID and map revision. Deleting a target orphans the comment visibly; it does not delete discussion history.
7. Scenario baselines remain immutable snapshots. Collaborative scenario edits reference the same baseline revision and follow the same optimistic-concurrency rule.
8. A CRDT is not adopted initially. The domain is small enough for optimistic commits and explicit semantic conflict handling, and silent field-level merges would be dangerous for strategic rationale and evidence.

## Proposed service contracts

```text
MapRepository
  get(mapId) -> map + revision
  commit(mapId, expectedRevision, operationId, actorId, document, note)
  listVersions(mapId)

CommentRepository
  list(mapId, revision?)
  add(mapId, targetType, targetId, body, actorId)
  resolve(commentId, actorId)

PresenceChannel (ephemeral)
  join(mapId, actor)
  publish(selection/cursor/viewport)
  leave(mapId, actor)
```

Authentication and authorization are service concerns. Every mutation must be checked server-side; client-supplied actor identity is never trusted. Evidence text and map content must not appear in logs, metrics, presence payloads, or error trackers.

## Consequences

- Current local persistence must be extracted behind `MapRepository` before collaboration implementation begins.
- Offline edits remain recoverable and can be uploaded when the user chooses.
- Conflicts require product UI and cannot be hidden behind last-write-wins.
- Presence can be implemented independently without migrating stored maps.
- Comments and decisions retain an auditable history even when map elements change.

## Validation before implementation

- contract tests for idempotent operation IDs and expected-revision conflicts;
- two-client tests for concurrent rename, movement, deletion, evidence, and decision edits;
- offline/reconnect tests that prove no local draft is lost;
- authorization tests for maps, comments, scenarios, exports, and presence;
- a threat model and data-retention review.

