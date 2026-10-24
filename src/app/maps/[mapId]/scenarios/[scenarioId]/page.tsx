'use client';

// SIM-02/04/05: Scenario comparison view.
// Left panel (380px): assumptions, changes (delta), consequences, decision record.
// Right panel: delta summary + rules findings.

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, AlertTriangle, AlertCircle, Info,
  CheckCircle, Trash2, ChevronDown, ChevronRight, Download, X,
} from 'lucide-react';
import { loadMap } from '@/hooks/use-persistence';
import {
  loadScenario,
  saveScenario,
  deleteScenario,
  summarizeChange,
  createDecisionRecord,
  listDecisions,
} from '@/hooks/use-scenarios';
import { runScenarioRules, allFindings, SCENARIO_RULES } from '@/analysis/scenario-rules';
import {
  Scenario, ScenarioAssumption, ScenarioConsequence, ScenarioChange,
  DecisionRecord, WardleyMap, Confidence, generateId,
} from '@/domain/types';

interface Props {
  params: Promise<{ mapId: string; scenarioId: string }>;
}

type PanelTab = 'assumptions' | 'changes' | 'consequences' | 'rules' | 'decision';

export default function ScenarioPage({ params }: Props) {
  const { mapId, scenarioId } = use(params);
  const router = useRouter();

  const [map, setMap] = React.useState(() => loadMap(mapId));
  const [scenario, setScenario] = React.useState(() => loadScenario(mapId, scenarioId));
  const [activeTab, setActiveTab] = React.useState<PanelTab>('changes');
  const [disabledRules, setDisabledRules] = React.useState<Set<string>>(new Set());

  const updateScenario = React.useCallback((fn: (prev: Scenario) => Scenario) => {
    setScenario((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveScenario(next);
      return next;
    });
  }, []);

  const ruleResults = React.useMemo(() => {
    if (!map || !scenario) return [];
    return runScenarioRules(map, scenario.changes, disabledRules);
  }, [map, scenario?.changes, disabledRules]);

  const findings = allFindings(ruleResults);
  const errorCount = findings.filter((f) => f.severity === 'error').length;
  const warnCount = findings.filter((f) => f.severity === 'warning').length;

  if (!map || !scenario) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Scenario or map not found.</p>
      </main>
    );
  }

  const tabs: { id: PanelTab; label: string; badge?: number }[] = [
    { id: 'changes', label: 'Changes', badge: scenario.changes.length },
    { id: 'assumptions', label: 'Assumptions', badge: scenario.assumptions.length },
    { id: 'consequences', label: 'Consequences', badge: scenario.consequences.length },
    { id: 'rules', label: 'Rules', badge: errorCount + warnCount > 0 ? errorCount + warnCount : undefined },
    { id: 'decision', label: 'Decision' },
  ];

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mapId: map.id,
      mapTitle: map.title,
      baselineRevision: scenario.baselineRevision,
      scenario,
      ruleFindings: findings,
      decisions: listDecisions(mapId).filter((d) => d.selectedScenarioId === scenarioId || d.rejectedScenarioIds.includes(scenarioId)),
      notice: 'Results shown are conditional consequences of explicit assumptions — not predictions of future states.',
    };
    const json = JSON.stringify(payload, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `${map.title.replace(/\s+/g, '-').toLowerCase()}-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-scenario.json`;
    a.click();
  };

  return (
    <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
        <Link href={`/maps/${mapId}/scenarios`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Scenarios
        </Link>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scenario.name}
        </span>
        {errorCount > 0 && <RulesBadge count={errorCount} kind="error" />}
        {warnCount > 0 && <RulesBadge count={warnCount} kind="warning" />}
        <button onClick={handleExport} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Download size={12} /> Export
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — 380px */}
        <div style={{ width: 380, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sub-tabs */}
          <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  height: 38,
                  padding: '0 10px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeTab === t.id ? 650 : 400,
                  color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 650, borderRadius: 999, padding: '0 4px', lineHeight: '16px', background: t.id === 'rules' ? 'var(--error-soft)' : 'var(--primary-soft)', color: t.id === 'rules' ? 'var(--error)' : 'var(--primary)' }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {activeTab === 'changes' && (
              <ChangesPanel map={map} scenario={scenario} onUpdate={updateScenario} />
            )}
            {activeTab === 'assumptions' && (
              <AssumptionsPanel scenario={scenario} onUpdate={updateScenario} />
            )}
            {activeTab === 'consequences' && (
              <ConsequencesPanel scenario={scenario} onUpdate={updateScenario} />
            )}
            {activeTab === 'rules' && (
              <RulesPanel results={ruleResults} disabledRules={disabledRules} onToggleRule={(id) => {
                setDisabledRules((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                });
              }} />
            )}
            {activeTab === 'decision' && (
              <DecisionPanel mapId={mapId} scenarioId={scenarioId} baselineRevision={scenario.baselineRevision} />
            )}
          </div>
        </div>

        {/* Right panel — delta overview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <DeltaOverview map={map} scenario={scenario} findings={findings} />
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Changes panel (SIM-02) — add scenario changes
// ---------------------------------------------------------------------------

function ChangesPanel({
  map,
  scenario,
  onUpdate,
}: {
  map: WardleyMap;
  scenario: Scenario;
  onUpdate: (fn: (s: Scenario) => Scenario) => void;
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [changeKind, setChangeKind] = React.useState<'move-evolution' | 'move-visibility' | 'add-element' | 'remove-element'>('move-evolution');
  const [elementId, setElementId] = React.useState('');
  const [targetValue, setTargetValue] = React.useState('0.5');
  const [rationale, setRationale] = React.useState('');
  const [newElName, setNewElName] = React.useState('');
  const [newElEv, setNewElEv] = React.useState('0.2');
  const [newElVis, setNewElVis] = React.useState('0.7');

  const handleAdd = () => {
    let change: ScenarioChange | null = null;
    const el = map.elements.find((e) => e.id === elementId);

    if (changeKind === 'move-evolution' && el) {
      change = { kind: 'move-evolution', elementId, from: el.evolution, to: parseFloat(targetValue), rationale };
    } else if (changeKind === 'move-visibility' && el) {
      change = { kind: 'move-visibility', elementId, from: el.visibility, to: parseFloat(targetValue), rationale };
    } else if (changeKind === 'remove-element' && elementId) {
      change = { kind: 'remove-element', elementId, rationale };
    } else if (changeKind === 'add-element' && newElName.trim()) {
      change = {
        kind: 'add-element',
        element: { id: generateId('el'), kind: 'component', name: newElName.trim(), componentType: 'unspecified', evolution: parseFloat(newElEv), visibility: parseFloat(newElVis) },
        rationale,
      };
    }

    if (!change) return;
    onUpdate((s) => ({ ...s, changes: [...s.changes, change!] }));
    setRationale('');
    setShowForm(false);
  };

  const handleRemove = (idx: number) => {
    onUpdate((s) => ({ ...s, changes: s.changes.filter((_, i) => i !== idx) }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Changes define what differs from the baseline. Each change requires explicit rationale.
      </p>

      {scenario.changes.map((change, idx) => {
        const summary = summarizeChange(change, map);
        return (
          <div key={idx} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 16, marginRight: 6, fontFamily: 'monospace' }}>{summary.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)' }}>{summary.label}</span>
              </div>
              <button onClick={() => handleRemove(idx)} aria-label="Remove change" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)', flexShrink: 0 }}>
                <X size={11} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{summary.detail}</div>
            {summary.rationale && <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>"{summary.rationale}"</div>}
          </div>
        );
      })}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add change
        </button>
      ) : (
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={labelStyle}>Change type</label>
            <select value={changeKind} onChange={(e) => setChangeKind(e.target.value as typeof changeKind)} style={inputStyle}>
              <option value="move-evolution">Move evolution</option>
              <option value="move-visibility">Move visibility</option>
              <option value="remove-element">Remove element</option>
              <option value="add-element">Add element</option>
            </select>
          </div>

          {changeKind !== 'add-element' && (
            <div>
              <label style={labelStyle}>Element</label>
              <select value={elementId} onChange={(e) => setElementId(e.target.value)} style={inputStyle}>
                <option value="">— select —</option>
                {map.elements.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.kind})</option>
                ))}
              </select>
            </div>
          )}

          {(changeKind === 'move-evolution' || changeKind === 'move-visibility') && (
            <div>
              <label style={labelStyle}>Target value (0–1)</label>
              <input type="number" min={0} max={1} step={0.01} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} style={inputStyle} />
            </div>
          )}

          {changeKind === 'add-element' && (
            <>
              <div>
                <label style={labelStyle}>Element name</label>
                <input value={newElName} onChange={(e) => setNewElName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Evolution</label>
                  <input type="number" min={0} max={1} step={0.01} value={newElEv} onChange={(e) => setNewElEv(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <input type="number" min={0} max={1} step={0.01} value={newElVis} onChange={(e) => setNewElVis(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Rationale *</label>
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} placeholder="Why is this change part of the scenario?" style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '7px 9px' }} />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!rationale.trim() || (changeKind !== 'add-element' && !elementId) || (changeKind === 'add-element' && !newElName.trim())}
              style={{ ...primaryBtn, opacity: (!rationale.trim() || (changeKind !== 'add-element' && !elementId) || (changeKind === 'add-element' && !newElName.trim())) ? 0.5 : 1 }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assumptions panel (SIM-04)
// ---------------------------------------------------------------------------

function AssumptionsPanel({ scenario, onUpdate }: { scenario: Scenario; onUpdate: (fn: (s: Scenario) => Scenario) => void }) {
  const [showForm, setShowForm] = React.useState(false);
  const [statement, setStatement] = React.useState('');
  const [confidence, setConfidence] = React.useState<Confidence>('medium');
  const [signal, setSignal] = React.useState('');

  const handleAdd = () => {
    if (!statement.trim()) return;
    const a: ScenarioAssumption = {
      id: generateId('sa'),
      statement: statement.trim(),
      confidence,
      evidenceIds: [],
      invalidationSignals: signal.trim() ? [signal.trim()] : [],
    };
    onUpdate((s) => ({ ...s, assumptions: [...s.assumptions, a] }));
    setStatement(''); setConfidence('medium'); setSignal(''); setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Assumptions bound the scenario. Results are conditional on these holding.
      </p>
      {scenario.assumptions.map((a) => (
        <div key={a.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>{a.statement}</span>
            <button onClick={() => onUpdate((s) => ({ ...s, assumptions: s.assumptions.filter((x) => x.id !== a.id) }))} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)', flexShrink: 0 }}>
              <X size={11} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <ConfidencePip confidence={a.confidence} />
            {a.invalidationSignals.map((sig, i) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Signal: {sig}</span>
            ))}
          </div>
        </div>
      ))}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add assumption
        </button>
      ) : (
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={labelStyle}>Assumption *</label>
            <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={2} placeholder="E.g. Competitor will release an open-source CRM within 18 months" style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '7px 9px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Confidence</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Invalidation signal</label>
              <input value={signal} onChange={(e) => setSignal(e.target.value)} placeholder="What would disprove this?" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            <button onClick={handleAdd} disabled={!statement.trim()} style={{ ...primaryBtn, opacity: statement.trim() ? 1 : 0.5 }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consequences panel (SIM-04)
// ---------------------------------------------------------------------------

function ConsequencesPanel({ scenario, onUpdate }: { scenario: Scenario; onUpdate: (fn: (s: Scenario) => Scenario) => void }) {
  const [showForm, setShowForm] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [direction, setDirection] = React.useState<ScenarioConsequence['direction']>('unknown');
  const [magnitude, setMagnitude] = React.useState<ScenarioConsequence['magnitude']>('unknown');
  const [confidence, setConfidence] = React.useState<Confidence>('low');
  const [uncertainty, setUncertainty] = React.useState('');

  const handleAdd = () => {
    if (!description.trim()) return;
    const c: ScenarioConsequence = {
      id: generateId('sq'),
      affectedIds: [],
      description: description.trim(),
      direction,
      magnitude,
      confidence,
      evidenceIds: [],
      uncertaintyNotes: uncertainty.trim() || undefined,
    };
    onUpdate((s) => ({ ...s, consequences: [...s.consequences, c] }));
    setDescription(''); setDirection('unknown'); setMagnitude('unknown'); setConfidence('low'); setUncertainty(''); setShowForm(false);
  };

  const dirIcon = { improves: '↑', worsens: '↓', mixed: '↕', unknown: '?' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Consequences are <strong>conditional outcomes</strong> if the assumptions hold — not predictions.
      </p>
      {scenario.consequences.map((c) => (
        <div key={c.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 18, marginRight: 6, fontFamily: 'monospace', color: c.direction === 'improves' ? 'var(--success)' : c.direction === 'worsens' ? 'var(--error)' : 'var(--text-muted)' }}>{dirIcon[c.direction]}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{c.description}</span>
            </div>
            <button onClick={() => onUpdate((s) => ({ ...s, consequences: s.consequences.filter((x) => x.id !== c.id) }))} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)', flexShrink: 0 }}>
              <X size={11} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <ConfidencePip confidence={c.confidence} />
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{c.magnitude} magnitude</span>
          </div>
          {c.uncertaintyNotes && <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '4px 0 0', fontStyle: 'italic' }}>{c.uncertaintyNotes}</p>}
        </div>
      ))}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add consequence
        </button>
      ) : (
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What conditional outcome might follow if the assumptions hold?" style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '7px 9px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)} style={inputStyle}>
                <option value="improves">Improves</option>
                <option value="worsens">Worsens</option>
                <option value="mixed">Mixed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Magnitude</label>
              <select value={magnitude} onChange={(e) => setMagnitude(e.target.value as typeof magnitude)} style={inputStyle}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Confidence</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Uncertainty notes</label>
            <input value={uncertainty} onChange={(e) => setUncertainty(e.target.value)} placeholder="What would change this outcome?" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            <button onClick={handleAdd} disabled={!description.trim()} style={{ ...primaryBtn, opacity: description.trim() ? 1 : 0.5 }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rules panel (SIM-03)
// ---------------------------------------------------------------------------

function RulesPanel({
  results,
  disabledRules,
  onToggleRule,
}: {
  results: ReturnType<typeof runScenarioRules>;
  disabledRules: Set<string>;
  onToggleRule: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Rules are deterministic, inspectable, and versioned. Disable a rule to see how findings change.
      </p>
      {SCENARIO_RULES.map((rule) => {
        const result = results.find((r) => r.ruleId === rule.id);
        const disabled = disabledRules.has(rule.id);
        const ruleFindings = result?.findings ?? [];
        return (
          <div key={rule.id} style={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
              <input type="checkbox" id={`rule-${rule.id}`} checked={!disabled} onChange={() => onToggleRule(rule.id)} style={{ cursor: 'pointer' }} />
              <label htmlFor={`rule-${rule.id}`} style={{ fontSize: 12, fontWeight: 600, color: disabled ? 'var(--text-subtle)' : 'var(--text)', cursor: 'pointer', flex: 1 }}>
                {rule.name}
                <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 6 }}>v{rule.version}</span>
              </label>
              {ruleFindings.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 650, color: ruleFindings[0].severity === 'error' ? 'var(--error)' : 'var(--warning)', background: ruleFindings[0].severity === 'error' ? 'var(--error-soft)' : 'var(--warning-soft)', borderRadius: 999, padding: '1px 6px' }}>
                  {ruleFindings.length}
                </span>
              )}
            </div>
            <div style={{ padding: '0 10px 8px', borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0 }}>{rule.description}</p>
              {ruleFindings.map((f, i) => (
                <div key={i} style={{ marginTop: 6, padding: '6px 8px', borderRadius: 6, background: f.severity === 'error' ? 'var(--error-soft)' : f.severity === 'warning' ? 'var(--warning-soft)' : 'var(--info-soft)', fontSize: 11, color: 'var(--text)' }}>
                  <div style={{ fontWeight: 650, marginBottom: 2 }}>{f.title}</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{f.explanation}</div>
                  <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Limitation: {f.limitations}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision record panel (SIM-05)
// ---------------------------------------------------------------------------

function DecisionPanel({
  mapId,
  scenarioId,
  baselineRevision,
}: {
  mapId: string;
  scenarioId: string;
  baselineRevision: number;
}) {
  const [decisions, setDecisions] = React.useState(() => listDecisions(mapId));
  const [showForm, setShowForm] = React.useState(false);
  const [rationale, setRationale] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [reviewAt, setReviewAt] = React.useState('');
  const [expectedSignal, setExpectedSignal] = React.useState('');
  const [stopCondition, setStopCondition] = React.useState('');

  const handleCreate = () => {
    if (!rationale.trim()) return;
    const record = createDecisionRecord({
      baselineMapId: mapId,
      baselineRevision,
      selectedScenarioId: scenarioId,
      rejectedScenarioIds: [],
      rationale: rationale.trim(),
      owner: owner.trim() || undefined,
      decidedAt: new Date().toISOString(),
      reviewAt: reviewAt || undefined,
      expectedSignals: expectedSignal.trim() ? [expectedSignal.trim()] : [],
      stopConditions: stopCondition.trim() ? [stopCondition.trim()] : [],
    });
    setDecisions((prev) => [...prev, record]);
    setRationale(''); setOwner(''); setReviewAt(''); setExpectedSignal(''); setStopCondition('');
    setShowForm(false);
  };

  const thisDecisions = decisions.filter((d) => d.selectedScenarioId === scenarioId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Decision records are immutable. A correction creates a new superseding record.
      </p>
      {thisDecisions.map((d) => (
        <div key={d.id} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--success)', background: 'var(--success-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CheckCircle size={12} color="var(--success)" />
            <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)' }}>Decision recorded</span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 'auto' }}>{new Date(d.decidedAt).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.4 }}>{d.rationale}</p>
          {d.owner && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Owner: {d.owner}</div>}
          {d.expectedSignals.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Expected: {d.expectedSignals.join(', ')}</div>}
          {d.stopConditions.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Stop if: {d.stopConditions.join(', ')}</div>}
          {d.supersedesId && <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>Supersedes: {d.supersedesId}</div>}
        </div>
      ))}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Record decision
        </button>
      ) : (
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={labelStyle}>Rationale *</label>
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={3} placeholder="Why was this scenario chosen? What evidence supports it?" style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '7px 9px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Owner</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who is accountable?" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Review date</label>
              <input type="date" value={reviewAt} onChange={(e) => setReviewAt(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Expected signal</label>
            <input value={expectedSignal} onChange={(e) => setExpectedSignal(e.target.value)} placeholder="What would confirm this was correct?" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stop / reversal condition</label>
            <input value={stopCondition} onChange={(e) => setStopCondition(e.target.value)} placeholder="What would indicate we should reverse?" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            <button onClick={handleCreate} disabled={!rationale.trim()} style={{ ...primaryBtn, opacity: rationale.trim() ? 1 : 0.5 }}>Save (immutable)</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delta overview (right panel)
// ---------------------------------------------------------------------------

function DeltaOverview({
  map,
  scenario,
  findings,
}: {
  map: WardleyMap;
  scenario: Scenario;
  findings: ReturnType<typeof allFindings>;
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 17, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>
        {scenario.name}
      </h2>
      {scenario.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>{scenario.description}</p>
      )}

      <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-subtle)', marginBottom: 20 }}>
        Baseline: "{map.title}" · revision {scenario.baselineRevision} · branched {new Date(scenario.createdAt).toLocaleDateString()}
      </div>

      {/* Delta summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatTile label="Changes" value={scenario.changes.length} />
        <StatTile label="Assumptions" value={scenario.assumptions.length} />
        <StatTile label="Consequences" value={scenario.consequences.length} />
      </div>

      {/* Rule findings */}
      {findings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>Rule findings</h3>
          {findings.map((f, i) => (
            <div key={i} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 6, border: `1px solid ${f.severity === 'error' ? 'var(--error)' : f.severity === 'warning' ? 'var(--warning)' : 'var(--border)'}`, background: f.severity === 'error' ? 'var(--error-soft)' : f.severity === 'warning' ? 'var(--warning-soft)' : 'var(--info-soft)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                {f.severity === 'error' ? <AlertCircle size={13} color="var(--error)" /> : f.severity === 'warning' ? <AlertTriangle size={13} color="var(--warning)" /> : <Info size={13} color="var(--info)" />}
                <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)' }}>{f.title}</span>
                <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 'auto' }}>{f.ruleId} v{f.ruleVersion}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 3px' }}>{f.explanation}</p>
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, fontStyle: 'italic' }}>Limitation: {f.limitations}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full delta list */}
      {scenario.changes.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>All changes ({scenario.changes.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={thStyle}>Icon</th>
                <th style={thStyle}>Change</th>
                <th style={thStyle}>Detail</th>
                <th style={thStyle}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {scenario.changes.map((change, i) => {
                const s = summarizeChange(change, map);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontSize: 16, fontFamily: 'monospace' }}>{s.icon}</td>
                    <td style={{ ...tdStyle, fontWeight: 550 }}>{s.label}</td>
                    <td style={tdStyle}>{s.detail}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.rationale || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {scenario.changes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', border: '2px dashed var(--border)', borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            No changes yet. Add changes in the left panel to build this scenario.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ConfidencePip({ confidence }: { confidence: Confidence }) {
  const color = confidence === 'high' ? 'var(--success)' : confidence === 'medium' ? 'var(--warning)' : 'var(--error)';
  return (
    <span style={{ fontSize: 10, fontWeight: 650, color, textTransform: 'uppercase', letterSpacing: '0.04em', background: `${color}22`, padding: '1px 5px', borderRadius: 4 }}>
      {confidence}
    </span>
  );
}

function RulesBadge({ count, kind }: { count: number; kind: 'error' | 'warning' }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 650, borderRadius: 999, padding: '2px 7px', background: kind === 'error' ? 'var(--error-soft)' : 'var(--warning-soft)', color: kind === 'error' ? 'var(--error)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
      {kind === 'error' ? <AlertCircle size={11} /> : <AlertTriangle size={11} />} {count}
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = { height: 32, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, width: '100%', outline: 'none', fontFamily: 'inherit' };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 };
const primaryBtn: React.CSSProperties = { height: 30, padding: '0 12px', borderRadius: 6, background: 'var(--primary)', color: 'var(--text-on-primary)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 550 };
const secondaryBtn: React.CSSProperties = { height: 30, padding: '0 12px', borderRadius: 6, background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12 };
const thStyle: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 650, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' };
const tdStyle: React.CSSProperties = { padding: '6px 8px', fontSize: 12, color: 'var(--text)', verticalAlign: 'top' };
