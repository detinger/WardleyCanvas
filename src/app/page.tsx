'use client';

// Section 3.2: Overview / home page.
// Shows recent maps, quick-start actions, and learning progress.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map, Plus, Clock, ArrowRight } from 'lucide-react';
import { listMaps, createMap, useMigrationEffect } from '@/hooks/use-persistence';
import { MapSummary } from '@/domain/types';

export default function HomePage() {
  useMigrationEffect();
  const router = useRouter();
  const [maps, setMaps] = React.useState<MapSummary[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setMaps(listMaps().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);

  const handleCreateMap = () => {
    const newMap = createMap('Untitled Map');
    router.push(`/maps/${newMap.id}`);
  };

  const recent = maps.slice(0, 6);

  return (
    <main
      id="main-content"
      style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}
    >
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <p className="text-eyebrow" style={{ marginBottom: 8 }}>
          Wardley Maps Studio
        </p>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 650,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            maxWidth: '72ch',
          }}
        >
          Map, understand, and act on your strategic landscape
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            margin: '0 0 24px',
            maxWidth: '72ch',
          }}
        >
          Create Wardley Maps to visualize your value chain, identify strategic
          patterns, and reason about possible futures — without pretending the
          map is a forecast.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleCreateMap}
            style={{
              height: 34,
              padding: '0 16px',
              borderRadius: 6,
              background: 'var(--primary)',
              color: 'var(--text-on-primary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 550,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} />
            Create map
          </button>
          <Link
            href="/maps"
            style={{
              height: 34,
              padding: '0 16px',
              borderRadius: 6,
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 14,
              fontWeight: 550,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <Map size={16} />
            My maps
          </Link>
        </div>
      </div>

      {/* Recent maps */}
      {isClient && recent.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 650,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Recent maps
            </h2>
            <Link
              href="/maps"
              style={{
                fontSize: 13,
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {recent.map((m) => (
              <MapCard key={m.id} map={m} />
            ))}
          </div>
        </section>
      )}

      {isClient && maps.length === 0 && (
        <section>
          <EmptyMapState onCreate={handleCreateMap} />
        </section>
      )}

      {/* Quick-start */}
      <section>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 650,
            color: 'var(--text)',
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}
        >
          What is a Wardley Map?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {CONCEPT_CARDS.map((card) => (
            <ConceptCard key={card.title} {...card} />
          ))}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Map card
// ---------------------------------------------------------------------------

function MapCard({ map }: { map: MapSummary }) {
  return (
    <Link
      href={`/maps/${map.id}`}
      style={{
        display: 'block',
        padding: 18,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 120ms, border-color 120ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
      }}
    >
      {/* Mini canvas preview placeholder */}
      <div
        style={{
          height: 80,
          borderRadius: 6,
          background: 'var(--canvas-bg)',
          border: '1px solid var(--border)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Map size={24} style={{ color: 'var(--border-strong)' }} />
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 550,
          color: 'var(--text)',
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {map.title}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: 'var(--text-subtle)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {formatRelative(map.updatedAt)}
        </span>
        <span>{map.elementCount} elements</span>
        <span>rev {map.revision}</span>
      </div>
    </Link>
  );
}

function EmptyMapState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      style={{
        padding: '36px 16px',
        textAlign: 'center',
        border: '2px dashed var(--border)',
        borderRadius: 10,
        maxWidth: 480,
      }}
    >
      <Map size={36} style={{ color: 'var(--border-strong)', marginBottom: 12 }} />
      <h3
        style={{
          fontSize: 16,
          fontWeight: 650,
          color: 'var(--text)',
          margin: '0 0 8px',
        }}
      >
        No maps yet
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        Create your first Wardley Map to start exploring your value chain.
      </p>
      <button
        onClick={onCreate}
        style={{
          height: 34,
          padding: '0 16px',
          borderRadius: 6,
          background: 'var(--primary)',
          color: 'var(--text-on-primary)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 550,
        }}
      >
        Create first map
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Concept cards
// ---------------------------------------------------------------------------

const CONCEPT_CARDS = [
  {
    title: 'Anchors and needs',
    description:
      'Start with who has a need. Anchors represent users or stakeholders at the top of the visible value chain.',
    color: 'var(--primary-soft)',
    textColor: 'var(--primary)',
  },
  {
    title: 'Components and value chains',
    description:
      'Map the components needed to satisfy that need, from visible activities down to underlying infrastructure.',
    color: 'var(--success-soft)',
    textColor: 'var(--success)',
  },
  {
    title: 'Evolution',
    description:
      'Position each component by how mature it is — from bespoke genesis through custom-built and product to commodity.',
    color: 'var(--accent-soft)',
    textColor: 'var(--accent)',
  },
  {
    title: 'Strategic context',
    description:
      'Climatic patterns, doctrine, and gameplay help you reason about what to do — without implying a guaranteed outcome.',
    color: 'var(--recommendation-soft)',
    textColor: 'var(--recommendation)',
  },
];

function ConceptCard({
  title,
  description,
  color,
  textColor,
}: (typeof CONCEPT_CARDS)[0]) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 999,
          background: color,
          color: textColor,
          fontSize: 12,
          fontWeight: 650,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
