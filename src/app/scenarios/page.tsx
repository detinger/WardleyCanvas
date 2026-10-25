'use client';

// /scenarios — all scenarios across maps; each opens its comparison workspace.

import * as React from 'react';
import Link from 'next/link';
import PageLayout from '@/components/shell/PageLayout';
import { listMaps } from '@/hooks/use-persistence';
import { listScenarios, listDecisions } from '@/hooks/use-scenarios';
import { MapSummary, Scenario } from '@/domain/types';

export default function ScenariosIndexPage() {
  const [rows, setRows] = React.useState<{ map: MapSummary; scenarios: Scenario[]; decisions: number }[] | null>(null);

  React.useEffect(() => {
    setRows(
      listMaps()
        .map((map) => ({ map, scenarios: listScenarios(map.id), decisions: listDecisions(map.id).length }))
        .filter((r) => r.scenarios.length > 0)
    );
  }, []);

  return (
    <PageLayout eyebrow="Strategy" title="Scenarios" intro="Named futures compared against a fixed baseline map, with assumptions, consequences and decisions.">
      {rows === null ? null : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>No scenarios yet.</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Open a map from <Link href="/maps">Maps</Link>, save a version and choose <strong>Scenario comparison</strong> in the toolbar.
          </p>
        </div>
      ) : (
        rows.map(({ map, scenarios, decisions }) => (
          <section key={map.id} className="card" aria-labelledby={`map-${map.id}`}>
            <h2 id={`map-${map.id}`} className="card__title">
              {map.title} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-subtle)' }}>· {decisions} decision{decisions === 1 ? '' : 's'}</span>
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8 }}>
              {scenarios.map((s) => (
                <li key={s.id}>
                  <Link href={`/maps/${map.id}/scenarios/${s.id}`}>{s.name}</Link>{' '}
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                    · {s.changes.length} change{s.changes.length === 1 ? '' : 's'} · baseline revision {s.baselineRevision}
                  </span>
                </li>
              ))}
            </ul>
            <Link href={`/maps/${map.id}/scenarios`} style={{ fontSize: 13 }}>All scenarios for this map</Link>
          </section>
        ))
      )}
    </PageLayout>
  );
}
