// Canonical Wardley Maps domain model — Section 5 of the implementation plan.
// All coordinates are normalized to [0, 1].  Serialization adapters transform
// to/from external formats (OWM text, legacy localStorage JSON, etc.).

export type Id = string;
export type Normalized = number; // inclusive 0..1
export type Confidence = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Map element
// ---------------------------------------------------------------------------

export type MapElementKind =
  | 'anchor'
  | 'component'
  | 'market'
  | 'ecosystem'
  | 'submap';

export type ComponentType =
  | 'activity'
  | 'practice'
  | 'data'
  | 'knowledge'
  | 'unspecified';

export interface MapElement {
  id: Id;
  kind: MapElementKind;
  name: string;
  description?: string;
  componentType: ComponentType;
  /** 0 = invisible/bottom, 1 = visible/top */
  visibility: Normalized;
  /** 0 = genesis/left, 1 = commodity/right */
  evolution: Normalized;
  labelOffset?: { x: number; y: number };
  inertia?: boolean;
  sourcing?: 'build' | 'buy' | 'outsource' | 'unspecified';
  tags?: string[];
  evidenceIds?: Id[];
  submapRef?: { mapId?: Id; url?: string };
}

// ---------------------------------------------------------------------------
// Dependency
// ---------------------------------------------------------------------------

export interface Dependency {
  id: Id;
  fromId: Id;
  toId: Id;
  kind: 'dependency' | 'flow';
  label?: string;
  flowDirection?: 'forward' | 'reverse' | 'bidirectional';
}

// ---------------------------------------------------------------------------
// Evolution movement (proposed/expected evolution change)
// ---------------------------------------------------------------------------

export interface EvolutionMovement {
  id: Id;
  elementId: Id;
  targetEvolution: Normalized;
  targetName?: string;
  sourcing?: 'build' | 'buy' | 'outsource';
  rationale?: string;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface Pipeline {
  id: Id;
  parentElementId: Id;
  memberElementIds: Id[];
  startEvolution: Normalized;
  endEvolution: Normalized;
}

// ---------------------------------------------------------------------------
// Annotation
// ---------------------------------------------------------------------------

export interface MapAnnotation {
  id: Id;
  text: string;
  x: Normalized;
  y: Normalized;
  number?: number;
}

// ---------------------------------------------------------------------------
// Evidence and analysis
// ---------------------------------------------------------------------------

export interface Evidence {
  id: Id;
  claim: string;
  sourceLabel?: string;
  sourceUrl?: string;
  confidence: Confidence;
  observedAt?: string;
  reviewAt?: string;
}

export interface PatternAssessment {
  id: Id;
  catalogId: string;
  appliesToIds: Id[];
  state: 'considering' | 'applies' | 'does-not-apply' | 'uncertain';
  rationale: string;
  evidenceIds: Id[];
  confidence: Confidence;
  owner?: string;
  reviewAt?: string;
}

export interface DoctrineAssessment extends PatternAssessment {
  capabilityState:
    | 'not-started'
    | 'emerging'
    | 'practiced'
    | 'embedded'
    | 'not-applicable';
}

export interface GameplayHypothesis extends PatternAssessment {
  category: string;
  intendedEffect: string;
  leadingSignals: string[];
  risks: string[];
  ethicalNotes?: string;
  // Section 7.3 — optional so earlier maps stay valid
  assumptions?: string;
  stopConditions?: string[];
  /** Climate/doctrine assessments that support this hypothesis */
  supportingIds?: Id[];
  /** A person has deliberately reviewed risks, harms and legal/ethical notes */
  humanReviewed?: boolean;
}

export interface DecisionRecord {
  id: Id;
  baselineMapId: Id;
  baselineRevision: number;
  selectedScenarioId?: Id;
  rejectedScenarioIds: Id[];
  rationale: string;
  owner?: string;
  decidedAt: string;
  reviewAt?: string;
  expectedSignals: string[];
  stopConditions: string[];
  supersedesId?: Id;
}

export interface AnalysisLayer {
  climate: PatternAssessment[];
  doctrine: DoctrineAssessment[];
  gameplay: GameplayHypothesis[];
  evidence: Evidence[];
  decisions: DecisionRecord[];
}

// ---------------------------------------------------------------------------
// Canonical WardleyMap
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_EVOLUTION_LABELS: [string, string, string, string] = [
  'Genesis',
  'Custom Built',
  'Product (+rental)',
  'Commodity (+utility)',
];

export const DEFAULT_STAGE_BOUNDARIES: [Normalized, Normalized, Normalized] = [
  0.25, 0.5, 0.75,
];

export interface WardleyMap {
  schemaVersion: number;
  id: Id;
  title: string;
  purpose?: string;
  perspective?: string;
  evolutionLabels: [string, string, string, string];
  stageBoundaries: [Normalized, Normalized, Normalized];
  elements: MapElement[];
  dependencies: Dependency[];
  evolutions: EvolutionMovement[];
  pipelines: Pipeline[];
  annotations: MapAnnotation[];
  analysis: AnalysisLayer;
  createdAt: string;
  updatedAt: string;
  revision: number;
  extensions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

export interface MapSummary {
  id: Id;
  title: string;
  updatedAt: string;
  revision: number;
  elementCount: number;
}

export interface MapVersion {
  map: WardleyMap;
  note?: string;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Scenario model (Section 8.1)
// ---------------------------------------------------------------------------

export type ScenarioChange =
  | {
      kind: 'move-evolution';
      elementId: Id;
      from: number;
      to: number;
      rationale: string;
    }
  | {
      kind: 'move-visibility';
      elementId: Id;
      from: number;
      to: number;
      rationale: string;
    }
  | {
      kind: 'add-element';
      element: MapElement;
      rationale: string;
    }
  | { kind: 'remove-element'; elementId: Id; rationale: string }
  | {
      kind: 'change-dependency';
      before?: Dependency;
      after?: Dependency;
      rationale: string;
    }
  | { kind: 'toggle-inertia'; elementId: Id; value: boolean; rationale: string }
  | { kind: 'apply-gameplay'; gameplayHypothesisId: Id; rationale: string };

export interface ScenarioAssumption {
  id: Id;
  statement: string;
  confidence: Confidence;
  evidenceIds: Id[];
  invalidationSignals: string[];
}

export interface ScenarioConsequence {
  id: Id;
  affectedIds: Id[];
  description: string;
  direction: 'improves' | 'worsens' | 'mixed' | 'unknown';
  magnitude: 'small' | 'medium' | 'large' | 'unknown';
  confidence: Confidence;
  evidenceIds: Id[];
  uncertaintyNotes?: string;
}

export interface Scenario {
  id: Id;
  name: string;
  baselineMapId: Id;
  baselineRevision: number;
  /**
   * SIM-01: immutable snapshot of the map at branch time. Later edits to the
   * map never change what a scenario is compared against. Optional only for
   * scenarios created before snapshots existed.
   */
  baseline?: WardleyMap;
  description?: string;
  horizonLabel?: string;
  assumptions: ScenarioAssumption[];
  changes: ScenarioChange[];
  consequences: ScenarioConsequence[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function makeEmptyAnalysis(): AnalysisLayer {
  return {
    climate: [],
    doctrine: [],
    gameplay: [],
    evidence: [],
    decisions: [],
  };
}

export function makeNewMap(id: Id, title = 'Untitled Map'): WardleyMap {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id,
    title,
    evolutionLabels: DEFAULT_EVOLUTION_LABELS,
    stageBoundaries: DEFAULT_STAGE_BOUNDARIES,
    elements: [],
    dependencies: [],
    evolutions: [],
    pipelines: [],
    annotations: [],
    analysis: makeEmptyAnalysis(),
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
}

export function clampNormalized(v: number): Normalized {
  return Math.max(0, Math.min(1, v));
}

export function generateId(prefix = 'el'): Id {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
