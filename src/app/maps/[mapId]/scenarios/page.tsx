'use client';

// SIM-02: Scenario list for a map.

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, GitBranch, Clock, Trash2, ChevronRight } from 'lucide-react';
import { loadMap } from '@/hooks/use-persistence';
import { useHydrated } from '@/hooks/use-hydrated';
import { listScenarios, createScenario, deleteScenario } from '@/hooks/use-scenarios';
import { Scenario } from '@/domain/types';

interface Props {
  params: Promise<{ mapId: string }>;
}

export default function ScenariosPage({ params }: Props) {
  const { mapId } = use(params);
  const router = useRouter();
  const [map, setMap] = React.useState(() => loadMap(mapId));
  const [scenarios, setScenarios] = React.useState<Scenario[]>(() => listScenarios(mapId));
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');

  const refresh = () => setScenarios(listScenarios(mapId));

  const handleCreate = () => {
    if (!newName.trim() || !map) return;
    const sc = createScenario(mapId, map.revision, newName.trim(), newDesc.trim() || undefined, map);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    router.push(`/maps/${mapId}/scenarios/${sc.id}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete scenario "${name}"? This cannot be undone.`)) return;
    deleteScenario(mapId, id);
    refresh();
  };

  const hydrated = useHydrated();
  if (!hydrated) {
    return <main id="main-content" style={{ flex: 1 }} aria-busy="true" />;
  }

  if (!map) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Map not found.</p>
      </main>
    );
  }

  return (
    <main id="main-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Link href={`/maps/${mapId}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> {map.title}
        </Link>
        <span style={{ color: 'var(--border-strong)', fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Scenario comparison</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.01em', color: 'var(--text)', margin: '0 0 4px' }}>
            Scenario comparison
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Branch from revision {map.revision} of "{map.title}" · {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ height: 34, padding: '0 14px', borderRadius: 6, background: 'var(--primary)', color: 'var(--text-on-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 550, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={14} /> New scenario
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', margin: '0 0 12px' }}>New scenario</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="new-scenario-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name *</label>
              <input id="new-scenario-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="E.g. Competitor commoditises CRM"
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="new-scenario-description" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea id="new-scenario-description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="What hypothesis does this scenario explore?"
                style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '8px 10px' }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>
              Results shown in this tool are conditional consequences of explicit assumptions — not predictions.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCreate(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim()} style={{ ...primaryBtn, opacity: newName.trim() ? 1 : 0.5, cursor: newName.trim() ? 'pointer' : 'not-allowed' }}>Create scenario</button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario list */}
      {scenarios.length === 0 && !showCreate ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', border: '2px dashed var(--border)', borderRadius: 10 }}>
          <GitBranch size={28} color="var(--border-strong)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text)', margin: '0 0 6px' }}>No scenarios yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: '40ch', marginInline: 'auto' }}>
            A scenario branches from the current map revision and lets you explore "what if" changes with explicit assumptions.
          </p>
          <button onClick={() => setShowCreate(true)} style={primaryBtn}>Create first scenario</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
          {scenarios.map((sc) => (
            <ScenarioCard key={sc.id} scenario={sc} mapId={mapId} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-subtle)' }}>
        Scenarios explore conditional hypotheses. Results depend entirely on the assumptions you configure — they are not predictions of future states.
      </p>
    </main>
  );
}

function ScenarioCard({
  scenario: sc,
  mapId,
  onDelete,
}: {
  scenario: Scenario;
  mapId: string;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{sc.name}</div>
          {sc.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>{sc.description}</p>}
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-subtle)' }}>
            <span>{sc.assumptions.length} assumption{sc.assumptions.length !== 1 ? 's' : ''}</span>
            <span>{sc.changes.length} change{sc.changes.length !== 1 ? 's' : ''}</span>
            <span>{sc.consequences.length} consequence{sc.consequences.length !== 1 ? 's' : ''}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {formatRelative(sc.updatedAt)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sc.id, sc.name); }}
            aria-label={`Delete scenario ${sc.name}`}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
          >
            <Trash2 size={13} />
          </button>
          <Link
            href={`/maps/${mapId}/scenarios/${sc.id}`}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'none' }}
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

const inputStyle: React.CSSProperties = {
  height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text)', fontSize: 13, width: '100%',
  outline: 'none', fontFamily: 'inherit',
};
const primaryBtn: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 6, background: 'var(--primary)',
  color: 'var(--text-on-primary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 550,
};
const secondaryBtn: React.CSSProperties = {
  height: 34, padding: '0 14px', borderRadius: 6, background: 'none',
  color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
};
