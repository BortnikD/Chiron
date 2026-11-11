'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { vetApi } from '@/modules/vet/api';
import { isDevMode } from '@/utils/env';
import { getHomeByRole, getUserInitials, type PhotoEntity } from '@/shared/lib';
import { CommandPaletteModal } from './CommandPaletteModal';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopbar } from './shell/AppTopbar';
import { getNavGroups, getMobileNavItems, resolveBreadcrumbs } from './shell/navConfig';
import { useShellNotifications } from './shell/useShellNotifications';

export interface ShellHeaderData {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  currentSection?: string;
  crumbGroup?: string;
  crumb?: string;
  crumb2?: string;
}

interface AppShellContextType {
  insideShell: boolean;
  wsConnected: boolean;
  setHeaderData: React.Dispatch<React.SetStateAction<ShellHeaderData>>;
}

export const AppShellContext = React.createContext<AppShellContextType | null>(null);

export function useAppShell() {
  return (
    React.useContext(AppShellContext) ?? {
      insideShell: false,
      wsConnected: false,
      setHeaderData: (() => {}) as React.Dispatch<React.SetStateAction<ShellHeaderData>>,
    }
  );
}

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
    header.crumb2,
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
  crumb2,
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
  const [bellTab, setBellTab] = useState<'all' | 'unread'>('all');
  const [isDev, setIsDev] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [vetAvatarPhoto, setVetAvatarPhoto] = useState<PhotoEntity | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const bellMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  useEffect(() => {
    if (role !== 'VETERINARIAN') {
      setVetAvatarPhoto(null);
      return;
    }
    let cancelled = false;
    vetApi
      .getProfile()
      .then((prof) => {
        if (cancelled) return;
        setVetAvatarPhoto(
          prof
            ? {
                photoUrl: prof.photoUrl,
                photoThumbnailUrl: prof.photoThumbnailUrl,
                photoUrlExpiresAt: prof.photoUrlExpiresAt,
              }
            : null
        );
      })
      .catch(() => {});

    const onVetProfileUpdated = (event: Event) => {
      const custom = event as CustomEvent<PhotoEntity | undefined>;
      if (custom.detail) {
        setVetAvatarPhoto({
          photoUrl: custom.detail.photoUrl ?? null,
          photoThumbnailUrl: custom.detail.photoThumbnailUrl ?? null,
          photoUrlExpiresAt: custom.detail.photoUrlExpiresAt ?? null,
        });
      }
    };
    window.addEventListener('chiron:vet-profile-updated', onVetProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('chiron:vet-profile-updated', onVetProfileUpdated);
    };
  }, [role, user?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['k', 'K', 'л', 'Л'].includes(e.key)) {
        e.preventDefault();
        setBellDropdown(false);
        setUserDropdown(false);
        setCmdOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setBellDropdown(false);
        setUserDropdown(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    setBellDropdown(false);
    setUserDropdown(false);
  }, [pathname]);

  const {
    notifications,
    unreadCount,
    vetTodayCount,
    loadingNotifications,
    wsConnected,
    handleMarkAllRead,
    handleClickNotification,
  } = useShellNotifications({
    role,
    pathname,
    bellDropdown,
    bellTab,
    onCloseBell: () => setBellDropdown(false),
  });

  const navGroups = useMemo(
    () => getNavGroups(role, unreadCount, vetTodayCount),
    [role, unreadCount, vetTodayCount]
  );
  const mobileItems = useMemo(() => getMobileNavItems(role), [role]);
  const initials = getUserInitials(user);

  const roleLabel =
    role === 'ADMIN' ? 'Администратор' : role === 'VETERINARIAN' ? 'Кабинет врача' : 'Кабинет клиента';
  const roleShortLabel =
    role === 'ADMIN' ? 'Администратор' : role === 'VETERINARIAN' ? 'Ветеринар' : 'Клиент';

  const shortName = useMemo(() => {
    if (!user) return 'Пользователь';
    if (user.firstName && user.lastName) {
      const f = `${user.firstName.charAt(0)}.`;
      const m = user.middleName ? ` ${user.middleName.charAt(0)}.` : '';
      return `${f}${m} ${user.lastName}`;
    }
    return user.fullName || 'Пользователь';
  }, [user]);

  const [resolvedGroup, resolvedCrumb, resolvedCrumb2] = resolveBreadcrumbs(pathname, role, {
    group: headerData.crumbGroup || crumbGroup,
    crumb: headerData.crumb || crumb,
    crumb2: headerData.crumb2 || crumb2,
    section: headerData.currentSection || currentSection,
    title: headerData.title || title,
  });

  const ctxValue = useMemo(
    () => ({ insideShell: true, wsConnected, setHeaderData }),
    [wsConnected]
  );

  return (
    <AppShellContext.Provider value={ctxValue}>
      <div className="app" data-theme={resolvedTheme}>
        {mobileOpen && (
          <div className="nav-backdrop mobile-only" onClick={() => setMobileOpen(false)} />
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

        <div className="main-col">
          <AppTopbar
            role={role}
            roleShortLabel={roleShortLabel}
            shortName={shortName}
            initials={initials}
            avatarPhoto={vetAvatarPhoto}
            crumbGroup={headerData.crumbGroup || crumbGroup || resolvedGroup}
            crumbLabel={headerData.crumb || crumb || headerData.currentSection || currentSection || resolvedCrumb}
            crumb2={headerData.crumb2 ?? crumb2 ?? resolvedCrumb2}
            actions={headerData.actions || actions}
            unreadCount={unreadCount}
            wsConnected={wsConnected}
            bellTab={bellTab}
            notifications={notifications}
            loadingNotifications={loadingNotifications}
            bellDropdown={bellDropdown}
            userDropdown={userDropdown}
            bellMenuRef={bellMenuRef}
            userMenuRef={userMenuRef}
            onOpenMobile={() => {
              setBellDropdown(false);
              setUserDropdown(false);
              setMobileOpen(true);
            }}
            onOpenCmd={() => {
              setBellDropdown(false);
              setUserDropdown(false);
              setCmdOpen(true);
            }}
            onToggleBell={() => {
              setUserDropdown(false);
              setBellDropdown((v) => !v);
            }}
            onCloseBell={() => setBellDropdown(false)}
            onChangeBellTab={setBellTab}
            onClickNotification={handleClickNotification}
            onToggleUserMenu={() => {
              setBellDropdown(false);
              setUserDropdown((v) => !v);
            }}
            onCloseUserMenu={() => setUserDropdown(false)}
            onMarkAllRead={handleMarkAllRead}
            onLogout={() => {
              logout();
              router.replace('/login');
            }}
          />

          <main className="content-col grow">{children}</main>
        </div>

        {mobileItems.length > 0 && (
          <nav className="mobile-nav" aria-label="Нижняя навигация">
            {mobileItems.map((item) => {
              const active =
                pathname === item.href ||
                Boolean(item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn btn-icon ${active ? 'btn-secondary' : 'btn-ghost'}`}
                  title={item.title}
                  aria-label={item.title}
                >
                  {item.icon}
                </Link>
              );
            })}
          </nav>
        )}

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
