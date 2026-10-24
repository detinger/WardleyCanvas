'use client';

// SIM-01: Scenario CRUD + pure delta engine.
// applyScenarioChanges() MUST never mutate the baseline map.

import {
  WardleyMap,
  Scenario,
  ScenarioChange,
  ScenarioAssumption,
  ScenarioConsequence,
  DecisionRecord,
  Id,
  generateId,
  makeEmptyAnalysis,
} from '@/domain/types';

const SCENARIOS_KEY = 'wardleyStudio.scenarios';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

type ScenarioStore = Record<Id, Scenario[]>; // keyed by mapId

function readStore(): ScenarioStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScenarioStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(store));
}

// ---------------------------------------------------------------------------
// Public CRUD
// ---------------------------------------------------------------------------

export function listScenarios(mapId: Id): Scenario[] {
  return readStore()[mapId] ?? [];
}

export function loadScenario(mapId: Id, scenarioId: Id): Scenario | null {
  return listScenarios(mapId).find((s) => s.id === scenarioId) ?? null;
}

export function createScenario(
  mapId: Id,
  baselineRevision: number,
  name: string,
  description?: string
): Scenario {
  const now = new Date().toISOString();
  const scenario: Scenario = {
    id: generateId('sc'),
    name,
    baselineMapId: mapId,
    baselineRevision,
    description,
    assumptions: [],
    changes: [],
    consequences: [],
    createdAt: now,
    updatedAt: now,
  };
  const store = readStore();
  store[mapId] = [...(store[mapId] ?? []), scenario];
  writeStore(store);
  return scenario;
}

export function saveScenario(scenario: Scenario): void {
  const store = readStore();
  const list = store[scenario.baselineMapId] ?? [];
  const idx = list.findIndex((s) => s.id === scenario.id);
  const updated = { ...scenario, updatedAt: new Date().toISOString() };
  store[scenario.baselineMapId] = idx >= 0
    ? list.map((s) => (s.id === scenario.id ? updated : s))
    : [...list, updated];
  writeStore(store);
}

export function deleteScenario(mapId: Id, scenarioId: Id): void {
  const store = readStore();
  store[mapId] = (store[mapId] ?? []).filter((s) => s.id !== scenarioId);
  writeStore(store);
}

// ---------------------------------------------------------------------------
// Delta engine (SIM-01) — pure, never mutates baseline
// ---------------------------------------------------------------------------

export function applyScenarioChanges(baseline: WardleyMap, changes: ScenarioChange[]): WardleyMap {
  // Deep-copy mutable parts of the map
  let elements = baseline.elements.map((e) => ({ ...e }));
  let dependencies = baseline.dependencies.map((d) => ({ ...d }));
  let evolutions = baseline.evolutions.map((ev) => ({ ...ev }));
  let pipelines = baseline.pipelines.map((p) => ({ ...p, memberElementIds: [...p.memberElementIds] }));

  for (const change of changes) {
    switch (change.kind) {
      case 'move-evolution':
        elements = elements.map((e) =>
          e.id === change.elementId ? { ...e, evolution: change.to } : e
        );
        break;

      case 'move-visibility':
        elements = elements.map((e) =>
          e.id === change.elementId ? { ...e, visibility: change.to } : e
        );
        break;

      case 'add-element':
        if (!elements.some((e) => e.id === change.element.id)) {
          elements = [...elements, { ...change.element }];
        }
        break;

      case 'remove-element':
        elements = elements.filter((e) => e.id !== change.elementId);
        dependencies = dependencies.filter(
          (d) => d.fromId !== change.elementId && d.toId !== change.elementId
        );
        evolutions = evolutions.filter((ev) => ev.elementId !== change.elementId);
        pipelines = pipelines
          .filter((p) => p.parentElementId !== change.elementId)
          .map((p) => ({
            ...p,
            memberElementIds: p.memberElementIds.filter((id) => id !== change.elementId),
          }));
        break;

      case 'change-dependency':
        if (change.before) {
          dependencies = dependencies.filter((d) => d.id !== change.before!.id);
        }
        if (change.after) {
          dependencies = [...dependencies, { ...change.after }];
        }
        break;

      case 'toggle-inertia':
        elements = elements.map((e) =>
          e.id === change.elementId ? { ...e, inertia: change.value } : e
        );
        break;

      case 'apply-gameplay':
        // Gameplay changes are intent records — no structural map change
        break;
    }
  }

  return {
    ...baseline,
    elements,
    dependencies,
    evolutions,
    pipelines,
    analysis: makeEmptyAnalysis(), // scenario map has separate analysis
  };
}

// ---------------------------------------------------------------------------
// Delta description helpers
// ---------------------------------------------------------------------------

export interface ChangeSummary {
  changeIndex: number;
  kind: ScenarioChange['kind'];
  icon: string;
  label: string;
  detail: string;
  rationale: string;
  elementName?: string;
}

export function summarizeChange(change: ScenarioChange, baseline: WardleyMap): ChangeSummary {
  const elementName = (id: Id) =>
    baseline.elements.find((e) => e.id === id)?.name ?? id;

  switch (change.kind) {
    case 'move-evolution': {
      const name = elementName(change.elementId);
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '→',
        label: `Evolve: ${name}`,
        detail: `Evolution ${change.from.toFixed(2)} → ${change.to.toFixed(2)}`,
        rationale: change.rationale,
        elementName: name,
      };
    }
    case 'move-visibility': {
      const name = elementName(change.elementId);
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '↕',
        label: `Reposition: ${name}`,
        detail: `Visibility ${change.from.toFixed(2)} → ${change.to.toFixed(2)}`,
        rationale: change.rationale,
        elementName: name,
      };
    }
    case 'add-element':
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '+',
        label: `Add: ${change.element.name}`,
        detail: `New ${change.element.kind} at evolution ${change.element.evolution.toFixed(2)}`,
        rationale: change.rationale,
        elementName: change.element.name,
      };
    case 'remove-element': {
      const name = elementName(change.elementId);
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '−',
        label: `Remove: ${name}`,
        detail: 'Element and its dependencies removed from scenario',
        rationale: change.rationale,
        elementName: name,
      };
    }
    case 'change-dependency': {
      const fromName = change.after
        ? elementName(change.after.fromId)
        : change.before
        ? elementName(change.before.fromId)
        : '?';
      const toName = change.after
        ? elementName(change.after.toId)
        : change.before
        ? elementName(change.before.toId)
        : '?';
      const verb = !change.before ? 'Add dependency' : !change.after ? 'Remove dependency' : 'Change dependency';
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '⟳',
        label: `${verb}: ${fromName} → ${toName}`,
        detail: !change.before ? 'New dependency added' : !change.after ? 'Dependency removed' : 'Dependency modified',
        rationale: change.rationale,
      };
    }
    case 'toggle-inertia': {
      const name = elementName(change.elementId);
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '⊘',
        label: `Inertia ${change.value ? 'added' : 'removed'}: ${name}`,
        detail: change.value ? 'Component marked as resistant to movement' : 'Inertia flag removed',
        rationale: change.rationale,
        elementName: name,
      };
    }
    case 'apply-gameplay':
      return {
        changeIndex: 0,
        kind: change.kind,
        icon: '⚑',
        label: `Gameplay hypothesis applied`,
        detail: `Hypothesis: ${change.gameplayHypothesisId}`,
        rationale: change.rationale,
      };
  }
}

// ---------------------------------------------------------------------------
// Decision record helpers (SIM-05)
// ---------------------------------------------------------------------------

const DECISIONS_KEY = 'wardleyStudio.decisions';

type DecisionStore = DecisionRecord[];

function readDecisions(): DecisionStore {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DECISIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDecisions(records: DecisionStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(records));
}

export function listDecisions(mapId: Id): DecisionRecord[] {
  return readDecisions().filter((d) => d.baselineMapId === mapId);
}

/** Create a new immutable decision record. Superseding is done by creating a
 *  new record with supersedesId pointing at the old one — old record is never modified. */
export function createDecisionRecord(
  record: Omit<DecisionRecord, 'id'>
): DecisionRecord {
  const newRecord: DecisionRecord = { ...record, id: generateId('dr') };
  const all = readDecisions();
  writeDecisions([...all, newRecord]);
  return newRecord;
}

export function getDecisionRecord(id: Id): DecisionRecord | null {
  return readDecisions().find((d) => d.id === id) ?? null;
}
