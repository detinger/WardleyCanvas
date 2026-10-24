'use client';

import * as React from 'react';
import NavSidebar from './NavSidebar';

const SIDEBAR_KEY = 'wardleyStudio.sidebarExpanded';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = React.useState(true);

  // Restore sidebar state
  React.useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) setExpanded(saved === 'true');
  }, []);

  const handleToggle = React.useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <NavSidebar expanded={expanded} onToggle={handleToggle} />
      <div
        id="main-content"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}
      >
        {children}
      </div>
    </div>
  );
}
