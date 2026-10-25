import { describe, it, expect } from 'vitest';
import { summarizeAnalysis, analysisToCsv, catalogProvenance } from '../summary';
import { sampleMap } from '../../../tests/factories';

function analysedMap() {
  const m = sampleMap();
  m.analysis.evidence = [
    { id: 'e1', claim: 'c', confidence: 'high', reviewAt: '2026-01-01' },
    { id: 'e2', claim: 'c2', confidence: 'low', reviewAt: '2027-01-01' },
  ];
  m.analysis.climate = [{ id: 'c1', catalogId: 'cp-001', appliesToIds: ['a', 'ghost'], state: 'applies', rationale: 'r', evidenceIds: ['e1', 'missing'], confidence: 'medium', reviewAt: '2026-10-01' }];
  m.analysis.doctrine = [
    { id: 'd1', catalogId: 'dc-101', appliesToIds: [], state: 'applies', rationale: '', evidenceIds: [], confidence: 'low', capabilityState: 'emerging' },
    { id: 'd2', catalogId: 'dc-201', appliesToIds: [], state: 'applies', rationale: 'x', evidenceIds: [], confidence: 'low', capabilityState: 'embedded' },
  ];
  m.analysis.gameplay = [{
    id: 'g1', catalogId: 'gp-001', appliesToIds: ['b'], state: 'considering', rationale: '=HYPERLINK("x")', evidenceIds: [], confidence: 'low',
    category: 'basic-operations', intendedEffect: 'e', leadingSignals: [], risks: [], humanReviewed: false,
  }];
  return m;
}

describe('summarizeAnalysis', () => {
  const s = summarizeAnalysis(analysedMap(), '2026-10-25');

  it('reports transparent counts, never a score', () => {
    expect(s.counts).toEqual({
      climate: 1, doctrine: 2, gameplay: 1, evidence: 2,
      reviewDue: 1, withoutEvidence: 3, withoutRationale: 1, gameplayUnreviewed: 1, evidenceReviewDue: 1,
    });
    expect(JSON.stringify(s)).not.toMatch(/percent|score/i);
  });

  it('resolves names and ignores dangling references', () => {
    const climate = s.rows.find((r) => r.id === 'c1')!;
    expect(climate.title).toBe('Everything evolves');
    expect(climate.affects).toEqual(['A']);
    expect(climate.evidenceCount).toBe(1);
    expect(climate.reviewDue).toBe(true);
  });

  it('tabulates doctrine states by phase', () => {
    const p1 = s.doctrineByPhase.find((p) => p.phase === 'I')!;
    const p2 = s.doctrineByPhase.find((p) => p.phase === 'II')!;
    expect(p1.states.emerging).toBe(1);
    expect(p2.states.embedded).toBe(1);
  });

  it('is deterministic for a given date', () => {
    expect(summarizeAnalysis(analysedMap(), '2026-10-25')).toEqual(s);
    expect(summarizeAnalysis(analysedMap(), '2025-01-01').counts.reviewDue).toBe(0);
  });
});

describe('analysisToCsv', () => {
  const csv = analysisToCsv(summarizeAnalysis(analysedMap(), '2026-10-25'));

  it('has a header and one row per assessment', () => {
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toMatch(/^kind,catalog_id,title/);
    expect(lines).toHaveLength(5);
  });

  it('quotes cells and neutralises formula injection', () => {
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toMatch(/,"=HYPERLINK/);
  });
});

it('catalog provenance carries attribution and licence', () => {
  const p = catalogProvenance();
  expect(p.license).toMatch(/CC BY-SA 4\.0/);
  expect(p.climate.every((e) => e.attribution.length > 0)).toBe(true);
});
