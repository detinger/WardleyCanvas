// LRN-01: Learning system types.
// Content is versioned; every concept has a stable ID so progress survives copy edits.
// Validators test observable structure, never prescribe a single "correct" map.

import { WardleyMap } from '@/domain/types';

// ---------------------------------------------------------------------------
// Content atoms
// ---------------------------------------------------------------------------

interface ConceptLink {
  id: string;
  label: string;
  url?: string;         // external reference (sanitized at render time)
  moduleId?: string;    // internal cross-reference
}

interface AnnotatedExample {
  id: string;
  title: string;
  description: string;
  /** OWM source text that can be parsed and displayed */
  owmSource: string;
  annotations: string[]; // Ordered callout texts referring to the map
}

// ---------------------------------------------------------------------------
// Challenge schema (Section 9.2)
// ---------------------------------------------------------------------------

export type ValidatorKind =
  | 'has-anchor'                // at least N anchors
  | 'has-component'             // at least N non-anchor elements
  | 'has-dependency'            // at least N dependencies
  | 'is-connected'              // every element reachable from an anchor
  | 'multi-stage'               // elements span more than one evolution stage
  | 'anchor-has-description'    // at least one anchor has a non-empty description
  | 'component-has-description' // at least one component has a description
  | 'has-evolution-movement'    // at least N evolve arrows
  | 'evolution-has-rationale'   // at least one evolve arrow explains why
  | 'has-inertia'               // at least one component marked with inertia
  | 'has-annotation'            // at least N notes/annotations
  | 'has-climate-assessment'    // a climate pattern decided (not just "considering") with rationale
  | 'has-doctrine-assessment'   // a doctrine principle assessed with rationale
  | 'has-gameplay-hypothesis'   // a gameplay with rationale, a leading signal and a risk
  | 'assessment-has-evidence'   // an assessment linked to an existing evidence record
  | 'custom';                   // custom predicate

export interface ChallengeValidator {
  id: string;
  kind: ValidatorKind;
  /** Minimum count for count-based validators */
  minCount?: number;
  /** Human-readable description of what this validator checks */
  description: string;
  /** Why this criterion matters */
  rationale: string;
  /** One possible next move when the check fails (Section 9.3) */
  nextStep?: string;
  /** Custom predicate for 'custom' kind */
  predicate?: (map: WardleyMap) => boolean;
}

interface ChallengeHint {
  /** Progressive: show in order, one at a time */
  level: 1 | 2 | 3 | 4;
  text: string;
}

interface RubricCriterion {
  id: string;
  description: string;
  /** Subjective — not auto-checked; presented for reflection only */
  reflectionOnly: boolean;
}

interface ChallengeStep {
  id: string;
  instruction: string;
}

export interface ChallengeDefinition {
  id: string;
  version: number;
  title: string;
  objective: string;
  conceptIds: string[];
  starterOwm?: string;         // OWM source to pre-populate the editor
  instructions: ChallengeStep[];
  validators: ChallengeValidator[];
  hints: ChallengeHint[];
  rubric: RubricCriterion[];
  reflectionPrompts: string[];
  /**
   * One possible answer, shown only after completion with a note that
   * alternatives may be equally valid. CI checks that it passes every validator.
   */
  sampleSolution?: {
    explanation: string;
    build: () => WardleyMap;
  };
}

// ---------------------------------------------------------------------------
// Content governance (Section 9.4)
// ---------------------------------------------------------------------------

interface ContentSource {
  label: string;
  url?: string;
}

export interface ContentMeta {
  /** Bump when the meaning of the content changes (not for typo fixes) */
  version: number;
  author: string;
  /** Human reviewer attribution; required when reviewStatus is reviewed. */
  reviewer?: string;
  reviewStatus: 'draft' | 'reviewed';
  /** ISO date (YYYY-MM-DD) of the last review or authoring pass */
  lastReviewed: string;
  license: string;
  sources: ContentSource[];
}

// ---------------------------------------------------------------------------
// Lesson / module
// ---------------------------------------------------------------------------

interface CaseStudyMeta {
  /** Display order within the case-study track (1-indexed). */
  number: number;
  /** Scaffolding deliberately decreases as learners progress. */
  guidance: 'Guided' | 'Supported' | 'Independent';
  estimatedMinutes: number;
  industry: 'IT';
}

export interface LearningModule {
  /** Stable ID — survives copy edits and renames */
  id: string;
  /** Display order (1-indexed) */
  index: number;
  title: string;
  tagline: string;
  conceptIds: string[];
  /** Markdown prose for the explanation section */
  explanation: string;
  examples: AnnotatedExample[];
  challenge: ChallengeDefinition;
  reflectionPrompts: string[];
  conceptLinks: ConceptLink[];
  /** Present when this module belongs to the applied case-study track. */
  caseStudy?: CaseStudyMeta;
  /** If true, module is ready; false = coming-soon stub */
  published: boolean;
  meta: ContentMeta;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface ModuleProgress {
  moduleId: string;
  /** ISO timestamp of first visit */
  startedAt?: string;
  /** ISO timestamp when challenge was passed */
  completedAt?: string;
  /** Which validators have been passed */
  passedValidatorIds: string[];
  /** Which hints have been revealed */
  revealedHintLevels: number[];
  /** User's own reflection notes */
  reflectionNotes: string;
  /** Number of attempts */
  attempts: number;
}

export interface LearningProgress {
  version: 1;
  moduleProgress: Record<string, ModuleProgress>;
}

// ---------------------------------------------------------------------------
// Validator result
// ---------------------------------------------------------------------------

export interface ValidatorResult {
  validatorId: string;
  passed: boolean;
  message: string;
}

export interface ChallengeResult {
  allPassed: boolean;
  results: ValidatorResult[];
  passCount: number;
  totalCount: number;
}
