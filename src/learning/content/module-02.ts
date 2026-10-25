import { LearningModule } from '../types';
import { solution, REVIEWED_META } from './helpers';

const module02: LearningModule = {
  id: 'components-value-chains',
  index: 2,
  title: 'Components and value chains',
  tagline: 'A value chain traces every dependency from user need to underlying capability.',
  conceptIds: ['component', 'value-chain', 'dependency', 'visibility'],
  published: true,
  meta: { ...REVIEWED_META, version: 1 },

  explanation: `
## What is a component?

A **component** is anything your system, product, or organisation needs in order to serve the user's need. Components can be:

- Activities (things people do — "customer support")
- Practices (ways of doing things — "agile delivery")
- Data (structured information — "transaction log")
- Knowledge (know-how — "regulatory expertise")

The type matters less than the structure. What matters is: **what depends on what?**

### The value chain

A value chain is the sequence of dependencies from the user's need down to the components that ultimately enable it. If you draw an anchor at the top and follow the dependencies downward, you trace the full value chain.

In a well-drawn map, every component that appears serves the user's need — directly or indirectly. A component with no path to the anchor is either misplaced or irrelevant.

### Visibility

The y-axis is **visibility**: how visible is this component to the user?

- **High visibility** (top): the user sees and cares about it directly. "The cup of tea."
- **Low visibility** (bottom): it is essential but invisible. "The boiler."

Visibility is a judgment call, not a measurement. Two people mapping the same system may place a component at different heights — and both may be right for their purposes. What matters is that the *relative* ordering makes sense: things higher up depend on things lower down.

### Avoid over-engineering early

A first map is not a complete system diagram. Three to eight components with clear dependencies is often more useful than a detailed inventory. You can always add components as questions arise.

### The dependency arrow means "depends on"

An arrow from A → B means **A depends on B**. If B disappeared, A could not function. This is the direction of the arrow, even though value flows in the opposite direction (upward toward the user).
`,

  examples: [
    {
      id: 'newspaper-example',
      title: 'Online newspaper',
      description:
        'A reader needs to read current news. The value chain starts at the reader and goes through the article, the content management system, the hosting infrastructure, and finally the data centre power supply.',
      owmSource: `title Online Newspaper

anchor Reader [0.95, 0.08]

component Article [0.85, 0.25]
component CMS [0.60, 0.35]
component Web Hosting [0.40, 0.60]
component Power Supply [0.15, 0.85]

Reader->Article
Article->CMS
CMS->Web Hosting
Web Hosting->Power Supply`,
      annotations: [
        'The Reader is the anchor — their need is to stay informed.',
        'Article is the most visible component — the reader directly reads it.',
        'The CMS is less visible — the reader does not think about it.',
        'Web Hosting is infrastructure — invisible but essential.',
        'Power Supply is the commodity at the bottom. Readers never think about electricity.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-02-components-value-chains',
    version: 1,
    title: 'Extend your map with a full value chain',
    objective:
      'Build a map with one anchor, three or more components spanning at least two visibility levels, all connected.',
    conceptIds: ['component', 'dependency', 'visibility', 'value-chain'],
    starterOwm: `title Value chain practice

anchor Customer [0.95, 0.10]

// Add components below the Customer.
// Place more visible things near the top (high visibility number).
// Place infrastructure and underlying capabilities lower.`,
    instructions: [
      {
        id: 's1',
        instruction:
          'Start with a specific user need. Place the anchor near the top of the map.',
      },
      {
        id: 's2',
        instruction:
          'Add the component the user directly uses or experiences. Connect it to the anchor.',
      },
      {
        id: 's3',
        instruction:
          'What does that component depend on? Add at least one more component below it. Connect them.',
      },
      {
        id: 's4',
        instruction:
          'Continue the chain — what does *that* component depend on? Add at least one more level.',
      },
      {
        id: 's5',
        instruction:
          'Make sure all components are connected. An isolated component suggests something was forgotten.',
      },
    ],
    validators: [
      {
        id: 'v1-has-anchor',
        kind: 'has-anchor',
        minCount: 1,
        description: 'At least one anchor',
        rationale: 'The value chain must start from a user need.',
      },
      {
        id: 'v2-has-3-components',
        kind: 'has-component',
        minCount: 3,
        description: 'At least 3 non-anchor components',
        rationale:
          'A value chain with fewer than 3 components is usually incomplete. Real needs depend on multiple layers.',
      },
      {
        id: 'v3-has-2-deps',
        kind: 'has-dependency',
        minCount: 2,
        description: 'At least 2 dependencies',
        rationale: 'A chain needs connections.',
      },
      {
        id: 'v4-is-connected',
        kind: 'is-connected',
        description: 'All elements are reachable from an anchor',
        rationale: 'Every component must serve the user\'s need.',
      },
      {
        id: 'v5-multi-stage',
        kind: 'multi-stage',
        description: 'Components span more than one evolution stage',
        rationale:
          'Real value chains include components at different stages of evolution — not everything is equally mature.',
      },
    ],
    hints: [
      {
        level: 1,
        text: 'Start by listing 4–6 things the user\'s need depends on. Don\'t worry about placement yet.',
      },
      {
        level: 2,
        text: 'Order your list from "most visible to user" at the top to "most invisible and basic" at the bottom.',
      },
      {
        level: 3,
        text: 'For "multi-stage": spread components left to right. A web app is probably in "Custom Built" (middle), while internet connectivity is "Commodity" (right).',
      },
      {
        level: 4,
        text: 'Example: User → Website → Database → Cloud Storage → Electricity. Each depends on the next.',
      },
    ],
    rubric: [
      {
        id: 'r1',
        description: 'The chain flows logically from user-facing to infrastructure',
        reflectionOnly: true,
      },
      {
        id: 'r2',
        description: 'Components with higher visibility are positioned higher on the y-axis',
        reflectionOnly: true,
      },
      {
        id: 'r3',
        description: 'There are no "floating" components not needed by anything above them',
        reflectionOnly: true,
      },
    ],
    reflectionPrompts: [
      'Which component in your chain do you have the most control over? The least?',
      'Which component would cause the most disruption if it failed?',
      'Are there any components you left out that you know exist but felt were "obvious"?',
    ],
    sampleSolution: {
      explanation:
        'One possible value chain for an online grocery customer. Other decompositions are equally valid if each component serves the one above it.',
      build: solution(`title Online groceries
anchor Customer [0.95, 0.50]
component Online Shop [0.82, 0.55]
component Delivery [0.70, 0.45]
component Product Catalogue [0.55, 0.40]
component Payments [0.45, 0.80]
component Compute [0.15, 0.90]
Customer->Online Shop
Customer->Delivery
Online Shop->Product Catalogue
Online Shop->Payments
Product Catalogue->Compute`),
    },
  },

  reflectionPrompts: [
    'What is the difference between a dependency and a flow?',
    'How does the y-axis (visibility) relate to what a user cares about?',
  ],

  conceptLinks: [
    {
      id: 'simon-wardley-chp3',
      label: 'Wardley Maps — Chapter 3: Mapping',
      url: 'https://medium.com/wardleymaps/on-being-lost-2ef5f05eb1ec',
    },
  ],
};

export default module02;
