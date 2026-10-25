'use client';

// /maps/:mapId/history — version timeline, preview, restore-as-new-version (Section 3.2, EDT-07).
// Saved versions are immutable: restoring never edits history, it commits a new version.

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/shell/PageLayout';
import { listVersions, loadMap, commitVersion, clearDraft } from '@/hooks/use-persistence';
import { renderMapSVG } from '@/renderer/svg-export';
import { MapVersion, WardleyMap } from '@/domain/types';

export default function HistoryPage({ params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = use(params);
  const router = useRouter();
  const [current, setCurrent] = React.useState<WardleyMap | null | undefined>(undefined);
  const [versions, setVersions] = React.useState<MapVersion[]>([]);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setCurrent(loadMap(mapId));
    setVersions(listVersions(mapId));
  }, [mapId]);

  if (current === undefined) return <main id="main-content" style={{ flex: 1 }} aria-busy="true" />;
  if (current === null) {
    return (
      <PageLayout title="Version history" intro="This map could not be found in this browser.">
        <Link href="/maps">Back to maps</Link>
      </PageLayout>
    );
  }

  const restore = (v: MapVersion) => {
    // A new immutable version whose content is the old one; history is untouched
    commitVersion({ ...v.map, id: mapId, createdAt: current.createdAt }, `Restored from revision ${v.map.revision}`);
    clearDraft(mapId);
    router.push(`/maps/${mapId}`);
  };

  const preview = previewIndex !== null ? versions[previewIndex] : null;
  const ordered = versions.map((v, i) => ({ v, i })).reverse();

  return (
    <PageLayout
      eyebrow="Map"
      title={`Version history — ${current.title}`}
      intro="Saved versions never change. Restoring a version saves it again as the newest version."
      actions={<Link href={`/maps/${mapId}`} className="btn" style={{ textDecoration: 'none' }}>Back to editor</Link>}
    >
      {versions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <p style={{ margin: 0, fontSize: 14 }}>No saved versions yet. Use <strong>Save version</strong> in the editor.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <caption className="sr-only">Saved versions, newest first</caption>
            <thead>
              <tr><th scope="col">Revision</th><th scope="col">Saved</th><th scope="col">Note</th><th scope="col">Elements</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {ordered.map(({ v, i }) => (
                <tr key={`${v.map.revision}-${i}`}>
                  <th scope="row">{v.map.revision}{i === versions.length - 1 ? ' (latest)' : ''}</th>
                  <td>{new Date(v.savedAt).toLocaleString()}</td>
                  <td>{v.note || '—'}</td>
                  <td>{v.map.elements.length}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn" onClick={() => setPreviewIndex(i)} aria-pressed={previewIndex === i}>
                      Preview<span className="sr-only"> revision {v.map.revision}</span>
                    </button>{' '}
                    {i !== versions.length - 1 && (
                      <button type="button" className="btn" onClick={() => restore(v)}>
                        Restore as new version<span className="sr-only"> from revision {v.map.revision}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {preview && (
        <figure className="card" style={{ margin: 0 }}>
          <figcaption className="card__title">Revision {preview.map.revision}{preview.note ? ` — ${preview.note}` : ''}</figcaption>
          {/* Escaped, self-contained SVG from the export renderer */}
          <div role="img" aria-label={`Map at revision ${preview.map.revision}`} style={{ lineHeight: 0 }} className="history-preview" dangerouslySetInnerHTML={{ __html: renderMapSVG(preview.map, { includeTitle: false }) }} />
        </figure>
      )}
    </PageLayout>
  );
}
