import { describe, it, expect, beforeEach } from 'vitest';
import { installMemoryStorage } from '../../../tests/memory-storage';
import {
  applyScenarioChanges, createScenario, saveScenario, listScenarios, loadScenario, deleteScenario,
  createDecisionRecord, listDecisions, getDecisionRecord, resolveBaseline,
} from '../use-scenarios';
import { runScenarioRules, allFindings } from '@/analysis/scenario-rules';
import { validateMap, hasErrors } from '@/domain/validation';
import { ScenarioChange } from '@/domain/types';
import { sampleMap, el } from '../../../tests/factories';

beforeEach(() => { installMemoryStorage(); });

const allChanges: ScenarioChange[] = [
  { kind: 'move-evolution', elementId: 'a', from: 0.6, to: 0.8, rationale: 'r' },
  { kind: 'move-visibility', elementId: 'b', from: 0.2, to: 0.3, rationale: 'r' },
  { kind: 'add-element', element: el('c'), rationale: 'r' },
  { kind: 'change-dependency', after: { id: 'd9', fromId: 'need', toId: 'c', kind: 'dependency' }, rationale: 'r' },
  { kind: 'toggle-inertia', elementId: 'a', value: true, rationale: 'r' },
  { kind: 'remove-element', elementId: 'b', rationale: 'r' },
  { kind: 'apply-gameplay', gameplayHypothesisId: 'g', rationale: 'r' },
];

describe('applyScenarioChanges', () => {
  it('never mutates the baseline', () => {
    const baseline = sampleMap();
    baseline.evolutions = [{ id: 'ev', elementId: 'a', targetEvolution: 0.9 }];
    const snapshot = structuredClone(baseline);
    applyScenarioChanges(baseline, allChanges);
    expect(baseline).toEqual(snapshot);
  });

  it('applies each change kind', () => {
    const out = applyScenarioChanges(sampleMap(), allChanges);
    const a = out.elements.find((e) => e.id === 'a')!;
    expect(a.evolution).toBe(0.8);
    expect(a.inertia).toBe(true);
    expect(out.elements.map((e) => e.id)).toEqual(['user', 'need', 'a', 'c']);
    expect(out.dependencies.map((d) => d.id)).toEqual(['d1', 'd2', 'd9']);
  });

  it('removing an element leaves no dangling references', () => {
    const baseline = sampleMap();
    baseline.evolutions = [{ id: 'ev', elementId: 'b', targetEvolution: 0.95 }];
    baseline.pipelines = [{ id: 'p', parentElementId: 'a', memberElementIds: ['b'], startEvolution: 0.2, endEvolution: 0.9 }];
    const out = applyScenarioChanges(baseline, [{ kind: 'remove-element', elementId: 'b', rationale: 'r' }]);
    expect(hasErrors(validateMap(out))).toBe(false);
    expect(out.evolutions).toEqual([]);
    expect(out.pipelines[0].memberElementIds).toEqual([]);
  });

  it('adding an element with an existing id is ignored', () => {
    const out = applyScenarioChanges(sampleMap(), [{ kind: 'add-element', element: el('a', { name: 'dup' }), rationale: 'r' }]);
    expect(out.elements.filter((e) => e.id === 'a')).toHaveLength(1);
  });
});

describe('scenario rules', () => {
  it('are deterministic and explain themselves', () => {
    const baseline = sampleMap();
    const changes: ScenarioChange[] = [{ kind: 'remove-element', elementId: 'need', rationale: 'r' }];
    const r1 = allFindings(runScenarioRules(baseline, changes));
    const r2 = allFindings(runScenarioRules(baseline, changes));
    expect(r1).toEqual(r2);
    for (const f of r1) {
      expect(f.ruleVersion).toBeGreaterThan(0);
      expect(f.explanation.length).toBeGreaterThan(0);
      expect(f.limitations.length).toBeGreaterThan(0);
    }
  });

  it('use no prediction language', () => {
    const findings = allFindings(runScenarioRules(sampleMap(), allChanges));
    const text = findings.map((f) => `${f.title} ${f.explanation}`).join(' ');
    expect(text).not.toMatch(/\b(will (definitely|certainly)|guarantee[sd]?|predicts?)\b/i);
  });
});

describe('scenario and decision storage', () => {
  it('scenario CRUD is scoped per map', () => {
    const s = createScenario('m1', 1, 'Plan A');
    createScenario('m2', 1, 'Other');
    saveScenario({ ...s, name: 'Plan A2' });
    expect(listScenarios('m1').map((x) => x.name)).toEqual(['Plan A2']);
    expect(loadScenario('m1', s.id)?.name).toBe('Plan A2');
    deleteScenario('m1', s.id);
    expect(listScenarios('m1')).toEqual([]);
    expect(listScenarios('m2')).toHaveLength(1);
  });

  it('superseding a decision keeps the original record unchanged', () => {
    const base = {
      baselineMapId: 'm1', baselineRevision: 1, rejectedScenarioIds: [], rationale: 'first',
      decidedAt: '2026-01-01', expectedSignals: [], stopConditions: [],
    };
    const d1 = createDecisionRecord(base);
    const d2 = createDecisionRecord({ ...base, rationale: 'second', supersedesId: d1.id });
    expect(getDecisionRecord(d1.id)?.rationale).toBe('first');
    expect(listDecisions('m1').map((d) => d.id)).toEqual([d1.id, d2.id]);
  });
});


describe('immutable baseline (SIM-01)', () => {
  it('a scenario keeps its branch-time snapshot when the map changes later', () => {
    const map = sampleMap();
    const sc = createScenario(map.id, 1, 'A', undefined, map);
    map.elements[2].evolution = 0.1; // later edit to the live map
    const stored = loadScenario(map.id, sc.id)!;
    expect(stored.baseline!.elements[2].evolution).toBe(0.6);
    expect(resolveBaseline(stored, map, []).source).toBe('snapshot');
  });

  it('saving a scenario can never replace its baseline', () => {
    const map = sampleMap();
    const sc = createScenario(map.id, 1, 'A', undefined, map);
    const tampered = { ...sc, baseline: { ...map, title: 'tampered' } };
    saveScenario(tampered);
    expect(loadScenario(map.id, sc.id)!.baseline!.title).toBe('Sample');
  });

  it('legacy scenarios fall back to the matching saved version, then the current map', () => {
    const current = { ...sampleMap(), revision: 5, title: 'current' };
    const v3 = { ...sampleMap(), revision: 3, title: 'v3' };
    const legacy = createScenario(current.id, 3, 'old');
    expect(resolveBaseline(legacy, current, [{ map: v3 }])).toMatchObject({ source: 'version', map: { title: 'v3' } });
    expect(resolveBaseline(legacy, current, [])).toMatchObject({ source: 'current', map: { title: 'current' } });
  });
});
