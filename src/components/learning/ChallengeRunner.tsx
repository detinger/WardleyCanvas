'use client';

// LRN-03/05: Challenge runner — the real map editor in practice mode, validator
// feedback (what, why, one next move), progressive hints, reflection, and an
// example answer revealed only after completion.

import * as React from 'react';
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Trophy, BookOpen } from 'lucide-react';
import { LearningModule, ValidatorResult, ChallengeValidator } from '@/learning/types';
import { runChallenge, defaultNextStep } from '@/learning/validators';
import {
  getModuleProgress,
  recordChallengeAttempt,
  markModuleComplete,
  revealHint,
  saveReflection,
  resetModuleProgress,
} from '@/learning/progress';
import { loadPracticeMap, savePracticeMap, clearPracticeMap } from '@/learning/practice';
import { parseOWM, serializeOWM } from '@/parser/owm';
import { WardleyMap, makeNewMap } from '@/domain/types';
import EditorLayout from '@/components/editor/EditorLayout';

interface Props {
  module: LearningModule;
  onComplete: () => void;
}

type Phase = 'challenge' | 'reflection' | 'done';

function starterMap(mod: LearningModule): WardleyMap {
  const id = `practice-${mod.id}`;
  if (mod.challenge.starterOwm) {
    const parsed = parseOWM(mod.challenge.starterOwm, id);
    if (!parsed.hasErrors) return parsed.map;
  }
  return makeNewMap(id, `${mod.title} practice`);
}

export default function ChallengeRunner({ module: mod, onComplete }: Props) {
  const ch = mod.challenge;

  // The practice map lives outside the editor so a check always sees the latest edit
  const [initialMap, setInitialMap] = React.useState<WardleyMap>(() => loadPracticeMap(mod.id) ?? starterMap(mod));
  const [editorKey, setEditorKey] = React.useState(0);
  const mapRef = React.useRef<WardleyMap>(initialMap);
  const [results, setResults] = React.useState<ValidatorResult[] | null>(null);
  const [allPassed, setAllPassed] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>(() => (getModuleProgress(mod.id).completedAt ? 'done' : 'challenge'));
  const [revealedHints, setRevealedHints] = React.useState<Set<number>>(
    () => new Set(getModuleProgress(mod.id).revealedHintLevels)
  );
  const [reflection, setReflection] = React.useState(() => getModuleProgress(mod.id).reflectionNotes);
  const [announcement, setAnnouncement] = React.useState('');
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const handleMapChange = React.useCallback((map: WardleyMap) => {
    mapRef.current = map;
    savePracticeMap(mod.id, map);
  }, [mod.id]);

  const handleCheck = React.useCallback(() => {
    const cr = runChallenge(ch, mapRef.current);
    setResults(cr.results);
    recordChallengeAttempt(mod.id, cr.results.filter((r) => r.passed).map((r) => r.validatorId));
    if (cr.allPassed) {
      setAllPassed(true);
      markModuleComplete(mod.id);
      setAnnouncement('All checks passed. You can continue to the reflection.');
      onComplete();
    } else {
      setAllPassed(false);
      const failCount = cr.totalCount - cr.passCount;
      setAnnouncement(`${cr.passCount} of ${cr.totalCount} checks passed. ${failCount} still to do.`);
    }
    // Move focus to results so keyboard and screen-reader users land on the feedback
    setTimeout(() => resultsRef.current?.focus(), 50);
  }, [ch, mod.id, onComplete]);

  const handleRevealHint = React.useCallback((level: number) => {
    revealHint(mod.id, level);
    setRevealedHints((prev) => new Set([...prev, level]));
    setAnnouncement(`Hint ${level} revealed.`);
  }, [mod.id]);

  const handleSaveReflection = React.useCallback(() => {
    saveReflection(mod.id, reflection);
    setPhase('done');
    onComplete();
  }, [mod.id, reflection, onComplete]);

  const handleReset = React.useCallback(() => {
    resetModuleProgress(mod.id);
    clearPracticeMap(mod.id);
    const fresh = starterMap(mod);
    mapRef.current = fresh;
    setInitialMap(fresh);
    setEditorKey((k) => k + 1);
    setResults(null);
    setAllPassed(false);
    setPhase('challenge');
    setRevealedHints(new Set());
    setReflection('');
    setAnnouncement('Challenge reset to the starter map.');
    onComplete();
  }, [mod, onComplete]);

  const maxHintLevel = ch.hints.length;
  const nextHintLevel = ch.hints.map((h) => h.level).find((l) => !revealedHints.has(l));

  if (phase === 'done') {
    return <CompletionBanner module={mod} onReset={handleReset} />;
  }

  return (
    <div>
      {/* LRN-05: polite live region for check results and hints */}
      <div role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
        {announcement}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>{ch.title}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{ch.objective}</p>
      </div>

      {ch.instructions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={sectionHeading}>Steps</h3>
          <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ch.instructions.map((step) => (
              <li key={step.id} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{step.instruction}</li>
            ))}
          </ol>
        </div>
      )}

      {/* The real editor in practice mode: nothing is saved to your maps */}
      <section aria-label="Practice map editor" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '0 0 6px' }}>
          Practice map — kept separately from your saved maps. Use the visual editor, the inspector or the source view.
        </p>
        <div className="practice-editor">
          <EditorLayout
            key={editorKey}
            initialMap={initialMap}
            practice={{ onChange: handleMapChange, primaryLabel: 'Check my map', onPrimary: handleCheck }}
          />
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {nextHintLevel !== undefined && (
          <button onClick={() => handleRevealHint(nextHintLevel)} style={secondaryButton}>
            <Lightbulb size={13} /> Hint ({nextHintLevel} of {maxHintLevel})
          </button>
        )}
        <button onClick={handleReset} style={secondaryButton}>
          <RotateCcw size={13} /> Start over
        </button>
      </div>

      {revealedHints.size > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ch.hints
            .filter((h) => revealedHints.has(h.level))
            .map((h) => (
              <div key={h.level} role="note" aria-label={`Hint ${h.level}`} style={hintBox}>
                <Lightbulb size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{h.text}</span>
              </div>
            ))}
        </div>
      )}

      {results && (
        <div ref={resultsRef} tabIndex={-1} style={{ marginBottom: 24, outline: 'none' }}>
          <ValidatorPanel results={results} validators={ch.validators} allPassed={allPassed} />
          {allPassed && phase === 'challenge' && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setPhase('reflection')} style={primaryButton}>
                <BookOpen size={15} /> Continue to reflection
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'reflection' && (
        <ReflectionSection
          prompts={ch.reflectionPrompts}
          rubric={ch.rubric}
          reflection={reflection}
          onChange={setReflection}
          onSave={handleSaveReflection}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validator results panel — Section 9.3: issue, why it matters, one next move
// ---------------------------------------------------------------------------

function ValidatorPanel({
  results,
  validators,
  allPassed,
}: {
  results: ValidatorResult[];
  validators: ChallengeValidator[];
  allPassed: boolean;
}) {
  const passCount = results.filter((r) => r.passed).length;
  return (
    <div
      role="region"
      aria-label="Check results"
      style={{ border: `1px solid ${allPassed ? 'var(--success)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: allPassed ? 'var(--success-soft)' : 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          color: allPassed ? 'var(--success)' : 'var(--text)',
        }}
      >
        {allPassed ? <CheckCircle size={15} /> : null}
        {allPassed ? 'All checks passed' : `${passCount} of ${results.length} checks passed`}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {results.map((r) => {
          const v = validators.find((x) => x.id === r.validatorId);
          return (
            <li key={r.validatorId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              {r.passed ? (
                <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              ) : (
                <XCircle size={15} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              )}
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <div style={{ color: 'var(--text)' }}>
                  <strong>{r.passed ? 'Done: ' : 'To do: '}</strong>
                  {v?.description ?? r.message}
                </div>
                {!r.passed && (
                  <>
                    <div style={{ color: 'var(--text-muted)' }}>{r.message}.</div>
                    {v && <div style={{ color: 'var(--text-muted)' }}><strong>Why it matters:</strong> {v.rationale}</div>}
                    {v && <div style={{ color: 'var(--text-muted)' }}><strong>Try:</strong> {v.nextStep ?? defaultNextStep(v.kind)}</div>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reflection section
// ---------------------------------------------------------------------------

function ReflectionSection({
  prompts,
  rubric,
  reflection,
  onChange,
  onSave,
}: {
  prompts: string[];
  rubric: NonNullable<LearningModule['challenge']['rubric']>;
  reflection: string;
  onChange: (s: string) => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text)', margin: 0 }}>
          Reflection
        </h3>
      </div>
      <div style={{ padding: '16px' }}>
        {rubric.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
              Reflect on these criteria
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rubric.map((r) => (
                <li key={r.id} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                  {r.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {prompts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
              Reflection prompts
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prompts.map((p, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          value={reflection}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your notes… (optional)"
          aria-label="Reflection notes"
          style={{
            width: '100%',
            minHeight: 100,
            fontFamily: 'inherit',
            fontSize: 13,
            lineHeight: 1.6,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
        />

        <button
          onClick={onSave}
          style={{
            height: 38,
            padding: '0 18px',
            borderRadius: 8,
            background: 'var(--primary)',
            color: 'var(--text-on-primary)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Trophy size={14} /> Complete module
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion banner — with one possible answer, never shown before completion
// ---------------------------------------------------------------------------

function CompletionBanner({ module: mod, onReset }: { module: LearningModule; onReset: () => void }) {
  const sample = mod.challenge.sampleSolution;
  const sampleOwm = React.useMemo(() => (sample ? serializeOWM(sample.build()) : ''), [sample]);
  const completionLabel = mod.caseStudy ? 'Case study complete' : 'Module complete';
  const completionSubject = mod.caseStudy ? 'case study' : 'module';
  return (
    <div>
      <div
        role="status"
        style={{ textAlign: 'center', padding: '32px 24px', border: '1px solid var(--success)', borderRadius: 12, background: 'var(--success-soft)', marginBottom: 16 }}
      >
        <Trophy size={32} color="var(--success)" style={{ marginBottom: 12 }} aria-hidden="true" />
        <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>{completionLabel}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
          You completed the {completionSubject} “{mod.title}”. Your objective checks and your reflection are recorded separately.
        </p>
        <button onClick={onReset} style={{ ...secondaryButton, display: 'inline-flex' }}>
          <RotateCcw size={13} /> Reset and try again
        </button>
      </div>
      {sample && (
        <details style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Compare with one possible answer
          </summary>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{sample.explanation}</p>
          <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: 12, borderRadius: 6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {sampleOwm}
          </pre>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const visuallyHidden: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};
const sectionHeading: React.CSSProperties = {
  fontSize: 12, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px',
};
const primaryButton: React.CSSProperties = {
  height: 38, padding: '0 18px', borderRadius: 8, background: 'var(--primary)', color: 'var(--text-on-primary)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
};
const secondaryButton: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 8, background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
};
const hintBox: React.CSSProperties = {
  display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'var(--primary-soft)', border: '1px solid var(--border)',
};
