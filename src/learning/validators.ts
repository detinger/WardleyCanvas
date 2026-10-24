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
