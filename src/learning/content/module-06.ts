import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const STARTER = `title Council planning service

anchor Resident [0.95, 0.50]

component Planning Application [0.85, 0.40]
component Online Form [0.72, 0.65]
component Case Management [0.55, 0.35]
component Document Storage [0.35, 0.80]
component Hosting [0.12, 0.90]

Resident->Planning Application
Planning Application->Online Form
Planning Application->Case Management
Case Management->Document Storage
Document Storage->Hosting
Online Form->Hosting`;

const module06: LearningModule = {
  id: 'doctrine-operating-context',
  index: 6,
  title: 'Doctrine and operating context',
  tagline: 'Universal principles that reduce unforced error — regardless of position.',
  conceptIds: ['doctrine', 'principle', 'operating'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## Doctrine: what generally works

Climate is about the landscape. **Doctrine** is about how you operate in it. Doctrine principles are practices that tend to help almost any organisation, whatever its position, because they reduce self-inflicted mistakes. Examples:

- **Know your users** and **focus on user needs**, not on the solutions you happen to have.
- **Use a common language** so that teams can challenge each other’s assumptions.
- **Remove duplication and bias** — the same capability built twice is a cost and a confusion.
- **Use appropriate methods.** Exploratory, agile approaches suit Genesis; lean product management suits Product; standardised, efficiency-focused methods suit Commodity. One method everywhere is a mistake.
- **Manage inertia** and **manage failure** deliberately rather than hoping they will not happen.

Doctrine is often presented in phases, from “stop self-harm” to more advanced practices. Earlier phases are usually worth getting right before later ones.

## Assessing doctrine honestly

A doctrine assessment asks: **how far is this principle actually practised here?** The states are *not started*, *emerging*, *practiced*, *embedded* and *not applicable*.

Good assessments are:

- **specific** — they say which part of the organisation or which components the principle applies to;
- **evidenced** — they point to something observable, such as a meeting, a document or a metric, not just a feeling;
- **owned and dated** — someone is responsible for reviewing them again.

## Not a score

It is tempting to turn doctrine into a percentage. Resist it. A number hides *which* principles are missing and invites gaming. Use transparent counts, such as “6 assessed, 2 need review”, and talk about the gaps.
`,

  examples: [
    {
      id: 'planning-doctrine',
      title: 'Doctrine in a public service',
      description: 'The council planning service used in the challenge.',
      owmSource: STARTER,
      annotations: [
        '“Know your users”: the team has interviewed residents who applied for planning permission in the last year — evidence that the principle is practised.',
        '“Use appropriate methods”: Document Storage is a commodity but is managed with a bespoke, change-controlled process — a sign that methods are not matched to evolution.',
        'Each assessment names the components it applies to, so the doctrine conversation stays tied to the map.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-06-doctrine',
    version: 1,
    title: 'Assess doctrine with evidence',
    objective: 'Assess at least two doctrine principles with a rationale and back at least one of them with an evidence record.',
    conceptIds: ['doctrine', 'evidence'],
    starterOwm: STARTER,
    instructions: [
      { id: 's1', instruction: 'Open Analysis → Doctrine. Read the observable signals for “Know your users” and choose the state that matches this service.' },
      { id: 's2', instruction: 'Write a rationale and choose the components the principle applies to.' },
      { id: 's3', instruction: 'Assess a second principle the same way.' },
      { id: 's4', instruction: 'Under Evidence, choose New evidence and record what you observed. It is linked to the assessment automatically.' },
    ],
    validators: [
      {
        id: 'v1-doctrine',
        kind: 'has-doctrine-assessment',
        minCount: 2,
        description: 'At least two doctrine principles are assessed with a rationale',
        rationale: 'One principle gives a single data point; two start to show a pattern in how the organisation operates.',
        nextStep: 'Open Analysis → Doctrine, choose a state for a principle and fill in its Rationale.',
      },
      {
        id: 'v2-evidence',
        kind: 'assessment-has-evidence',
        description: 'At least one assessment is backed by evidence',
        rationale: 'An assessment without evidence is an opinion. Evidence makes it possible for others to agree, disagree or update it later.',
        nextStep: 'In an assessment, choose New evidence, describe what you observed and add it.',
      },
    ],
    hints: [
      { level: 1, text: 'What would you have to see in this team to believe it really knows its users?' },
      { level: 2, text: 'Evidence is something observable: research notes, a usage metric, a complaint log, a meeting record.' },
      { level: 3, text: '“Use appropriate methods” and “Know your users” are good starting points for this map.' },
      { level: 4, text: 'Assess “Know your users” as practiced, citing resident interviews as evidence, and “Use appropriate methods” as emerging for Document Storage, with your reasoning.' },
    ],
    rubric: [
      { id: 'r1', description: 'Each rationale refers to observable behaviour, not intentions', reflectionOnly: true },
      { id: 'r2', description: 'The evidence would convince a sceptical colleague', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which principle did you find hardest to assess honestly? Why?',
      'What would move your weakest principle up one state?',
    ],
    sampleSolution: {
      explanation: 'One possible assessment. Your states may differ — what matters is that the rationale and evidence support them.',
      build: solution(STARTER, (map, id) => {
        map.analysis.evidence.push({
          id: 'sample-evidence',
          claim: 'Twelve residents who applied in the last year were interviewed in March.',
          sourceLabel: 'User research notes',
          confidence: 'high',
        });
        map.analysis.doctrine.push(
          {
            id: 'sample-doc-1',
            catalogId: 'dc-102',
            appliesToIds: [id('Planning Application')],
            state: 'applies',
            rationale: 'The team regularly talks to residents and changes the service based on what they hear.',
            evidenceIds: ['sample-evidence'],
            confidence: 'high',
            capabilityState: 'practiced',
          },
          {
            id: 'sample-doc-2',
            catalogId: 'dc-107',
            appliesToIds: [id('Document Storage')],
            state: 'applies',
            rationale: 'Document Storage is a commodity but is changed through a slow bespoke process designed for novel work.',
            evidenceIds: [],
            confidence: 'medium',
            capabilityState: 'emerging',
          }
        );
      }),
    },
  },

  reflectionPrompts: [
    'Why might a single doctrine percentage be harmful?',
    'How does doctrine differ from climate and from gameplay?',
  ],

  conceptLinks: [
    { id: 'wardley-doctrine', label: 'Simon Wardley — Wardley Maps: doctrine', url: 'https://medium.com/wardleymaps' },
  ],
};

export default module06;
