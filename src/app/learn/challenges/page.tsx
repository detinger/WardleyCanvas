'use client';

// /learn/challenges — every challenge with its objective and your status.

import * as React from 'react';
import Link from 'next/link';
import PageLayout from '@/components/shell/PageLayout';
import { ALL_MODULES } from '@/learning/content';
import { loadProgress } from '@/learning/progress';
import { ModuleProgress } from '@/learning/types';

export default function ChallengesPage() {
  const [progress, setProgress] = React.useState<Record<string, ModuleProgress>>({});
  React.useEffect(() => setProgress(loadProgress().moduleProgress), []);

  return (
    <PageLayout eyebrow="Learn" title="Challenges" intro="Hands-on practice for the foundation modules and six IT case studies. Checks observe structure; many different maps can pass.">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {ALL_MODULES.map((m) => {
          const p = progress[m.id];
          const status = p?.completedAt ? 'Completed' : p?.attempts ? `In progress · ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}` : 'Not started';
          return (
            <li key={m.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                {m.caseStudy ? `Case study ${m.caseStudy.number} · ${m.caseStudy.guidance}` : `Module ${m.index}`} · {m.title}
              </span>
              <h2 className="card__title" style={{ margin: 0 }}>{m.challenge.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, flex: 1 }}>{m.challenge.objective}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: p?.completedAt ? 'var(--success)' : 'var(--text-muted)' }}>{status}</span>
              <Link
                href={`/learn/${m.id}?tab=challenge`}
                className="btn"
                aria-label={`${p?.completedAt ? 'Review' : 'Open challenge'}: ${m.challenge.title}`}
                style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
              >
                {p?.completedAt ? 'Review' : 'Open challenge'}
              </Link>
            </li>
          );
        })}
      </ol>
    </PageLayout>
  );
}
