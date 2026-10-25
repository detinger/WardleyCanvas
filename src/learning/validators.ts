// LRN-01: Challenge validator runner.
// Pure functions — no side effects.

import { WardleyMap } from '@/domain/types';
import { ChallengeDefinition, ChallengeResult, ValidatorResult, ChallengeValidator } from './types';

function runValidator(v: ChallengeValidator, map: WardleyMap): ValidatorResult {
  let passed = false;
  let message = v.description;

  switch (v.kind) {
    case 'has-anchor': {
      const count = map.elements.filter((e) => e.kind === 'anchor').length;
      const min = v.minCount ?? 1;
      passed = count >= min;
      message = passed
        ? `Has ${count} anchor${count !== 1 ? 's' : ''}`
        : `Needs at least ${min} anchor — found ${count}`;
      break;
    }

    case 'has-component': {
      const count = map.elements.filter((e) => e.kind !== 'anchor').length;
      const min = v.minCount ?? 1;
      passed = count >= min;
      message = passed
        ? `Has ${count} component${count !== 1 ? 's' : ''}`
        : `Needs at least ${min} component${min !== 1 ? 's' : ''} — found ${count}`;
      break;
    }

    case 'has-dependency': {
      const count = map.dependencies.length;
      const min = v.minCount ?? 1;
      passed = count >= min;
      message = passed
        ? `Has ${count} dependenc${count !== 1 ? 'ies' : 'y'}`
        : `Needs at least ${min} dependenc${min !== 1 ? 'ies' : 'y'} — found ${count}`;
      break;
    }

    case 'is-connected': {
      if (map.elements.length <= 1) { passed = true; message = 'Map has one element'; break; }
      // Build adjacency and BFS from anchors
      const adj = new Map<string, Set<string>>();
      for (const el of map.elements) adj.set(el.id, new Set());
      for (const dep of map.dependencies) {
        adj.get(dep.fromId)?.add(dep.toId);
        adj.get(dep.toId)?.add(dep.fromId);
      }
      const anchors = map.elements.filter((e) => e.kind === 'anchor');
      if (anchors.length === 0) { passed = false; message = 'No anchor to connect from'; break; }

      const visited = new Set<string>();
      const queue = anchors.map((a) => a.id);
      queue.forEach((id) => visited.add(id));
      while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const neighbor of adj.get(cur) ?? []) {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
        }
      }
      const isolated = map.elements.filter((e) => !visited.has(e.id));
      passed = isolated.length === 0;
      message = passed
        ? 'All elements are reachable from an anchor'
        : `${isolated.length} element${isolated.length !== 1 ? 's are' : ' is'} not reachable from an anchor`;
      break;
    }

    case 'multi-stage': {
      if (map.elements.length < 2) { passed = false; message = 'Need at least 2 elements to span stages'; break; }
      const [b0, b1, b2] = map.stageBoundaries;
      const stages = new Set(map.elements.map((e) => {
        if (e.evolution < b0) return 0;
        if (e.evolution < b1) return 1;
        if (e.evolution < b2) return 2;
        return 3;
      }));
      passed = stages.size >= 2;
      message = passed
        ? `Elements span ${stages.size} evolution stages`
        : 'All elements are in the same evolution stage — spread them across the map';
      break;
    }

    case 'anchor-has-description': {
      const anchors = map.elements.filter((e) => e.kind === 'anchor');
      passed = anchors.some((e) => (e.description ?? '').trim().length > 0);
      message = passed
        ? 'An anchor has a description'
        : 'Add a description to an anchor explaining who this user is and what they need';
      break;
    }

    case 'component-has-description': {
      const comps = map.elements.filter((e) => e.kind !== 'anchor');
      passed = comps.some((e) => (e.description ?? '').trim().length > 0);
      message = passed
        ? 'A component has a description'
        : 'Add a description to at least one component';
      break;
    }

    case 'has-evolution-movement': {
      const count = map.evolutions.length;
      const min = v.minCount ?? 1;
      passed = count >= min;
      message = passed
        ? `Has ${count} evolve arrow${count !== 1 ? 's' : ''}`
        : `Needs at least ${min} evolve arrow${min !== 1 ? 's' : ''} — found ${count}`;
      break;
    }

    case 'evolution-has-rationale': {
      passed = map.evolutions.some((ev) => (ev.rationale ?? '').trim().length > 0);
      message = passed
        ? 'An evolve arrow explains why the component will move'
        : 'No evolve arrow has a rationale yet';
      break;
    }

    case 'has-inertia': {
      const count = map.elements.filter((e) => e.inertia).length;
      passed = count >= (v.minCount ?? 1);
      message = passed
        ? `${count} component${count !== 1 ? 's are' : ' is'} marked with inertia`
        : 'No component is marked with inertia';
      break;
    }

    case 'has-annotation': {
      const count = map.annotations.length;
      const min = v.minCount ?? 1;
      passed = count >= min;
      message = passed
        ? `Has ${count} note${count !== 1 ? 's' : ''}`
        : `Needs at least ${min} note${min !== 1 ? 's' : ''} — found ${count}`;
      break;
    }

    case 'has-climate-assessment': {
      const decided = map.analysis.climate.filter(
        (a) => a.state !== 'considering' && a.rationale.trim().length > 0
      );
      passed = decided.length >= (v.minCount ?? 1);
      message = passed
        ? `${decided.length} climatic pattern${decided.length !== 1 ? 's' : ''} assessed with a rationale`
        : 'No climatic pattern has been assessed with a rationale yet';
      break;
    }

    case 'has-doctrine-assessment': {
      const assessed = map.analysis.doctrine.filter((a) => a.rationale.trim().length > 0);
      passed = assessed.length >= (v.minCount ?? 1);
      message = passed
        ? `${assessed.length} doctrine principle${assessed.length !== 1 ? 's' : ''} assessed with a rationale`
        : 'No doctrine principle has been assessed with a rationale yet';
      break;
    }

    case 'has-gameplay-hypothesis': {
      const complete = map.analysis.gameplay.filter(
        (g) => g.rationale.trim().length > 0 && g.leadingSignals.some((s) => s.trim()) && g.risks.some((r) => r.trim())
      );
      passed = complete.length >= (v.minCount ?? 1);
      message = passed
        ? `${complete.length} gameplay hypothes${complete.length !== 1 ? 'es have' : 'is has'} a rationale, signal and risk`
        : 'No gameplay hypothesis has a rationale, a leading signal and a risk yet';
      break;
    }

    case 'assessment-has-evidence': {
      const evidenceIds = new Set(map.analysis.evidence.map((e) => e.id));
      const all = [...map.analysis.climate, ...map.analysis.doctrine, ...map.analysis.gameplay];
      passed = all.some((a) => a.evidenceIds.some((id) => evidenceIds.has(id)));
      message = passed
        ? 'An assessment is backed by evidence'
        : 'No assessment is linked to an evidence record yet';
      break;
    }

    case 'custom': {
      if (!v.predicate) { passed = false; message = 'Custom validator has no predicate'; break; }
      try {
        passed = v.predicate(map);
        message = passed ? v.description : `Not met: ${v.description}`;
      } catch {
        passed = false;
        message = 'Validator error';
      }
      break;
    }
  }

  return { validatorId: v.id, passed, message };
}

export function runChallenge(challenge: ChallengeDefinition, map: WardleyMap): ChallengeResult {
  const results = challenge.validators.map((v) => runValidator(v, map));
  const passCount = results.filter((r) => r.passed).length;
  return {
    allPassed: passCount === results.length,
    results,
    passCount,
    totalCount: results.length,
  };
}

/** Fallback "one possible next move" when a validator has no authored nextStep. */
export function defaultNextStep(kind: ChallengeValidator['kind']): string {
  switch (kind) {
    case 'has-anchor': return 'Add an anchor from the toolbar (A) and name it after a real person or role.';
    case 'has-component': return 'Add a component from the toolbar (C) and connect it to the value chain.';
    case 'has-dependency': return 'Select an element, open the Connections tab and choose what it depends on.';
    case 'is-connected': return 'Connect each loose component to something above it, or remove it.';
    case 'multi-stage': return 'Move a component left or right, or set its Evolution value in the inspector.';
    case 'anchor-has-description': return 'Select the anchor and describe the need in its Description.';
    case 'component-has-description': return 'Select a component and explain your reasoning in its Description.';
    case 'has-evolution-movement': return 'Select a component, open the Evolution tab and choose Add evolve arrow.';
    case 'evolution-has-rationale': return 'In the Evolution tab, fill in “Rationale — why will it move?”.';
    case 'has-inertia': return 'Select a component and tick Inertia in the Details tab.';
    case 'has-annotation': return 'With nothing selected, open Details → Notes and choose Add note.';
    case 'has-climate-assessment': return 'Open Analysis → Climate, choose a state for a pattern and write a rationale.';
    case 'has-doctrine-assessment': return 'Open Analysis → Doctrine, choose a state for a principle and write a rationale.';
    case 'has-gameplay-hypothesis': return 'Open Analysis → Gameplay, add a hypothesis and fill in rationale, signals and risks.';
    case 'assessment-has-evidence': return 'In an assessment, choose New evidence and record what you observed.';
    default: return 'Review the instructions above and adjust your map.';
  }
}
