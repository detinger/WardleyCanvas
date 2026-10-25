import { LearningModule } from '../types';
import { solution, DRAFT_META } from './helpers';

const STARTER = `title Regional hospital records

anchor Clinician [0.95, 0.45]

component Patient Record [0.85, 0.50]
component Records System [0.65, 0.35]
component Data Centre [0.30, 0.40]
component Network [0.15, 0.85]

Clinician->Patient Record
Patient Record->Records System
Records System->Data Centre
Data Centre->Network`;

const module08: LearningModule = {
  id: 'scenario-comparison-decisions',
  index: 8,
  title: 'Scenario comparison and decisions',
  tagline: 'Compare futures, record the decision, and track what you expected.',
  conceptIds: ['scenario', 'decision', 'comparison'],
  published: true,
  meta: { ...DRAFT_META, version: 1 },

  explanation: `
## From one map to several futures

A map shows the landscape as you understand it today. Strategy means choosing between possible futures. A **scenario** is a named set of changes to a baseline map — components moving, appearing or disappearing — together with the **assumptions** that would have to be true for that future to happen.

Comparing scenarios is useful because it makes differences explicit. Instead of arguing about a whole strategy, a team can ask: *which change do we disagree about, and why?*

## What a good scenario contains

- **A fixed baseline.** The scenario describes changes relative to a specific version of the map. The baseline itself is never edited.
- **Typed changes.** “Move Data Centre to Commodity”, “Add Cloud Records Service”, “Remove Records System”.
- **Assumptions with confidence and evidence.** “Our regulator will approve cloud hosting of patient data (medium confidence).”
- **Consequences** — which components are affected, in which direction, and how uncertain that is.
- **Invalidation signals** — what you would see if the assumptions turned out to be wrong.

## Scenarios are not predictions

Scenario rules can point out effects such as “this change disconnects a component from any user”. They cannot tell you which future will happen. Avoid language like “will” and “guaranteed”; prefer “if our assumptions hold…”.

## Record the decision

When you choose, write a **decision record**: the selected scenario, the rejected alternatives, the rationale, the signals you expect to see, the conditions under which you would stop, and a date to review it. Decision records are never edited afterwards — if you change your mind, you write a new record that supersedes the old one. That history is how an organisation learns whether its maps were any good.

In the editor, the **Scenario comparison** button on a saved map opens the full scenario workspace. In this challenge you practise the core skill on a single map: expressing a proposed future and the signals that would test it.
`,

  examples: [
    {
      id: 'hospital-scenario',
      title: 'Two futures for patient records',
      description: 'A baseline hospital map and the changes one scenario proposes.',
      owmSource: `${STARTER}

evolve Data Centre 0.85
evolve Records System 0.60`,
      annotations: [
        'Scenario A, “Move to cloud”: the Data Centre is replaced by a utility (evolve to Commodity) and the Records System moves towards a product.',
        'Assumption: the regulator approves cloud hosting of patient data. Invalidation signal: draft guidance restricts it.',
        'Scenario B, “Modernise in place”, would keep the Data Centre and only rebuild the Records System. Comparing the two shows the real disagreement is about the regulator, not the technology.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-08-scenarios',
    version: 1,
    title: 'Express a future and how to test it',
    objective: 'Draw a proposed future as at least two evolve arrows, explain why with a rationale, and record a hypothesis with a leading signal, a risk and a stop condition.',
    conceptIds: ['scenario', 'assumption', 'decision'],
    starterOwm: STARTER,
    instructions: [
      { id: 's1', instruction: 'Decide what future you want to explore for this hospital. Draw it as evolve arrows on at least two components.' },
      { id: 's2', instruction: 'Give at least one evolve arrow a rationale: what would have to be true for this movement to happen?' },
      { id: 's3', instruction: 'Add a gameplay hypothesis for the move (for example “Constraint removal” or “Create a platform”) with a rationale, a leading signal, a risk and a stop condition.' },
      { id: 's4', instruction: 'Optional: save this as a real map and open Scenario comparison to compare it against an alternative and record a decision.' },
    ],
    validators: [
      {
        id: 'v1-arrows',
        kind: 'has-evolution-movement',
        minCount: 2,
        description: 'The proposed future changes at least two components',
        rationale: 'A future that moves only one component rarely captures the knock-on effects that make scenarios worth comparing.',
        nextStep: 'Select another component, open the Evolution tab and add an evolve arrow.',
      },
      {
        id: 'v2-rationale',
        kind: 'evolution-has-rationale',
        description: 'At least one movement states its assumption',
        rationale: 'Assumptions are what you are really choosing between. Writing them down shows what to monitor.',
        nextStep: 'In the Evolution tab, fill in “Rationale — why will it move?”.',
      },
      {
        id: 'v3-hypothesis',
        kind: 'has-gameplay-hypothesis',
        description: 'A hypothesis has a rationale, a leading signal and a risk',
        rationale: 'Signals and risks are how you will find out whether the chosen future is unfolding.',
      },
      {
        id: 'v4-stop',
        kind: 'custom',
        description: 'A hypothesis has at least one stop condition',
        rationale: 'Deciding in advance when to stop protects you from escalating commitment to a failing plan.',
        nextStep: 'In the hypothesis, fill in “Stop conditions”.',
        predicate: (map) => map.analysis.gameplay.some((g) => (g.stopConditions ?? []).some((s) => s.trim())),
      },
    ],
    hints: [
      { level: 1, text: 'What is the biggest uncertainty about this hospital’s future — technology, regulation, money or people?' },
      { level: 2, text: 'An assumption is something outside your control that must be true for the future to happen.' },
      { level: 3, text: 'Moving the Data Centre towards Commodity and the Records System towards Product is one coherent future.' },
      { level: 4, text: 'Evolve Data Centre to 0.85 with the rationale “regulator approves cloud hosting”, evolve Records System to 0.6, and add “Constraint removal” with signal “guidance published”, risk “migration disrupts clinical work” and stop condition “guidance restricts cloud hosting”.' },
    ],
    rubric: [
      { id: 'r1', description: 'The assumption is outside the organisation’s direct control', reflectionOnly: true },
      { id: 'r2', description: 'The stop condition could actually be observed', reflectionOnly: true },
      { id: 'r3', description: 'No statement presents the future as certain', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'What would an alternative scenario for this hospital look like?',
      'When should this decision be reviewed, and by whom?',
    ],
    sampleSolution: {
      explanation: 'One possible future. “Modernise in place” or a shared regional records platform would be equally valid scenarios to explore.',
      build: solution(
        `${STARTER}

evolve Data Centre 0.85
evolve Records System 0.60`,
        (map, id) => {
          map.evolutions.find((e) => e.elementId === id('Data Centre'))!.rationale =
            'Assumes the regulator approves cloud hosting of patient data.';
          map.analysis.gameplay.push({
            id: 'sample-play',
            catalogId: 'gp-010',
            appliesToIds: [id('Data Centre')],
            state: 'considering',
            rationale: 'Running our own data centre constrains how fast the records system can change.',
            evidenceIds: [],
            confidence: 'medium',
            category: 'basic-operations',
            intendedEffect: 'Hosting becomes a utility so effort shifts to clinical features.',
            leadingSignals: ['Regulator publishes cloud hosting guidance'],
            stopConditions: ['Guidance restricts cloud hosting of patient data'],
            risks: ['Migration disrupts clinical work'],
            humanReviewed: true,
          });
        }
      ),
    },
  },

  reflectionPrompts: [
    'Why should decision records never be edited after the fact?',
    'How does comparing scenarios change the conversation compared with presenting one plan?',
  ],

  conceptLinks: [
    { id: 'wardley-scenarios', label: 'Simon Wardley — Wardley Maps (free online book)', url: 'https://medium.com/wardleymaps' },
  ],
};

export default module08;
