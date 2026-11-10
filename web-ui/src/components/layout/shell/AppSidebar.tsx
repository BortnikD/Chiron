'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ChironLogo } from '@/components/ui/ChironLogo';
import type { NavGroup } from './navConfig';

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

  const isItemActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      for (const [k, v] of new URLSearchParams(query).entries()) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    return pathname === href && !searchParams.get('tab');
  };

  return (
    <>
      {navGroups.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-0.5">
          {group.label && !collapsed && <span className="nav-group-label">{group.label}</span>}
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isItemActive(item.href) ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onItemClick}
            >
              {item.icon}
              {!collapsed && <span className="label">{item.label}</span>}
              {!collapsed && item.badge !== undefined && <span className="nav-count">{item.badge}</span>}
            </Link>
          ))}
        </div>
      ))}
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
      className={`island sidebar flex flex-col justify-between shrink-0 transition-all duration-200 ${
        collapsed ? 'collapsed' : ''
      } ${mobileOpen ? 'open' : ''}`}
    >
      <div className="flex flex-col gap-1 min-h-0">
        <div className="brand p-2 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2.5 text-inherit no-underline">
            <div className="brand-mark bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
              <ChironLogo size={18} />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="brand-name font-bold text-sm tracking-tight leading-tight">Chiron</span>
                <span className="brand-role text-[11px] text-[var(--muted-foreground)] leading-tight">{roleLabel}</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className="mobile-only btn btn-ghost btn-icon h-7 w-7"
            onClick={onCloseMobile}
            aria-label="Закрыть меню"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 py-2 flex flex-col gap-1">
          <Suspense fallback={null}>
            <SidebarNavLinks
              navGroups={navGroups}
              collapsed={collapsed}
              pathname={pathname}
              onItemClick={onCloseMobile}
            />
          </Suspense>
        </div>
      </div>

      <div className="sidebar-foot shrink-0">
        {isDev && (
          <div className="health" title="GET /actuator/health → UP">
            <span className="dot" />
            {!collapsed && <span className="label text-xs">Сервер доступен</span>}
          </div>
        )}

        <button
          type="button"
          className="nav-item hidden lg:flex items-center text-xs text-[var(--muted-foreground)]"
          onClick={onToggleCollapse}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <ChevronRight className="ic" /> : <ChevronLeft className="ic" />}
          {!collapsed && <span className="label text-xs">Свернуть</span>}
        </button>
      </div>
    </aside>
  );
}
