import { describe, it, expect } from 'vitest';
import { buildDecisionPacket } from '../decision-packet';
import { runScenarioRules, allFindings } from '../scenario-rules';
import { Scenario } from '@/domain/types';
import { sampleMap } from '../../../tests/factories';

function input() {
  const baseline = sampleMap();
  const scenario: Scenario = {
    id: 'sc1', name: 'Move to cloud', baselineMapId: baseline.id, baselineRevision: 3, baseline,
    description: 'Try utility hosting',
    assumptions: [{ id: 'as1', statement: 'Regulator approves', confidence: 'medium', evidenceIds: [], invalidationSignals: ['Draft guidance restricts it'] }],
    changes: [{ kind: 'move-evolution', elementId: 'b', from: 0.9, to: 0.95, rationale: 'utility' }, { kind: 'remove-element', elementId: 'need', rationale: 'test' }],
    consequences: [{ id: 'cq', affectedIds: ['a'], description: 'Lower cost', direction: 'improves', magnitude: 'medium', confidence: 'low', evidenceIds: [] }],
    createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-02T10:00:00.000Z',
  };
  const findings = allFindings(runScenarioRules(baseline, scenario.changes));
  return {
    baseline, scenario, findings,
    decisions: [{
      id: 'dr1', baselineMapId: baseline.id, baselineRevision: 3, selectedScenarioId: 'sc1', rejectedScenarioIds: ['sc2'],
      rationale: 'Cheaper\n# not a heading', owner: 'CTO', decidedAt: '2026-10-05T00:00:00.000Z', reviewAt: '2027-01-01',
      expectedSignals: ['Costs fall'], stopConditions: ['Outage over 1h'],
    }],
    scenarioNames: { sc1: 'Move to cloud', sc2: 'Modernise in place' },
    generatedAt: '2026-10-25',
  };
}

describe('buildDecisionPacket', () => {
  const md = buildDecisionPacket(input());

  it('contains every section and the non-prediction notice', () => {
    for (const h of ['# Decision packet: Move to cloud', '## Assumptions', '## Changes from the baseline', '## Consequences', '## Rule findings', '## Decisions']) {
      expect(md).toContain(h);
    }
    expect(md).toMatch(/not predictions/);
    expect(md).not.toMatch(/\bwill (definitely|certainly)\b|guarantee/i);
  });

  it('names rejected alternatives, signals and stop conditions', () => {
    expect(md).toContain('Rejected alternatives: Modernise in place');
    expect(md).toContain('Expected signal: Costs fall');
    expect(md).toContain('Stop condition: Outage over 1h');
    expect(md).toContain('Would be invalidated by: Draft guidance restricts it');
  });

  it('includes rule findings with their limitations', () => {
    expect(md).toMatch(/Limitation: /);
  });

  it('user text cannot inject Markdown structure', () => {
    expect(md).not.toMatch(/^# not a heading/m);
    expect(md).toContain('Rationale: Cheaper # not a heading');
  });

  it('is deterministic', () => {
    expect(buildDecisionPacket(input())).toBe(md);
  });
});
