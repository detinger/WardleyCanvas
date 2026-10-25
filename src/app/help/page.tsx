// /help — orientation, shortcuts and privacy.

import Link from 'next/link';
import PageLayout from '@/components/shell/PageLayout';

export default function HelpPage() {
  return (
    <PageLayout eyebrow="Help" title="Help" intro="How to get started, work efficiently and look after your data.">
      <section className="card" aria-labelledby="start-heading">
        <h2 id="start-heading" className="card__title">Getting started</h2>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
          <li>New to Wardley Mapping? Follow the <Link href="/learn">learning path</Link> — module 1 builds your first map.</li>
          <li>Create a map from <Link href="/maps">Maps</Link>, or import an OnlineWardleyMaps (<code>.owm</code>) file.</li>
          <li>Add a user (anchor), the components that serve their need, and connect them: “A depends on B”.</li>
          <li>Position components by visibility (up and down) and evolution (left to right), then save a version.</li>
          <li>Use the Analysis tab for climate, doctrine and gameplay, and Scenario comparison to explore futures.</li>
        </ol>
      </section>
      <section className="card" aria-labelledby="keys-heading">
        <h2 id="keys-heading" className="card__title">Keyboard</h2>
        <p style={{ fontSize: 14, margin: 0 }}>
          In the editor press <kbd>?</kbd> for the full list. <kbd>A</kbd> adds an anchor, <kbd>C</kbd> a component, arrow keys nudge,
          <kbd>⌘/Ctrl</kbd>+<kbd>Z</kbd> undoes. <strong>Show outline</strong> lists every element and dependency.
        </p>
      </section>
      <section className="card" aria-labelledby="concepts-heading">
        <h2 id="concepts-heading" className="card__title">Concepts and catalogs</h2>
        <p style={{ fontSize: 14, margin: 0 }}>
          The <Link href="/reference">reference</Link> explains the notation and lists the climatic patterns, doctrine principles and gameplays,
          with attribution.
        </p>
      </section>
      <section className="card" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="card__title">Privacy and your data</h2>
        <p style={{ fontSize: 14, margin: 0 }}>
          Maps, analysis and learning progress are stored only in this browser and never sent anywhere. Export a backup or delete everything in{' '}
          <Link href="/settings">Settings</Link>.
        </p>
      </section>
    </PageLayout>
  );
}
