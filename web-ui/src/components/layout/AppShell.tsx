'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationsApi } from '@/shared/api';
import type { AppNotification } from '@/shared/types';
import { useNotificationSocket } from '@/shared/realtime/useNotificationSocket';
import { isDevMode } from '@/utils/env';
import { getHomeByRole, getUserInitials } from '@/shared/lib';
import { CommandPaletteModal } from './CommandPaletteModal';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopbar } from './shell/AppTopbar';
import { getNavGroups, getMobileNavItems, resolveBreadcrumbs } from './shell/navConfig';

export interface ShellHeaderData {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  currentSection?: string;
  crumbGroup?: string;
  crumb?: string;
}

interface AppShellContextType {
  insideShell: boolean;
  setHeaderData: React.Dispatch<React.SetStateAction<ShellHeaderData>>;
}

export const AppShellContext = React.createContext<AppShellContextType | null>(null);

export function useShellHeader(header: ShellHeaderData) {
  const ctx = React.useContext(AppShellContext);
  const setHeaderData = ctx?.setHeaderData;
  useEffect(() => {
    if (!setHeaderData) return;
    setHeaderData(header);
    return () => setHeaderData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setHeaderData,
    header.title,
    header.subtitle,
    header.actions,
    header.currentSection,
    header.crumbGroup,
    header.crumb,
  ]);
}

export interface AppShellProps extends ShellHeaderData {
  children: React.ReactNode;
}

const NestedAppShell: React.FC<AppShellProps> = ({ children, ...header }) => {
  useShellHeader(header);
  return <>{children}</>;
};

const RootAppShell: React.FC<AppShellProps> = ({
  children,
  title,
  actions,
  currentSection,
  crumbGroup,
  crumb,
}) => {
  const [headerData, setHeaderData] = useState<ShellHeaderData>({});
  const { user, role, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [bellDropdown, setBellDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const bellMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['k', 'K', 'л', 'Л'].includes(e.key)) {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchUnread = useCallback(() => {
    if (!role || role === 'ADMIN') {
      setUnreadCount(0);
      return;
    }

    notificationsApi
      .getUnreadCount()
      .then((res) => {
        const count = typeof res === 'number' ? res : (res as { count?: number })?.count ?? 0;
        setUnreadCount(count);
      })
      .catch(() => {
        // Сохраняем текущее значение счётчика при временном сбое сети
      });
  }, [role]);

  useEffect(() => {
    fetchUnread();
    if (!role || role === 'ADMIN') return;
    window.addEventListener('chiron:notifications-updated', fetchUnread);
    return () => window.removeEventListener('chiron:notifications-updated', fetchUnread);
  }, [role, fetchUnread]);

  const handleIncomingNotification = useCallback((notif: AppNotification) => {
    if (!notif?.id) return;
    setNotifications((prev) => [notif, ...prev.filter((item) => item.id !== notif.id)].slice(0, 15));
  }, []);

  useNotificationSocket({
    onNotification: handleIncomingNotification,
    onConnect: fetchUnread,
  });

  useEffect(() => {
    if (!bellDropdown) return;
    if (role === 'ADMIN') {
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    notificationsApi
      .getNotifications(0, 15)
      .then((res) => setNotifications(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifications(false));
  }, [bellDropdown, role]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (bellMenuRef.current && !bellMenuRef.current.contains(e.target as Node)) setBellDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      window.dispatchEvent(new CustomEvent('chiron:notifications-marked-all-read'));
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
    } catch {
      // ignore transient mark-all failure inside topbar popover
    }
  };

  const navGroups = useMemo(() => getNavGroups(role, unreadCount), [role, unreadCount]);
  const mobileItems = useMemo(() => getMobileNavItems(role), [role]);

  const initials = getUserInitials(user);

  const roleLabel =
    role === 'ADMIN' ? 'Администратор' : role === 'VETERINARIAN' ? 'Кабинет врача' : 'Кабинет клиента';

  const [resolvedGroup, resolvedCrumb] = resolveBreadcrumbs(pathname, role, {
    group: headerData.crumbGroup || crumbGroup,
    crumb: headerData.crumb || crumb,
    section: headerData.currentSection || currentSection,
    title: headerData.title || title,
  });

  const ctxValue = useMemo(() => ({ insideShell: true, setHeaderData }), []);

  return (
    <AppShellContext.Provider value={ctxValue}>
      <div className="app" data-theme={resolvedTheme}>
        {mobileOpen && (
          <div
            className="nav-backdrop mobile-only"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <AppSidebar
          homeHref={getHomeByRole(role)}
          roleLabel={roleLabel}
          navGroups={navGroups}
          pathname={pathname}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isDev={isDev}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="main-col flex-1 flex flex-col min-w-0 min-h-0 gap-2">
          <AppTopbar
            role={role}
            roleLabel={roleLabel}
            user={user}
            initials={initials}
            crumbGroup={headerData.crumbGroup || crumbGroup || resolvedGroup}
            crumbLabel={headerData.crumb || crumb || headerData.currentSection || currentSection || resolvedCrumb}
            actions={headerData.actions || actions}
            unreadCount={unreadCount}
            notifications={notifications}
            loadingNotifications={loadingNotifications}
            bellDropdown={bellDropdown}
            userDropdown={userDropdown}
            bellMenuRef={bellMenuRef}
            userMenuRef={userMenuRef}
            onOpenMobile={() => setMobileOpen(true)}
            onOpenCmd={() => setCmdOpen(true)}
            onToggleBell={() => setBellDropdown((v) => !v)}
            onCloseBell={() => setBellDropdown(false)}
            onToggleUserMenu={() => setUserDropdown((v) => !v)}
            onCloseUserMenu={() => setUserDropdown(false)}
            onMarkAllRead={handleMarkAllRead}
            onLogout={() => {
              logout();
              router.replace('/login');
            }}
          />

          <main className="flex-1 flex flex-col min-h-0 min-w-0 w-full" style={{ minHeight: 0 }}>
            {children}
          </main>
        </div>

        <nav className="mobile-nav" aria-label="Нижняя навигация">
          {mobileItems.map((item) =>
            item.isBell ? (
              <button
                key={item.title}
                type="button"
                className={`btn btn-icon ${bellDropdown ? 'btn-secondary' : 'btn-ghost'} relative`}
                onClick={() => setBellDropdown((v) => !v)}
                title={item.title}
              >
                {item.icon}
                {unreadCount > 0 && (
                  <span className="dot dot-danger" style={{ position: 'absolute', top: '8px', right: '8px' }} />
                )}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className={`btn btn-icon ${pathname === item.href ? 'btn-secondary' : 'btn-ghost'}`}
                title={item.title}
              >
                {item.icon}
              </Link>
            )
          )}
        </nav>

        <CommandPaletteModal isOpen={cmdOpen} onClose={() => setCmdOpen(false)} role={role} />
      </div>
    </AppShellContext.Provider>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  const parentShell = React.useContext(AppShellContext);
  if (parentShell?.insideShell) {
    return <NestedAppShell {...props} />;
  }
  return <RootAppShell {...props} />;
};
