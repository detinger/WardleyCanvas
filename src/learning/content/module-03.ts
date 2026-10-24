import { LearningModule } from '../types';

const module03: LearningModule = {
  id: 'visibility-evolution',
  index: 3,
  title: 'Visibility and evolution',
  tagline: 'Position tells you where a component is now — not where it should be.',
  conceptIds: ['visibility', 'evolution', 'genesis', 'commodity', 'stage'],
  published: true,

  explanation: `
## The two axes

A Wardley Map has two axes. You have already encountered visibility (y-axis). The second axis is **evolution** (x-axis), and it is what makes Wardley Maps distinctive.

### Evolution: left to right

The x-axis represents how mature or evolved a component is in the broader market:

| Stage | Description |
|---|---|
| **Genesis** (left) | New, uncertain, rare. Nobody knows the best way to do it. High variance, high experimentation. |
| **Custom Built** | Understood in principle but built specifically for each use case. Unstable, improving, often proprietary. |
| **Product (+ rental)** | Available off-the-shelf. Competing products exist. Well understood. |
| **Commodity (+ utility)** | Standard, widely available, interchangeable. Competed on price and availability. |

Evolution moves **left to right** over time — but not on a fixed schedule. A component evolves when the market develops it further. You cannot say "this will be a commodity in 5 years"; you can only say "based on what I observe, this is currently in Custom Built."

### Evolution is an observation, not a prescription

When you place a component on the evolution axis, you are **recording where it is in the current market**, not where you want it to be or where it will be. This is the single most common mistake in early maps.

If cloud object storage is now a utility, your map should show it on the right — regardless of whether your organisation treats it that way.

### Visibility and evolution are independent

A component can be highly visible but commodity (think: a phone call to customer support — visible, but telephony is a utility).

A component can be invisible but genesis (think: an internal ML model that no user sees, but is custom and experimental).

### What evolution is NOT

- It is not a maturity model for *your organisation's* capabilities.
- It is not a judgment about quality.
- It does not move at a fixed rate.
- It is not precise. Two people may place the same component one stage apart and both be reasonable.

The axis captures the *competitive* maturity of a capability in the external landscape.
`,

  examples: [
    {
      id: 'logistics-example',
      title: 'Logistics platform',
      description:
        'A logistics startup needs to deliver parcels. Some components are custom-built; others are commodities. The map shows how the same value chain spans all four evolution stages.',
      owmSource: `title Parcel Delivery Service

anchor Sender [0.95, 0.05]
anchor Recipient [0.90, 0.15]

component Route Optimisation [0.70, 0.15]
component Driver App [0.75, 0.30]
component Parcel Tracking [0.85, 0.45]
component Map Data [0.50, 0.65]
component Mobile Network [0.40, 0.85]
component GPS [0.30, 0.90]

Sender->Route Optimisation
Recipient->Parcel Tracking
Route Optimisation->Driver App
Driver App->Parcel Tracking
Driver App->Map Data
Driver App->Mobile Network
Parcel Tracking->GPS
Map Data->GPS`,
      annotations: [
        'Route Optimisation is genesis/custom — each logistics company builds their own competitive algorithm.',
        'Driver App is custom-built — important and differentiating, but apps in general are a known pattern.',
        'Parcel Tracking is becoming a product — multiple vendors offer it.',
        'Map Data is a commodity/product — Google Maps, HERE, OpenStreetMap.',
        'Mobile Network and GPS are utilities — fully commoditised infrastructure.',
      ],
    },
  ],

  challenge: {
    id: 'challenge-03-visibility-evolution',
    version: 1,
    title: 'Position components across evolution stages',
    objective:
      'Create a map where components are deliberately placed in at least two different evolution stages, reflecting their market maturity.',
    conceptIds: ['evolution', 'visibility', 'stage'],
    starterOwm: `title Evolution practice

anchor User [0.95, 0.10]

// Tip: Genesis = far left (evolution ~0.1)
// Custom Built = left-centre (~0.35)
// Product = right-centre (~0.60)
// Commodity = far right (~0.85)`,
    instructions: [
      {
        id: 's1',
        instruction:
          'Choose a domain you know: healthcare, retail, software, logistics, finance. Place your anchor.',
      },
      {
        id: 's2',
        instruction:
          'Add 3–5 components. For each one, ask: is this available as a commodity today? A standard product? Or is it still bespoke?',
      },
      {
        id: 's3',
        instruction:
          'Place components based on their **market maturity**, not your organisation\'s maturity. Cloud storage is a commodity even if you\'re not using it yet.',
      },
      {
        id: 's4',
        instruction:
          'Connect everything into a value chain. Make sure at least one component is left-of-centre (genesis or custom) and one is right-of-centre (product or commodity).',
      },
    ],
    validators: [
      {
        id: 'v1-has-anchor',
        kind: 'has-anchor',
        minCount: 1,
        description: 'At least one anchor',
        rationale: 'Positioning only makes sense relative to a user need.',
      },
      {
        id: 'v2-has-components',
        kind: 'has-component',
        minCount: 3,
        description: 'At least 3 components',
        rationale: 'You need enough components to show a spread across the axis.',
      },
      {
        id: 'v3-connected',
        kind: 'is-connected',
        description: 'All elements are connected',
        rationale: 'Every component must serve the need.',
      },
      {
        id: 'v4-multi-stage',
        kind: 'multi-stage',
        description: 'Components span at least 2 evolution stages',
        rationale:
          'The whole point of this challenge is to use the evolution axis. A map with all components in one stage misses the key insight.',
      },
    ],
    hints: [
      {
        level: 1,
        text: 'Evolution is about the broader market, not your company. Ask: "Could I go to a vendor and buy this today as a standard product?"',
      },
      {
        level: 2,
        text: 'Electricity, internet bandwidth, basic cloud storage, standard databases, email delivery — all commodities. Place them on the right.',
      },
      {
        level: 3,
        text: 'Custom algorithms, proprietary models, novel UX flows, unique processes — these are genesis or custom-built. Place them on the left.',
      },
      {
        level: 4,
        text: 'Example spread: User → Custom Algorithm (left, genesis) → Standard API (centre, product) → Cloud Infrastructure (right, commodity).',
      },
    ],
    rubric: [
      {
        id: 'r1',
        description: 'Evolution positions reflect market maturity, not internal process maturity',
        reflectionOnly: true,
      },
      {
        id: 'r2',
        description: 'The most novel or custom component is left of standard/commodity components',
        reflectionOnly: true,
      },
    ],
    reflectionPrompts: [
      'Which component surprised you most in terms of where it sits on the evolution axis?',
      'If a competitor used commodity versions of your custom components, how would that change the landscape?',
      'Are there any components where reasonable people might disagree on the stage? Why?',
    ],
  },

  reflectionPrompts: [
    'Why does evolution move left to right, and what forces drive it?',
    'How is the evolution axis different from a maturity model?',
  ],

  conceptLinks: [
    {
      id: 'wardley-evolution',
      label: 'Wardley Maps — Evolution explained',
      url: 'https://medium.com/wardleymaps/finding-a-path-cdb1249078c0',
    },
  ],
};

export default module03;
