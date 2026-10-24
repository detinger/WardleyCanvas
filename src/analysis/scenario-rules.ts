// SIM-03: Inspectable scenario rules engine.
// Each rule is deterministic, versioned, and explains its inputs, output, and limitations.
// Rules produce findings — never opaque scores.

import { WardleyMap, ScenarioChange, Id } from '@/domain/types';
import { applyScenarioChanges } from '@/hooks/use-scenarios';

export interface ScenarioFinding {
  ruleId: string;
  ruleVersion: number;
  severity: 'error' | 'warning' | 'info';
  title: string;
  explanation: string;
  /** How to interpret this finding — what it assumes and does not capture */
  limitations: string;
  affectedIds: Id[];
  inputs: Record<string, unknown>;
}

export interface ScenarioRuleResult {
  ruleId: string;
  ruleVersion: number;
  enabled: boolean;
  findings: ScenarioFinding[];
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

function ruleIsolation(
  baseline: WardleyMap,
  scenarioMap: WardleyMap
): ScenarioFinding[] {
  // Find elements that become disconnected from all anchors after changes
  const anchors = scenarioMap.elements.filter((e) => e.kind === 'anchor');
  if (anchors.length === 0) return [];

  const adj = new Map<Id, Set<Id>>();
  for (const el of scenarioMap.elements) adj.set(el.id, new Set());
  for (const dep of scenarioMap.dependencies) {
    adj.get(dep.fromId)?.add(dep.toId);
    adj.get(dep.toId)?.add(dep.fromId);
  }

  const visited = new Set<Id>();
  const queue = anchors.map((a) => a.id);
  queue.forEach((id) => visited.add(id));
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of adj.get(cur) ?? []) {
      if (!visited.has(n)) { visited.add(n); queue.push(n); }
    }
  }

  const isolated = scenarioMap.elements
    .filter((e) => !visited.has(e.id))
    .map((e) => e.id);

  if (isolated.length === 0) return [];

  return [{
    ruleId: 'sc-isolation',
    ruleVersion: 1,
    severity: 'warning',
    title: `${isolated.length} element${isolated.length > 1 ? 's' : ''} disconnected from all anchors`,
    explanation: `After applying scenario changes, ${isolated.length} element${isolated.length > 1 ? 's are' : ' is'} no longer reachable from any anchor via the dependency graph.`,
    limitations: 'Checks only structural reachability. Does not assess whether isolation is intentional.',
    affectedIds: isolated,
    inputs: { isolatedIds: isolated, anchorCount: anchors.length },
  }];
}

function ruleInertiaOverride(
  baseline: WardleyMap,
  changes: ScenarioChange[]
): ScenarioFinding[] {
  const findings: ScenarioFinding[] = [];
  for (const change of changes) {
    if (change.kind !== 'move-evolution' && change.kind !== 'move-visibility') continue;
    const el = baseline.elements.find((e) => e.id === change.elementId);
    if (!el?.inertia) continue;
    findings.push({
      ruleId: 'sc-inertia-override',
      ruleVersion: 1,
      severity: 'warning',
      title: `Scenario moves "${el.name}" which has inertia`,
      explanation: `"${el.name}" is flagged for inertia on the baseline map. The scenario proposes moving it anyway. This may be intentional — inertia does not make movement impossible, only costly and difficult.`,
      limitations: 'Inertia is a qualitative flag. This rule cannot assess the cost or feasibility of overcoming it.',
      affectedIds: [change.elementId],
      inputs: { elementId: change.elementId, elementName: el.name },
    });
  }
  return findings;
}

function ruleEvolutionBackward(
  baseline: WardleyMap,
  changes: ScenarioChange[]
): ScenarioFinding[] {
  const findings: ScenarioFinding[] = [];
  for (const change of changes) {
    if (change.kind !== 'move-evolution') continue;
    if (change.to >= change.from) continue;
    const el = baseline.elements.find((e) => e.id === change.elementId);
    const name = el?.name ?? change.elementId;
    findings.push({
      ruleId: 'sc-evolution-backward',
      ruleVersion: 1,
      severity: 'info',
      title: `"${name}" moved leftward (de-evolution)`,
      explanation: `This scenario moves "${name}" to a lower evolution value (${change.from.toFixed(2)} → ${change.to.toFixed(2)}). Evolution typically moves rightward over time under market pressure. Leftward movement is unusual and requires explicit justification — for example, a technology being abandoned, or repositioning to a more experimental approach.`,
      limitations: 'Evolution direction is a heuristic observation, not a physical law. Leftward scenarios are valid hypotheses in some contexts.',
      affectedIds: [change.elementId],
      inputs: { elementId: change.elementId, from: change.from, to: change.to },
    });
  }
  return findings;
}

function ruleRemovedAnchor(
  baseline: WardleyMap,
  changes: ScenarioChange[]
): ScenarioFinding[] {
  const findings: ScenarioFinding[] = [];
  for (const change of changes) {
    if (change.kind !== 'remove-element') continue;
    const el = baseline.elements.find((e) => e.id === change.elementId);
    if (el?.kind !== 'anchor') continue;
    findings.push({
      ruleId: 'sc-removed-anchor',
      ruleVersion: 1,
      severity: 'warning',
      title: `Anchor "${el.name}" removed in scenario`,
      explanation: `This scenario removes an anchor (user/stakeholder need). Removing an anchor changes who the map serves and may leave previously justified components without a user need.`,
      limitations: 'Does not assess whether removing this anchor reflects a genuine strategic change in scope.',
      affectedIds: [change.elementId],
      inputs: { elementId: change.elementId, elementName: el.name },
    });
  }
  return findings;
}

function ruleValidationRegression(
  baseline: WardleyMap,
  scenarioMap: WardleyMap
): ScenarioFinding[] {
  // Check if scenario introduces circular-ish dependencies or dangling refs
  const findings: ScenarioFinding[] = [];
  const elIds = new Set(scenarioMap.elements.map((e) => e.id));
  const danglingDeps = scenarioMap.dependencies.filter(
    (d) => !elIds.has(d.fromId) || !elIds.has(d.toId)
  );
  if (danglingDeps.length > 0) {
    findings.push({
      ruleId: 'sc-dangling-deps',
      ruleVersion: 1,
      severity: 'error',
      title: `${danglingDeps.length} dependency endpoint${danglingDeps.length > 1 ? 's' : ''} missing`,
      explanation: `The scenario has ${danglingDeps.length} dependenc${danglingDeps.length > 1 ? 'ies' : 'y'} pointing to elements that no longer exist. This is likely caused by removing an element without also removing its dependencies.`,
      limitations: 'Reports only dependencies with missing endpoints; does not detect semantic inconsistencies.',
      affectedIds: danglingDeps.flatMap((d) => [d.fromId, d.toId]).filter((id) => !elIds.has(id)),
      inputs: { danglingCount: danglingDeps.length },
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Rule registry and runner
// ---------------------------------------------------------------------------

export interface ScenarioRule {
  id: string;
  version: number;
  name: string;
  description: string;
  run: (baseline: WardleyMap, scenarioMap: WardleyMap, changes: ScenarioChange[]) => ScenarioFinding[];
}

export const SCENARIO_RULES: ScenarioRule[] = [
  {
    id: 'sc-isolation',
    version: 1,
    name: 'Disconnected elements',
    description: 'Flags elements that become unreachable from any anchor after applying scenario changes.',
    run: (baseline, scenarioMap) => ruleIsolation(baseline, scenarioMap),
  },
  {
    id: 'sc-inertia-override',
    version: 1,
    name: 'Inertia override',
    description: 'Warns when a scenario moves elements that have inertia flags on the baseline map.',
    run: (baseline, scenarioMap, changes) => ruleInertiaOverride(baseline, changes),
  },
  {
    id: 'sc-evolution-backward',
    version: 1,
    name: 'Backward evolution',
    description: 'Flags evolution movements that go leftward — unusual and requiring explicit justification.',
    run: (baseline, scenarioMap, changes) => ruleEvolutionBackward(baseline, changes),
  },
  {
    id: 'sc-removed-anchor',
    version: 1,
    name: 'Anchor removed',
    description: 'Warns when an anchor (user/stakeholder need) is removed in the scenario.',
    run: (baseline, scenarioMap, changes) => ruleRemovedAnchor(baseline, changes),
  },
  {
    id: 'sc-dangling-deps',
    version: 1,
    name: 'Dangling dependencies',
    description: 'Detects dependencies with missing endpoints introduced by the scenario changes.',
    run: (baseline, scenarioMap, changes) => ruleValidationRegression(baseline, scenarioMap),
  },
];

export function runScenarioRules(
  baseline: WardleyMap,
  changes: ScenarioChange[],
  disabledRuleIds: Set<string> = new Set()
): ScenarioRuleResult[] {
  const scenarioMap = applyScenarioChanges(baseline, changes);
  return SCENARIO_RULES.map((rule) => ({
    ruleId: rule.id,
    ruleVersion: rule.version,
    enabled: !disabledRuleIds.has(rule.id),
    findings: disabledRuleIds.has(rule.id) ? [] : rule.run(baseline, scenarioMap, changes),
  }));
}

export function allFindings(results: ScenarioRuleResult[]): ScenarioFinding[] {
  return results.flatMap((r) => r.findings);
}
