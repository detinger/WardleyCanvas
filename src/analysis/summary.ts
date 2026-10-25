// ANL-01/03/05: Transparent analysis summary — counts, review status and a flat
// table usable for display, CSV export and screen readers. Deliberately no
// percentages or composite scores (Section 7.2).

import { WardleyMap, Confidence } from '@/domain/types';
import { getClimateEntry, CLIMATE_CATALOG } from './climate-catalog';
import { getDoctrineEntry, DOCTRINE_CATALOG, DOCTRINE_PHASES } from './doctrine-catalog';
import { getGameplayEntry, GAMEPLAY_CATALOG } from './gameplay-catalog';

type AssessmentKind = 'climate' | 'doctrine' | 'gameplay';

interface AssessmentRow {
  id: string;
  kind: AssessmentKind;
  catalogId: string;
  title: string;
  /** climate: applies/uncertain…; doctrine: capability state; gameplay: hypothesis state */
  status: string;
  confidence: Confidence;
  affects: string[];
  evidenceCount: number;
  owner: string;
  reviewAt: string;
  reviewDue: boolean;
  /** Gameplay only: false until a person has reviewed risks and ethics */
  humanReviewed: boolean | null;
  rationale: string;
}

export interface AnalysisSummary {
  counts: {
    climate: number;
    doctrine: number;
    gameplay: number;
    evidence: number;
    reviewDue: number;
    withoutEvidence: number;
    withoutRationale: number;
    gameplayUnreviewed: number;
    evidenceReviewDue: number;
  };
  rows: AssessmentRow[];
  /** Doctrine capability states per phase — a table, never a score */
  doctrineByPhase: { phase: string; label: string; states: Record<string, number> }[];
}

export const DOCTRINE_STATES = ['not-started', 'emerging', 'practiced', 'embedded', 'not-applicable'] as const;

/** `today` is YYYY-MM-DD; injected so results are deterministic in tests and exports. */
export function summarizeAnalysis(map: WardleyMap, today: string): AnalysisSummary {
  const names = new Map(map.elements.map((e) => [e.id, e.name]));
  const evidenceIds = new Set(map.analysis.evidence.map((e) => e.id));
  const due = (reviewAt?: string) => !!reviewAt && reviewAt <= today;

  const rows: AssessmentRow[] = [];
  for (const a of map.analysis.climate) {
    rows.push(row(a, 'climate', getClimateEntry(a.catalogId)?.shortTitle, a.state, null));
  }
  for (const a of map.analysis.doctrine) {
    rows.push(row(a, 'doctrine', getDoctrineEntry(a.catalogId)?.shortTitle, a.capabilityState, null));
  }
  for (const a of map.analysis.gameplay) {
    rows.push(row(a, 'gameplay', getGameplayEntry(a.catalogId)?.shortTitle, a.state, !!a.humanReviewed));
  }

  function row(
    a: WardleyMap['analysis']['climate'][number],
    kind: AssessmentKind,
    title: string | undefined,
    status: string,
    humanReviewed: boolean | null
  ): AssessmentRow {
    return {
      id: a.id,
      kind,
      catalogId: a.catalogId,
      title: title ?? a.catalogId,
      status,
      confidence: a.confidence,
      affects: a.appliesToIds.map((id) => names.get(id)).filter((n): n is string => !!n),
      evidenceCount: a.evidenceIds.filter((id) => evidenceIds.has(id)).length,
      owner: a.owner ?? '',
      reviewAt: a.reviewAt ?? '',
      reviewDue: due(a.reviewAt),
      humanReviewed,
      rationale: a.rationale,
    };
  }

  const doctrineByPhase = DOCTRINE_PHASES.map(({ phase, label }) => {
    const states: Record<string, number> = Object.fromEntries(DOCTRINE_STATES.map((s) => [s, 0]));
    for (const a of map.analysis.doctrine) {
      if (getDoctrineEntry(a.catalogId)?.phase === phase) states[a.capabilityState]++;
    }
    return { phase, label, states };
  });

  return {
    counts: {
      climate: map.analysis.climate.length,
      doctrine: map.analysis.doctrine.length,
      gameplay: map.analysis.gameplay.length,
      evidence: map.analysis.evidence.length,
      reviewDue: rows.filter((r) => r.reviewDue).length,
      withoutEvidence: rows.filter((r) => r.evidenceCount === 0).length,
      withoutRationale: rows.filter((r) => !r.rationale.trim()).length,
      gameplayUnreviewed: rows.filter((r) => r.humanReviewed === false).length,
      evidenceReviewDue: map.analysis.evidence.filter((e) => due(e.reviewAt)).length,
    },
    rows,
    doctrineByPhase,
  };
}

// ---------------------------------------------------------------------------
// CSV (Section 11.3: analysis tables only, not a substitute for the map)
// ---------------------------------------------------------------------------

function csvCell(v: string | number | boolean | null): string {
  const s = v === null ? '' : String(v);
  // Neutralise spreadsheet formula injection, then quote
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function analysisToCsv(summary: AnalysisSummary): string {
  const header = ['kind', 'catalog_id', 'title', 'status', 'confidence', 'affects', 'evidence_count', 'owner', 'review_at', 'review_due', 'human_reviewed', 'rationale'];
  const lines = [header.join(',')];
  for (const r of summary.rows) {
    lines.push(
      [r.kind, r.catalogId, r.title, r.status, r.confidence, r.affects.join('; '), r.evidenceCount, r.owner, r.reviewAt, r.reviewDue, r.humanReviewed, r.rationale]
        .map(csvCell)
        .join(',')
    );
  }
  return lines.join('\r\n') + '\r\n';
}

/** Catalog provenance for exports that reproduce catalog text (CC BY-SA attribution). */
export function catalogProvenance() {
  return {
    climate: CLIMATE_CATALOG.map(catalogEntryProvenance),
    doctrine: DOCTRINE_CATALOG.map(catalogEntryProvenance),
    gameplay: GAMEPLAY_CATALOG.map(catalogEntryProvenance),
    license:
      'Catalog definitions are adapted from Wardley Maps by Simon Wardley, licensed CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). ' +
      'Adaptations are shared under the same licence. Assessments are map-specific observations by the map’s authors.',
  };
}

function catalogEntryProvenance(e: {
  id: string;
  version: number;
  shortTitle: string;
  attribution: string;
  license: string;
  sourceUrl: string;
  adaptationNotice: string;
  lastReviewed: string;
}) {
  return {
    id: e.id,
    version: e.version,
    title: e.shortTitle,
    attribution: e.attribution,
    license: e.license,
    sourceUrl: e.sourceUrl,
    adaptationNotice: e.adaptationNotice,
    lastReviewed: e.lastReviewed,
  };
}
