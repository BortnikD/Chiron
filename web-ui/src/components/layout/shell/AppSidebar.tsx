'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PanelLeft, X } from 'lucide-react';
import { ChironLogo } from '@/components/ui/ChironLogo';
import type { NavGroup, NavItem } from './navConfig';

function SidebarNavLinks({
  navGroups,
  collapsed,
  pathname,
  onItemClick,
}: {
  navGroups: NavGroup[];
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  const searchParams = useSearchParams();

  const isItemActive = (item: NavItem) => {
    const href = item.href;
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      for (const [k, v] of new URLSearchParams(query).entries()) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    if (pathname === href && !searchParams.get('tab')) return true;
    if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
      return true;
    }
    return false;
  };

  return (
    <>
      {navGroups.map((group, gIdx) => (
        <React.Fragment key={group.label ?? `group-${gIdx}`}>
          {group.label && <span className="nav-group-label">{group.label}</span>}
          {group.items.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? 'active' : ''}`}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={onItemClick}
              >
                {item.icon}
                <span className="label">{item.label}</span>
                {item.badge !== undefined && <span className="nav-count">{item.badge}</span>}
              </Link>
            );
          })}
        </React.Fragment>
      ))}
      {collapsed ? null : null}
    </>
  );
}

interface AppSidebarProps {
  homeHref: string;
  roleLabel: string;
  navGroups: NavGroup[];
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  isDev: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function AppSidebar({
  homeHref,
  roleLabel,
  navGroups,
  pathname,
  collapsed,
  mobileOpen,
  isDev,
  onToggleCollapse,
  onCloseMobile,
}: AppSidebarProps) {
  return (
    <aside
      className={`island sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
      aria-label="Навигация"
    >
      <div className="brand" style={{ justifyContent: 'space-between' }}>
        <Link
          href={homeHref}
          className="row"
          style={{ gap: '10px', textDecoration: 'none', color: 'inherit', minWidth: 0, flex: 1 }}
        >
          <div className="brand-mark">
            <ChironLogo size={20} />
          </div>
          <div className="col label" style={{ gap: 0 }}>
            <span className="brand-name">Chiron</span>
            <span className="brand-role">{roleLabel}</span>
          </div>
        </Link>

        <button
          type="button"
          className="mobile-only btn btn-ghost btn-icon btn-sm"
          onClick={onCloseMobile}
          aria-label="Закрыть меню"
        >
          <X className="ic" />
        </button>
      </div>

      <nav
        className="col"
        style={{ gap: '2px', overflowY: 'auto', overflowX: 'hidden', flex: 1 }}
        aria-label="Разделы"
      >
        <Suspense fallback={null}>
          <SidebarNavLinks
            navGroups={navGroups}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={onCloseMobile}
          />
        </Suspense>
      </nav>

      <div className="sidebar-foot">
        {isDev && (
          <div className="health" title="GET /actuator/health → UP">
            <span className="dot" />
            <span className="label">Сервер доступен</span>
          </div>
        )}

        <button
          type="button"
          className="nav-item"
          onClick={onToggleCollapse}
          title={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
          aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
        >
          <PanelLeft className="ic" />
          <span className="label">Свернуть</span>
        </button>
      </div>
    </aside>
  );
}
