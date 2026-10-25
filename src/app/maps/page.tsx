'use client';

// Section 3.2: Maps collection page — searchable/sortable list + create/import.

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Map,
  Clock,
  Trash2,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { listMaps, createMap, deleteMap, useMigrationEffect } from '@/hooks/use-persistence';
import { MapSummary } from '@/domain/types';

type SortField = 'title' | 'updatedAt' | 'elementCount' | 'revision';
type SortDir = 'asc' | 'desc';

export default function MapsPage() {
  useMigrationEffect();
  const router = useRouter();
  const [maps, setMaps] = React.useState<MapSummary[]>([]);
  const [search, setSearch] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [isClient, setIsClient] = React.useState(false);

  const refresh = React.useCallback(() => {
    setMaps(listMaps());
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    refresh();
  }, [refresh]);

  const handleCreate = () => {
    const newMap = createMap('Untitled Map');
    router.push(`/maps/${newMap.id}`);
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMap(id);
    refresh();
  };

  const filtered = React.useMemo(() => {
    let result = maps;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = typeof av === 'string'
        ? av.localeCompare(bv as string)
        : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [maps, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <main
      id="main-content"
      style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 650,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              margin: '0 0 4px',
            }}
          >
            Maps
          </h1>
          {isClient && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              {maps.length} map{maps.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleCreate}
          style={{
            height: 34,
            padding: '0 12px',
            borderRadius: 6,
            background: 'var(--primary)',
            color: 'var(--text-on-primary)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 550,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} />
          Create map
        </button>
      </div>

      {/* Search and sort */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 380 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)',
              pointerEvents: 'none',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search maps…"
            aria-label="Search maps"
            style={{
              height: 34,
              width: '100%',
              padding: '0 10px 0 32px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Sort:</span>
          {(
            [
              { field: 'updatedAt' as SortField, label: 'Recent' },
              { field: 'title' as SortField, label: 'Name' },
              { field: 'elementCount' as SortField, label: 'Size' },
            ] as { field: SortField; label: string }[]
          ).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: sortField === field ? 'var(--primary)' : 'var(--border)',
                background: sortField === field ? 'var(--primary-soft)' : 'var(--bg-elevated)',
                color: sortField === field ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 550,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {label}
              {sortField === field &&
                (sortDir === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />)}
            </button>
          ))}
        </div>
      </div>

      {/* Map grid */}
      {!isClient ? null : filtered.length === 0 ? (
        search ? (
          <EmptyState search={search} onCreate={handleCreate} />
        ) : maps.length === 0 ? (
          <FirstMapOnboarding onCreate={handleCreate} />
        ) : (
          <EmptyState search={search} onCreate={handleCreate} />
        )
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((m) => (
            <MapCard key={m.id} map={m} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Map card
// ---------------------------------------------------------------------------

function MapCard({
  map,
  onDelete,
}: {
  map: MapSummary;
  onDelete: (id: string, title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        transition: 'box-shadow 120ms, border-color 120ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
    >
      {/* Canvas preview */}
      <Link href={`/maps/${map.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            height: 100,
            background: 'var(--canvas-bg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Map size={28} style={{ color: 'var(--border-strong)' }} />
        </div>

        <div style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 550,
              color: 'var(--text)',
              marginBottom: 6,
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} />
              {formatRelative(map.updatedAt)}
            </span>
            <span>{map.elementCount} elements</span>
          </div>
        </div>
      </Link>

      {/* Context menu */}
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          aria-label="Map options"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            border: 'none',
            background: 'var(--bg-elevated)',
            cursor: 'pointer',
            color: 'var(--text-subtle)',
          }}
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              minWidth: 140,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 30,
              padding: 4,
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); onDelete(map.id, map.title); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 4,
                border: 'none',
                background: 'none',
                color: 'var(--error)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Trash2 size={13} />
              Delete map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// First-map onboarding (LRN-04)
// ---------------------------------------------------------------------------

function FirstMapOnboarding({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Map size={28} color="var(--primary)" />
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 650,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            margin: '0 0 10px',
          }}
        >
          Welcome to Wardley Canvas
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.65,
            maxWidth: '48ch',
            marginInline: 'auto',
          }}
        >
          Wardley Maps visualise your value chain and the evolutionary
          stage of every component — helping you spot strategic moves
          before they become obvious.
        </p>
      </div>

      {/* Two paths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {/* Learn path */}
        <Link
          href="/learn"
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              padding: '20px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'border-color 120ms',
              height: '100%',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <BookOpen size={17} color="var(--primary)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', marginBottom: 6 }}>
              Learn the basics
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Eight short modules — anchors, value chains, evolution — with
              guided challenges and examples.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 13, color: 'var(--primary)', fontWeight: 550 }}>
              Start module 1 <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* Create blank path */}
        <div
          onClick={onCreate}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCreate(); }}
          aria-label="Create a blank map"
          style={{
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'border-color 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Sparkles size={17} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', marginBottom: 6 }}>
            Start blank
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Jump straight into an empty canvas. Use the source editor or
            drag components onto the map.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 13, color: 'var(--text-muted)', fontWeight: 550 }}>
            Create map <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* Reassurance note */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        All maps are stored locally in your browser — nothing is sent to a server.
      </p>
    </div>
  );
}

function EmptyState({
  search,
  onCreate,
}: {
  search: string;
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        padding: '36px 16px',
        textAlign: 'center',
        border: '2px dashed var(--border)',
        borderRadius: 10,
      }}
    >
      <Map size={32} style={{ color: 'var(--border-strong)', marginBottom: 12 }} />
      <h3 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text)', margin: '0 0 8px' }}>
        {search ? `No maps match "${search}"` : 'No maps yet'}
      </h3>
      {!search && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Create your first Wardley Map to get started.
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
            Create map
          </button>
        </>
      )}
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
