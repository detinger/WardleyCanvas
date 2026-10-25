import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const STARTER = `title Newspaper publisher

anchor Reader [0.95, 0.60]

component News Content [0.82, 0.40]
component Print Edition [0.70, 0.75]
component Online Edition [0.68, 0.55]
component Printing Press [0.45, 0.70]
component Content Management [0.40, 0.55]
component Hosting [0.15, 0.88]

Reader->News Content
News Content->Print Edition
News Content->Online Edition
Print Edition->Printing Press
Online Edition->Content Management
Content Management->Hosting`;

const module05: LearningModule = {
  id: 'climate-inertia',
  index: 5,
  title: 'Climate and inertia',
  tagline: 'External forces shape the landscape — whether you act on them or not.',
  conceptIds: ['climate', 'inertia', 'pattern'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## Climate: the rules of the game

Climatic patterns are forces that affect every player in a landscape, whatever they decide to do. You cannot choose them, but you can anticipate them. A few that come up on almost every map:

- **Everything evolves.** Through supply and demand competition, components move from Genesis towards Commodity. The speed varies, but the direction is consistent.
- **Characteristics change as components evolve.** Uncertain, rare and fast-changing things become standardised, widespread and stable. The way you manage a component should change with it.
- **Efficiency enables innovation.** When a component becomes a commodity, it becomes a cheap building block for new things higher up the chain.
- **Past success breeds inertia.** The more you have invested in a way of doing things, the harder it is to change when the landscape moves.

Treat each pattern as a **question to ask of your map**, not as a fact the map proves. "Does this apply here, and what is our evidence?" is the right posture.

## Inertia: resistance to change

Inertia is anything that makes an organisation resist a change it would benefit from. Common sources are:

- sunk investment in assets, such as a printing press or a data centre;
- skills and identity built around the old way of working;
- contracts, suppliers and revenue that depend on the current position;
- leadership that was rewarded for past success.

On a map, inertia is drawn as a barrier in front of a component that is expected to evolve. It does not stop evolution in the market — it stops **you** from moving with it.

## Avoid two traps

1. **Do not turn evolution into a calendar.** An evolve arrow shows direction. It does not say "in 18 months".
2. **Do not assume every component moves at the same speed.** Some markets move in years, others in decades.
`,

  examples: [
    {
      id: 'newspaper-climate',
      title: 'A publisher facing evolution',
      description: 'The newspaper map used in the challenge, read through climatic patterns.',
      owmSource: `${STARTER}

evolve Content Management 0.80
inertia Printing Press`,
      annotations: [
        'Content Management is evolving towards a product: many publishers now buy rather than build it. The evolve arrow records that expectation.',
        'The Printing Press carries inertia: large sunk investment, skilled staff and long-term contracts all resist moving readers online.',
        'The climate pattern "past success breeds inertia" applies to Print Edition — the more profitable print has been, the harder it is to change.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-05-climate-inertia',
    version: 1,
    title: 'Spot climate and inertia',
    objective: 'Mark where inertia exists and explain its source, assess one climatic pattern with a rationale, and draw one movement you expect.',
    conceptIds: ['climate', 'inertia', 'evolution'],
    starterOwm: STARTER,
    instructions: [
      { id: 's1', instruction: 'Choose a component where the organisation is likely to resist change. Select it and tick Inertia in the Details tab.' },
      { id: 's2', instruction: 'In the same component’s Description, explain where the inertia comes from (investment, skills, contracts, culture…).' },
      { id: 's3', instruction: 'Open Analysis → Climate. Mark one pattern as applies, does not apply or uncertain, choose the affected components and write your rationale.' },
      { id: 's4', instruction: 'Draw an evolve arrow for a component you expect the market to move, from the Evolution tab.' },
    ],
    validators: [
      {
        id: 'v1-inertia',
        kind: 'has-inertia',
        description: 'At least one component is marked with inertia',
        rationale: 'Naming where you will resist change is the first step to managing it.',
        nextStep: 'Select a component and tick “Inertia (resistant to movement)” in the Details tab.',
      },
      {
        id: 'v2-inertia-source',
        kind: 'custom',
        description: 'A component with inertia explains the source of that inertia',
        rationale: 'Inertia with no stated cause cannot be addressed. Different sources need different responses.',
        nextStep: 'Select the component with inertia and describe why it resists change in its Description.',
        predicate: (map) => map.elements.some((e) => e.inertia && (e.description ?? '').trim().length > 0),
      },
      {
        id: 'v3-climate',
        kind: 'has-climate-assessment',
        description: 'One climatic pattern is assessed with a rationale',
        rationale: 'Climate patterns are questions to ask of the map; recording your answer and reasons makes it reviewable.',
        nextStep: 'Open Analysis → Climate, pick a state for a pattern and fill in the Rationale.',
      },
      {
        id: 'v4-movement',
        kind: 'has-evolution-movement',
        description: 'At least one expected movement is drawn',
        rationale: 'Everything evolves; showing which way lets you discuss the consequences.',
      },
    ],
    hints: [
      { level: 1, text: 'Where has this organisation invested the most money, people or pride?' },
      { level: 2, text: 'Inertia lives with the organisation, not with the market. The market can move while you stand still.' },
      { level: 3, text: 'The Printing Press is a strong candidate: sunk capital, specialist staff and print advertising revenue.' },
      { level: 4, text: 'Tick Inertia on Printing Press and describe the investment and contracts behind it. Assess “Past success creates inertia” as applies to Print Edition, and draw an evolve arrow moving Content Management to about 0.8.' },
    ],
    rubric: [
      { id: 'r1', description: 'The stated source of inertia is specific (not just “people don’t like change”)', reflectionOnly: true },
      { id: 'r2', description: 'The climate rationale refers to something observable in this landscape', reflectionOnly: true },
      { id: 'r3', description: 'The evolve arrow is about market maturity, not a delivery plan', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'What evidence would change your mind about the climatic pattern you assessed?',
      'Which source of inertia in your own organisation is hardest to talk about openly?',
    ],
    sampleSolution: {
      explanation: 'One possible answer. You might reasonably have chosen Print Edition or the newsroom’s skills as the main source of inertia instead.',
      build: solution(
        `${STARTER}

evolve Content Management 0.80
inertia Printing Press`,
        (map, id) => {
          map.elements.find((e) => e.id === id('Printing Press'))!.description =
            'Large sunk investment, specialist staff and long-term print advertising contracts all resist moving readers online.';
          map.analysis.climate.push({
            id: 'sample-climate',
            catalogId: 'cp-003',
            appliesToIds: [id('Print Edition'), id('Printing Press')],
            state: 'applies',
            rationale: 'Print has been profitable for decades, which makes it hard to prioritise the online edition.',
            evidenceIds: [],
            confidence: 'medium',
          });
        }
      ),
    },
  },

  reflectionPrompts: [
    'Why is it useful to separate climate (what happens anyway) from your own choices?',
    'How would you know if you were overestimating how fast a component will evolve?',
  ],

  conceptLinks: [
    { id: 'wardley-climate', label: 'Simon Wardley — Wardley Maps: climatic patterns', url: 'https://medium.com/wardleymaps' },
  ],
};

export default module05;
