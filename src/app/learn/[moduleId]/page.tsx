'use client';

// LRN-02: Module lesson page — explanation, example, challenge.

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, BookOpen, Target, Lightbulb } from 'lucide-react';
import { getModule, ALL_MODULES } from '@/learning/content';
import { markModuleStarted, loadProgress } from '@/learning/progress';
import ChallengeRunner from '@/components/learning/ChallengeRunner';
import { markdownToHtml } from '@/learning/markdown';
import { sanitizeUrl } from '@/parser/owm';

interface Props {
  params: Promise<{ moduleId: string }>;
}

type Tab = 'learn' | 'challenge';

export default function ModulePage({ params }: Props) {
  const { moduleId } = use(params);
  const router = useRouter();
  const mod = getModule(moduleId);
  const [tab, setTab] = React.useState<Tab>('learn');
  // Loaded after mount so server and client markup match (localStorage is client-only)
  const [progress, setProgress] = React.useState<ReturnType<typeof loadProgress>['moduleProgress']>({});

  React.useEffect(() => {
    if (mod) markModuleStarted(mod.id);
    setProgress(loadProgress().moduleProgress);
    // Deep link from the challenges index: /learn/<id>?tab=challenge
    if (new URLSearchParams(window.location.search).get('tab') === 'challenge') setTab('challenge');
  }, [mod]);

  if (!mod) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 8px' }}>Module not found</h2>
          <Link href="/learn" style={{ color: 'var(--primary)', fontSize: 14 }}>Back to learning path</Link>
        </div>
      </div>
    );
  }

  if (!mod.published) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <h2 style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 8px' }}>{mod.title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
            This module is being prepared and will be available soon.
          </p>
          <Link href="/learn" style={{ color: 'var(--primary)', fontSize: 14 }}>← Back to learning path</Link>
        </div>
      </div>
    );
  }

  const currentIndex = ALL_MODULES.findIndex((m) => m.id === moduleId);
  const next = currentIndex < ALL_MODULES.length - 1 ? ALL_MODULES[currentIndex + 1] : null;
  const prev = currentIndex > 0 ? ALL_MODULES[currentIndex - 1] : null;
  const isDone = !!progress[mod.id]?.completedAt;

  const refreshProgress = () => setProgress(loadProgress().moduleProgress);

  return (
    <main id="main-content" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
      {/* Module header */}
      <div
        style={{
          padding: '20px 28px 0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Link
            href="/learn"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            <ArrowLeft size={13} /> Learning path
          </Link>
          <span style={{ color: 'var(--border-strong)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Module {mod.index}</span>
          {mod.meta.reviewStatus === 'draft' && (
            <span
              title={`Version ${mod.meta.version}, last updated ${mod.meta.lastReviewed}. Content has not yet been reviewed by a subject-matter expert.`}
              style={{ fontSize: 11, fontWeight: 650, padding: '0 7px', height: 20, display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid var(--warning)', background: 'var(--warning-soft)', color: 'var(--text)' }}
            >
              Draft — awaiting expert review
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.01em', color: 'var(--text)', margin: '0 0 4px' }}>
          {mod.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px' }}>{mod.tagline}</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {(['learn', 'challenge'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                height: 36,
                padding: '0 16px',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
                marginBottom: -1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {t === 'learn' ? <BookOpen size={14} /> : <Target size={14} />}
              {t === 'learn' ? 'Learn' : 'Challenge'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px 48px', maxWidth: 800 }}>
        {tab === 'learn' ? (
          <LearnTab module={mod} onStartChallenge={() => setTab('challenge')} />
        ) : (
          <ChallengeRunner
            module={mod}
            onComplete={refreshProgress}
          />
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          {prev ? (
            <Link href={`/learn/${prev.id}`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← {prev.title}
            </Link>
          ) : <div />}
          {next && next.published ? (
            <Link href={`/learn/${next.id}`} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              {next.title} <ChevronRight size={13} />
            </Link>
          ) : <div />}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Learn tab
// ---------------------------------------------------------------------------

function LearnTab({
  module: mod,
  onStartChallenge,
}: {
  module: ReturnType<typeof getModule> & {};
  onStartChallenge: () => void;
}) {
  return (
    <div>
      {/* Explanation */}
      <div
        className="prose-wardley"
        style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: 32 }}
        dangerouslySetInnerHTML={{ __html: markdownToHtml(mod!.explanation) }}
      />

      {/* Examples */}
      {mod!.examples.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 650, color: 'var(--text)', margin: '0 0 16px' }}>
            Example
          </h2>
          {mod!.examples.map((ex) => (
            <ExampleCard key={ex.id} example={ex} />
          ))}
        </div>
      )}

      {/* Reference links */}
      {mod!.conceptLinks.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
            Further reading
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mod!.conceptLinks.filter((link) => link.url && sanitizeUrl(link.url)).map((link) => (
              <a
                key={link.id}
                href={sanitizeUrl(link.url!)!}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Lightbulb size={12} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Section 9.4 governance + CC BY-SA attribution */}
      <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '0 0 24px', lineHeight: 1.6 }}>
        Sources:{' '}
        {mod!.meta.sources.map((src, i) => (
          <React.Fragment key={src.label}>
            {i > 0 && '; '}
            {src.url && sanitizeUrl(src.url) ? (
              <a href={sanitizeUrl(src.url)!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>{src.label}</a>
            ) : src.label}
          </React.Fragment>
        ))}
        . Licensed {mod!.meta.license}. Version {mod!.meta.version}, updated {mod!.meta.lastReviewed}
        {mod!.meta.reviewer ? `, reviewed by ${mod!.meta.reviewer}` : ''}.
      </p>

      {/* CTA */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={onStartChallenge}
          style={{
            height: 40,
            padding: '0 20px',
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
          <Target size={15} />
          Start challenge
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example card with OWM source display
// ---------------------------------------------------------------------------

function ExampleCard({ example }: { example: NonNullable<ReturnType<typeof getModule>>['examples'][0] }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{example.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{example.description}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <pre
          style={{
            margin: 0,
            padding: '12px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.6,
            background: 'var(--bg)',
            color: 'var(--text)',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {example.owmSource}
        </pre>
        {example.annotations.length > 0 && (
          <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)' }}>
            <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {example.annotations.map((ann, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{ann}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal safe Markdown→HTML (headings, bold, tables, paragraphs only)
// ---------------------------------------------------------------------------

