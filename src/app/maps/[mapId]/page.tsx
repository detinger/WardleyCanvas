'use client';

// Section 3.2: Primary editor route — /maps/:mapId
// Loads map from localStorage, shows EditorLayout, handles new/not-found cases.

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadMap,
  loadDraft,
  createMap,
  useMigrationEffect,
} from '@/hooks/use-persistence';
import { WardleyMap } from '@/domain/types';
import EditorLayout from '@/components/editor/EditorLayout';
import { migrateFromLegacy } from '@/domain/migration';

interface PageProps {
  params: Promise<{ mapId: string }>;
}

export default function EditorPage({ params }: PageProps) {
  useMigrationEffect();
  const { mapId } = use(params);
  const router = useRouter();

  const [map, setMap] = React.useState<WardleyMap | null>(null);
  const [draftExists, setDraftExists] = React.useState(false);
  const [useDraft, setUseDraft] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (mapId === 'new') {
      const newMap = createMap('Untitled Map');
      router.replace(`/maps/${newMap.id}`);
      return;
    }

    const saved = loadMap(mapId);
    const draft = loadDraft(mapId);

    if (!saved && !draft) {
      setNotFound(true);
      return;
    }

    if (draft && saved) {
      // Draft is newer — ask user
      setDraftExists(true);
      setMap(saved);
    } else if (draft) {
      setMap(draft);
    } else {
      setMap(saved!);
    }
  }, [mapId, router]);

  const handleUseDraft = () => {
    const draft = loadDraft(mapId);
    if (draft) setMap(draft);
    setDraftExists(false);
    setUseDraft(true);
  };

  const handleDiscardDraft = () => {
    setDraftExists(false);
  };

  if (notFound) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 12,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 650,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Map not found
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          The map "{mapId}" could not be found in your local storage.
        </p>
        <button
          onClick={() => router.push('/maps')}
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
          Back to maps
        </button>
      </div>
    );
  }

  if (!map) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <>
      {/* Draft recovery banner */}
      {draftExists && (
        <DraftRecoveryBanner
          onUseDraft={handleUseDraft}
          onDiscard={handleDiscardDraft}
        />
      )}
      <EditorLayout initialMap={map} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Draft recovery banner
// ---------------------------------------------------------------------------

function DraftRecoveryBanner({
  onUseDraft,
  onDiscard,
}: {
  onUseDraft: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--warning-soft)',
        borderBottom: '1px solid var(--warning)',
        fontSize: 13,
        color: 'var(--text)',
        flexShrink: 0,
      }}
    >
      <span style={{ flex: 1 }}>
        An unsaved draft was found from your previous session.{' '}
        <strong>Would you like to recover it?</strong>
      </span>
      <button
        onClick={onUseDraft}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 6,
          background: 'var(--warning)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 550,
        }}
      >
        Recover draft
      </button>
      <button
        onClick={onDiscard}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 6,
          background: 'none',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Discard
      </button>
    </div>
  );
}
