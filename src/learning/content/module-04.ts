import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const STARTER = `title Online bookshop

anchor Reader [0.95, 0.55]

component Website [0.85, 0.50]
component Recommendations [0.72, 0.20]
component Order Tracking [0.68, 0.45]
component Payments [0.55, 0.30]
component Warehouse System [0.40, 0.35]
component Servers [0.15, 0.30]
component Power [0.05, 0.92]

Reader->Website
Website->Recommendations
Website->Order Tracking
Website->Payments
Order Tracking->Warehouse System
Payments->Servers
Warehouse System->Servers
Recommendations->Servers
Servers->Power`;

const module04: LearningModule = {
  id: 'reading-complete-map',
  index: 4,
  title: 'Reading a complete map',
  tagline: 'Learn to extract strategic insight from a Wardley Map you did not draw.',
  conceptIds: ['reading', 'pattern', 'interpretation'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## A map is a conversation starter

When someone hands you a map, resist the urge to judge the drawing. The value of a map is the questions it lets a group ask. Reading one well means looking at it in a deliberate order.

### 1. Start at the top

Find the anchor and the need. Ask whether the need is described as a situation ("a reader wants a book delivered tomorrow") or as a solution ("a reader wants our website"). Everything else on the map should be justified by that need.

### 2. Follow the chain down

Trace each dependency from the anchor towards the bottom. For every component, ask: what does this need in order to work? Missing components are common — a map that jumps from "Website" straight to "Power" is hiding the interesting decisions.

### 3. Check the positions against the market

Evolution describes how mature and widespread a component is in the market, not how good your version is. Look for mismatches:

- a component placed in **Custom Built** that the market now treats as a **Product** or **Commodity** (you may be spending effort where others simply buy);
- a component placed far right that is actually new and uncertain;
- the same capability built twice in different parts of the chain (duplication).

### 4. Look for movement

Everything evolves through supply and demand competition. Ask which components are likely to move right, what would happen to the components that depend on them, and where people or contracts might resist that change (inertia).

### 5. Write down what you see

Observations are only useful if they are shared. Put notes directly on the map, explain debatable positions in descriptions, and draw evolve arrows for the movements you expect. Then let others disagree — that is the point.
`,

  examples: [
    {
      id: 'bookshop-reading',
      title: 'Reading the bookshop map',
      description:
        'The same bookshop map used in the challenge. The annotations show the kind of observations an experienced reader makes in the first few minutes.',
      owmSource: STARTER,
      annotations: [
        'Servers sit in Genesis, far left. Compute is widely available as a utility, so this position is either a mistake or a sign of an unusual in-house setup worth questioning.',
        'Payments is placed as Custom Built. Most organisations buy payment processing as a product or service — is there a real reason to build it?',
        'Recommendations is genuinely closer to the left: it is where the bookshop might differentiate itself, so investment there may be justified.',
        'Nothing is marked as resisting change. Ask who runs the Servers today and how they would feel about moving to a utility provider.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-04-reading-complete-map',
    version: 1,
    title: 'Read and annotate a map',
    objective: 'Study a complete map you did not draw, record at least two observations as notes, explain one in a component description, and mark one movement you expect.',
    conceptIds: ['reading', 'evolution', 'annotation'],
    starterOwm: STARTER,
    instructions: [
      { id: 's1', instruction: 'Start at the Reader and follow each dependency down. Is anything missing between the Website and the Servers?' },
      { id: 's2', instruction: 'Compare each component’s position with how the market treats it today. Note at least two places where you disagree or have a question (Map details → Notes → Add note, or `note text [visibility, evolution]` in the source).' },
      { id: 's3', instruction: 'Pick the observation you feel most strongly about and explain it in that component’s Description.' },
      { id: 's4', instruction: 'Select a component you expect to evolve, open the Evolution tab and add an evolve arrow.' },
    ],
    validators: [
      {
        id: 'v1-notes',
        kind: 'has-annotation',
        minCount: 2,
        description: 'At least two observations are recorded as notes on the map',
        rationale: 'Observations written on the map can be discussed and challenged; observations kept in your head cannot.',
        nextStep: 'With nothing selected, open the Details tab, scroll to Notes and choose Add note.',
      },
      {
        id: 'v2-explained',
        kind: 'component-has-description',
        description: 'One observation is explained in a component description',
        rationale: 'Explaining why you think a position is wrong turns an opinion into an argument others can test.',
        nextStep: 'Select the component you questioned and write your reasoning in its Description.',
      },
      {
        id: 'v3-movement',
        kind: 'has-evolution-movement',
        description: 'At least one expected movement is drawn as an evolve arrow',
        rationale: 'Reading a map includes reading where it is going, not only where it is.',
        nextStep: 'Select a component, open the Evolution tab and choose Add evolve arrow.',
      },
    ],
    hints: [
      { level: 1, text: 'Which component on this map would you be surprised to see a company build from scratch today?' },
      { level: 2, text: 'Evolution is about the market, not about your own implementation. A commodity bought from a provider sits far right even if your team finds it complicated.' },
      { level: 3, text: 'Look at Servers and Payments. Both are placed further left than most markets would place them today.' },
      { level: 4, text: 'For example: add a note "Compute is a utility — why are Servers in Genesis?", add a second note about Payments, describe Servers with your reasoning, and draw an evolve arrow moving Servers towards 0.9.' },
    ],
    rubric: [
      { id: 'r1', description: 'Notes describe observations or questions, not instructions', reflectionOnly: true },
      { id: 'r2', description: 'The explanation refers to the market, not only to the team’s own preference', reflectionOnly: true },
      { id: 'r3', description: 'The evolve arrow is plausible and its consequences for dependent components were considered', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which of your observations would you most like the map’s author to respond to?',
      'If your evolve arrow happens, which other components on the map are affected?',
    ],
    sampleSolution: {
      explanation:
        'One possible reading. Others might focus on Order Tracking or on the missing delivery components — both are valid observations.',
      build: solution(
        `${STARTER}

evolve Servers 0.90

note Compute is a utility - why are Servers in Genesis? [0.20, 0.40]
note Payments is usually bought, not built [0.58, 0.40]`,
        (map, id) => {
          map.elements.find((e) => e.id === id('Servers'))!.description =
            'Placed in Genesis, but compute is widely sold as a utility. Either this is a mistake or we run unusual hardware — worth asking.';
        }
      ),
    },
  },

  reflectionPrompts: [
    'What is the difference between disagreeing with a map and disagreeing with its author?',
    'Which reading step (top, chain, positions, movement) do you tend to skip?',
  ],

  conceptLinks: [
    { id: 'wardley-book', label: 'Simon Wardley — Wardley Maps (free online book)', url: 'https://medium.com/wardleymaps' },
    { id: 'owm-docs', label: 'OnlineWardleyMaps DSL reference', url: 'https://docs.onlinewardleymaps.com/' },
  ],
};

export default module04;
