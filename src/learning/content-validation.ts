// LRN-01 / Section 9.4: schema and integrity checks for learning content.
// Run in CI through the unit test suite: invalid content fails the build.

import { LearningModule, ValidatorKind } from './types';
import { runChallenge } from './validators';
import { parseOWM, sanitizeUrl } from '@/parser/owm';

export interface ContentIssue {
  moduleId: string;
  path: string;
  message: string;
}

const KNOWN_KINDS: ValidatorKind[] = [
  'has-anchor', 'has-component', 'has-dependency', 'is-connected', 'multi-stage',
  'anchor-has-description', 'component-has-description', 'has-evolution-movement',
  'evolution-has-rationale', 'has-inertia', 'has-annotation', 'has-climate-assessment',
  'has-doctrine-assessment', 'has-gameplay-hypothesis', 'assessment-has-evidence', 'custom',
];

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateContent(modules: LearningModule[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const seenModuleIds = new Set<string>();
  const seenChallengeIds = new Set<string>();

  modules.forEach((mod, i) => {
    const issue = (path: string, message: string) => issues.push({ moduleId: mod.id, path, message });

    if (!ID_RE.test(mod.id)) issue('id', `Module id "${mod.id}" must be lower-case kebab-case`);
    if (seenModuleIds.has(mod.id)) issue('id', `Duplicate module id "${mod.id}"`);
    seenModuleIds.add(mod.id);
    if (mod.index !== i + 1) issue('index', `Module index ${mod.index} should be ${i + 1} (modules are listed in order)`);

    // Governance metadata
    const meta = mod.meta;
    if (!meta) {
      issue('meta', 'Missing content metadata');
    } else {
      if (!Number.isInteger(meta.version) || meta.version < 1) issue('meta.version', 'Version must be a positive integer');
      if (!meta.author.trim()) issue('meta.author', 'Author is required');
      if (!meta.license.trim()) issue('meta.license', 'License is required');
      if (!DATE_RE.test(meta.lastReviewed)) issue('meta.lastReviewed', 'lastReviewed must be YYYY-MM-DD');
      if (meta.reviewStatus === 'reviewed' && !meta.reviewer?.trim()) issue('meta.reviewer', 'Reviewed content must name its reviewer');
      if (meta.sources.length === 0) issue('meta.sources', 'At least one source is required');
      meta.sources.forEach((src, j) => {
        if (src.url && !sanitizeUrl(src.url)) issue(`meta.sources[${j}].url`, `Unsafe or invalid URL "${src.url}"`);
      });
    }

    for (const link of mod.conceptLinks) {
      if (link.url && !sanitizeUrl(link.url)) issue(`conceptLinks.${link.id}`, `Unsafe or invalid URL "${link.url}"`);
    }

    if (!mod.published) return;

    // Published modules must be complete (Section 9.1)
    if (mod.explanation.trim().length < 200) issue('explanation', 'Explanation is missing or too short');
    if (mod.examples.length === 0) issue('examples', 'At least one annotated example is required');
    mod.examples.forEach((ex) => {
      const parsed = parseOWM(ex.owmSource);
      if (parsed.hasErrors) issue(`examples.${ex.id}`, `Example map does not parse: ${parsed.diagnostics.map((d) => d.message).join('; ')}`);
      if (ex.annotations.length === 0) issue(`examples.${ex.id}`, 'Example needs at least one annotation');
    });
    if (mod.reflectionPrompts.length === 0) issue('reflectionPrompts', 'At least one reflection prompt is required');
    if (mod.conceptLinks.length === 0) issue('conceptLinks', 'At least one reference link is required');

    const ch = mod.challenge;
    if (seenChallengeIds.has(ch.id)) issue('challenge.id', `Duplicate challenge id "${ch.id}"`);
    seenChallengeIds.add(ch.id);
    if (ch.instructions.length === 0) issue('challenge.instructions', 'Challenge needs instructions');
    if (ch.validators.length === 0) issue('challenge.validators', 'Challenge needs at least one validator');
    if (ch.reflectionPrompts.length === 0) issue('challenge.reflectionPrompts', 'Challenge needs reflection prompts');
    if (ch.rubric.length === 0) issue('challenge.rubric', 'Challenge needs a rubric');

    const validatorIds = new Set<string>();
    for (const v of ch.validators) {
      if (validatorIds.has(v.id)) issue(`challenge.validators.${v.id}`, 'Duplicate validator id');
      validatorIds.add(v.id);
      if (!KNOWN_KINDS.includes(v.kind)) issue(`challenge.validators.${v.id}`, `Unknown validator kind "${v.kind}"`);
      if (v.kind === 'custom' && !v.predicate) issue(`challenge.validators.${v.id}`, 'Custom validator needs a predicate');
      if (v.minCount !== undefined && (!Number.isInteger(v.minCount) || v.minCount < 1)) {
        issue(`challenge.validators.${v.id}`, 'minCount must be a positive integer');
      }
      if (!v.description.trim() || !v.rationale.trim()) issue(`challenge.validators.${v.id}`, 'Validator needs a description and a rationale');
    }

    // Hints are progressive: levels 1..n in order, at least three (Section 9.3)
    const levels = ch.hints.map((h) => h.level);
    if (levels.length < 3) issue('challenge.hints', 'At least three progressive hints are required');
    if (levels.some((l, k) => l !== k + 1)) issue('challenge.hints', 'Hint levels must run 1, 2, 3… in order');

    if (ch.starterOwm) {
      const starter = parseOWM(ch.starterOwm);
      if (starter.hasErrors) issue('challenge.starterOwm', 'Starter map does not parse');
      else if (runChallenge(ch, starter.map).allPassed) issue('challenge.starterOwm', 'Starter map already passes every check');
    }

    // The challenge must be solvable: the sample solution passes every validator
    if (!ch.sampleSolution) {
      issue('challenge.sampleSolution', 'A sample solution is required to prove the challenge is solvable');
    } else {
      try {
        const result = runChallenge(ch, ch.sampleSolution.build());
        for (const r of result.results.filter((x) => !x.passed)) {
          issue('challenge.sampleSolution', `Sample solution fails ${r.validatorId}: ${r.message}`);
        }
      } catch (e) {
        issue('challenge.sampleSolution', `Sample solution could not be built: ${(e as Error).message}`);
      }
    }
  });

  return issues;
}
