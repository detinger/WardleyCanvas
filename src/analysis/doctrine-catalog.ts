// ANL-03: Wardley doctrine catalog.
// Organized by phase. Stable IDs — do not change once published.
// Source: Wardley Maps (Simon Wardley, CC BY-SA 4.0).

export type DoctrinePhase = 'I' | 'II' | 'III' | 'IV';

export interface DoctrineCatalogEntry {
  id: string;
  version: number;
  phase: DoctrinePhase;
  phaseLabel: string;
  category: string;
  shortTitle: string;
  definition: string;
  /** Observable behaviours that indicate this principle is in practice */
  observableSignals: string[];
  /** Signs that the principle is absent or violated */
  counterSignals: string[];
  /** Reflection questions — not a prescriptive score */
  reflectionPrompts: string[];
  attribution: string;
}

const ATTR = 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)';

export const DOCTRINE_CATALOG: DoctrineCatalogEntry[] = [
  // ---------------------------------------------------------------------------
  // Phase I: Stop self-harm
  // ---------------------------------------------------------------------------
  {
    id: 'dc-101',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Communication',
    shortTitle: 'Use a common language',
    definition:
      'Develop and use a shared vocabulary for strategy — maps, positions, and movements — so that teams can communicate without ambiguity and challenge assumptions directly.',
    observableSignals: [
      'Maps are used as the basis for strategy discussions',
      'Teams refer to evolution stages by name in conversation',
      'Decisions are documented with landscape context',
    ],
    counterSignals: [
      'Strategy is expressed only in spreadsheets or slides',
      'Different teams use incompatible terminology for the same concepts',
    ],
    reflectionPrompts: [
      'Could two different teams read your current strategy documents and draw the same map?',
      'What terms does your organisation use that are undefined or contested?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-102',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Awareness',
    shortTitle: 'Know your users',
    definition:
      'Understand who uses the system, what they need (not what they want), and how those needs are served by the components on the map. Needs drive anchor placement.',
    observableSignals: [
      'Anchors on maps are named after real user types, not internal teams',
      'User needs are expressed as observable outcomes',
      'There is a process for regularly revisiting user needs',
    ],
    counterSignals: [
      'Anchors are abstract (e.g., "The Business") with no clear need attached',
      'No mechanism for learning about user needs from observation',
    ],
    reflectionPrompts: [
      'For each anchor on this map: who specifically is this user, and what is their actual need?',
      'How do you currently learn what users need?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-103',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Awareness',
    shortTitle: 'Understand the landscape',
    definition:
      'Map the environment as it currently exists — not as you wish it were, not as it was, and not as a roadmap to a future state. The map is an observation tool.',
    observableSignals: [
      'Maps distinguish "current position" from "proposed movement"',
      'Components are placed by market maturity, not by organisational preference',
      'Maps are updated when the landscape changes',
    ],
    counterSignals: [
      'Evolution positions reflect internal capability assessments rather than market maturity',
      'Maps are treated as aspirational artefacts rather than situational snapshots',
    ],
    reflectionPrompts: [
      'Which positions on this map reflect external observation vs. internal preference?',
      'When did this map last change based on new information about the landscape?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-104',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Learning',
    shortTitle: 'Use a systematic mechanism of learning',
    definition:
      'Strategy requires continuous learning. Build feedback loops — maps evolve as the landscape evolves. Avoid purely static strategy documents.',
    observableSignals: [
      'Maps are revisited on a defined cadence or after significant events',
      'Past map predictions are compared to outcomes',
      'There is a practice of testing assumptions explicitly',
    ],
    counterSignals: [
      'Strategy documents are reviewed less than annually',
      'No practice of asking "what did we expect vs. what happened?"',
    ],
    reflectionPrompts: [
      'What is your current mechanism for updating your understanding of the landscape?',
      'Which assumptions in this map have not been tested recently?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-105',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Organisation',
    shortTitle: 'Be transparent',
    definition:
      'Make maps, assumptions, and rationale visible to those who need to act on them. Hidden strategy prevents challenge and correction.',
    observableSignals: [
      'Maps are shared with teams who must execute on them',
      'Assumptions underlying strategic positions are explicit',
      'Team members can challenge maps without political risk',
    ],
    counterSignals: [
      'Strategy is held by a small group and communicated as directives',
      'Teams are not shown the reasoning behind their priorities',
    ],
    reflectionPrompts: [
      'Who has access to this map and the reasoning behind it?',
      'Are there assumptions here that teams are not aware of?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-106',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Organisation',
    shortTitle: 'Move fast',
    definition:
      'Reduce organisational inertia to be able to respond to landscape change. Speed matters; the ability to pivot matters more than the perfection of any single plan.',
    observableSignals: [
      'Decision cycles are measured and deliberately shortened',
      'Teams can deploy or change without extensive approval chains',
      'The time from decision to action is tracked',
    ],
    counterSignals: [
      'Strategic decisions require many layers of approval',
      'Long planning cycles that prevent rapid response to change',
    ],
    reflectionPrompts: [
      'What is the current cycle time from strategic decision to visible action?',
      'What approval chains slow down responses to landscape changes?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-107',
    version: 1,
    phase: 'I',
    phaseLabel: 'Stop self-harm',
    category: 'Organisation',
    shortTitle: 'Remove bias and use appropriate methods',
    definition:
      'Different evolutionary stages require different management approaches. Genesis requires exploration; commodity requires efficiency. Using the wrong method for the stage is waste.',
    observableSignals: [
      'Genesis-stage work is managed for exploration (experiments, hypotheses)',
      'Commodity-stage work is managed for operational efficiency',
      'Method selection is explicit, not habitual',
    ],
    counterSignals: [
      'All work is managed with the same methodology regardless of stage',
      'KPIs designed for commodity are applied to genesis work',
    ],
    reflectionPrompts: [
      'Which components on this map are being managed with a method mismatched to their stage?',
      'Do your planning and governance processes distinguish between genesis and commodity work?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Phase II: Becoming more context-aware
  // ---------------------------------------------------------------------------
  {
    id: 'dc-201',
    version: 1,
    phase: 'II',
    phaseLabel: 'Context awareness',
    category: 'Execution',
    shortTitle: 'Manage inertia',
    definition:
      'Recognise sources of organisational inertia — technical debt, cultural attachment, financial commitment — and actively manage them. Inertia is strongest where it is most dangerous.',
    observableSignals: [
      'Inertia is explicitly marked on maps',
      'Teams actively track and address technical and organisational debt',
      'There is a process for reviewing and retiring outdated practices',
    ],
    counterSignals: [
      'Resistance to change is treated as a permanent constraint rather than a managed risk',
      'Outdated practices persist because of cultural attachment, not strategic choice',
    ],
    reflectionPrompts: [
      'Which components or practices on this map have the most inertia?',
      'What would need to happen to overcome the most significant inertia barrier here?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-202',
    version: 1,
    phase: 'II',
    phaseLabel: 'Context awareness',
    category: 'Execution',
    shortTitle: 'Manage failure',
    definition:
      'Plan for component failure. In genesis, failure is expected and informative. In commodity, failure is unacceptable. Manage accordingly — the appropriate risk tolerance changes with stage.',
    observableSignals: [
      'Genesis experiments have explicit failure criteria and learning extraction',
      'Commodity components have SLAs, redundancy, and incident plans',
      'Post-mortems distinguish between "expected exploration failure" and "operational failure"',
    ],
    counterSignals: [
      'All failures are treated with the same severity regardless of stage',
      'No distinction between intentional experiments and operational outages',
    ],
    reflectionPrompts: [
      'What is the expected failure rate for genesis-stage components on this map?',
      'Are commodity components resilient enough to meet user expectations?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-203',
    version: 1,
    phase: 'II',
    phaseLabel: 'Context awareness',
    category: 'Organisation',
    shortTitle: 'Use appropriate structures',
    definition:
      'Organise teams around the evolutionary stage of the work. Small, autonomous teams for genesis; centralised, efficient operations for commodity. Conway\'s Law means structure affects what you can build.',
    observableSignals: [
      'Team structures differ across genesis, custom, product, and commodity work',
      'Teams producing commodity capabilities are optimised for efficiency and reliability',
      'Experimental teams are shielded from operational metrics',
    ],
    counterSignals: [
      'All work is performed by identically structured teams regardless of nature',
      'Experimental teams burdened with operational metrics that penalise exploration',
    ],
    reflectionPrompts: [
      'Are the teams responsible for genesis work structured for exploration?',
      'Are commodity-stage teams free to focus on efficiency without being drawn into experimentation?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-204',
    version: 1,
    phase: 'II',
    phaseLabel: 'Context awareness',
    category: 'Execution',
    shortTitle: 'Use standards where appropriate',
    definition:
      'Adopt standards for commodity and product components to reduce costs and facilitate interoperability. Avoid premature standardisation of genesis activities, which forecloses learning.',
    observableSignals: [
      'Commodity components use open or industry standards',
      'Standards adoption is a deliberate choice, not an accidental default',
      'No attempt to standardise components in genesis stage',
    ],
    counterSignals: [
      'Proprietary formats used for commodity capabilities without strategic justification',
      'Standards imposed on genesis-stage work, constraining exploration',
    ],
    reflectionPrompts: [
      'Which components on this map could benefit from adopting existing standards?',
      'Are there areas where premature standardisation is preventing useful learning?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-205',
    version: 1,
    phase: 'II',
    phaseLabel: 'Context awareness',
    category: 'Awareness',
    shortTitle: 'Focus on user needs (not solutions)',
    definition:
      'Components exist to serve user needs. The value chain must be traced from anchors to infrastructure. Solutions that don\'t serve an observable user need are waste.',
    observableSignals: [
      'Every component on the map traces to at least one anchor',
      'Decisions about components start from user needs, not technology preferences',
      'Disconnected components are challenged before being built or maintained',
    ],
    counterSignals: [
      'Components exist because "we\'ve always done it this way" rather than serving a current need',
      'Technology investments disconnected from visible user outcomes',
    ],
    reflectionPrompts: [
      'Can you trace every component on this map to a user anchor?',
      'Are there components here that no longer serve a user need?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Phase III: Better for users
  // ---------------------------------------------------------------------------
  {
    id: 'dc-301',
    version: 1,
    phase: 'III',
    phaseLabel: 'Better for users',
    category: 'Strategy',
    shortTitle: 'Exploit the landscape',
    definition:
      'Use positional awareness to identify and act on strategic opportunities — open-source plays, ecosystem development, constraint removal — before competitors do.',
    observableSignals: [
      'Maps are used to identify underserved positions in the landscape',
      'Decisions include analysis of competitor positions',
      'Landscape changes are anticipated rather than reacted to',
    ],
    counterSignals: [
      'Strategy is based on internal capability rather than landscape position',
      'Competitive moves are reacted to, not anticipated',
    ],
    reflectionPrompts: [
      'What strategic moves does this map suggest that you have not yet taken?',
      'Which competitor positions are you tracking on this map?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-302',
    version: 1,
    phase: 'III',
    phaseLabel: 'Better for users',
    category: 'Execution',
    shortTitle: 'Think aptitude and attitude',
    definition:
      'Different evolutionary contexts require different people and approaches. Genesis needs pioneers; commodity needs settlers/town-planners. Matching aptitude and attitude to context improves outcomes.',
    observableSignals: [
      'Teams are staffed based on the evolutionary context of the work',
      'Pioneers are not expected to scale and optimise; they explore',
      'Town planners are not expected to innovate; they industrialise',
    ],
    counterSignals: [
      'All work assigned to generic "development teams" regardless of evolutionary stage',
      'High explorers frustrated by operational demands; high operators frustrated by ambiguity',
    ],
    reflectionPrompts: [
      'Do you have the right mix of pioneers, settlers, and town planners for this map?',
      'Are team members assigned to work matching their aptitude and the evolutionary stage?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-303',
    version: 1,
    phase: 'III',
    phaseLabel: 'Better for users',
    category: 'Organisation',
    shortTitle: 'Distribute power and decision-making',
    definition:
      'Push decision-making to the teams closest to the information. Command-and-control structures slow response time and introduce information loss at every layer.',
    observableSignals: [
      'Teams make operational decisions without escalation',
      'Strategic decisions are made with context from teams, not imposed top-down',
      'Empowerment is explicit and not contingent on seniority',
    ],
    counterSignals: [
      'Minor decisions require senior approval',
      'Strategic direction is set without input from teams with landscape knowledge',
    ],
    reflectionPrompts: [
      'What decisions are currently made centrally that teams could make better?',
      'Do the teams responsible for this map have the authority to act on it?',
    ],
    attribution: ATTR,
  },

  // ---------------------------------------------------------------------------
  // Phase IV: Continuously improving
  // ---------------------------------------------------------------------------
  {
    id: 'dc-401',
    version: 1,
    phase: 'IV',
    phaseLabel: 'Continuously improving',
    category: 'Learning',
    shortTitle: 'Purposeful learning',
    definition:
      'Build intentional learning mechanisms into every activity. Treat every significant action as an experiment with measurable hypotheses and review cycles.',
    observableSignals: [
      'Every strategic initiative has defined success criteria and review dates',
      'Learning is extracted from both successes and failures explicitly',
      'Maps are updated based on observed outcomes, not just intentions',
    ],
    counterSignals: [
      'No structured review of past strategic decisions against outcomes',
      'Learning is ad hoc and individual rather than organisational',
    ],
    reflectionPrompts: [
      'What have you learned from the most recent strategic actions reflected in this map?',
      'What feedback loops will tell you whether this map\'s positions are correct?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-402',
    version: 1,
    phase: 'IV',
    phaseLabel: 'Continuously improving',
    category: 'Strategy',
    shortTitle: 'An obsession with outcome rather than activity',
    definition:
      'Measure and manage for outcomes delivered to users, not for activity completed by teams. Busy teams that produce no user value are waste dressed as productivity.',
    observableSignals: [
      'Success metrics are defined in terms of user outcomes, not team outputs',
      'Teams are not rewarded for feature delivery disconnected from user impact',
      'Investment allocation is reviewed against outcome evidence',
    ],
    counterSignals: [
      'Teams measured by velocity, tickets closed, or features shipped without outcome linkage',
      'Continued investment in components with no evidence of user value',
    ],
    reflectionPrompts: [
      'What user outcomes does this map exist to improve?',
      'How do you currently measure whether the components here produce user value?',
    ],
    attribution: ATTR,
  },
  {
    id: 'dc-403',
    version: 1,
    phase: 'IV',
    phaseLabel: 'Continuously improving',
    category: 'Execution',
    shortTitle: 'Bias to action',
    definition:
      'Prefer small, fast, observable actions over large, slow, theoretical plans. Landscape knowledge is perishable; acting while uncertain is often better than waiting for certainty.',
    observableSignals: [
      'Small experiments are preferred over large-scale programmes where possible',
      'Speed of iteration is valued alongside quality of decision',
      'Imperfect maps that are acted on beat perfect maps that are not',
    ],
    counterSignals: [
      'Extended planning periods before any action is taken',
      'Seeking certainty before acting when the landscape is changing rapidly',
    ],
    reflectionPrompts: [
      'What is the smallest action you could take now to test a key assumption in this map?',
      'Are there areas where waiting for more information is costing more than acting on current information?',
    ],
    attribution: ATTR,
  },
];

export function getDoctrineCatalog(): DoctrineCatalogEntry[] {
  return DOCTRINE_CATALOG;
}

export function getDoctrineEntry(id: string): DoctrineCatalogEntry | undefined {
  return DOCTRINE_CATALOG.find((e) => e.id === id);
}

export const DOCTRINE_PHASES: { phase: DoctrinePhase; label: string }[] = [
  { phase: 'I', label: 'Stop self-harm' },
  { phase: 'II', label: 'Context awareness' },
  { phase: 'III', label: 'Better for users' },
  { phase: 'IV', label: 'Continuously improving' },
];
