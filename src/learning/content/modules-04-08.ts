// Stub modules 4–8 — published: false until implemented in later iterations.
import { LearningModule } from '../types';

const STUB_CHALLENGE = (id: string): LearningModule['challenge'] => ({
  id,
  version: 1,
  title: 'Coming soon',
  objective: 'This challenge is being prepared.',
  conceptIds: [],
  instructions: [],
  validators: [],
  hints: [],
  rubric: [],
  reflectionPrompts: [],
});

export const module04: LearningModule = {
  id: 'reading-complete-map',
  index: 4,
  title: 'Reading a complete map',
  tagline: 'Learn to extract strategic insight from a Wardley Map you did not draw.',
  conceptIds: ['reading', 'pattern', 'interpretation'],
  published: false,
  explanation: 'Coming soon.',
  examples: [],
  challenge: STUB_CHALLENGE('challenge-04'),
  reflectionPrompts: [],
  conceptLinks: [],
};

export const module05: LearningModule = {
  id: 'climate-inertia',
  index: 5,
  title: 'Climate and inertia',
  tagline: 'External forces shape the landscape — whether you act on them or not.',
  conceptIds: ['climate', 'inertia', 'pattern'],
  published: false,
  explanation: 'Coming soon.',
  examples: [],
  challenge: STUB_CHALLENGE('challenge-05'),
  reflectionPrompts: [],
  conceptLinks: [],
};

export const module06: LearningModule = {
  id: 'doctrine-operating-context',
  index: 6,
  title: 'Doctrine and operating context',
  tagline: 'Universal principles that reduce unforced error — regardless of position.',
  conceptIds: ['doctrine', 'principle', 'operating'],
  published: false,
  explanation: 'Coming soon.',
  examples: [],
  challenge: STUB_CHALLENGE('challenge-06'),
  reflectionPrompts: [],
  conceptLinks: [],
};

export const module07: LearningModule = {
  id: 'gameplay-hypotheses',
  index: 7,
  title: 'Gameplay hypotheses',
  tagline: 'Strategic moves are hypotheses — not instructions or guarantees.',
  conceptIds: ['gameplay', 'hypothesis', 'strategy'],
  published: false,
  explanation: 'Coming soon.',
  examples: [],
  challenge: STUB_CHALLENGE('challenge-07'),
  reflectionPrompts: [],
  conceptLinks: [],
};

export const module08: LearningModule = {
  id: 'scenario-comparison-decisions',
  index: 8,
  title: 'Scenario comparison and decisions',
  tagline: 'Compare futures, record the decision, and track what you expected.',
  conceptIds: ['scenario', 'decision', 'comparison'],
  published: false,
  explanation: 'Coming soon.',
  examples: [],
  challenge: STUB_CHALLENGE('challenge-08'),
  reflectionPrompts: [],
  conceptLinks: [],
};
