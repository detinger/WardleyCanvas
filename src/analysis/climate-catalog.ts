// ANL-02: Versioned climatic pattern catalog.
// Each entry has a stable ID. Do not change IDs once published.
// Source: Wardley Maps (Simon Wardley, CC BY-SA 4.0).

import { CatalogProvenance, WARDLEY_CATALOG_PROVENANCE } from './catalog-meta';

export type ClimateCategory =
  | 'competitors'
  | 'components'
  | 'finance'
  | 'inertia'
  | 'prediction'
  | 'speed';

export interface ClimateCatalogEntry extends CatalogProvenance {
  id: string;
  version: number;
  category: ClimateCategory;
  shortTitle: string;
  description: string;
  /** Questions to help assess applicability — never automatic assertions */
  assessmentPrompts: string[];
  relatedIds: string[];
  attribution: string;
}

const CLIMATE_CATALOG_BASE: Omit<ClimateCatalogEntry, keyof CatalogProvenance>[] = [
  {
    id: 'cp-001',
    version: 1,
    category: 'prediction',
    shortTitle: 'Everything evolves',
    description:
      'All components are subject to evolutionary pressure — from genesis toward commodity — driven by supply-and-demand competition. No component is permanently fixed at a stage.',
    assessmentPrompts: [
      'Are any components in this map treated as permanent custom assets that could be commoditised?',
      'Which components have you not considered the evolutionary trajectory of?',
    ],
    relatedIds: ['cp-002', 'cp-011'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-002',
    version: 1,
    category: 'competitors',
    shortTitle: 'Competition drives commoditisation',
    description:
      'Supply-and-demand competition causes activities, practices, and data to evolve rightward. When many providers offer the same capability, it becomes a commodity regardless of incumbents\' preferences.',
    assessmentPrompts: [
      'Are there multiple vendors offering equivalent capabilities to any component on this map?',
      'Is competition increasing in any area of the landscape?',
    ],
    relatedIds: ['cp-001', 'cp-007'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-003',
    version: 1,
    category: 'inertia',
    shortTitle: 'Past success creates inertia',
    description:
      'Prior investment, existing processes, and cultural identity create resistance to change. Inertia is strongest at the point where a component is about to commoditise — exactly when change is most necessary.',
    assessmentPrompts: [
      'Which components have significant sunk cost, organisational identity, or contractual lock-in?',
      'Where are teams defending a position that competitors have already moved past?',
    ],
    relatedIds: ['cp-001'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-004',
    version: 1,
    category: 'finance',
    shortTitle: 'Efficiency enables innovation',
    description:
      'When a component commoditises, the capital and effort previously consumed by that component is freed up to build new, higher-order capabilities. Commodity infrastructure is a prerequisite for genesis.',
    assessmentPrompts: [
      'What new capabilities might become possible if expensive custom components were replaced by commodity alternatives?',
      'Which commoditised components are enabling new genesis-stage work in this context?',
    ],
    relatedIds: ['cp-001', 'cp-005'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-005',
    version: 1,
    category: 'components',
    shortTitle: 'Higher-order systems emerge from commoditised components',
    description:
      'New systems and services are built from previously commoditised components. Each wave of commoditisation seeds the next wave of genesis. You cannot reach genesis in one area without commodity elsewhere.',
    assessmentPrompts: [
      'Which commodity components are enabling the genesis-stage elements on this map?',
      'Are there emerging capabilities that depend on components not yet commodity?',
    ],
    relatedIds: ['cp-004'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-006',
    version: 1,
    category: 'competitors',
    shortTitle: 'No single actor controls evolution',
    description:
      'Market forces drive evolutionary stage transitions. Individual organisations can accelerate or decelerate evolution, but cannot prevent it. Attempting to hold back commoditisation typically fails.',
    assessmentPrompts: [
      'Is any strategy here dependent on preventing a competitor from commoditising a capability?',
      'Are there components being treated as proprietary advantages that market forces are already commoditising?',
    ],
    relatedIds: ['cp-002', 'cp-003'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-007',
    version: 1,
    category: 'competitors',
    shortTitle: 'Ecosystems can be engineered',
    description:
      'Platforms and ecosystems can be deliberately cultivated to create co-evolution. An ecosystem multiplies value by enabling third parties to build on top of commoditised components.',
    assessmentPrompts: [
      'Are there components here that could form a platform for an external ecosystem?',
      'Is there opportunity to benefit from co-evolution with third-party developers?',
    ],
    relatedIds: ['cp-002'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-008',
    version: 1,
    category: 'speed',
    shortTitle: 'Speed of evolution varies by context',
    description:
      'Evolution in some industries takes decades; in others, months. The rate depends on the intensity of competition, the ease of imitation, and network effects. Context-specific observation is required.',
    assessmentPrompts: [
      'How quickly has the competitive landscape changed in this domain over the past 2–3 years?',
      'Are there external forces (regulation, platform changes, VC activity) accelerating or slowing evolution?',
    ],
    relatedIds: ['cp-001'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-009',
    version: 1,
    category: 'finance',
    shortTitle: 'Capital flows toward opportunity',
    description:
      'Investment concentrates in genesis and early custom-built activities where differentiation and returns are highest. As components commoditise, competition shifts from differentiation to efficiency and price.',
    assessmentPrompts: [
      'Where is investment in this landscape currently concentrated?',
      'Which genesis-stage components are attracting external capital that might accelerate commoditisation?',
    ],
    relatedIds: ['cp-004'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-010',
    version: 1,
    category: 'components',
    shortTitle: 'Components shape practice and culture',
    description:
      'As the components an organisation uses evolve, its working practices, structures, and culture co-evolve with them. Misalignment between component stage and organisational practice is a common source of waste.',
    assessmentPrompts: [
      'Are there practices or processes aligned to a component stage that has since evolved?',
      'Is the organisation treating product-stage capabilities with genesis-stage processes (or vice versa)?',
    ],
    relatedIds: ['cp-011'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-011',
    version: 1,
    category: 'prediction',
    shortTitle: 'Co-evolution of practice with technology',
    description:
      'Practices do not evolve separately from technical capabilities — they co-evolve. A new technology forces new working patterns; entrenched practices delay adoption of evolved technology.',
    assessmentPrompts: [
      'Which components on this map have evolved, but whose associated practices have not kept up?',
      'Are there working methods here that are holding back adoption of more evolved components?',
    ],
    relatedIds: ['cp-010'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
  {
    id: 'cp-012',
    version: 1,
    category: 'finance',
    shortTitle: 'Commoditisation reduces transaction costs',
    description:
      'As components become utilities, the overhead of procurement, integration, and operation falls. This reduction in friction expands the addressable market and enables smaller actors to compete.',
    assessmentPrompts: [
      'Are there components that are expensive to acquire or integrate today, but are becoming commodity?',
      'Which components require significant transaction cost that commodity alternatives could eliminate?',
    ],
    relatedIds: ['cp-004', 'cp-009'],
    attribution: 'Wardley Maps — Simon Wardley (CC BY-SA 4.0)',
  },
];

export const CLIMATE_CATALOG: ClimateCatalogEntry[] = CLIMATE_CATALOG_BASE.map((entry) => ({
  ...entry,
  ...WARDLEY_CATALOG_PROVENANCE,
}));

export function getClimateEntry(id: string): ClimateCatalogEntry | undefined {
  return CLIMATE_CATALOG.find((e) => e.id === id);
}

export const CLIMATE_CATEGORIES: ClimateCategory[] = [
  'competitors', 'components', 'finance', 'inertia', 'prediction', 'speed',
];
