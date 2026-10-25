import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const STARTER = `title Mapping tool vendor

anchor Strategy Team [0.95, 0.55]

component Mapping App [0.85, 0.45]
component Map Format [0.65, 0.25]
component Collaboration [0.60, 0.50]
component Rendering Engine [0.45, 0.40]
component Cloud Hosting [0.12, 0.90]

Strategy Team->Mapping App
Mapping App->Map Format
Mapping App->Collaboration
Mapping App->Rendering Engine
Collaboration->Cloud Hosting
Rendering Engine->Cloud Hosting`;

const module07: LearningModule = {
  id: 'gameplay-hypotheses',
  index: 7,
  title: 'Gameplay hypotheses',
  tagline: 'Strategic moves are hypotheses — not instructions or guarantees.',
  conceptIds: ['gameplay', 'hypothesis', 'strategy'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## Gameplay: deliberate moves

Once you understand the landscape (the map), the forces acting on it (climate) and how you operate (doctrine), you can consider **gameplay**: context-specific actions intended to change the landscape in your favour. Examples from the catalog include:

- **Open approaches** — releasing a component, such as a format or library, to speed up its commoditisation and shift competition elsewhere.
- **Create a platform** — turning a component others depend on into a service they build upon.
- **Cultivate an ecosystem** — encouraging others to build on your components so you can sense what they need.

Unlike doctrine, gameplay depends entirely on context. A move that is brilliant on one map is foolish on another.

## Write plays as hypotheses

A play on a map is a **hypothesis**, not an instruction. A good hypothesis states:

1. **What it affects** — the components involved.
2. **The intended change** — usually shown as an evolve arrow.
3. **Why it fits** — the rationale, linked to climate or doctrine observations and to evidence.
4. **Leading signals** — what you would expect to see early if it is working.
5. **Stop conditions** — what would make you abandon it.
6. **Risks and harms** — including harms to users, partners or the wider market.

## Ethics and law are part of the play

Some plays can be manipulative, anti-competitive or harmful: raising barriers to entry, spreading fear and doubt about competitors, locking users in. The catalog marks these with cautions and ethical review prompts. Before any play leaves the map, a person should deliberately review its risks, harms and legal position. If you would not be comfortable explaining the play to the people it affects, treat that as a stop condition.
`,

  examples: [
    {
      id: 'open-format',
      title: 'Opening a map format',
      description: 'The mapping tool vendor in the challenge considers publishing its map format as an open standard.',
      owmSource: `${STARTER}

evolve Map Format 0.75`,
      annotations: [
        'The play is “Open approach” applied to Map Format: publishing the format should speed its move towards a commodity standard.',
        'The intended effect is shown as an evolve arrow on Map Format.',
        'Leading signal: other tools adopt the format within a year. Stop condition: a competitor forks it in an incompatible way.',
        'Risk: the vendor gives away something competitors can use — the hypothesis must say why value shifts to Collaboration instead.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-07-gameplay',
    version: 1,
    title: 'Write a gameplay hypothesis',
    objective: 'Add one gameplay as a hypothesis with a rationale, a leading signal and a risk, back it with evidence, and show its intended effect as an evolve arrow.',
    conceptIds: ['gameplay', 'hypothesis', 'evidence'],
    starterOwm: STARTER,
    instructions: [
      { id: 's1', instruction: 'Open Analysis → Gameplay, read a play’s risks and ethical prompts, and choose Add as hypothesis.' },
      { id: 's2', instruction: 'Fill in the rationale, the affected components, at least one leading signal and at least one risk.' },
      { id: 's3', instruction: 'Add an evidence record that supports the hypothesis.' },
      { id: 's4', instruction: 'Draw the intended change as an evolve arrow on the affected component (Evolution tab).' },
      { id: 's5', instruction: 'When you have considered the risks and ethics, tick the review box.' },
    ],
    validators: [
      {
        id: 'v1-hypothesis',
        kind: 'has-gameplay-hypothesis',
        description: 'A gameplay hypothesis has a rationale, a leading signal and a risk',
        rationale: 'Without signals and risks a play is a wish. These fields turn it into something you can test and stop.',
        nextStep: 'Open your hypothesis in Analysis → Gameplay and complete Rationale, Leading signals and Risks.',
      },
      {
        id: 'v2-evidence',
        kind: 'assessment-has-evidence',
        description: 'The analysis is backed by evidence',
        rationale: 'Evidence keeps plays grounded in the landscape rather than in enthusiasm.',
        nextStep: 'In the hypothesis, choose New evidence and record what supports it.',
      },
      {
        id: 'v3-effect',
        kind: 'has-evolution-movement',
        description: 'The intended effect is drawn as an evolve arrow',
        rationale: 'Most plays aim to change how a component evolves; drawing it makes the intended effect explicit.',
      },
    ],
    hints: [
      { level: 1, text: 'Which component on this map would the vendor benefit from seeing become a standard?' },
      { level: 2, text: 'A leading signal is something you would see early, before the final outcome — for example adoption by others.' },
      { level: 3, text: '“Open approach” on Map Format is a natural fit for this map.' },
      { level: 4, text: 'Add “Open approach”, apply it to Map Format, signal “two other tools adopt the format within a year”, risk “competitors benefit from our work”, add evidence such as customer requests for interoperability, and evolve Map Format to about 0.75.' },
    ],
    rubric: [
      { id: 'r1', description: 'The rationale explains why this play fits this landscape specifically', reflectionOnly: true },
      { id: 'r2', description: 'At least one risk considers harm to others, not just to the organisation', reflectionOnly: true },
      { id: 'r3', description: 'A clear stop condition exists', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'What would you need to see to abandon this play?',
      'Who could be harmed if this play succeeds?',
    ],
    sampleSolution: {
      explanation: 'One possible hypothesis. A platform or ecosystem play could be equally valid on this map.',
      build: solution(
        `${STARTER}

evolve Map Format 0.75`,
        (map, id) => {
          map.analysis.evidence.push({
            id: 'sample-evidence',
            claim: 'Eight of our ten largest customers asked to exchange maps with other tools.',
            sourceLabel: 'Customer interviews',
            confidence: 'medium',
          });
          map.analysis.gameplay.push({
            id: 'sample-play',
            catalogId: 'gp-001',
            appliesToIds: [id('Map Format')],
            state: 'considering',
            rationale: 'Customers want interoperability; an open format moves competition to collaboration features, where we are strongest.',
            evidenceIds: ['sample-evidence'],
            confidence: 'medium',
            category: 'basic-operations',
            intendedEffect: 'Map Format becomes a shared standard; value shifts to Collaboration.',
            leadingSignals: ['Two other tools adopt the format within a year'],
            stopConditions: ['A competitor forks the format incompatibly'],
            risks: ['Competitors benefit from our work without contributing'],
            humanReviewed: true,
          });
        }
      ),
    },
  },

  reflectionPrompts: [
    'Why is it dangerous to treat a gameplay catalog as a list of recommendations?',
    'How would you explain your play to the people it affects?',
  ],

  conceptLinks: [
    { id: 'wardley-gameplay', label: 'Simon Wardley — Wardley Maps: gameplay', url: 'https://medium.com/wardleymaps' },
  ],
};

export default module07;
