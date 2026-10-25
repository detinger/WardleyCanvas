import { describe, it, expect } from 'vitest';
import { runChallenge, defaultNextStep } from '../validators';
import { getModule } from '../content';
import { parseOWM } from '@/parser/owm';
import { ChallengeDefinition, ChallengeValidator, ValidatorKind } from '../types';
import { sampleMap } from '../../../tests/factories';

const one = (kind: ValidatorKind, extra: Partial<ChallengeValidator> = {}): ChallengeDefinition => ({
  id: 'c', version: 1, title: 't', objective: 'o', conceptIds: [], instructions: [], hints: [], rubric: [], reflectionPrompts: [],
  validators: [{ id: 'v', kind, description: 'd', rationale: 'r', ...extra }],
});
const passes = (kind: ValidatorKind, map: ReturnType<typeof sampleMap>, extra?: Partial<ChallengeValidator>) =>
  runChallenge(one(kind, extra), map).allPassed;

describe('alternative valid solutions are accepted (LRN-03)', () => {
  const ch = getModule('components-value-chains')!.challenge;
  const solutions = [
    // Deep chain
    `anchor Patient [0.95, 0.5]\ncomponent Appointment [0.8, 0.4]\ncomponent Booking System [0.6, 0.3]\ncomponent Database [0.3, 0.8]\nPatient->Appointment\nAppointment->Booking System\nBooking System->Database`,
    // Wide chain with two anchors
    `anchor Driver [0.95, 0.4]\nanchor Rider [0.95, 0.7]\ncomponent Ride [0.85, 0.5]\ncomponent Maps [0.5, 0.75]\ncomponent Payments [0.45, 0.85]\ncomponent Pricing [0.4, 0.2]\nDriver->Ride\nRider->Ride\nRide->Maps\nRide->Payments\nRide->Pricing`,
    // Non-technical domain
    `anchor Diner [0.95, 0.5]\ncomponent Meal [0.8, 0.45]\ncomponent Recipe [0.6, 0.2]\ncomponent Ingredients [0.4, 0.8]\ncomponent Kitchen [0.3, 0.7]\nDiner->Meal\nMeal->Recipe\nMeal->Ingredients\nMeal->Kitchen`,
  ];
  for (const [i, owm] of solutions.entries()) {
    it(`solution ${i + 1} passes`, () => {
      const result = runChallenge(ch, parseOWM(owm).map);
      expect(result.results.filter((r) => !r.passed)).toEqual([]);
    });
  }

  it('a map with an isolated component fails only the connectivity check', () => {
    const map = parseOWM(solutions[0] + '\ncomponent Lonely [0.2, 0.2]').map;
    const failed = runChallenge(ch, map).results.filter((r) => !r.passed).map((r) => r.validatorId);
    expect(failed).toEqual(['v4-is-connected']);
  });
});

describe('validator kinds', () => {
  it('has-evolution-movement and evolution-has-rationale', () => {
    const m = sampleMap();
    expect(passes('has-evolution-movement', m)).toBe(false);
    m.evolutions = [{ id: 'e', elementId: 'a', targetEvolution: 0.8 }];
    expect(passes('has-evolution-movement', m)).toBe(true);
    expect(passes('evolution-has-rationale', m)).toBe(false);
    m.evolutions[0].rationale = '  ';
    expect(passes('evolution-has-rationale', m)).toBe(false);
    m.evolutions[0].rationale = 'because';
    expect(passes('evolution-has-rationale', m)).toBe(true);
  });

  it('has-inertia and has-annotation', () => {
    const m = sampleMap();
    expect(passes('has-inertia', m)).toBe(false);
    m.elements[2].inertia = true;
    expect(passes('has-inertia', m)).toBe(true);
    m.annotations = [{ id: 'n', text: 'x', x: 0.5, y: 0.5 }];
    expect(passes('has-annotation', m, { minCount: 2 })).toBe(false);
    expect(passes('has-annotation', m)).toBe(true);
  });

  it('climate assessments must be decided and explained', () => {
    const m = sampleMap();
    const a = { id: 'c', catalogId: 'cp-001', appliesToIds: [], state: 'considering' as const, rationale: 'r', evidenceIds: [], confidence: 'low' as const };
    m.analysis.climate = [a];
    expect(passes('has-climate-assessment', m)).toBe(false);
    m.analysis.climate = [{ ...a, state: 'applies', rationale: '' }];
    expect(passes('has-climate-assessment', m)).toBe(false);
    m.analysis.climate = [{ ...a, state: 'uncertain' }];
    expect(passes('has-climate-assessment', m)).toBe(true);
  });

  it('gameplay hypotheses need rationale, a signal and a risk', () => {
    const m = sampleMap();
    const g = {
      id: 'g', catalogId: 'gp-001', appliesToIds: [], state: 'considering' as const, rationale: 'r', evidenceIds: [], confidence: 'low' as const,
      category: 'x', intendedEffect: 'e', leadingSignals: [] as string[], risks: ['risk'],
    };
    m.analysis.gameplay = [g];
    expect(passes('has-gameplay-hypothesis', m)).toBe(false);
    m.analysis.gameplay = [{ ...g, leadingSignals: ['signal'] }];
    expect(passes('has-gameplay-hypothesis', m)).toBe(true);
  });

  it('evidence must exist, not just be referenced', () => {
    const m = sampleMap();
    m.analysis.doctrine = [{ id: 'd', catalogId: 'dc-101', appliesToIds: [], state: 'applies', rationale: 'r', evidenceIds: ['ghost'], confidence: 'low', capabilityState: 'emerging' }];
    expect(passes('assessment-has-evidence', m)).toBe(false);
    m.analysis.evidence = [{ id: 'ghost', claim: 'c', confidence: 'low' }];
    expect(passes('assessment-has-evidence', m)).toBe(true);
    expect(passes('has-doctrine-assessment', m)).toBe(true);
  });

  it('a throwing custom predicate fails safely', () => {
    const result = runChallenge(one('custom', { predicate: () => { throw new Error('x'); } }), sampleMap());
    expect(result.allPassed).toBe(false);
  });

  it('every kind has a default next step', () => {
    for (const k of ['has-anchor', 'has-gameplay-hypothesis', 'assessment-has-evidence', 'custom'] as ValidatorKind[]) {
      expect(defaultNextStep(k).length).toBeGreaterThan(10);
    }
  });
});
