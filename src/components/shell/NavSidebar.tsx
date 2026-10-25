'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme, NEXT_PREFERENCE } from '@/hooks/use-theme';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Clock,
  GraduationCap,
  Trophy,
  BookOpen,
  Flame,
  Shield,
  Gamepad2,
  GitBranch,
  Library,
  Upload,
  Moon,
  Sun,
  Monitor,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Nav structure — Section 3.1
// ---------------------------------------------------------------------------

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'Workspace',
    items: [
      { label: 'Overview', href: '/', icon: <LayoutDashboard size={18} /> },
      { label: 'Maps', href: '/maps', icon: <Map size={18} /> },
      { label: 'Recent', href: '/maps?sort=recent', icon: <Clock size={18} /> },
    ],
  },
  {
    groupLabel: 'Learn',
    items: [
      { label: 'Learning Path', href: '/learn', icon: <GraduationCap size={18} /> },
      { label: 'Challenges', href: '/learn/challenges', icon: <Trophy size={18} /> },
      { label: 'Reference', href: '/reference', icon: <BookOpen size={18} /> },
    ],
  },
  {
    groupLabel: 'Strategy',
    items: [
      { label: 'Climate', href: '/reference#climate', icon: <Flame size={18} /> },
      { label: 'Doctrine', href: '/reference#doctrine', icon: <Shield size={18} /> },
      { label: 'Gameplay', href: '/reference#gameplay', icon: <Gamepad2 size={18} /> },
      { label: 'Scenarios', href: '/scenarios', icon: <GitBranch size={18} /> },
    ],
  },
  {
    groupLabel: 'Library',
    items: [
      { label: 'Templates', href: '/maps?tab=templates', icon: <Library size={18} /> },
      { label: 'Import / Export', href: '/maps?tab=import', icon: <Upload size={18} /> },
    ],
  },
];

// ---------------------------------------------------------------------------
// Theme toggle (simple implementation)
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NavSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function NavSidebar({ expanded, onToggle }: NavSidebarProps) {
  const pathname = usePathname();
  const { theme, preference, toggle: toggleTheme } = useTheme();

  // Only the most specific matching item is current (e.g. Challenges, not also Learning Path)
  const pathOf = (href: string) => href.split(/[?#]/)[0];
  const matches = (href: string) => {
    const p = pathOf(href);
    return p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`);
  };
  const bestMatch = NAV_GROUPS.flatMap((g) => g.items)
    .filter((i) => !i.disabled && matches(i.href))
    .sort((a, b) => pathOf(b.href).length - pathOf(a.href).length)[0]?.href;
  const isActive = (href: string) => href === bestMatch;

  return (
    <aside
      aria-label="Main navigation"
      className="nav-sidebar"
      style={{
        width: expanded ? 232 : 64,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 120ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand row */}
      <div
        className="nav-sidebar__brand"
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: expanded ? '0 16px' : '0',
          justifyContent: expanded ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {expanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WardleyMark />
            <span style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Wardley Canvas
            </span>
          </div>
        )}
        {!expanded && <WardleyMark />}
        <button
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            color: 'var(--text-subtle)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          className="nav-sidebar__toggle"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav
        className="nav-sidebar__nav"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.groupLabel} className="nav-sidebar__group" style={{ marginBottom: 4 }}>
            {expanded && (
              <div
                className="text-nav-group"
                style={{
                  padding: '8px 16px 4px',
                  color: 'var(--text-subtle)',
                }}
              >
                {group.groupLabel}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.label}
                  item={item}
                  active={active}
                  expanded={expanded}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom utilities */}
      <div className="nav-sidebar__utils" style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <UtilityButton
          icon={preference === 'system' ? <Monitor size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          label={`Theme: ${preference === 'system' ? `system (${theme})` : preference}. Switch to ${NEXT_PREFERENCE[preference]}`}
          onClick={toggleTheme}
          expanded={expanded}
        />
        <UtilityButton
          icon={<Settings size={18} />}
          label="Settings"
          href="/settings"
          expanded={expanded}
        />
        <UtilityButton
          icon={<HelpCircle size={18} />}
          label="Help"
          href="/help"
          expanded={expanded}
        />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavLink({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: expanded ? '7px 12px 7px 16px' : '7px 0',
    justifyContent: expanded ? 'flex-start' : 'center',
    margin: '1px 4px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: active ? 550 : 400,
    color: active ? 'var(--primary)' : item.disabled ? 'var(--text-subtle)' : 'var(--text-muted)',
    background: active ? 'var(--primary-soft)' : 'none',
    textDecoration: 'none',
    cursor: item.disabled ? 'not-allowed' : 'pointer',
    opacity: item.disabled ? 0.5 : 1,
    border: 'none',
    width: expanded ? 'calc(100% - 8px)' : 'calc(100% - 8px)',
    transition: 'background 120ms',
  };

  if (item.disabled) {
    return (
      <div style={style} title={expanded ? undefined : item.label}>
        <span style={{ flexShrink: 0 }}>{item.icon}</span>
        {expanded && <span className="nav-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
      </div>
    );
  }

  return (
    <Link href={item.href} prefetch={false} style={style} aria-label={item.label} aria-current={active ? 'page' : undefined} title={expanded ? undefined : item.label}>
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {expanded && (
        <span className="nav-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

function UtilityButton({
  icon,
  label,
  href,
  onClick,
  expanded,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  expanded: boolean;
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: expanded ? '7px 12px 7px 16px' : '7px 0',
    justifyContent: expanded ? 'flex-start' : 'center',
    margin: '1px 4px',
    borderRadius: 6,
    fontSize: 13,
    color: 'var(--text-muted)',
    background: 'none',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    width: 'calc(100% - 8px)',
    transition: 'background 120ms, color 120ms',
  };

  const content = (
    <>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      {expanded && <span className="nav-label" style={{ whiteSpace: 'nowrap' }}>{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false} style={style} aria-label={label} title={expanded ? undefined : label}>
        {content}
      </Link>
    );
  }

  return (
    <button style={style} onClick={onClick} aria-label={label} title={expanded ? undefined : label}>
      {content}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Wardley logo mark — Section 3.1: value-chain line descending across 4 stages
// ---------------------------------------------------------------------------

function WardleyMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Four-stage horizontal field */}
      <rect x="2" y="24" width="24" height="1" fill="var(--text-subtle)" />
      {/* Descending value-chain line */}
      <polyline
        points="4,6 10,11 17,16 24,20"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Component dots */}
      <circle cx="4" cy="6" r="2.5" fill="var(--primary)" />
      <circle cx="10" cy="11" r="2" fill="var(--primary)" opacity="0.75" />
      <circle cx="17" cy="16" r="2" fill="var(--primary)" opacity="0.55" />
      <circle cx="24" cy="20" r="2" fill="var(--primary)" opacity="0.35" />
    </svg>
  );
}
