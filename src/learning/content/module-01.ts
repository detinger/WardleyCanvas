import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const module01: LearningModule = {
  id: 'purpose-users-needs',
  index: 1,
  title: 'Purpose, users, and needs',
  tagline: 'Every useful map starts with who has a need — not with a solution.',
  conceptIds: ['anchor', 'user-need', 'value-chain-top'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## Why start with the user?

A Wardley Map is a tool for situational awareness — understanding the landscape your organisation operates in so you can reason about what to do next. But a map without a purpose is just a drawing.

The first question is always: **who has a need?** Not "what technology should we use" or "what should we build" — but who is the person or organisation whose need you are trying to serve?

### Anchors

In Wardley Map notation, the entity with the need is called an **anchor** (sometimes labelled "user" or "customer"). Anchors sit at the **top of the map**, at the visible end of the value chain. Everything below an anchor exists only because it serves that need — directly or indirectly.

You can have multiple anchors on one map if different users have distinct needs that share underlying components. But it is usually better to start with one.

### The need is not the solution

A common mistake is to write the anchor's *want* instead of their *need*. For example:
- ❌ "User needs a React app" — that is a solution, not a need.
- ✅ "User needs to track inventory across warehouses" — that describes the situation.

Capturing needs rather than solutions keeps the map honest. If the real need turns out to be served by a spreadsheet, the map should reflect that.

### What goes at the top?

The anchor sits at high visibility (near the top of the map's y-axis) because it is directly visible to whoever is responsible for the map. The components that satisfy the need sit below — and they become less and less visible to the end user as you go further down the value chain.

### Start small

Your first map does not need to be complete. A map with one anchor, three components, and two dependencies is more useful than a half-finished attempt at "the whole company". Clarity of scope beats breadth.
`,

  examples: [
    {
      id: 'tea-shop-example',
      title: 'Tea shop customer',
      description:
        'A tea shop serves a customer who needs a hot cup of tea. The anchor is the Customer, positioned high on the visibility axis. The components they directly perceive — the tea cup — are near the top. The hot water and water supply that make tea possible are less visible.',
      owmSource: `title Tea Shop (example)

anchor Customer [0.95, 0.05]

component Tea Cup [0.80, 0.45]
component Hot Water [0.65, 0.35]
component Water [0.35, 0.70]

Customer->Tea Cup
Tea Cup->Hot Water
Hot Water->Water`,
      annotations: [
        'The Customer (anchor) sits near the top — they are the most visible entity.',
        'Tea Cup is what the customer directly perceives. It is highly visible.',
        'Hot Water serves Tea Cup but the customer does not think about it directly.',
        'Water is the commodity that flows through everything — invisible to the customer, essential to the chain.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-01-purpose-users-needs',
    version: 1,
    title: 'Map a real user need',
    objective: 'Create a map with at least one anchor representing a real person or organisation, connected to at least two components.',
    conceptIds: ['anchor', 'user-need', 'dependency'],
    starterOwm: `title My first map

// Tip: replace "User" with a real person or role.
// What do they actually need — not what you want to build for them.
anchor User [0.95, 0.10]`,
    instructions: [
      {
        id: 's1',
        instruction:
          'Think of a user or customer. What situation are they in? What are they trying to accomplish? Rename the anchor to reflect who they are (e.g. "Nurse", "Small business owner", "Online shopper").',
      },
      {
        id: 's2',
        instruction:
          'Add a component that is directly visible to this user — something they interact with or experience. Connect it to the anchor with a dependency.',
      },
      {
        id: 's3',
        instruction:
          'Add at least one more component that the first component depends on. This second component is less visible — the user probably does not think about it directly.',
      },
      {
        id: 's4',
        instruction:
          'Open the inspector and add a short description to the anchor explaining what the user\'s need actually is.',
      },
    ],
    validators: [
      {
        id: 'v1-has-anchor',
        kind: 'has-anchor',
        minCount: 1,
        description: 'Map has at least one anchor (user/stakeholder)',
        rationale:
          'Every Wardley Map needs an anchor to express whose need is being served. Without one, the map has no defined purpose.',
        nextStep: 'Add an anchor with the toolbar (A) and name it after a real role, such as "Nurse" or "Online shopper".',
      },
      {
        id: 'v2-has-components',
        kind: 'has-component',
        minCount: 2,
        description: 'Map has at least 2 components',
        rationale:
          'A value chain needs at least two levels to show that needs depend on other things.',
        nextStep: 'Add a component the user directly experiences, then one it relies on.',
      },
      {
        id: 'v3-has-dependency',
        kind: 'has-dependency',
        minCount: 1,
        description: 'At least one dependency connects elements',
        rationale:
          'Dependencies show what depends on what. Without them the map is just a list.',
        nextStep: 'Select the anchor, open the Connections tab and choose what it depends on.',
      },
      {
        id: 'v4-is-connected',
        kind: 'is-connected',
        description: 'All elements are reachable from the anchor',
        rationale:
          'Every component should serve the user\'s need — directly or indirectly. Isolated components suggest scope that hasn\'t been explained.',
        nextStep: 'Connect each loose component to something above it, or remove it if it is out of scope.',
      },
      {
        id: 'v5-anchor-description',
        kind: 'anchor-has-description',
        description: 'The anchor has a description explaining the user need',
        rationale:
          'Writing the need in words forces you to be specific. "User needs a dashboard" is weaker than "User needs to answer operational questions in under 2 minutes without calling the team".',
        nextStep: 'Select the anchor and complete its Description: "This person is trying to…".',
      },
    ],
    hints: [
      {
        level: 1,
        text: 'Think about a specific situation: a nurse at the end of a shift, a customer in a supermarket, an engineer deploying code at 2am. Specificity makes the map useful.',
      },
      {
        level: 2,
        text: 'The anchor\'s description should complete the sentence: "This person is trying to ___". Avoid "use the app" or "have access to the platform" — those are solutions.',
      },
      {
        level: 3,
        text: 'For the second component (the less-visible one), ask: "what does the first component need in order to work?" Hot water needs water. A form needs a database. An API needs a server.',
      },
      {
        level: 4,
        text: 'If you\'re stuck, use this structure: Anchor "Customer" → Component "Website" → Component "Database". Replace each name with something from your own context.',
      },
    ],
    rubric: [
      {
        id: 'r1',
        description: 'The anchor name reflects a real role or person, not "User"',
        reflectionOnly: true,
      },
      {
        id: 'r2',
        description: 'The description expresses a need (situation/goal), not a solution',
        reflectionOnly: true,
      },
      {
        id: 'r3',
        description: 'The value chain flows logically from visible to less visible',
        reflectionOnly: true,
      },
    ],
    reflectionPrompts: [
      'What would change about your map if the user\'s real need was slightly different?',
      'Is there anything in your value chain that the user directly sees, but you placed lower on the map? Why?',
      'Who else might have a need served by parts of this same value chain?',
    ],
    sampleSolution: {
      explanation:
        'One possible map: a commuter whose need is a reliable morning coffee. Your map can be entirely different and still be valid.',
      build: solution(
        `title Morning coffee
anchor Commuter [0.95, 0.40]
component Cup of Coffee [0.80, 0.45]
component Coffee Machine [0.55, 0.60]
component Power [0.20, 0.90]
Commuter->Cup of Coffee
Cup of Coffee->Coffee Machine
Coffee Machine->Power`,
        (map, id) => {
          map.elements.find((e) => e.id === id('Commuter'))!.description =
            'Is trying to get a reliable coffee on the way to work in under five minutes.';
        }
      ),
    },
  },

  reflectionPrompts: [
    'What is the difference between a user\'s want and their need?',
    'Why is it useful to start a strategy conversation with users rather than technology?',
  ],

  conceptLinks: [
    {
      id: 'owm-docs',
      label: 'OnlineWardleyMaps DSL reference',
      url: 'https://docs.onlinewardleymaps.com/',
    },
    {
      id: 'simon-wardley-book',
      label: 'Simon Wardley — Wardley Maps (free online book)',
      url: 'https://medium.com/wardleymaps',
    },
  ],
};

export default module01;
