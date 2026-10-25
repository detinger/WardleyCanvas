// ANL-04: Gameplay catalog with attribution, context, risks, and ethical review prompts.
// Each entry has a stable ID. Source: Wardley Maps (Simon Wardley, CC BY-SA 4.0).
// IMPORTANT: All gameplay entries MUST include risks and ethical review prompts.
// These are strategic hypotheses — not instructions or guarantees.

import { CatalogProvenance, WARDLEY_CATALOG_PROVENANCE } from './catalog-meta';

export type GameplayCategory =
  | 'basic-operations'
  | 'user-perception'
  | 'accelerators'
  | 'deaccelerators'
  | 'market'
  | 'defensive'
  | 'attacking'
  | 'ecosystem'
  | 'positional'
  | 'competitor';

export interface GameplayCatalogEntry extends CatalogProvenance {
  id: string;
  version: number;
  category: GameplayCategory;
  shortTitle: string;
  description: string;
  intendedEffect: string;
  prerequisites: string[];
  risks: string[];
  counterplays: string[];
  /** Ethical and legal review prompts — required field */
  ethicalReviewPrompts: string[];
  /** Shown beside sensitive plays (competition law, manipulation, harm) */
  caution?: string;
  attribution: string;
}

const ATTR = 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)';

const GAMEPLAY_CATALOG_BASE: Omit<GameplayCatalogEntry, keyof CatalogProvenance>[] = [
  // ---------------------------------------------------------------------------
  // Basic operations
  // ---------------------------------------------------------------------------
  {
    id: 'gp-001',
    version: 1,
    category: 'basic-operations',
    shortTitle: 'Open approach',
    description:
      'Release a component (source code, data, standard, specification) into the open to commoditise it, removing competitors\' advantage or reducing ecosystem friction.',
    intendedEffect:
      'Accelerates commoditisation of the target component, shifting competitive advantage to adjacent higher-order activities.',
    prerequisites: [
      'You have an established capability in the component',
      'Competitors rely on the same component as a differentiator',
      'You are positioned to benefit from the adjacent layer once commoditised',
    ],
    risks: [
      'May commoditise components you have not yet extracted value from',
      'Community development may not be sufficient to maintain quality',
      'Competitors may also benefit from the commoditisation',
    ],
    counterplays: ['Embrace and extend', 'Fork and differentiate'],
    ethicalReviewPrompts: [
      'Are any intellectual property rights of third parties involved?',
      'Could opening this component harm contributors or downstream users?',
      'Is the licensing clear and fair to all contributors?',
    ],
    attribution: ATTR,
  },
  {
    id: 'gp-002',
    version: 1,
    category: 'basic-operations',
    shortTitle: 'Exploit advantage before commoditisation',
    description:
      'Maximise returns from a component while it remains in custom or product stage before it inevitably commoditises. Invest in adjacent genesis work in parallel.',
    intendedEffect:
      'Extracts maximum value from current advantage while building the next wave of differentiation.',
    prerequisites: [
      'You have a clear lead in a component that is approaching commodity',
      'The timeline of commoditisation can be estimated reasonably',
    ],
    risks: [
      'Overestimating remaining window may result in being caught off-guard',
      'Under-investing in next-wave genesis work while exploiting current advantage',
    ],
    counterplays: ['Accelerate commoditisation via open approach', 'Build alternative product quickly'],
    ethicalReviewPrompts: [
      'Does exploiting this advantage involve any lock-in practices that harm users?',
      'Are pricing or availability tactics here fair to customers with limited alternatives?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // User perception
  // ---------------------------------------------------------------------------
  {
    id: 'gp-003',
    version: 1,
    category: 'user-perception',
    shortTitle: 'Emphasise user-visible differentiation',
    description:
      'Invest in the visible parts of the value chain — the user experience, branding, and reliability that users directly evaluate — while treating lower-level infrastructure as commodities.',
    intendedEffect:
      'Captures user preference and loyalty through visible quality while reducing cost in invisible layers.',
    prerequisites: [
      'You can identify which components are visible to users',
      'Infrastructure layers are available as commodity',
    ],
    risks: [
      'Visible improvements may not address the underlying value chain structure',
      'Overinvestment in presentation while infrastructure deteriorates',
    ],
    counterplays: ['Compete on infrastructure efficiency', 'Expose the underlying commodity to users directly'],
    ethicalReviewPrompts: [
      'Does this approach create misleading impressions about product capabilities?',
      'Are claims about quality or differentiation accurate and verifiable?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Accelerators
  // ---------------------------------------------------------------------------
  {
    id: 'gp-004',
    version: 1,
    category: 'accelerators',
    shortTitle: 'Education and awareness',
    description:
      'Invest in educating users, developers, or the market about a capability to accelerate adoption and commoditise the space faster.',
    intendedEffect:
      'Increases awareness and adoption speed, which drives competitive consolidation and rewards early movers.',
    prerequisites: [
      'There is genuine market confusion or low awareness about the capability',
      'Education does not primarily benefit competitors',
    ],
    risks: [
      'May educate competitors as much as customers',
      'High investment with uncertain return timeline',
    ],
    counterplays: ['Counter-narrative', 'FUD (fear, uncertainty, doubt) about the new approach'],
    ethicalReviewPrompts: [
      'Is the educational content accurate and balanced, or promotional?',
      'Are claims about maturity or reliability substantiated?',
    ],
    attribution: ATTR,
  },
  {
    id: 'gp-005',
    version: 1,
    category: 'accelerators',
    shortTitle: 'Exploit network effects',
    description:
      'Build or invest in a component whose value increases with adoption. First-mover advantage compounds as network effects create switching costs for competitors.',
    intendedEffect:
      'Creates a self-reinforcing adoption loop that makes displacement increasingly costly.',
    prerequisites: [
      'The component has genuine network effects (value increases with users)',
      'You can achieve critical mass before a competitor',
    ],
    risks: [
      'Network effects can reverse rapidly once a competitor achieves critical mass',
      'May create anti-competitive lock-in that attracts regulatory attention',
    ],
    counterplays: ['Data portability requirements', 'Open alternative with interoperability'],
    ethicalReviewPrompts: [
      'Does this create lock-in that harms users who later wish to leave?',
      'Are network effects here consistent with competition and consumer protection law?',
      'Does this disadvantage smaller or newer competitors unfairly?',
    ],
    caution:
      'Network effects can lock users in. Check that users can leave with their data and that the play does not rely on deceptive design or on suppressing interoperability.',
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Deaccelerators
  // ---------------------------------------------------------------------------
  {
    id: 'gp-006',
    version: 1,
    category: 'deaccelerators',
    shortTitle: 'Raising barriers to entry',
    description:
      'Invest in capabilities, standards, or certifications that competitors would need to replicate to compete, making entry more expensive and time-consuming.',
    intendedEffect:
      'Slows competitor entry and maintains current market position for longer.',
    prerequisites: [
      'Barriers are based on legitimate capability rather than exclusionary practices',
      'The barrier does not primarily harm users',
    ],
    risks: [
      'High barriers may also prevent ecosystem growth and innovation',
      'May trigger regulatory scrutiny if interpreted as anti-competitive',
    ],
    counterplays: ['Open alternative', 'Regulatory challenge', 'Coalition building among competitors'],
    ethicalReviewPrompts: [
      'Are the barriers raised through genuine capability or exclusionary practices?',
      'Could this be interpreted as anti-competitive behaviour in your jurisdiction?',
      'Does this harm users or smaller competitors in ways that are disproportionate?',
    ],
    caution:
      'Raising barriers can breach competition law (for example exclusive dealing, tying or abuse of a dominant position) and can harm users by reducing choice. Take legal advice before acting.',
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Market
  // ---------------------------------------------------------------------------
  {
    id: 'gp-007',
    version: 1,
    category: 'market',
    shortTitle: 'Create a platform',
    description:
      'Build a two-sided or multi-sided platform that connects suppliers and consumers, capturing value through the transactions or interactions facilitated.',
    intendedEffect:
      'Creates a high-value marketplace position that benefits from both sides of the ecosystem and is difficult to displace once established.',
    prerequisites: [
      'There is a genuine matching problem between supply and demand',
      'You can attract sufficient participants on both sides to achieve liquidity',
    ],
    risks: [
      'Cold-start problem requires heavy subsidisation of one side',
      'Platform may be displaced if either side finds a direct connection',
      'Governance failures can undermine trust on both sides',
    ],
    counterplays: ['Disintermediation by one side', 'Regulatory intervention', 'Competing platform with better terms'],
    ethicalReviewPrompts: [
      'Are the terms fair to both sides of the platform?',
      'Does the platform create exploitative conditions for weaker participants (e.g., gig workers)?',
      'How are disputes between participants handled fairly?',
    ],
    attribution: ATTR,
  },
  {
    id: 'gp-008',
    version: 1,
    category: 'market',
    shortTitle: 'Category creation',
    description:
      'Define a new market category around a capability you own, framing the competitive landscape so that you are the reference point rather than a contender in an existing race.',
    intendedEffect:
      'Shifts user evaluation criteria to ones where you have a natural lead, making direct comparison with incumbents harder.',
    prerequisites: [
      'You have a genuinely differentiated capability that does not fit existing categories cleanly',
      'Resources to invest in category education and positioning',
    ],
    risks: [
      'Category may not gain market acceptance',
      'High marketing investment with uncertain payoff',
      'Incumbents may reframe their offerings to fit the new category',
    ],
    counterplays: ['Absorb the category framing', 'Reframe to make the category seem niche'],
    ethicalReviewPrompts: [
      'Is the category definition accurate, or does it create misleading impressions?',
      'Are comparisons with competitors fair and based on verifiable criteria?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Defensive
  // ---------------------------------------------------------------------------
  {
    id: 'gp-009',
    version: 1,
    category: 'defensive',
    shortTitle: 'Talent acquisition',
    description:
      'Recruit key people who possess rare skills or knowledge in a component area, reducing competitors\' ability to execute in that area.',
    intendedEffect:
      'Increases your capability while reducing competitor capability in the targeted area.',
    prerequisites: [
      'The skill in question is genuinely scarce and hard to replicate quickly',
      'Compensation and working environment can compete with alternatives',
    ],
    risks: [
      'Talent may leave with knowledge',
      'May be seen as anti-competitive if used to strip competitors of critical personnel',
    ],
    counterplays: ['Counter-offers', 'Develop internal talent rather than acquire externally'],
    ethicalReviewPrompts: [
      'Are non-compete clauses being used in ways that restrict individuals\' livelihood?',
      'Is this acquisition fair to the individuals involved, including notice and transition?',
    ],
    caution:
      'Hiring to deprive a competitor of talent can raise anti-poaching and competition-law concerns, and no-poach agreements are unlawful in many jurisdictions. Treat people as people, not as pieces to deny an opponent.',
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Attacking
  // ---------------------------------------------------------------------------
  {
    id: 'gp-010',
    version: 1,
    category: 'attacking',
    shortTitle: 'Constraint removal',
    description:
      'Identify a constraint in the existing landscape — a bottleneck, a regulation, a technology gap — and invest in removing it to unlock value that incumbents cannot easily capture.',
    intendedEffect:
      'Opens new value chains and market positions that were previously inaccessible.',
    prerequisites: [
      'A genuine constraint exists that limits value creation for users',
      'You have the capability to remove or circumvent the constraint',
    ],
    risks: [
      'Removing a constraint may create new bottlenecks elsewhere',
      'Incumbents may respond by building the same constraint removal',
    ],
    counterplays: ['Restore constraint through standards or regulation', 'Build a parallel constraint in a different area'],
    ethicalReviewPrompts: [
      'If the constraint is a regulation, is circumventing it legal and ethical?',
      'Does removing this constraint create externalities for other parties not represented in the map?',
    ],
    attribution: ATTR,
  },
  {
    id: 'gp-011',
    version: 1,
    category: 'attacking',
    shortTitle: 'Involve the user in value creation',
    description:
      'Shift value creation toward users themselves — through self-service, APIs, or community contribution — reducing your production cost while increasing user engagement and lock-in.',
    intendedEffect:
      'Reduces cost of production and increases user investment in the platform, improving retention.',
    prerequisites: [
      'Users have sufficient technical or domain capability to contribute value',
      'The contribution mechanism is designed to be low friction',
    ],
    risks: [
      'Quality of user-contributed content may degrade experience for others',
      'If contributions are unpaid, raises questions about fair compensation',
    ],
    counterplays: ['Competitor with professional content', 'Community fragmentation'],
    ethicalReviewPrompts: [
      'Are users fairly compensated or acknowledged for the value they contribute?',
      'Are the terms of contribution clear and not exploitative?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Ecosystem
  // ---------------------------------------------------------------------------
  {
    id: 'gp-012',
    version: 1,
    category: 'ecosystem',
    shortTitle: 'Cultivate an ecosystem',
    description:
      'Deliberately invest in third-party developers, partners, or complementors who build on your platform, multiplying the value you deliver without proportional cost.',
    intendedEffect:
      'Creates a self-sustaining ecosystem that is difficult to displace and increases switching costs for users.',
    prerequisites: [
      'A stable, well-documented platform layer that third parties can build on',
      'Governance and incentive structures that make participation worthwhile',
    ],
    risks: [
      'Ecosystem participants may build competing products on your platform',
      'Poor governance erodes trust and drives participants to alternatives',
    ],
    counterplays: ['Fork the ecosystem', 'Compete with ecosystem participants using internal products'],
    ethicalReviewPrompts: [
      'Are ecosystem participation terms fair to developers and partners?',
      'Do you compete unfairly with ecosystem participants using information asymmetry?',
      'Are smaller ecosystem participants protected from arbitrary changes to the platform?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Positional
  // ---------------------------------------------------------------------------
  {
    id: 'gp-013',
    version: 1,
    category: 'positional',
    shortTitle: 'Exploit weak signals early',
    description:
      'Invest in genesis-stage capabilities before they become visible to competitors. Early positioning in a future commodity enables first-mover advantage in the next layer of value.',
    intendedEffect:
      'Establishes a position in the future landscape before the cost of entry rises.',
    prerequisites: [
      'Ability to read weak signals and identify future commoditisation candidates',
      'Risk tolerance for genesis-stage investment with uncertain timelines',
    ],
    risks: [
      'May invest in capabilities that never commoditise',
      'Timing may be wrong — too early is effectively wrong',
    ],
    counterplays: ['Wait and copy', 'Invest in multiple competing genesis bets'],
    ethicalReviewPrompts: [
      'Does early positioning involve suppressing information that competitors would benefit from knowing?',
      'Are any of the "weak signals" derived from data that was shared in confidence?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Competitor
  // ---------------------------------------------------------------------------
  {
    id: 'gp-014',
    version: 1,
    category: 'competitor',
    shortTitle: 'Sweat the asset',
    description:
      'Maximise utilisation and efficiency of a commodity component while competitors continue to pay custom-built costs, using the cost advantage to invest in differentiated layers.',
    intendedEffect:
      'Creates a structural cost advantage that can be sustained as long as the component remains commodity.',
    prerequisites: [
      'You have adopted a commodity version of a component that competitors have not',
      'The cost savings are material relative to competitors',
    ],
    risks: [
      'Competitors may catch up, eliminating the advantage',
      'Over-optimisation for the commodity layer may create rigidity',
    ],
    counterplays: ['Accelerate adoption of the commodity across the industry', 'Differentiate on other dimensions'],
    ethicalReviewPrompts: [
      'Does the cost advantage affect pricing in ways that harm users or distort the market?',
      'Are any worker or environmental externalities associated with the efficiency gain?',
    ],
    attribution: ATTR,
  },
];

export const GAMEPLAY_CATALOG: GameplayCatalogEntry[] = GAMEPLAY_CATALOG_BASE.map((entry) => ({
  ...entry,
  ...WARDLEY_CATALOG_PROVENANCE,
}));

export function getGameplayEntry(id: string): GameplayCatalogEntry | undefined {
  return GAMEPLAY_CATALOG.find((e) => e.id === id);
}

export const GAMEPLAY_CATEGORIES: { id: GameplayCategory; label: string }[] = [
  { id: 'basic-operations', label: 'Basic operations' },
  { id: 'user-perception', label: 'User perception' },
  { id: 'accelerators', label: 'Accelerators' },
  { id: 'deaccelerators', label: 'Deaccelerators' },
  { id: 'market', label: 'Market' },
  { id: 'defensive', label: 'Defensive' },
  { id: 'attacking', label: 'Attacking' },
  { id: 'ecosystem', label: 'Ecosystem' },
  { id: 'positional', label: 'Positional' },
  { id: 'competitor', label: 'Competitor' },
];
