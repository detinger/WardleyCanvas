'use client';

// /settings — theme, accessibility notes and data controls (Sections 3.2, 11.4).

import * as React from 'react';
import PageLayout from '@/components/shell/PageLayout';
import { useTheme, ThemePreference } from '@/hooks/use-theme';
import { exportAllData, deleteAllData, describeLocalData } from '@/hooks/data-controls';
import { useHydrated } from '@/hooks/use-hydrated';

export default function SettingsPage() {
  const { preference, theme, setPreference } = useTheme();
  const hydrated = useHydrated();
  const [counts, setCounts] = React.useState({ maps: 0, scenarios: 0, decisions: 0, learningModules: 0 });
  const [confirming, setConfirming] = React.useState(false);
  const [includePreferences, setIncludePreferences] = React.useState(false);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => setCounts(describeLocalData()), []);

  const exportData = () => {
    const backup = exportAllData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardley-canvas-backup-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('All data exported.');
  };

  const deleteData = () => {
    deleteAllData({ includePreferences });
    setConfirming(false);
    setCounts(describeLocalData());
    setStatus('All local data was deleted from this browser.');
  };

  return (
    <PageLayout eyebrow="Settings" title="Settings" intro="Preferences and the data stored in this browser.">
      <section className="card" aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="card__title">Theme</h2>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Colour theme</legend>
          {(['light', 'dark', 'system'] as ThemePreference[]).map((p) => (
            <label key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 6 }}>
              <input type="radio" name="theme" value={p} checked={hydrated && preference === p} onChange={() => setPreference(p)} />
              {p === 'system' ? `Follow the system (currently ${theme})` : p === 'light' ? 'Light' : 'Dark'}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="card" aria-labelledby="a11y-heading">
        <h2 id="a11y-heading" className="card__title">Accessibility</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
          <li>Reduced motion follows your system setting.</li>
          <li>In the editor, press <kbd>?</kbd> for keyboard shortcuts, and use <strong>Show outline</strong> for a list view of the map.</li>
          <li>Every element can be created, connected and positioned without a pointer.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="data-heading">
        <h2 id="data-heading" className="card__title">Your data</h2>
        <p style={{ fontSize: 14, margin: '0 0 12px' }}>
          Everything is stored only in this browser. Nothing is uploaded. Clearing your browser data also removes it, so export a backup regularly.
        </p>
        <p style={{ fontSize: 14, margin: '0 0 12px' }}>
          Stored now: {counts.maps} map{counts.maps === 1 ? '' : 's'}, {counts.scenarios} scenario{counts.scenarios === 1 ? '' : 's'},{' '}
          {counts.decisions} decision record{counts.decisions === 1 ? '' : 's'}, progress in {counts.learningModules} learning module{counts.learningModules === 1 ? '' : 's'}.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn" onClick={exportData}>Export all data</button>
          {!confirming ? (
            <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>Delete local data…</button>
          ) : (
            <div role="group" aria-label="Confirm deletion" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Delete all maps, versions, drafts, scenarios, decisions and learning progress? This cannot be undone.</span>
              <label style={{ display: 'flex', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={includePreferences} onChange={(e) => setIncludePreferences(e.target.checked)} />
                Also reset preferences (theme, sidebar)
              </label>
              <button type="button" className="btn btn--danger" onClick={deleteData}>Yes, delete everything</button>
              <button type="button" className="btn" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          )}
        </div>
        <p role="status" style={{ fontSize: 13, color: 'var(--text-muted)', minHeight: 20, margin: '10px 0 0' }}>{status}</p>
      </section>
    </PageLayout>
  );
}
