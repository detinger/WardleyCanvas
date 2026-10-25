// SIM-05: Decision packet — a self-contained, human-readable record of a
// decision: the baseline, the scenario's assumptions and changes, rule
// findings with their limits, and the immutable decision records.

import { WardleyMap, Scenario, DecisionRecord } from '@/domain/types';
import { summarizeChange } from '@/hooks/use-scenarios';
import { ScenarioFinding } from './scenario-rules';

export interface DecisionPacketInput {
  baseline: WardleyMap;
  scenario: Scenario;
  findings: ScenarioFinding[];
  decisions: DecisionRecord[];
  /** Names of other scenarios on the map, for rejected alternatives */
  scenarioNames: Record<string, string>;
  generatedAt: string;
}

const NOTICE =
  'Scenario results are conditional consequences of the stated assumptions. They are not predictions of what will happen.';

/** Keep user text from breaking the Markdown structure (headings, lists, tables). */
function line(text: string): string {
  return text.replace(/\r?\n+/g, ' ').replace(/^([#>*-]|\d+\.)\s/, '\\$1 ').trim();
}

export function buildDecisionPacket(input: DecisionPacketInput): string {
  const { baseline, scenario, findings, decisions, scenarioNames, generatedAt } = input;
  const out: string[] = [];
  out.push(`# Decision packet: ${line(scenario.name)}`);
  out.push('');
  out.push(`Map: ${line(baseline.title)} (baseline revision ${scenario.baselineRevision})  `);
  out.push(`Scenario branched: ${scenario.createdAt.slice(0, 10)}  `);
  out.push(`Generated: ${generatedAt}`);
  out.push('');
  out.push(`> ${NOTICE}`);
  if (scenario.description) {
    out.push('');
    out.push(line(scenario.description));
  }

  out.push('', '## Assumptions', '');
  if (scenario.assumptions.length === 0) out.push('None recorded.');
  for (const a of scenario.assumptions) {
    out.push(`- ${line(a.statement)} — confidence: ${a.confidence}`);
    for (const s of a.invalidationSignals) out.push(`  - Would be invalidated by: ${line(s)}`);
  }

  out.push('', '## Changes from the baseline', '');
  if (scenario.changes.length === 0) out.push('None.');
  for (const c of scenario.changes) {
    const s = summarizeChange(c, baseline);
    out.push(`- ${line(s.label)}: ${line(s.detail)}${s.rationale ? ` — ${line(s.rationale)}` : ''}`);
  }

  out.push('', '## Consequences', '');
  if (scenario.consequences.length === 0) out.push('None recorded.');
  const names = new Map(baseline.elements.map((e) => [e.id, e.name]));
  for (const c of scenario.consequences) {
    const affected = c.affectedIds.map((id) => names.get(id) ?? id).join(', ');
    out.push(`- ${line(c.description)} (${c.direction}, magnitude ${c.magnitude}, confidence ${c.confidence})${affected ? ` — affects ${line(affected)}` : ''}`);
    if (c.uncertaintyNotes) out.push(`  - Uncertainty: ${line(c.uncertaintyNotes)}`);
  }

  out.push('', '## Rule findings', '');
  if (findings.length === 0) out.push('No rule findings.');
  for (const f of findings) {
    out.push(`- [${f.severity}] ${line(f.title)} (${f.ruleId} v${f.ruleVersion}): ${line(f.explanation)}`);
    out.push(`  - Limitation: ${line(f.limitations)}`);
  }

  out.push('', '## Decisions', '');
  if (decisions.length === 0) out.push('No decision recorded yet.');
  for (const d of decisions) {
    out.push(`### Decision ${d.id} — ${d.decidedAt.slice(0, 10)}`);
    out.push('');
    out.push(`- Rationale: ${line(d.rationale)}`);
    if (d.owner) out.push(`- Owner: ${line(d.owner)}`);
    if (d.reviewAt) out.push(`- Review by: ${d.reviewAt}`);
    if (d.rejectedScenarioIds.length) {
      out.push(`- Rejected alternatives: ${d.rejectedScenarioIds.map((id) => line(scenarioNames[id] ?? id)).join(', ')}`);
    }
    for (const s of d.expectedSignals) out.push(`- Expected signal: ${line(s)}`);
    for (const s of d.stopConditions) out.push(`- Stop condition: ${line(s)}`);
    if (d.supersedesId) out.push(`- Supersedes: ${d.supersedesId}`);
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
