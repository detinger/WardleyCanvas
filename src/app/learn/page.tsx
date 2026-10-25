'use client';

// LRN-02: Learning path overview — fundamentals plus applied IT case studies.

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle, Lock, ChevronRight, Clock3, ArrowRight, Map } from 'lucide-react';
import { CASE_STUDIES, FUNDAMENTAL_MODULES } from '@/learning/content';
import { loadProgress, resetAllProgress } from '@/learning/progress';
import { clearAllPracticeMaps } from '@/learning/practice';
import { LearningModule, ModuleProgress } from '@/learning/types';

export default function LearnPage() {
  const [progressMap, setProgressMap] = React.useState<Record<string, ModuleProgress>>({});

  React.useEffect(() => {
    setProgressMap(loadProgress().moduleProgress);
  }, []);

  const completedCases = CASE_STUDIES.filter((mod) => progressMap[mod.id]?.completedAt).length;
  const casesComplete = completedCases === CASE_STUDIES.length;

  return (
    <main id="main-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 650, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
          Learning path
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.015em', color: 'var(--text)', margin: '0 0 10px' }}>
          Learn Wardley Mapping
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: '64ch' }}>
          Learn the foundations in eight focused modules, then apply them in six progressive IT case studies.
          You can skip ahead—progress is never a lock on product capability.
        </p>
      </div>

      <section aria-labelledby="fundamentals-heading" style={{ maxWidth: 720 }}>
        <h2 id="fundamentals-heading" style={{ fontSize: 20, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>
          Foundations
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Learn the vocabulary and mechanics before applying them to complete situations.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FUNDAMENTAL_MODULES.map((mod) => {
            const mp = progressMap[mod.id];
            return (
              <ModuleCard
                key={mod.id}
                module={mod}
                locked={!mod.published}
                started={!!mp?.startedAt}
                done={!!mp?.completedAt}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="case-studies-heading" style={{ marginTop: 44, maxWidth: 1080 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 650, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
              Applied tutorial
            </p>
            <h2 id="case-studies-heading" style={{ fontSize: 20, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>
              Six IT industry case studies
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: '68ch', lineHeight: 1.5 }}>
              Work from guided value chains to an independent security-response capstone. Each case removes a little more scaffolding.
            </p>
          </div>
          <span role="status" style={{ fontSize: 13, fontWeight: 600, color: casesComplete ? 'var(--success)' : 'var(--text-muted)' }}>
            {completedCases} of {CASE_STUDIES.length} completed
          </span>
        </div>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {CASE_STUDIES.map((mod) => {
            const mp = progressMap[mod.id];
            return <CaseStudyCard key={mod.id} module={mod} started={!!mp?.startedAt} done={!!mp?.completedAt} />;
          })}
        </ol>

        <div
          style={{
            marginTop: 16,
            padding: '16px 18px',
            border: `1px solid ${casesComplete ? 'var(--success)' : 'var(--border)'}`,
            borderRadius: 10,
            background: casesComplete ? 'var(--success-soft)' : 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text)', margin: '0 0 4px' }}>
              {casesComplete ? 'Ready to map your own situation' : 'Your independent mapping milestone'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {casesComplete
                ? 'You completed the six-case tutorial. Start with a real user, a real need, and a deliberately narrow scope.'
                : 'Complete the capstone without a starter map, then use the same process on a real situation from your work.'}
            </p>
          </div>
          {casesComplete && (
            <Link href="/maps" className="btn" style={{ textDecoration: 'none' }}>
              <Map size={14} /> Create your own map <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </section>

      <ProgressControls onReset={() => setProgressMap({})} />

      {/* Attribution */}
      <p style={{ marginTop: 40, fontSize: 12, color: 'var(--text-subtle)', maxWidth: '64ch' }}>
        Content based on Simon Wardley&apos;s open work. This learning path is not affiliated with or endorsed by Simon Wardley.
        For the primary source, read{' '}
        <a href="https://medium.com/wardleymaps" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
          Wardley Maps on Medium
        </a>
        .
      </p>
    </main>
  );
}

function CaseStudyCard({ module: mod, started, done }: { module: LearningModule; started: boolean; done: boolean }) {
  const detail = mod.caseStudy!;
  return (
    <li>
      <Link
        href={`/learn/${mod.id}`}
        aria-label={`Case study ${detail.number}: ${mod.title}`}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 18,
          borderRadius: 10,
          border: `1px solid ${done ? 'var(--success)' : 'var(--border)'}`,
          background: done ? 'var(--success-soft)' : 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text)',
          textDecoration: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Case study {detail.number}
          </span>
          {done ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 650, color: 'var(--success)' }}>
              <CheckCircle size={13} /> Completed
            </span>
          ) : started ? (
            <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--primary)' }}>In progress</span>
          ) : null}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 650, margin: 0, color: 'var(--text)' }}>{mod.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, flex: 1 }}>{mod.tagline}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-subtle)' }}>
          <span style={{ padding: '2px 7px', borderRadius: 999, background: detail.guidance === 'Independent' ? 'var(--accent-soft)' : 'var(--primary-soft)', color: 'var(--text)' }}>
            {detail.guidance}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={12} /> {detail.estimatedMinutes} min</span>
          <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
        </div>
      </Link>
    </li>
  );
}

function ModuleCard({
  module: mod,
  locked,
  started,
  done,
}: {
  module: LearningModule;
  locked: boolean;
  started: boolean;
  done: boolean;
}) {
  const statusColor = done
    ? 'var(--success)'
    : started
    ? 'var(--primary)'
    : locked
    ? 'var(--text-subtle)'
    : 'var(--text-muted)';

  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 16px',
        borderRadius: 10,
        border: `1px solid ${done ? 'var(--success)' : 'var(--border)'}`,
        background: done ? 'var(--success-soft)' : locked ? 'var(--bg)' : 'var(--bg-elevated)',
        boxShadow: locked ? 'none' : 'var(--shadow-sm)',
        opacity: locked ? 0.55 : 1,
        transition: 'border-color 120ms, box-shadow 120ms',
        cursor: locked ? 'not-allowed' : 'pointer',
        textDecoration: 'none',
      }}
    >
      {/* Index badge */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `2px solid ${statusColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: done ? 'var(--success-soft)' : 'transparent',
        }}
      >
        {done ? (
          <CheckCircle size={18} color="var(--success)" aria-hidden="true" />
        ) : locked ? (
          <Lock size={15} color="var(--text-subtle)" />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 650, color: statusColor }}>
            {mod.index}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {mod.title}
          </span>
          {!mod.published && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 650,
                color: 'var(--text-subtle)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '1px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Soon
            </span>
          )}
          {started && !done && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 650,
                color: 'var(--primary)',
                background: 'var(--primary-soft)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              In progress
            </span>
          )}
          {done && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 650,
                color: 'var(--success)',
                background: 'var(--success-soft)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Completed
            </span>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {mod.tagline}
        </p>
      </div>

      {/* Arrow */}
      {!locked && <ChevronRight size={16} color="var(--text-subtle)" style={{ flexShrink: 0 }} />}
    </div>
  );

  if (locked) return inner;

  return (
    <Link href={`/learn/${mod.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section 9.3: progress can be exported or reset; it never touches map data
// ---------------------------------------------------------------------------

function ProgressControls({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = React.useState(false);
  const [status, setStatus] = React.useState('');

  const exportProgress = () => {
    const payload = { exportedAt: new Date().toISOString(), progress: loadProgress() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wardley-learning-progress.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Progress exported.');
  };

  const reset = () => {
    resetAllProgress();
    clearAllPracticeMaps();
    setConfirming(false);
    setStatus('All learning progress and practice maps were reset. Your saved maps were not changed.');
    onReset();
  };

  const button: React.CSSProperties = {
    height: 34, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)',
    color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 550,
  };

  return (
    <section aria-labelledby="progress-controls-heading" style={{ marginTop: 32, maxWidth: 720 }}>
      <h2 id="progress-controls-heading" style={{ fontSize: 15, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>Your progress</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Progress is stored only in this browser and is kept separate from your maps.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={exportProgress} style={button}>Export progress</button>
        {confirming ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Reset all modules and practice maps?</span>
            <button type="button" onClick={reset} style={{ ...button, borderColor: 'var(--error)', color: 'var(--error)' }}>Yes, reset</button>
            <button type="button" onClick={() => setConfirming(false)} style={button}>Cancel</button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} style={button}>Reset progress…</button>
        )}
      </div>
      <p role="status" style={{ fontSize: 12, color: 'var(--text-subtle)', minHeight: 18, margin: '8px 0 0' }}>{status}</p>
    </section>
  );
}
