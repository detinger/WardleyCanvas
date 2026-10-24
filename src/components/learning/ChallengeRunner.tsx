'use client';

// LRN-03: Challenge runner — embedded OWM editor, validator feedback, hints, reflection.

import * as React from 'react';
import {
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { LearningModule, ValidatorResult } from '@/learning/types';
import { runChallenge } from '@/learning/validators';
import {
  getModuleProgress,
  recordChallengeAttempt,
  markModuleComplete,
  revealHint,
  saveReflection,
  resetModuleProgress,
} from '@/learning/progress';
import { parseOWM, serializeOWM } from '@/parser/owm';
import { WardleyMap } from '@/domain/types';

interface Props {
  module: LearningModule;
  onComplete: () => void;
}

type Phase = 'challenge' | 'reflection' | 'done';

export default function ChallengeRunner({ module: mod, onComplete }: Props) {
  const ch = mod.challenge;

  // --- state ---
  const [owmSource, setOwmSource] = React.useState(
    ch.starterOwm ?? `title ${mod.title} practice\n\nanchor User [0.95, 0.10]\n`
  );
  const [map, setMap] = React.useState<WardleyMap | null>(null);
  const [results, setResults] = React.useState<ValidatorResult[] | null>(null);
  const [allPassed, setAllPassed] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>('challenge');
  const [revealedHints, setRevealedHints] = React.useState<Set<number>>(() => {
    const mp = getModuleProgress(mod.id);
    return new Set(mp.revealedHintLevels);
  });
  const [reflection, setReflection] = React.useState(() => {
    return getModuleProgress(mod.id).reflectionNotes;
  });
  const [parseError, setParseError] = React.useState('');
  const [announcement, setAnnouncement] = React.useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Seed map from starter OWM on mount
  React.useEffect(() => {
    const result = parseOWM(owmSource);
    if (!result.hasErrors) setMap(result.map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse on source change (debounced)
  const handleSourceChange = React.useCallback((text: string) => {
    setOwmSource(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = parseOWM(text);
      if (result.hasErrors) {
        setParseError(result.diagnostics.filter((d) => d.severity === 'error').map((d) => d.message).join('; '));
      } else {
        setParseError('');
        setMap(result.map);
      }
    }, 400);
  }, []);

  const handleCheck = React.useCallback(() => {
    if (!map) return;
    const cr = runChallenge(ch, map);
    setResults(cr.results);
    recordChallengeAttempt(mod.id, cr.results.filter((r) => r.passed).map((r) => r.validatorId));
    if (cr.allPassed) {
      setAllPassed(true);
      markModuleComplete(mod.id);
      setAnnouncement('All checks passed! You can now continue to the reflection section.');
      setPhase('reflection');
      onComplete();
    } else {
      const failCount = cr.results.filter((r) => !r.passed).length;
      setAnnouncement(`${cr.passCount} of ${cr.totalCount} checks passed. ${failCount} still to fix.`);
      // Move focus to results so keyboard/screen-reader users see them immediately
      setTimeout(() => resultsRef.current?.focus(), 50);
    }
  }, [map, ch, mod.id, onComplete]);

  const handleRevealHint = React.useCallback((level: number) => {
    revealHint(mod.id, level);
    setRevealedHints((prev) => new Set([...prev, level]));
  }, [mod.id]);

  const handleSaveReflection = React.useCallback(() => {
    saveReflection(mod.id, reflection);
    setPhase('done');
    onComplete();
  }, [mod.id, reflection, onComplete]);

  const handleReset = React.useCallback(() => {
    resetModuleProgress(mod.id);
    setOwmSource(ch.starterOwm ?? `title ${mod.title} practice\n\nanchor User [0.95, 0.10]\n`);
    setResults(null);
    setAllPassed(false);
    setPhase('challenge');
    setRevealedHints(new Set());
    setReflection('');
    setParseError('');
    const r = parseOWM(ch.starterOwm ?? '');
    if (!r.hasErrors) setMap(r.map);
  }, [mod.id, mod.title, ch.starterOwm]);

  // Next hint level to reveal
  const maxHintLevel = ch.hints.length > 0 ? Math.max(...ch.hints.map((h) => h.level)) : 0;
  const nextHintLevel = Array.from({ length: maxHintLevel }, (_, i) => i + 1).find(
    (l) => !revealedHints.has(l)
  );

  if (phase === 'done') {
    return <CompletionBanner moduleTitle={mod.title} onReset={handleReset} />;
  }

  return (
    <div>
      {/* LRN-05: Visually-hidden live region for screen-reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement}
      </div>

      {/* Challenge header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>
          {ch.title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          {ch.objective}
        </p>
      </div>

      {/* Instructions */}
      {ch.instructions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
            Steps
          </h3>
          <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ch.instructions.map((step) => (
              <li key={step.id} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                {step.instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* OWM editor */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label
            htmlFor="challenge-owm-editor"
            style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Your map (OWM source)
          </label>
          {parseError && (
            <span style={{ fontSize: 11, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <XCircle size={11} /> {parseError}
            </span>
          )}
        </div>
        <textarea
          id="challenge-owm-editor"
          ref={textareaRef}
          value={owmSource}
          onChange={(e) => handleSourceChange(e.target.value)}
          spellCheck={false}
          aria-label="OWM challenge editor"
          style={{
            width: '100%',
            minHeight: 220,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.6,
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${parseError ? 'var(--error)' : 'var(--border)'}`,
            background: 'var(--bg)',
            color: 'var(--text)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={handleCheck}
          disabled={!map || !!parseError}
          style={{
            height: 38,
            padding: '0 18px',
            borderRadius: 8,
            background: 'var(--primary)',
            color: 'var(--text-on-primary)',
            border: 'none',
            cursor: !map || !!parseError ? 'not-allowed' : 'pointer',
            opacity: !map || !!parseError ? 0.5 : 1,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Check my map
        </button>

        {nextHintLevel && (
          <button
            onClick={() => handleRevealHint(nextHintLevel)}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 8,
              background: 'none',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Lightbulb size={13} />
            Hint ({nextHintLevel} of {maxHintLevel})
          </button>
        )}
      </div>

      {/* Revealed hints */}
      {revealedHints.size > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ch.hints
            .filter((h) => revealedHints.has(h.level))
            .sort((a, b) => a.level - b.level)
            .map((h) => (
              <div
                key={h.level}
                role="note"
                aria-label={`Hint ${h.level}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Lightbulb size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{h.text}</span>
              </div>
            ))}
        </div>
      )}

      {/* Validator results */}
      {results && (
        <div ref={resultsRef} tabIndex={-1} style={{ marginBottom: 24, outline: 'none' }}>
          <ValidatorPanel results={results} allPassed={allPassed} />
          {allPassed && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setPhase('reflection')}
                style={{
                  height: 38,
                  padding: '0 18px',
                  borderRadius: 8,
                  background: 'var(--success)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <BookOpen size={15} /> Continue to reflection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reflection phase */}
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
// Validator results panel
// ---------------------------------------------------------------------------

function ValidatorPanel({ results, allPassed }: { results: ValidatorResult[]; allPassed: boolean }) {
  return (
    <div
      role="region"
      aria-label="Validation results"
      aria-live="polite"
      style={{
        border: `1px solid ${allPassed ? 'var(--success)' : 'var(--border)'}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: allPassed ? 'var(--success-soft)' : 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {allPassed ? (
          <CheckCircle size={15} color="var(--success)" />
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {results.filter((r) => r.passed).length} / {results.length} passed
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: allPassed ? 600 : 400, color: allPassed ? 'var(--success)' : 'var(--text)' }}>
          {allPassed ? 'All checks passed!' : 'Validator results'}
        </span>
      </div>
      <div>
        {results.map((r) => (
          <div
            key={r.validatorId}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '9px 14px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {r.passed ? (
              <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <XCircle size={15} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <span
              style={{
                fontSize: 13,
                color: r.passed ? 'var(--text)' : 'var(--error)',
                lineHeight: 1.5,
              }}
            >
              {r.message}
            </span>
          </div>
        ))}
      </div>
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
// Completion banner
// ---------------------------------------------------------------------------

function CompletionBanner({ moduleTitle, onReset }: { moduleTitle: string; onReset: () => void }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        border: '1px solid var(--success)',
        borderRadius: 12,
        background: 'var(--success-soft)',
      }}
    >
      <Trophy size={32} color="var(--success)" style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>
        Module complete!
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
        You've completed "{moduleTitle}". Move on to the next module or revisit anytime.
      </p>
      <button
        onClick={onReset}
        style={{
          height: 34,
          padding: '0 14px',
          borderRadius: 8,
          background: 'none',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <RotateCcw size={13} /> Reset and retry
      </button>
    </div>
  );
}
