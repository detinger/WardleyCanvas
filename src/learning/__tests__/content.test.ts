import { describe, it, expect } from 'vitest';
import { ALL_MODULES, CASE_STUDIES, FUNDAMENTAL_MODULES } from '../content';
import { validateContent } from '../content-validation';
import { LearningModule } from '../types';

// This suite is the CI gate for learning content (LRN-01): invalid content fails the build.
describe('learning content', () => {
  it('passes schema and integrity validation', () => {
    const issues = validateContent(ALL_MODULES);
    expect(issues.map((i) => `${i.moduleId} › ${i.path}: ${i.message}`)).toEqual([]);
  });

  it('follows the plan’s foundation order', () => {
    expect(FUNDAMENTAL_MODULES.map((m) => m.title)).toEqual([
      'Purpose, users, and needs',
      'Components and value chains',
      'Visibility and evolution',
      'Reading a complete map',
      'Climate and inertia',
      'Doctrine and operating context',
      'Gameplay hypotheses',
      'Scenario comparison and decisions',
    ]);
    expect(ALL_MODULES.every((m) => m.published)).toBe(true);
    expect(ALL_MODULES.every((m) => m.meta.reviewStatus === 'reviewed')).toBe(true);
    expect(ALL_MODULES.every((m) => m.meta.reviewer === 'Project owner')).toBe(true);
  });

  it('adds six progressively less-scaffolded IT case studies', () => {
    expect(CASE_STUDIES.map((m) => m.title)).toEqual([
      'SaaS incident status service',
      'Software delivery platform',
      'Managed database service',
      'Enterprise identity modernisation',
      'AI-assisted code review',
      'Security incident response capstone',
    ]);
    expect(CASE_STUDIES.map((m) => m.caseStudy?.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(CASE_STUDIES.map((m) => m.caseStudy?.guidance)).toEqual([
      'Guided', 'Guided', 'Supported', 'Supported', 'Supported', 'Independent',
    ]);
    expect(CASE_STUDIES.at(-1)?.challenge.starterOwm).toBeUndefined();
  });
});

describe('validateContent catches broken content', () => {
  const solved = ALL_MODULES[0].challenge.sampleSolution;
  const base = (): LearningModule => ({
    ...ALL_MODULES[0],
    examples: [...ALL_MODULES[0].examples],
    conceptLinks: [...ALL_MODULES[0].conceptLinks],
    meta: { ...ALL_MODULES[0].meta },
    challenge: { ...ALL_MODULES[0].challenge, sampleSolution: solved },
  });
  const messages = (m: LearningModule) => validateContent([m]).map((i) => i.message).join(' | ');

  it('unsafe links', () => {
    const m = base();
    m.conceptLinks = [{ id: 'x', label: 'x', url: 'javascript:alert(1)' }];
    expect(messages(m)).toMatch(/Unsafe or invalid URL/);
  });

  it('unparseable example maps', () => {
    const m = base();
    m.examples = [{ ...m.examples[0], owmSource: 'A->Missing' }];
    expect(messages(m)).toMatch(/does not parse/);
  });

  it('out-of-order hints and duplicate validators', () => {
    const m = base();
    m.challenge.hints = [{ level: 2, text: 'a' }, { level: 1, text: 'b' }, { level: 3, text: 'c' }];
    m.challenge.validators = [m.challenge.validators[0], m.challenge.validators[0]];
    expect(messages(m)).toMatch(/Hint levels/);
    expect(messages(m)).toMatch(/Duplicate validator id/);
  });

  it('unsolvable challenges', () => {
    const m = base();
    m.challenge.validators = [{ id: 'impossible', kind: 'has-component', minCount: 99, description: 'd', rationale: 'r' }];
    expect(messages(m)).toMatch(/Sample solution fails impossible/);
  });

  it('missing sample solutions', () => {
    const m = base();
    m.challenge.sampleSolution = undefined;
    expect(messages(m)).toMatch(/sample solution is required/);
  });

  it('reviewed content without a reviewer, and malformed dates', () => {
    const m = base();
    m.meta = { ...m.meta, reviewStatus: 'reviewed', reviewer: undefined, lastReviewed: 'yesterday' };
    expect(messages(m)).toMatch(/must name its reviewer/);
    expect(messages(m)).toMatch(/YYYY-MM-DD/);
  });

  it('starter maps that already pass', () => {
    const m = base();
    m.challenge.starterOwm = 'anchor A [0.9,0.5]\ncomponent B [0.5,0.5]\nA->B';
    m.challenge.validators = [{ id: 'v', kind: 'has-anchor', description: 'd', rationale: 'r' }];
    expect(messages(m)).toMatch(/already passes/);
  });

  it('modules listed out of order', () => {
    expect(validateContent([ALL_MODULES[1]]).map((i) => i.message).join()).toMatch(/should be 1/);
  });
});
