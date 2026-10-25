'use client';

// ANL-01..04: Editor for one map-specific assessment (climate, doctrine or gameplay).
// Catalog text is a definition; everything edited here is the team's own assertion:
// affected components, rationale, confidence, evidence, owner and review date.
// Text fields commit on blur so typing a sentence is one undo step, not dozens.

import * as React from 'react';
import { Plus } from 'lucide-react';
import {
  WardleyMap,
  PatternAssessment,
  GameplayHypothesis,
  Evidence,
  Confidence,
  Id,
  generateId,
} from '@/domain/types';
import { sanitizeUrl } from '@/parser/owm';
import { getClimateEntry } from '@/analysis/climate-catalog';
import { getDoctrineEntry } from '@/analysis/doctrine-catalog';

type AnyAssessment = PatternAssessment | GameplayHypothesis;

interface Props<T extends AnyAssessment> {
  kind: 'climate' | 'doctrine' | 'gameplay';
  assessment: T;
  map: WardleyMap;
  onChange: (next: T) => void;
  onAddEvidence: (ev: Evidence) => void;
  /** Call out the affected components on the canvas while this editor has focus */
  onHighlight?: (ids: Id[]) => void;
}

export default function AssessmentEditor<T extends AnyAssessment>({
  kind,
  assessment,
  map,
  onChange,
  onAddEvidence,
  onHighlight,
}: Props<T>) {
  const affected = assessment.appliesToIds;
  React.useEffect(() => () => onHighlight?.([]), [onHighlight]);
  const set = (changes: Partial<T>) => onChange({ ...assessment, ...changes });
  const idBase = `assess-${assessment.id}`;
  const gameplay = kind === 'gameplay' ? (assessment as GameplayHypothesis) : null;
  const setGameplay = (changes: Partial<GameplayHypothesis>) => onChange({ ...assessment, ...changes } as unknown as T);

  return (
    <div
      onFocusCapture={() => onHighlight?.(affected)}
      onMouseEnter={() => onHighlight?.(affected)}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}
    >
      {!assessment.rationale.trim() && (
        <p role="note" style={{ margin: 0, fontSize: 12, color: 'var(--warning)' }}>
          Incomplete: add a rationale. Assessments without one are flagged in the summary and exports.
        </p>
      )}
      <CommitText
        id={`${idBase}-rationale`}
        label={kind === 'gameplay' ? 'Rationale — why this play fits this landscape' : 'Rationale — why you made this assessment'}
        value={assessment.rationale}
        onCommit={(rationale) => set({ rationale } as Partial<T>)}
        multiline
      />

      <ComponentPicker
        id={`${idBase}-affects`}
        map={map}
        selected={assessment.appliesToIds}
        onChange={(appliesToIds) => {
          set({ appliesToIds } as Partial<T>);
          onHighlight?.(appliesToIds);
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        <Field label="Confidence" htmlFor={`${idBase}-confidence`}>
          <select
            id={`${idBase}-confidence`}
            value={assessment.confidence}
            onChange={(e) => set({ confidence: e.target.value as Confidence } as Partial<T>)}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <CommitText
          id={`${idBase}-owner`}
          label="Owner"
          value={assessment.owner ?? ''}
          onCommit={(owner) => set({ owner: owner || undefined } as Partial<T>)}
        />
        <Field label="Review by" htmlFor={`${idBase}-review`}>
          <input
            id={`${idBase}-review`}
            type="date"
            value={assessment.reviewAt ?? ''}
            onChange={(e) => set({ reviewAt: e.target.value || undefined } as Partial<T>)}
            style={inputStyle}
          />
        </Field>
      </div>

      <EvidencePicker
        idBase={idBase}
        map={map}
        selected={assessment.evidenceIds}
        onChange={(evidenceIds) => set({ evidenceIds } as Partial<T>)}
        onAddEvidence={(ev) => {
          onAddEvidence(ev);
          set({ evidenceIds: [...assessment.evidenceIds, ev.id] } as Partial<T>);
        }}
      />

      {gameplay && (
        <>
          <CommitText
            id={`${idBase}-effect`}
            label="Intended change in the landscape"
            value={gameplay.intendedEffect}
            onCommit={(intendedEffect) => setGameplay({ intendedEffect })}
            multiline
          />
          <CommitText
            id={`${idBase}-assumptions`}
            label="Assumptions"
            value={gameplay.assumptions ?? ''}
            onCommit={(assumptions) => setGameplay({ assumptions: assumptions || undefined })}
            multiline
          />
          <LinesField
            id={`${idBase}-signals`}
            label="Leading signals (one per line)"
            value={gameplay.leadingSignals}
            onCommit={(leadingSignals) => setGameplay({ leadingSignals })}
          />
          <LinesField
            id={`${idBase}-stop`}
            label="Stop conditions (one per line)"
            value={gameplay.stopConditions ?? []}
            onCommit={(stopConditions) => setGameplay({ stopConditions })}
          />
          <LinesField
            id={`${idBase}-risks`}
            label="Risks and possible harms (one per line)"
            value={gameplay.risks}
            onCommit={(risks) => setGameplay({ risks })}
          />
          <CommitText
            id={`${idBase}-ethics`}
            label="Legal and ethical notes"
            value={gameplay.ethicalNotes ?? ''}
            onCommit={(ethicalNotes) => setGameplay({ ethicalNotes: ethicalNotes || undefined })}
            multiline
          />
          <SupportingPicker
            id={`${idBase}-support`}
            map={map}
            selected={gameplay.supportingIds ?? []}
            onChange={(supportingIds) => setGameplay({ supportingIds })}
          />
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={!!gameplay.humanReviewed}
              onChange={(e) => setGameplay({ humanReviewed: e.target.checked })}
              style={{ marginTop: 3 }}
            />
            <span>
              I have reviewed the risks, harms and legal/ethical notes for this hypothesis.
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)' }}>
                Unreviewed hypotheses are labelled as such in exports and summaries.
              </span>
            </span>
          </label>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label htmlFor={htmlFor} style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/** Text input that keeps a local draft and commits on blur (or Ctrl/⌘+Enter). */
export function CommitText({
  id,
  label,
  value,
  onCommit,
  multiline,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const commit = () => { if (draft !== value) onCommit(draft); };
  const common = {
    id,
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !multiline)) {
        e.preventDefault();
        commit();
      }
    },
  };
  return (
    <Field label={label} htmlFor={id}>
      {multiline ? (
        <textarea {...common} rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
      ) : (
        <input {...common} style={inputStyle} />
      )}
    </Field>
  );
}

function LinesField({ id, label, value, onCommit }: { id: string; label: string; value: string[]; onCommit: (v: string[]) => void }) {
  return (
    <CommitText
      id={id}
      label={label}
      value={value.join('\n')}
      onCommit={(text) => onCommit(text.split('\n').map((s) => s.trim()).filter(Boolean))}
      multiline
    />
  );
}

function ComponentPicker({ id, map, selected, onChange }: { id: string; map: WardleyMap; selected: Id[]; onChange: (ids: Id[]) => void }) {
  if (map.elements.length === 0) return null;
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>Affected components</legend>
      <div id={id} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {map.elements.map((el) => (
          <label key={el.id} style={checkLabelStyle}>
            <input
              type="checkbox"
              checked={selected.includes(el.id)}
              onChange={(e) => onChange(e.target.checked ? [...selected, el.id] : selected.filter((x) => x !== el.id))}
            />
            {el.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SupportingPicker({ id, map, selected, onChange }: { id: string; map: WardleyMap; selected: Id[]; onChange: (ids: Id[]) => void }) {
  const options = [
    ...map.analysis.climate.map((a) => ({ id: a.id, label: `Climate: ${getClimateEntry(a.catalogId)?.shortTitle ?? a.catalogId}` })),
    ...map.analysis.doctrine.map((a) => ({ id: a.id, label: `Doctrine: ${getDoctrineEntry(a.catalogId)?.shortTitle ?? a.catalogId}` })),
  ];
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>Supporting climate/doctrine observations</legend>
      {options.length === 0 ? (
        <p style={hintStyle}>Assess climate patterns or doctrine first to link them here.</p>
      ) : (
        <div id={id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {options.map((o) => (
            <label key={o.id} style={checkLabelStyle}>
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) => onChange(e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id))}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function EvidencePicker({
  idBase,
  map,
  selected,
  onChange,
  onAddEvidence,
}: {
  idBase: string;
  map: WardleyMap;
  selected: Id[];
  onChange: (ids: Id[]) => void;
  onAddEvidence: (ev: Evidence) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [claim, setClaim] = React.useState('');
  const [source, setSource] = React.useState('');
  const [url, setUrl] = React.useState('');
  const urlInvalid = url.trim() !== '' && !sanitizeUrl(url);

  const add = () => {
    if (!claim.trim() || urlInvalid) return;
    onAddEvidence({
      id: generateId('evd'),
      claim: claim.trim(),
      sourceLabel: source.trim() || undefined,
      sourceUrl: url.trim() ? sanitizeUrl(url)! : undefined,
      confidence: 'medium',
      observedAt: new Date().toISOString().slice(0, 10),
    });
    setClaim(''); setSource(''); setUrl(''); setAdding(false);
  };

  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>Evidence</legend>
      {map.analysis.evidence.length === 0 && !adding && <p style={hintStyle}>No evidence recorded on this map yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {map.analysis.evidence.map((ev) => (
          <label key={ev.id} style={checkLabelStyle}>
            <input
              type="checkbox"
              checked={selected.includes(ev.id)}
              onChange={(e) => onChange(e.target.checked ? [...selected, ev.id] : selected.filter((x) => x !== ev.id))}
            />
            <span>{ev.claim}{ev.sourceLabel ? <span style={{ color: 'var(--text-subtle)' }}> — {ev.sourceLabel}</span> : null}</span>
          </label>
        ))}
      </div>
      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <Field label="Claim" htmlFor={`${idBase}-ev-claim`}>
            <input id={`${idBase}-ev-claim`} value={claim} onChange={(e) => setClaim(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Source (optional)" htmlFor={`${idBase}-ev-source`}>
            <input id={`${idBase}-ev-source`} value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Link (optional, http/https)" htmlFor={`${idBase}-ev-url`}>
            <input
              id={`${idBase}-ev-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={urlInvalid}
              aria-describedby={urlInvalid ? `${idBase}-ev-url-err` : undefined}
              style={inputStyle}
            />
          </Field>
          {urlInvalid && <p id={`${idBase}-ev-url-err`} style={{ ...hintStyle, color: 'var(--error)' }}>Only http(s) links are allowed.</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={add} disabled={!claim.trim() || urlInvalid} style={smallBtnStyle}>Add and link evidence</button>
            <button type="button" onClick={() => setAdding(false)} style={{ ...smallBtnStyle, background: 'none' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={{ ...smallBtnStyle, marginTop: 6 }}>
          <Plus size={12} /> New evidence
        </button>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Styles (Section 4.6 small controls)
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  height: 30,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13,
  width: '100%',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 550, color: 'var(--text-muted)', padding: 0 };
const hintStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-subtle)', margin: 0 };
const fieldsetStyle: React.CSSProperties = { border: 'none', padding: 0, margin: 0, minWidth: 0 };
const checkLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: 'var(--text)' };
const smallBtnStyle: React.CSSProperties = {
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
  alignSelf: 'flex-start',
};
