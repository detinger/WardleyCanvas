'use client';

// EDT-01: Inspector panel with tabbed content (420px; responsive sizes in globals.css).
// Shows map-level or element-level details depending on selection.

import * as React from 'react';
import { AlertTriangle, AlertCircle, Info, Lightbulb, Trash2, ChevronDown, ChevronRight, Plus, ExternalLink, Clock, Shield, Zap, BookOpen, X } from 'lucide-react';
import { WardleyMap, MapElement, Dependency, EvolutionMovement, Pipeline, MapAnnotation, Id, ComponentType, MapElementKind, Evidence, PatternAssessment, DoctrineAssessment, GameplayHypothesis, Confidence, generateId } from '@/domain/types';
import { ValidationFinding, ValidationSeverity, validateMap, countBySeverity } from '@/domain/validation';
import { useMapEditor } from '@/hooks/use-map-editor';
import { describeDependency } from '@/domain/editing';
import AssessmentEditor, { CommitText } from './AssessmentEditor';
import { sanitizeUrl } from '@/parser/owm';
import { CLIMATE_CATALOG, CLIMATE_CATEGORIES } from '@/analysis/climate-catalog';
import { DOCTRINE_CATALOG, DOCTRINE_PHASES } from '@/analysis/doctrine-catalog';
import { GAMEPLAY_CATALOG, GAMEPLAY_CATEGORIES } from '@/analysis/gameplay-catalog';

type Tab = 'details' | 'connections' | 'evolution' | 'evidence' | 'analysis' | 'validation';

interface MapInspectorProps {
  map: WardleyMap;
  selectedIds: string[];
  editor: ReturnType<typeof useMapEditor>;
}

export default function MapInspector({ map, selectedIds, editor }: MapInspectorProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('details');
  const findings = React.useMemo(() => validateMap(map), [map]);
  const counts = countBySeverity(findings);

  const selectedElement =
    selectedIds.length === 1
      ? map.elements.find((el) => el.id === selectedIds[0]) ?? null
      : null;

  const selectedDep =
    selectedIds.length === 1
      ? map.dependencies.find((d) => d.id === selectedIds[0]) ?? null
      : null;

  const analysisCount =
    map.analysis.climate.length + map.analysis.doctrine.length + map.analysis.gameplay.length;
  const evidenceCount = map.analysis.evidence.length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'connections', label: 'Connections' },
    { id: 'evolution', label: 'Evolution' },
    { id: 'evidence', label: 'Evidence', badge: evidenceCount > 0 ? evidenceCount : undefined },
    { id: 'analysis', label: 'Analysis', badge: analysisCount > 0 ? analysisCount : undefined },
    {
      id: 'validation',
      label: 'Validation',
      badge: counts.error + counts.warning,
    },
  ];

  return (
    <div
      role="complementary"
      aria-label="Map inspector"
      className="editor-inspector"
    >
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Inspector tabs"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 550 : 400,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 120ms',
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  height: 20,
                  minWidth: 20,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: (tab.id === 'evidence' || tab.id === 'analysis')
                    ? 'var(--primary-soft)' : 'var(--error-soft)',
                  color: (tab.id === 'evidence' || tab.id === 'analysis')
                    ? 'var(--primary)' : 'var(--error)',
                  fontSize: 11,
                  fontWeight: 650,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        style={{ flex: 1, overflowY: 'auto', padding: 18 }}
      >
        {activeTab === 'details' && (
          <DetailsPanel
            map={map}
            element={selectedElement}
            dep={selectedDep}
            editor={editor}
          />
        )}
        {activeTab === 'connections' && (
          <ConnectionsPanel
            map={map}
            element={selectedElement}
            editor={editor}
          />
        )}
        {activeTab === 'evolution' && (
          <EvolutionPanel
            map={map}
            element={selectedElement}
            editor={editor}
          />
        )}
        {activeTab === 'evidence' && (
          <EvidencePanel map={map} editor={editor} selectedElement={selectedElement} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisPanel map={map} editor={editor} />
        )}
        {activeTab === 'validation' && (
          <ValidationPanel
            findings={findings}
            onSelectElement={(id) => editor.select([id])}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details panel
// ---------------------------------------------------------------------------

function DetailsPanel({
  map,
  element,
  dep,
  editor,
}: {
  map: WardleyMap;
  element: MapElement | null;
  dep: Dependency | null;
  editor: ReturnType<typeof useMapEditor>;
}) {
  if (element) {
    return <ElementDetails element={element} editor={editor} map={map} />;
  }

  if (dep) {
    return <DependencyDetails dep={dep} map={map} editor={editor} />;
  }

  return <MapDetails map={map} editor={editor} />;
}

function MapDetails({
  map,
  editor,
}: {
  map: WardleyMap;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const [title, setTitle] = React.useState(map.title);
  const [purpose, setPurpose] = React.useState(map.purpose ?? '');

  React.useEffect(() => setTitle(map.title), [map.title]);
  React.useEffect(() => setPurpose(map.purpose ?? ''), [map.purpose]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section label="Map">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title !== map.title) editor.setTitle(title); }}
            style={inputStyle}
          />
        </Field>
        <Field label="Purpose / scope">
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            onBlur={() => { if (purpose !== (map.purpose ?? '')) editor.setPurpose(purpose); }}
            rows={3}
            placeholder="Who has the need, and what are you exploring?"
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '8px 10px' }}
          />
        </Field>
      </Section>
      <Section label="Summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatTile label="Elements" value={map.elements.length} />
          <StatTile label="Dependencies" value={map.dependencies.length} />
          <StatTile
            label="Anchors"
            value={map.elements.filter((e) => e.kind === 'anchor').length}
          />
          <StatTile label="Revision" value={map.revision} />
        </div>
      </Section>
      <Section label="Evolution axis">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {map.evolutionLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: `rgba(31,95,139,${0.15 + i * 0.2})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--primary)',
                }}
              >
                {i + 1}
              </div>
              {label}
            </div>
          ))}
        </div>
      </Section>

      <NotesSection map={map} editor={editor} />
    </div>
  );
}

/** EDT-08: notes and numbered annotations, editable without the source view. */
function NotesSection({ map, editor }: { map: WardleyMap; editor: ReturnType<typeof useMapEditor> }) {
  const update = (id: Id, changes: Partial<MapAnnotation>) =>
    editor.patchMap({ annotations: map.annotations.map((a) => (a.id === id ? { ...a, ...changes } : a)) });
  const nextNumber = Math.max(0, ...map.annotations.map((a) => a.number ?? 0)) + 1;

  return (
    <Section label={`Notes (${map.annotations.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {map.annotations.map((ann, i) => (
          <div key={ann.id} style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CommitText
              id={`note-text-${ann.id}`}
              label={ann.number != null ? `Annotation ${ann.number}` : `Note ${i + 1}`}
              value={ann.text}
              onCommit={(text) => update(ann.id, { text })}
              multiline
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(['y', 'x'] as const).map((key) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label htmlFor={`note-${key}-${ann.id}`} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {key === 'y' ? 'Visibility (0–1)' : 'Evolution (0–1)'}
                  </label>
                  <input
                    id={`note-${key}-${ann.id}`}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={ann[key]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) update(ann.id, { [key]: Math.max(0, Math.min(1, v)) });
                    }}
                    style={{ ...inputStyle, height: 28 }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.patchMap({ annotations: map.annotations.filter((a) => a.id !== ann.id) })}
              aria-label={`Remove ${ann.number != null ? `annotation ${ann.number}` : `note ${i + 1}`}`}
              style={{ ...smallButtonStyle, alignSelf: 'flex-start', color: 'var(--error)' }}
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => editor.patchMap({ annotations: [...map.annotations, { id: generateId('ann'), text: 'New note', x: 0.5, y: 0.5 }] })}
            style={smallButtonStyle}
          >
            <Plus size={12} /> Add note
          </button>
          <button
            type="button"
            onClick={() =>
              editor.patchMap({
                annotations: [...map.annotations, { id: generateId('ann'), number: nextNumber, text: 'New annotation', x: 0.5, y: 0.5 }],
              })
            }
            style={smallButtonStyle}
          >
            <Plus size={12} /> Add numbered annotation
          </button>
        </div>
      </div>
    </Section>
  );
}

function ElementDetails({
  element,
  map,
  editor,
}: {
  element: MapElement;
  map: WardleyMap;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const [name, setName] = React.useState(element.name);
  const [description, setDescription] = React.useState(element.description ?? '');
  const [visInput, setVisInput] = React.useState(element.visibility.toFixed(3));
  const [evInput, setEvInput] = React.useState(element.evolution.toFixed(3));

  React.useEffect(() => { setName(element.name); }, [element.name]);
  React.useEffect(() => { setDescription(element.description ?? ''); }, [element.description]);
  React.useEffect(() => { setVisInput(element.visibility.toFixed(3)); }, [element.visibility]);
  React.useEffect(() => { setEvInput(element.evolution.toFixed(3)); }, [element.evolution]);

  const kindOptions: { value: MapElementKind; label: string }[] = [
    { value: 'anchor', label: 'Anchor (user/stakeholder)' },
    { value: 'component', label: 'Component' },
    { value: 'market', label: 'Market' },
    { value: 'ecosystem', label: 'Ecosystem' },
    { value: 'submap', label: 'Submap' },
  ];

  const typeOptions: { value: ComponentType; label: string }[] = [
    { value: 'unspecified', label: 'Unspecified' },
    { value: 'activity', label: 'Activity' },
    { value: 'practice', label: 'Practice' },
    { value: 'data', label: 'Data' },
    { value: 'knowledge', label: 'Knowledge' },
  ];

  const stageLabel = (ev: number) => {
    const [b0, b1, b2] = map.stageBoundaries;
    if (ev < b0) return map.evolutionLabels[0];
    if (ev < b1) return map.evolutionLabels[1];
    if (ev < b2) return map.evolutionLabels[2];
    return map.evolutionLabels[3];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 650,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {element.kind}
        </span>
        <button
          onClick={() => editor.removeElements([element.id])}
          aria-label={`Delete ${element.name}`}
          style={{
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: 'none', background: 'none',
            cursor: 'pointer', color: 'var(--error)',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Section label="Identity">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name !== element.name) editor.updateElement(element.id, { name }); }}
            style={inputStyle}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { if (description !== (element.description ?? '')) editor.updateElement(element.id, { description }); }}
            rows={2}
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '8px 10px' }}
          />
        </Field>
        <Field label="Kind">
          <select
            value={element.kind}
            onChange={(e) =>
              editor.updateElement(element.id, { kind: e.target.value as MapElementKind })
            }
            style={inputStyle}
          >
            {kindOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Component type">
          <select
            value={element.componentType}
            onChange={(e) =>
              editor.updateElement(element.id, { componentType: e.target.value as ComponentType })
            }
            style={inputStyle}
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section label="Position">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Visibility (0–1)">
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={visInput}
              onChange={(e) => setVisInput(e.target.value)}
              onBlur={() => {
                const v = parseFloat(visInput);
                if (isFinite(v)) editor.updateElement(element.id, { visibility: v });
              }}
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
              className="tabular-nums"
            />
          </Field>
          <Field label="Evolution (0–1)">
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={evInput}
              onChange={(e) => setEvInput(e.target.value)}
              onBlur={() => {
                const v = parseFloat(evInput);
                if (isFinite(v)) editor.updateElement(element.id, { evolution: v });
              }}
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
              className="tabular-nums"
            />
          </Field>
        </div>
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: 'var(--bg-subtle)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Stage: <strong style={{ color: 'var(--text)' }}>{stageLabel(element.evolution)}</strong>
        </div>

        {/* Visibility slider */}
        <Field label="Visibility">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.visibility}
            onChange={(e) =>
              editor.updateElement(element.id, { visibility: parseFloat(e.target.value) })
            }
            aria-label="Visibility slider"
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subtle)' }}>
            <span>Invisible</span><span>Visible</span>
          </div>
        </Field>

        {/* Evolution slider */}
        <Field label="Evolution">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.evolution}
            onChange={(e) =>
              editor.updateElement(element.id, { evolution: parseFloat(e.target.value) })
            }
            aria-label="Evolution slider"
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subtle)' }}>
            <span>Genesis</span><span>Commodity</span>
          </div>
        </Field>
      </Section>

      <Section label="Attributes">
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <input
            type="checkbox"
            checked={element.inertia ?? false}
            onChange={(e) =>
              editor.updateElement(element.id, { inertia: e.target.checked })
            }
          />
          Inertia (resistant to movement)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          <label htmlFor={`sourcing-${element.id}`} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Sourcing
          </label>
          <select
            id={`sourcing-${element.id}`}
            value={element.sourcing ?? 'unspecified'}
            onChange={(e) =>
              editor.updateElement(element.id, {
                sourcing: e.target.value === 'unspecified' ? undefined : (e.target.value as MapElement['sourcing']),
              })
            }
            style={inputStyle}
          >
            <option value="unspecified">Not specified</option>
            <option value="build">Build</option>
            <option value="buy">Buy</option>
            <option value="outsource">Outsource</option>
          </select>
        </div>
      </Section>
    </div>
  );
}

function DependencyDetails({
  dep,
  map,
  editor,
}: {
  dep: Dependency;
  map: WardleyMap;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const from = map.elements.find((el) => el.id === dep.fromId);
  const to = map.elements.find((el) => el.id === dep.toId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Dependency
        </span>
        <button
          onClick={() => editor.removeDependency(dep.id)}
          aria-label="Delete dependency"
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          background: 'var(--bg-subtle)',
          fontSize: 13,
        }}
      >
        <strong>{from?.name ?? dep.fromId}</strong>
        <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>depends on</span>
        <strong>{to?.name ?? dep.toId}</strong>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        A dependency from A to B means <strong>A depends on B</strong>. The arrowhead points toward the component that must exist for A to function.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connections panel
// ---------------------------------------------------------------------------

function ConnectionsPanel({
  map,
  element,
  editor,
}: {
  map: WardleyMap;
  element: MapElement | null;
  editor: ReturnType<typeof useMapEditor>;
}) {
  if (!element) {
    return (
      <EmptyState
        message="Select an element to see its connections."
      />
    );
  }

  const outgoing = map.dependencies.filter((d) => d.fromId === element.id);
  const incoming = map.dependencies.filter((d) => d.toId === element.id);

  const elementName = (id: Id) => map.elements.find((el) => el.id === id)?.name ?? id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section label={`Depends on (${outgoing.length})`}>
        {outgoing.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>
            No outgoing dependencies.
          </p>
        ) : (
          outgoing.map((dep) => (
            <DepRow
              key={dep.id}
              label={`→ ${elementName(dep.toId)}`}
              onDelete={() => editor.removeDependency(dep.id)}
              onSelect={() => editor.select([dep.id])}
            />
          ))
        )}
        <AddDependency map={map} element={element} editor={editor} />
      </Section>

      <Section label={`Used by (${incoming.length})`}>
        {incoming.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>
            No incoming dependencies.
          </p>
        ) : (
          incoming.map((dep) => (
            <DepRow
              key={dep.id}
              label={`← ${elementName(dep.fromId)}`}
              onDelete={() => editor.removeDependency(dep.id)}
              onSelect={() => editor.select([dep.id])}
            />
          ))
        )}
      </Section>
    </div>
  );
}

/** Keyboard-friendly dependency creation that states the direction before committing. */
function AddDependency({
  map,
  element,
  editor,
}: {
  map: WardleyMap;
  element: MapElement;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const [targetId, setTargetId] = React.useState('');
  // Exclude itself and anything already connected in either direction
  const connected = new Set(
    map.dependencies
      .filter((d) => d.fromId === element.id || d.toId === element.id)
      .map((d) => (d.fromId === element.id ? d.toId : d.fromId))
  );
  const candidates = map.elements.filter((el) => el.id !== element.id && !connected.has(el.id));
  const target = candidates.find((el) => el.id === targetId);

  if (candidates.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      <label htmlFor="add-dependency-target" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Add dependency: {element.name} depends on…
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          id="add-dependency-target"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
        >
          <option value="">Choose a component</option>
          {candidates.map((el) => (
            <option key={el.id} value={el.id}>{el.name}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!target}
          onClick={() => {
            if (!target) return;
            editor.createDependency(element.id, target.id);
            setTargetId('');
          }}
          style={{
            height: 34,
            padding: '0 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            cursor: target ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 550,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <p aria-live="polite" style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0, minHeight: 16 }}>
        {target ? `Will add: ${describeDependency(element.name, target.name)}.` : ''}
      </p>
    </div>
  );
}

function DepRow({
  label,
  onDelete,
  onSelect,
}: {
  label: string;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 8px',
        borderRadius: 6,
        background: 'var(--bg-subtle)',
        marginBottom: 4,
        fontSize: 13,
      }}
    >
      <button
        onClick={onSelect}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left', fontSize: 13 }}
      >
        {label}
      </button>
      <button
        onClick={onDelete}
        aria-label="Remove dependency"
        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Evolution panel
// ---------------------------------------------------------------------------

function EvolutionPanel({
  map,
  element,
  editor,
}: {
  map: WardleyMap;
  element: MapElement | null;
  editor: ReturnType<typeof useMapEditor>;
}) {
  if (!element) {
    return (
      <EmptyState message="Select an element to view or propose an evolution movement." />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section label="Current position">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatTile label="Evolution" value={element.evolution.toFixed(3)} />
          <StatTile label="Visibility" value={element.visibility.toFixed(3)} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
          Evolution represents maturity in the market — not time elapsed, not adoption percentage, and not an objectively precise measurement. Treat it as a qualitative estimate.
        </p>
      </Section>
      <ProposedMovement map={map} element={element} editor={editor} />
      <PipelineSection map={map} element={element} editor={editor} />
    </div>
  );
}

/** EDT-06: evolve arrow — expected or proposed position, optional rename, rationale. */
function ProposedMovement({
  map,
  element,
  editor,
}: {
  map: WardleyMap;
  element: MapElement;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const movement = map.evolutions.find((ev) => ev.elementId === element.id);
  const update = (changes: Partial<EvolutionMovement>) =>
    editor.patchMap({
      evolutions: map.evolutions.map((ev) => (ev.id === movement!.id ? { ...ev, ...changes } : ev)),
    });

  if (!movement) {
    return (
      <Section label="Proposed movement">
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
          Record where you expect or propose {element.name} to move. This draws an evolve arrow.
        </p>
        <button
          type="button"
          onClick={() =>
            editor.patchMap({
              evolutions: [
                ...map.evolutions,
                { id: generateId('ev'), elementId: element.id, targetEvolution: Math.min(1, Math.round((element.evolution + 0.2) * 100) / 100) },
              ],
            })
          }
          style={smallButtonStyle}
        >
          <Plus size={12} /> Add evolve arrow
        </button>
      </Section>
    );
  }

  const stage = stageName(map, movement.targetEvolution);
  return (
    <Section label="Proposed movement">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="evolve-target" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Target evolution (0–1) — {stage}
        </label>
        <input
          id="evolve-target"
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={movement.targetEvolution}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) update({ targetEvolution: Math.max(0, Math.min(1, v)) });
          }}
          style={inputStyle}
        />
        <CommitText
          id="evolve-name"
          label="New name after the move (optional)"
          value={movement.targetName ?? ''}
          onCommit={(targetName) => update({ targetName: targetName || undefined })}
        />
        <CommitText
          id="evolve-rationale"
          label="Rationale — why will it move?"
          value={movement.rationale ?? ''}
          onCommit={(rationale) => update({ rationale: rationale || undefined })}
          multiline
        />
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0 }}>
          An evolve arrow shows direction, not a date: evolution is not a calendar forecast.
        </p>
        <button
          type="button"
          onClick={() => editor.patchMap({ evolutions: map.evolutions.filter((ev) => ev.id !== movement.id) })}
          style={{ ...smallButtonStyle, color: 'var(--error)' }}
        >
          <Trash2 size={12} /> Remove evolve arrow
        </button>
      </div>
    </Section>
  );
}

/** EDT-08: pipeline — a family of related components spanning a range of evolution. */
function PipelineSection({
  map,
  element,
  editor,
}: {
  map: WardleyMap;
  element: MapElement;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const pipeline = map.pipelines.find((p) => p.parentElementId === element.id);
  const update = (changes: Partial<Pipeline>) =>
    editor.patchMap({ pipelines: map.pipelines.map((p) => (p.id === pipeline!.id ? { ...p, ...changes } : p)) });

  if (!pipeline) {
    return (
      <Section label="Pipeline">
        <button
          type="button"
          onClick={() =>
            editor.patchMap({
              pipelines: [
                ...map.pipelines,
                {
                  id: generateId('pip'),
                  parentElementId: element.id,
                  memberElementIds: [],
                  startEvolution: Math.max(0, Math.round((element.evolution - 0.15) * 100) / 100),
                  endEvolution: Math.min(1, Math.round((element.evolution + 0.15) * 100) / 100),
                },
              ],
            })
          }
          style={smallButtonStyle}
        >
          <Plus size={12} /> Make {element.name} a pipeline
        </button>
      </Section>
    );
  }

  const candidates = map.elements.filter((el) => el.id !== element.id);
  return (
    <Section label="Pipeline">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(['startEvolution', 'endEvolution'] as const).map((key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor={`pipeline-${key}`} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {key === 'startEvolution' ? 'From evolution' : 'To evolution'}
            </label>
            <input
              id={`pipeline-${key}`}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={pipeline[key]}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) update({ [key]: Math.max(0, Math.min(1, v)) });
              }}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      {candidates.length > 0 && (
        <fieldset style={{ border: 'none', padding: 0, margin: '8px 0 0' }}>
          <legend style={{ fontSize: 12, color: 'var(--text-muted)', padding: 0 }}>Members</legend>
          {candidates.map((el) => (
            <label key={el.id} style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={pipeline.memberElementIds.includes(el.id)}
                onChange={(e) =>
                  update({
                    memberElementIds: e.target.checked
                      ? [...pipeline.memberElementIds, el.id]
                      : pipeline.memberElementIds.filter((x) => x !== el.id),
                  })
                }
              />
              {el.name}
            </label>
          ))}
        </fieldset>
      )}
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '8px 0' }}>
        Removing a pipeline never deletes its member components.
      </p>
      <button
        type="button"
        onClick={() => editor.patchMap({ pipelines: map.pipelines.filter((p) => p.id !== pipeline.id) })}
        style={{ ...smallButtonStyle, color: 'var(--error)' }}
      >
        <Trash2 size={12} /> Remove pipeline
      </button>
    </Section>
  );
}

function stageName(map: WardleyMap, evolution: number): string {
  const [b0, b1, b2] = map.stageBoundaries;
  const i = evolution < b0 ? 0 : evolution < b1 ? 1 : evolution < b2 ? 2 : 3;
  return map.evolutionLabels[i];
}

const smallButtonStyle: React.CSSProperties = {
  height: 28,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

// ---------------------------------------------------------------------------
// Validation panel
// ---------------------------------------------------------------------------

function ValidationPanel({
  findings,
  onSelectElement,
}: {
  findings: ValidationFinding[];
  onSelectElement: (id: string) => void;
}) {
  if (findings.length === 0) {
    return (
      <EmptyState
        icon={<span style={{ fontSize: 24 }}>✓</span>}
        message="No issues found."
        sub="The map passes all structural checks."
      />
    );
  }

  const order: ValidationSeverity[] = ['error', 'warning', 'recommendation', 'info'];
  const grouped = order
    .map((sev) => ({ sev, items: findings.filter((f) => f.severity === sev) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {grouped.map(({ sev, items }) => (
        <div key={sev}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: severityColor(sev),
              marginBottom: 6,
              letterSpacing: '0.06em',
            }}
          >
            {sev}s ({items.length})
          </div>
          {items.map((f) => (
            <FindingRow key={f.ruleId} finding={f} onSelectElement={onSelectElement} />
          ))}
        </div>
      ))}
    </div>
  );
}

function FindingRow({
  finding,
  onSelectElement,
}: {
  finding: ValidationFinding;
  onSelectElement: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      style={{
        marginBottom: 6,
        borderRadius: 6,
        border: `1px solid ${severitySoftColor(finding.severity)}`,
        background: severityBgColor(finding.severity),
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: severityColor(finding.severity), flexShrink: 0, marginTop: 1 }}>
          {severityIcon(finding.severity)}
        </span>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 400 }}>
          {finding.message}
        </span>
        <span style={{ color: 'var(--text-subtle)', flexShrink: 0, marginTop: 2 }}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 10px 10px 36px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>
            {finding.explanation}
          </p>
          {finding.suggestedAction && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>
              <strong>Suggested:</strong> {finding.suggestedAction}
            </p>
          )}
          {finding.affectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {finding.affectedIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onSelectElement(id)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    fontSize: 11,
                    cursor: 'pointer',
                    color: 'var(--primary)',
                  }}
                >
                  Navigate to
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Evidence panel (ANL-01)
// ---------------------------------------------------------------------------

function EvidencePanel({
  map,
  editor,
  selectedElement,
}: {
  map: WardleyMap;
  editor: ReturnType<typeof useMapEditor>;
  selectedElement: MapElement | null;
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [claim, setClaim] = React.useState('');
  const [sourceLabel, setSourceLabel] = React.useState('');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [confidence, setConfidence] = React.useState<Confidence>('medium');
  const [reviewAt, setReviewAt] = React.useState('');

  const reset = () => { setClaim(''); setSourceLabel(''); setSourceUrl(''); setConfidence('medium'); setReviewAt(''); setShowForm(false); };

  const handleAdd = () => {
    if (!claim.trim()) return;
    const ev: Evidence = {
      id: generateId('ev'),
      claim: claim.trim(),
      sourceLabel: sourceLabel.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      confidence,
      reviewAt: reviewAt || undefined,
    };
    editor.addEvidence(ev);
    reset();
  };

  const evidence = map.analysis.evidence;
  const stale = evidence.filter((e) => e.reviewAt && new Date(e.reviewAt) < new Date());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{evidence.length} record{evidence.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={12} /> Add evidence
        </button>
      </div>

      {stale.length > 0 && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--warning-soft)', border: '1px solid var(--warning)', fontSize: 12, color: 'var(--text)', display: 'flex', gap: 8 }}>
          <Clock size={13} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{stale.length} evidence record{stale.length !== 1 ? 's' : ''} past review date</span>
        </div>
      )}

      {showForm && (
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="Claim *">
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={2}
              placeholder="What is being claimed?"
              style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '8px 10px' }}
            />
          </Field>
          <Field label="Source label">
            <input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="E.g. Interview notes 2024-10" style={inputStyle} />
          </Field>
          <Field label="Source URL">
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" type="url" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Confidence">
              <select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Review by">
              <input value={reviewAt} onChange={(e) => setReviewAt(e.target.value)} type="date" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={reset} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>Cancel</button>
            <button onClick={handleAdd} disabled={!claim.trim()} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: 'none', background: claim.trim() ? 'var(--primary)' : 'var(--bg-subtle)', color: claim.trim() ? 'var(--text-on-primary)' : 'var(--text-subtle)', cursor: claim.trim() ? 'pointer' : 'not-allowed', fontSize: 12 }}>Save</button>
          </div>
        </div>
      )}

      {evidence.length === 0 && !showForm && (
        <EmptyState message="No evidence records yet." sub="Evidence links claims to observations, sources, and review dates." />
      )}

      {evidence.map((ev) => (
        <EvidenceCard key={ev.id} evidence={ev} onRemove={() => editor.removeEvidence(ev.id)} />
      ))}
    </div>
  );
}

function EvidenceCard({ evidence: ev, onRemove }: { evidence: Evidence; onRemove: () => void }) {
  const isStale = ev.reviewAt && new Date(ev.reviewAt) < new Date();
  return (
    <div style={{ padding: 10, borderRadius: 8, border: `1px solid ${isStale ? 'var(--warning)' : 'var(--border)'}`, background: isStale ? 'var(--warning-soft)' : 'var(--bg-elevated)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>{ev.claim}</span>
        <button onClick={onRemove} aria-label="Remove evidence" style={{ flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
          <X size={12} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ConfidencePip confidence={ev.confidence} />
        {ev.sourceLabel && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {ev.sourceUrl && sanitizeUrl(ev.sourceUrl) ? (
              <a href={sanitizeUrl(ev.sourceUrl)!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                {ev.sourceLabel} <ExternalLink size={10} />
              </a>
            ) : ev.sourceLabel}
          </span>
        )}
        {ev.reviewAt && (
          <span style={{ fontSize: 11, color: isStale ? 'var(--warning)' : 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> Review {ev.reviewAt}
          </span>
        )}
      </div>
    </div>
  );
}

function ConfidencePip({ confidence }: { confidence: Confidence }) {
  const color = confidence === 'high' ? 'var(--success)' : confidence === 'medium' ? 'var(--warning)' : 'var(--error)';
  return (
    <span style={{ fontSize: 10, fontWeight: 650, color, textTransform: 'uppercase', letterSpacing: '0.04em', background: `${color}22`, padding: '1px 5px', borderRadius: 4 }}>
      {confidence}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Analysis panel (ANL-02/03/04): Climate, Doctrine, Gameplay
// ---------------------------------------------------------------------------

type AnalysisSubTab = 'climate' | 'doctrine' | 'gameplay';

function AnalysisPanel({
  map,
  editor,
}: {
  map: WardleyMap;
  editor: ReturnType<typeof useMapEditor>;
}) {
  const [sub, setSub] = React.useState<AnalysisSubTab>('climate');

  const climateBadge = map.analysis.climate.length;
  const doctrineBadge = map.analysis.doctrine.length;
  const gameplayBadge = map.analysis.gameplay.length;

  const subTabs: { id: AnalysisSubTab; label: string; badge: number; icon: React.ReactNode }[] = [
    { id: 'climate', label: 'Climate', badge: climateBadge, icon: <Zap size={12} /> },
    { id: 'doctrine', label: 'Doctrine', badge: doctrineBadge, icon: <Shield size={12} /> },
    { id: 'gameplay', label: 'Gameplay', badge: gameplayBadge, icon: <BookOpen size={12} /> },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            style={{
              flex: 1,
              height: 30,
              borderRadius: 6,
              border: `1px solid ${sub === t.id ? 'var(--primary)' : 'var(--border)'}`,
              background: sub === t.id ? 'var(--primary-soft)' : 'var(--bg-elevated)',
              color: sub === t.id ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: sub === t.id ? 650 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {t.icon}
            {t.label}
            {t.badge > 0 && (
              <span style={{ fontSize: 10, fontWeight: 650, color: 'var(--primary)', background: 'var(--primary-soft)', borderRadius: 999, padding: '0 4px', lineHeight: '16px' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {sub === 'climate' && <ClimateSubPanel map={map} editor={editor} />}
      {sub === 'doctrine' && <DoctrineSubPanel map={map} editor={editor} />}
      {sub === 'gameplay' && <GameplaySubPanel map={map} editor={editor} />}

      <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
        Analysis is context-specific. Catalog descriptions are definitions; assessments are map-specific hypotheses that require human rationale.
      </p>
    </div>
  );
}

// ---- Climate sub-panel ----

function ClimateSubPanel({ map, editor }: { map: WardleyMap; editor: ReturnType<typeof useMapEditor> }) {
  const [selectedCatalogId, setSelectedCatalogId] = React.useState('');
  const [filterCat, setFilterCat] = React.useState<string>('all');

  const filtered = CLIMATE_CATALOG.filter((e) => filterCat === 'all' || e.category === filterCat);
  const assessed = new Set(map.analysis.climate.map((a) => a.catalogId));

  const handleAssess = (catalogId: string, state: PatternAssessment['state']) => {
    const existing = map.analysis.climate.find((a) => a.catalogId === catalogId);
    // Changing the state must keep rationale, evidence and affected components
    const assessment: PatternAssessment = existing
      ? { ...existing, state }
      : {
          id: generateId('ca'),
          catalogId,
          appliesToIds: [],
          state,
          rationale: '',
          evidenceIds: [],
          confidence: 'medium',
        };
    editor.upsertClimateAssessment(assessment);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Climatic patterns are external forces. Mark whether each applies to this map — these are your observations, not automatic facts.
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat('all')} style={filterBtnStyle(filterCat === 'all')}>All</button>
        {CLIMATE_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} style={filterBtnStyle(filterCat === c)}>{c}</button>
        ))}
      </div>
      {filtered.map((entry) => {
        const assessment = map.analysis.climate.find((a) => a.catalogId === entry.id);
        return (
          <div key={entry.id} style={{ padding: 10, borderRadius: 8, border: `1px solid ${assessed.has(entry.id) ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)', marginBottom: 4 }}>{entry.shortTitle}</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{entry.description}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['considering', 'applies', 'does-not-apply', 'uncertain'] as PatternAssessment['state'][]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleAssess(entry.id, s)}
                  aria-pressed={assessment?.state === s}
                  style={{
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: assessment?.state === s ? 'var(--primary)' : 'var(--border)',
                    background: assessment?.state === s ? 'var(--primary-soft)' : 'none',
                    color: assessment?.state === s ? 'var(--primary)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: assessment?.state === s ? 650 : 400,
                  }}
                >
                  {s.replace(/-/g, ' ')}
                </button>
              ))}
              {assessment && (
                <button onClick={() => editor.removeClimateAssessment(assessment.id)} aria-label={`Remove assessment of ${entry.shortTitle}`} style={{ height: 24, padding: '0 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-subtle)', marginLeft: 'auto' }}>
                  <X size={10} />
                </button>
              )}
            </div>
            {assessment && (
              <AssessmentEditor
                kind="climate"
                assessment={assessment}
                map={map}
                onChange={editor.upsertClimateAssessment}
                onAddEvidence={editor.addEvidence}
                    onHighlight={editor.setHighlight}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Doctrine sub-panel ----

function DoctrineSubPanel({ map, editor }: { map: WardleyMap; editor: ReturnType<typeof useMapEditor> }) {
  const [filterPhase, setFilterPhase] = React.useState<string>('all');

  const filtered = DOCTRINE_CATALOG.filter((e) => filterPhase === 'all' || e.phase === filterPhase);

  const handleAssess = (catalogId: string, capabilityState: DoctrineAssessment['capabilityState']) => {
    const existing = map.analysis.doctrine.find((a) => a.catalogId === catalogId);
    const assessment: DoctrineAssessment = existing
      ? { ...existing, capabilityState }
      : {
          id: generateId('da'),
          catalogId,
          appliesToIds: [],
          state: 'applies',
          rationale: '',
          evidenceIds: [],
          confidence: 'medium',
          capabilityState,
        };
    editor.upsertDoctrineAssessment(assessment);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Doctrine principles are generally applicable best practices. Assess where you are — these counts are for review, not a vanity score.
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterPhase('all')} style={filterBtnStyle(filterPhase === 'all')}>All</button>
        {DOCTRINE_PHASES.map((p) => (
          <button key={p.phase} onClick={() => setFilterPhase(p.phase)} style={filterBtnStyle(filterPhase === p.phase)}>Phase {p.phase}</button>
        ))}
      </div>
      {/* Counts — not a percentage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <StatTile label="Assessed" value={map.analysis.doctrine.length} />
        <StatTile label="Embedded" value={map.analysis.doctrine.filter((a) => a.capabilityState === 'embedded').length} />
      </div>
      {filtered.map((entry) => {
        const assessment = map.analysis.doctrine.find((a) => a.catalogId === entry.id);
        const capStates: DoctrineAssessment['capabilityState'][] = ['not-started', 'emerging', 'practiced', 'embedded', 'not-applicable'];
        return (
          <div key={entry.id} style={{ padding: 10, borderRadius: 8, border: `1px solid ${assessment ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Phase {entry.phase} · {entry.category}</div>
            <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)', marginBottom: 4 }}>{entry.shortTitle}</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>{entry.definition}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {capStates.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAssess(entry.id, s)}
                  aria-pressed={assessment?.capabilityState === s}
                  style={{
                    height: 22,
                    padding: '0 7px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: assessment?.capabilityState === s ? 'var(--primary)' : 'var(--border)',
                    background: assessment?.capabilityState === s ? 'var(--primary-soft)' : 'none',
                    color: assessment?.capabilityState === s ? 'var(--primary)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: assessment?.capabilityState === s ? 650 : 400,
                  }}
                >
                  {s.replace(/-/g, ' ')}
                </button>
              ))}
              {assessment && (
                <button onClick={() => editor.removeDoctrineAssessment(assessment.id)} aria-label={`Remove assessment of ${entry.shortTitle}`} style={{ height: 22, padding: '0 5px', borderRadius: 4, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-subtle)', marginLeft: 'auto' }}>
                  <X size={9} />
                </button>
              )}
            </div>
            {assessment && (
              <>
                <details style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <summary style={{ cursor: 'pointer' }}>Observable signals and counter-signals</summary>
                  <p style={{ margin: '6px 0 2px', fontWeight: 600 }}>In practice when…</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>{entry.observableSignals.map((x) => <li key={x}>{x}</li>)}</ul>
                  <p style={{ margin: '6px 0 2px', fontWeight: 600 }}>Absent when…</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>{entry.counterSignals.map((x) => <li key={x}>{x}</li>)}</ul>
                  <p style={{ margin: '6px 0 2px', fontWeight: 600 }}>Reflect</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>{entry.reflectionPrompts.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
                <AssessmentEditor
                  kind="doctrine"
                  assessment={assessment}
                  map={map}
                  onChange={editor.upsertDoctrineAssessment}
                  onAddEvidence={editor.addEvidence}
                    onHighlight={editor.setHighlight}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Gameplay sub-panel ----

function GameplaySubPanel({ map, editor }: { map: WardleyMap; editor: ReturnType<typeof useMapEditor> }) {
  const [filterCat, setFilterCat] = React.useState<string>('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = GAMEPLAY_CATALOG.filter((e) => filterCat === 'all' || e.category === filterCat);
  const hypothesized = new Set(map.analysis.gameplay.map((g) => g.catalogId));

  const handleAddHypothesis = (catalogId: string) => {
    const entry = GAMEPLAY_CATALOG.find((e) => e.id === catalogId)!;
    const hypothesis: GameplayHypothesis = {
      id: generateId('gh'),
      catalogId,
      appliesToIds: [],
      state: 'considering',
      rationale: '',
      evidenceIds: [],
      confidence: 'low',
      category: entry.category,
      intendedEffect: entry.intendedEffect,
      leadingSignals: [],
      risks: [...entry.risks],
      ethicalNotes: '',
      stopConditions: [],
      supportingIds: [],
      humanReviewed: false,
    };
    editor.upsertGameplayHypothesis(hypothesis);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--warning-soft)', border: '1px solid var(--warning)', fontSize: 12, color: 'var(--text)' }}>
        Gameplays added to a map are <strong>hypotheses</strong>, not instructions. Each requires rationale, risks, and deliberate human review before acting.
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat('all')} style={filterBtnStyle(filterCat === 'all')}>All</button>
        {GAMEPLAY_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={filterBtnStyle(filterCat === c.id)}>{c.label}</button>
        ))}
      </div>
      {filtered.map((entry) => {
        const hypothesis = map.analysis.gameplay.find((g) => g.catalogId === entry.id);
        const isExpanded = expandedId === entry.id;
        return (
          <div key={entry.id} style={{ borderRadius: 8, border: `1px solid ${hypothesis ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              aria-expanded={isExpanded}
              style={{ width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 6 }}>{entry.category.replace(/-/g, ' ')}</span>
                <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text)' }}>{entry.shortTitle}</span>
              </div>
              <span style={{ color: 'var(--text-subtle)' }}>
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            </button>
            {isExpanded && (
              <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.5 }}>{entry.description}</p>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Risks</div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {entry.risks.map((r, i) => <li key={i} style={{ fontSize: 11, color: 'var(--error)', lineHeight: 1.5 }}>{r}</li>)}
                  </ul>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ethical review required</div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                    {entry.ethicalReviewPrompts.map((p, i) => <li key={i} style={{ fontSize: 11, color: 'var(--warning)', lineHeight: 1.5 }}>{p}</li>)}
                  </ul>
                </div>
                {entry.caution && (
                  <div role="note" style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--error)', background: 'var(--error-soft)', fontSize: 12, color: 'var(--text)' }}>
                    <strong>Caution:</strong> {entry.caution}
                  </div>
                )}
                {hypothesis ? (
                  <button onClick={() => editor.removeGameplayHypothesis(hypothesis.id)} style={{ height: 26, padding: '0 10px', borderRadius: 6, border: '1px solid var(--error)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--error)' }}>Remove hypothesis</button>
                ) : (
                  <button onClick={() => handleAddHypothesis(entry.id)} style={{ height: 26, padding: '0 10px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'var(--text-on-primary)', cursor: 'pointer', fontSize: 11 }}>Add as hypothesis</button>
                )}
                {hypothesis && (
                  <AssessmentEditor
                    kind="gameplay"
                    assessment={hypothesis}
                    map={map}
                    onChange={editor.upsertGameplayHypothesis}
                    onAddEvidence={editor.addEvidence}
                    onHighlight={editor.setHighlight}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    height: 24,
    padding: '0 8px',
    borderRadius: 4,
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    background: active ? 'var(--primary-soft)' : 'none',
    color: active ? 'var(--primary)' : 'var(--text-subtle)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: active ? 650 : 400,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-subtle)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

/** Labels its control via htmlFor/id so the accessible name is exactly `label`. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 };
  // Several controls (e.g. slider plus scale captions): fall back to a group label
  if (!React.isValidElement(children)) {
    return (
      <div role="group" aria-label={label}>
        <span style={labelStyle}>{label}</span>
        {children}
      </div>
    );
  }
  const child = children as React.ReactElement<{ id?: string }>;
  const id = child.props.id ?? generatedId;
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {React.cloneElement(child, { id })}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{label}</span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  sub,
}: {
  icon?: React.ReactNode;
  message: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        textAlign: 'center',
        gap: 8,
      }}
    >
      {icon}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{message}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 34,
  padding: '0 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
};

function severityColor(sev: ValidationSeverity): string {
  switch (sev) {
    case 'error': return 'var(--error)';
    case 'warning': return 'var(--warning)';
    case 'recommendation': return 'var(--recommendation)';
    default: return 'var(--info)';
  }
}

function severityBgColor(sev: ValidationSeverity): string {
  switch (sev) {
    case 'error': return 'var(--error-soft)';
    case 'warning': return 'var(--warning-soft)';
    case 'recommendation': return 'var(--recommendation-soft)';
    default: return 'var(--info-soft)';
  }
}

function severitySoftColor(sev: ValidationSeverity): string {
  switch (sev) {
    case 'error': return 'var(--error)';
    case 'warning': return 'var(--warning)';
    case 'recommendation': return 'var(--recommendation)';
    default: return 'var(--border)';
  }
}

function severityIcon(sev: ValidationSeverity) {
  switch (sev) {
    case 'error': return <AlertCircle size={14} />;
    case 'warning': return <AlertTriangle size={14} />;
    case 'recommendation': return <Lightbulb size={14} />;
    default: return <Info size={14} />;
  }
}
