// Section 4.5 standard page: 28px 32px 48px padding (18px 16px 40px at <=820px),
// narrow content up to 1080px, header with content left and actions right.

import * as React from 'react';

export default function PageLayout({
  eyebrow,
  title,
  intro,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="page">
      <div className="page__inner">
        <header className="page__header">
          <div style={{ minWidth: 0 }}>
            {eyebrow && <p className="page__eyebrow">{eyebrow}</p>}
            <h1 className="page__title">{title}</h1>
            {intro && <p className="page__intro">{intro}</p>}
          </div>
          {actions && <div className="page__actions">{actions}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}
