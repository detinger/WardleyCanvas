'use client';

// LRN-02: Learning path overview — shows all 8 modules with progress.

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle, Lock, BookOpen, ChevronRight } from 'lucide-react';
import { ALL_MODULES } from '@/learning/content';
import { loadProgress, resetAllProgress } from '@/learning/progress';
import { clearAllPracticeMaps } from '@/learning/practice';
import { LearningModule, ModuleProgress } from '@/learning/types';

export default function LearnPage() {
  const [progressMap, setProgressMap] = React.useState<Record<string, ModuleProgress>>({});

  React.useEffect(() => {
    setProgressMap(loadProgress().moduleProgress);
  }, []);

  return (
    <main id="main-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 650, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
          Learning path
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.015em', color: 'var(--text)', margin: '0 0 10px' }}>
          Wardley Maps — 8 modules
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: '64ch' }}>
          Each module is a short explanation, an annotated example, and a hands-on challenge.
          You can skip ahead — progress is never a lock on product capability.
        </p>
      </div>

      {/* Module list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
        {ALL_MODULES.map((mod, i) => {
          const prev = i > 0 ? ALL_MODULES[i - 1] : null;
          const prevDone = !prev || !!progressMap[prev.id]?.completedAt;
          const locked = !mod.published;
          const mp = progressMap[mod.id];
          const started = !!mp?.startedAt;
          const done = !!mp?.completedAt;

          return (
            <ModuleCard
              key={mod.id}
              module={mod}
              locked={locked}
              started={started}
              done={done}
            />
          );
        })}
      </div>

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
