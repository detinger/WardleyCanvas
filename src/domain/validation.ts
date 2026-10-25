// VAL-01: Structural validation rules over the canonical WardleyMap model.
// Pure functions — no side effects, no rendering, no storage.
// Rules return stable IDs so the UI can navigate to affected elements.

import { WardleyMap } from './types';

export type ValidationSeverity = 'error' | 'warning' | 'recommendation' | 'info';

export interface ValidationFinding {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  explanation: string;
  affectedIds: string[];
  suggestedAction?: string;
}

// ---------------------------------------------------------------------------
// Structural errors — these block export of corrupt data
// ---------------------------------------------------------------------------

function checkStructuralErrors(map: WardleyMap): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const elementIds = new Set<string>();

  for (const el of map.elements) {
    if (elementIds.has(el.id)) {
      findings.push({
        ruleId: 'E001',
        severity: 'error',
        message: `Duplicate element ID "${el.id}"`,
        explanation: 'Each element must have a unique stable ID. This map cannot be reliably saved or exported until the duplicate is removed.',
        affectedIds: [el.id],
        suggestedAction: 'Remove the duplicate element.',
      });
    }
    elementIds.add(el.id);

    if (!isFinite(el.visibility) || el.visibility < 0 || el.visibility > 1) {
      findings.push({
        ruleId: 'E002',
        severity: 'error',
        message: `"${el.name}": visibility ${el.visibility} is out of range`,
        explanation: 'Visibility must be a finite number between 0 and 1 (inclusive).',
        affectedIds: [el.id],
        suggestedAction: 'Use the inspector to set a value between 0 and 1.',
      });
    }

    if (!isFinite(el.evolution) || el.evolution < 0 || el.evolution > 1) {
      findings.push({
        ruleId: 'E003',
        severity: 'error',
        message: `"${el.name}": evolution ${el.evolution} is out of range`,
        explanation: 'Evolution must be a finite number between 0 and 1 (inclusive).',
        affectedIds: [el.id],
        suggestedAction: 'Use the inspector to set a value between 0 and 1.',
      });
    }
  }

  const depIds = new Set<string>();
  for (const dep of map.dependencies) {
    if (depIds.has(dep.id)) {
      findings.push({
        ruleId: 'E004',
        severity: 'error',
        message: `Duplicate dependency ID "${dep.id}"`,
        explanation: 'Each dependency must have a unique ID.',
        affectedIds: [dep.id],
      });
    }
    depIds.add(dep.id);

    if (!elementIds.has(dep.fromId)) {
      findings.push({
        ruleId: 'E005',
        severity: 'error',
        message: `Dependency references missing element "${dep.fromId}"`,
        explanation: 'The source of this dependency does not exist in the map.',
        affectedIds: [dep.id],
        suggestedAction: 'Delete this dependency or restore the missing element.',
      });
    }

    if (!elementIds.has(dep.toId)) {
      findings.push({
        ruleId: 'E006',
        severity: 'error',
        message: `Dependency references missing element "${dep.toId}"`,
        explanation: 'The target of this dependency does not exist in the map.',
        affectedIds: [dep.id],
        suggestedAction: 'Delete this dependency or restore the missing element.',
      });
    }
  }

  for (const ev of map.evolutions) {
    if (!elementIds.has(ev.elementId)) {
      findings.push({
        ruleId: 'E007',
        severity: 'error',
        message: `Evolution movement references missing element "${ev.elementId}"`,
        explanation: 'The element this movement applies to does not exist.',
        affectedIds: [ev.id],
        suggestedAction: 'Delete this evolution movement.',
      });
    }
    if (!isFinite(ev.targetEvolution) || ev.targetEvolution < 0 || ev.targetEvolution > 1) {
      findings.push({
        ruleId: 'E008',
        severity: 'error',
        message: `Evolution target ${ev.targetEvolution} is out of range`,
        explanation: 'Evolution target must be between 0 and 1.',
        affectedIds: [ev.id],
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Modeling warnings — require human judgment to resolve
// ---------------------------------------------------------------------------

function checkModelingWarnings(map: WardleyMap): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  const hasAnchor = map.elements.some((el) => el.kind === 'anchor');
  if (!hasAnchor && map.elements.length > 0) {
    findings.push({
      ruleId: 'W001',
      severity: 'warning',
      message: 'No anchor (user/stakeholder) element',
      explanation:
        'A Wardley Map should express who has the need being served. Add an anchor element to represent a user or stakeholder.',
      affectedIds: [],
      suggestedAction: 'Use the toolbar to add an anchor element.',
    });
  }

  if (map.elements.length > 1) {
    const connectedIds = new Set<string>();
    for (const dep of map.dependencies) {
      connectedIds.add(dep.fromId);
      connectedIds.add(dep.toId);
    }
    for (const el of map.elements) {
      if (!connectedIds.has(el.id)) {
        findings.push({
          ruleId: 'W002',
          severity: 'warning',
          message: `"${el.name}" is not connected to any other element`,
          explanation:
            'Isolated components are usually a modeling mistake. Either connect this component to the value chain or remove it.',
          affectedIds: [el.id],
          suggestedAction: 'Select this element and use the dependency tool to connect it.',
        });
      }
    }
  }

  // Detect circular dependencies (simple two-node cycle check)
  const pairs = new Set<string>();
  for (const dep of map.dependencies) {
    const key = [dep.fromId, dep.toId].sort().join('→');
    if (pairs.has(key)) {
      findings.push({
        ruleId: 'W003',
        severity: 'warning',
        message: 'Circular dependency detected',
        explanation:
          'Two elements depend on each other simultaneously. This is allowed but usually indicates a modeling issue. Review the relationship direction.',
        affectedIds: [dep.fromId, dep.toId],
      });
    }
    pairs.add(key);
  }

  // Duplicate-looking names
  const names = new Map<string, string[]>();
  for (const el of map.elements) {
    const norm = el.name.trim().toLowerCase();
    if (!names.has(norm)) names.set(norm, []);
    names.get(norm)!.push(el.id);
  }
  for (const [, ids] of names) {
    if (ids.length > 1) {
      findings.push({
        ruleId: 'W004',
        severity: 'warning',
        message: `${ids.length} elements share the same name`,
        explanation:
          'Duplicate names are allowed but can confuse text-based formats and readers. Consider distinguishing them.',
        affectedIds: ids,
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Recommendations — never block; coaching prompts only
// ---------------------------------------------------------------------------

function checkRecommendations(map: WardleyMap): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  if (map.elements.length > 30) {
    findings.push({
      ruleId: 'R001',
      severity: 'recommendation',
      message: 'Map may be too large for one useful conversation',
      explanation:
        'Maps with more than 30 components are often hard to discuss in a single session. Consider splitting by user need or value chain.',
      affectedIds: [],
    });
  }

  const evValues = new Set(map.elements.map((el) => {
    const [b0, b1, b2] = map.stageBoundaries;
    if (el.evolution < b0) return 0;
    if (el.evolution < b1) return 1;
    if (el.evolution < b2) return 2;
    return 3;
  }));
  if (map.elements.length >= 3 && evValues.size === 1) {
    findings.push({
      ruleId: 'R002',
      severity: 'recommendation',
      message: 'All components are in the same evolution stage',
      explanation:
        'Real value chains usually span multiple stages of evolution. Review whether the positioning reflects actual market maturity.',
      affectedIds: [],
    });
  }

  if (!map.purpose && map.elements.length >= 3) {
    findings.push({
      ruleId: 'R003',
      severity: 'recommendation',
      message: 'Map has no stated purpose',
      explanation:
        'Adding a purpose statement helps readers understand the scope and user context of the map.',
      affectedIds: [],
      suggestedAction: 'Add a purpose in the map details panel.',
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// VAL-02: Modeling guidance — advisory rules that never block operations.
// These surface coaching prompts; suppression is supported.
// ---------------------------------------------------------------------------

function checkModelingGuidance(map: WardleyMap): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  // G001: Inertia asserted without explanation
  const inertiaWithoutNote = map.elements.filter(
    (el) => el.inertia && !el.description
  );
  for (const el of inertiaWithoutNote) {
    findings.push({
      ruleId: 'G001',
      severity: 'recommendation',
      message: `"${el.name}" has inertia but no description explaining why`,
      explanation:
        'Inertia is a claim about why a component resists evolution. Adding a description makes the assumption explicit and reviewable.',
      affectedIds: [el.id],
      suggestedAction: 'Open the inspector and add a description explaining the source of inertia.',
    });
  }

  // G002: Evolution movement is leftward (de-commoditisation)
  for (const ev of map.evolutions) {
    const el = map.elements.find((e) => e.id === ev.elementId);
    if (!el) continue;
    if (ev.targetEvolution < el.evolution) {
      findings.push({
        ruleId: 'G002',
        severity: 'info',
        message: `"${el.name}" evolve arrow points leftward (de-commoditisation)`,
        explanation:
          'Evolution generally moves rightward. A leftward arrow is unusual and may represent a strategic regression or a modeling error.',
        affectedIds: [el.id, ev.id],
      });
    }
  }

  // G003: Sourcing contradicts evolution position
  const sourcingMismatch = map.elements.filter((el) => {
    // 'buy' a genesis-stage component is unusual
    if (el.sourcing === 'buy' && el.evolution < map.stageBoundaries[0]) return true;
    // 'build' a commodity is unusual
    if (el.sourcing === 'build' && el.evolution > map.stageBoundaries[2]) return true;
    return false;
  });
  for (const el of sourcingMismatch) {
    findings.push({
      ruleId: 'G003',
      severity: 'recommendation',
      message: `"${el.name}": sourcing method "${el.sourcing}" may be mismatched with its evolution position`,
      explanation:
        'Genesis components are rarely available to buy. Commodity components are rarely worth building custom. Review whether the sourcing decision reflects strategic intent.',
      affectedIds: [el.id],
    });
  }

  // G004: Pipeline with no members
  for (const pip of map.pipelines) {
    if (pip.memberElementIds.length === 0) {
      findings.push({
        ruleId: 'G004',
        severity: 'info',
        message: `Pipeline has no member components`,
        explanation:
          'A pipeline defines a range of evolution for a component family. If no components fall within the range, the pipeline may be misplaced.',
        affectedIds: [pip.id],
      });
    }
  }

  // G005: Deeply nested value chain (long dependency paths)
  if (map.elements.length > 5) {
    const MAX_DEPTH = 8;
    const adj = new Map<string, string[]>();
    for (const dep of map.dependencies) {
      if (!adj.has(dep.fromId)) adj.set(dep.fromId, []);
      adj.get(dep.fromId)!.push(dep.toId);
    }
    function maxDepth(id: string, visited = new Set<string>()): number {
      if (visited.has(id)) return 0;
      visited.add(id);
      const children = adj.get(id) ?? [];
      return children.length === 0 ? 1 : 1 + Math.max(...children.map((c) => maxDepth(c, visited)));
    }
    const anchors = map.elements.filter((e) => e.kind === 'anchor');
    for (const anchor of anchors) {
      const depth = maxDepth(anchor.id);
      if (depth > MAX_DEPTH) {
        findings.push({
          ruleId: 'G005',
          severity: 'recommendation',
          message: `Value chain is ${depth} levels deep — consider splitting into a submap`,
          explanation:
            `Long chains (>${MAX_DEPTH} levels) are hard to discuss in a single map. A submap can replace a cluster of components with a single node.`,
          affectedIds: [anchor.id],
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function validateMap(map: WardleyMap, suppressedRules?: Set<string>): ValidationFinding[] {
  const all = [
    ...checkStructuralErrors(map),
    ...checkModelingWarnings(map),
    ...checkRecommendations(map),
    ...checkModelingGuidance(map),
  ];
  if (!suppressedRules || suppressedRules.size === 0) return all;
  return all.filter((f) => !suppressedRules.has(f.ruleId));
}

export function hasErrors(findings: ValidationFinding[]): boolean {
  return findings.some((f) => f.severity === 'error');
}

export function countBySeverity(
  findings: ValidationFinding[]
): Record<ValidationSeverity, number> {
  const counts: Record<ValidationSeverity, number> = {
    error: 0,
    warning: 0,
    recommendation: 0,
    info: 0,
  };
  for (const f of findings) counts[f.severity]++;
  return counts;
}
