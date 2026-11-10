'use client';

import React, { RefObject } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  ChevronRight,
  Info,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import type { AppNotification, User, UserRole } from '@/shared/types';
import { formatSlotTime } from '@/shared/lib';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AppTopbarProps {
  role: UserRole | null;
  roleLabel: string;
  user: User | null;
  initials: string;
  crumbGroup: string;
  crumbLabel: string;
  actions?: React.ReactNode;
  unreadCount: number;
  notifications: AppNotification[];
  loadingNotifications: boolean;
  bellDropdown: boolean;
  userDropdown: boolean;
  bellMenuRef: RefObject<HTMLDivElement | null>;
  userMenuRef: RefObject<HTMLDivElement | null>;
  onOpenMobile: () => void;
  onOpenCmd: () => void;
  onToggleBell: () => void;
  onCloseBell: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
}

export function AppTopbar({
  role,
  roleLabel,
  user,
  initials,
  crumbGroup,
  crumbLabel,
  actions,
  unreadCount,
  notifications,
  loadingNotifications,
  bellDropdown,
  userDropdown,
  bellMenuRef,
  userMenuRef,
  onOpenMobile,
  onOpenCmd,
  onToggleBell,
  onCloseBell,
  onToggleUserMenu,
  onCloseUserMenu,
  onMarkAllRead,
  onLogout,
}: AppTopbarProps) {
  const rolePrefix = role === 'ADMIN' ? '/admin' : role === 'VETERINARIAN' ? '/vet' : '/client';

  return (
    <header className="island topbar shrink-0 flex items-center justify-between px-3 py-2 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="mobile-only btn btn-ghost btn-icon h-8 w-8 shrink-0"
          onClick={onOpenMobile}
          aria-label="Открыть меню"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav className="crumbs" aria-label="Хлебные крошки">
          <span>{crumbGroup}</span>
          <ChevronRight className="ic" style={{ width: '14px', height: '14px' }} />
          <span className="cur">{crumbLabel}</span>
        </nav>
      </div>

      <div className="spacer" />

      <div className="flex items-center gap-2 shrink-0">
        {actions}

        <button
          type="button"
          className="search-trigger hidden md:inline-flex"
          onClick={onOpenCmd}
          aria-label="Быстрый поиск (Ctrl+K)"
        >
          <Search className="ic" />
          <span>Разделы, услуги, врачи...</span>
          <span className="kbd">Ctrl K</span>
        </button>

        <div className="rel" ref={bellMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon h-8 w-8"
            onClick={onToggleBell}
            aria-label="Уведомления"
            title="Уведомления"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </button>

          {bellDropdown && (
            <div
              className="popover shadow-xl flex flex-col gap-2 p-3"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: '360px',
                maxWidth: 'calc(100vw - 32px)',
                zIndex: 100,
              }}
              role="dialog"
              aria-label="Уведомления"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">Уведомления</span>
                  {unreadCount > 0 && (
                    <span className="badge font-mono text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] px-1.5 py-0.2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-[10px] text-[var(--primary-text)] hover:underline flex items-center gap-1"
                    onClick={onMarkAllRead}
                  >
                    <Check className="w-3 h-3" />
                    Прочитать все
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
                {loadingNotifications ? (
                  <div className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                    Загрузка уведомлений...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                    Новых уведомлений нет
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-md border text-xs flex flex-col gap-0.5 transition-colors ${
                        n.readAt
                          ? 'bg-transparent border-[var(--border)] text-[var(--muted-foreground)]'
                          : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--foreground)] font-medium'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-[11px] leading-tight">
                          {n.title || 'Уведомление'}
                        </span>
                        {n.createdAt && (
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 font-mono">
                            {formatSlotTime(n.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug line-clamp-2">
                        {n.body || ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-1.5 border-t border-[var(--border)] text-center">
                <Link
                  href={`${rolePrefix}/notifications`}
                  className="text-xs text-[var(--primary-text)] hover:underline inline-block py-0.5"
                  onClick={onCloseBell}
                >
                  Все уведомления →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className={`rel tone-${role || 'CLIENT'}`} ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0 4px' }}
            onClick={onToggleUserMenu}
            aria-label="Меню профиля"
          >
            <span className="t-ava sm round font-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {initials}
            </span>
          </button>

          {userDropdown && (
            <div
              className="popover menu shadow-xl flex flex-col p-1.5"
              style={{
                position: 'absolute',
                right: 0,
                left: 'auto',
                top: 'calc(100% + 6px)',
                width: '220px',
                maxWidth: 'calc(100vw - 24px)',
                zIndex: 100,
              }}
            >
              <div className="menu-label">
                {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Пользователь'} ·{' '}
                {roleLabel}
              </div>

              <Link href={`${rolePrefix}/profile`} className="menu-item flex items-center gap-2" onClick={onCloseUserMenu}>
                <UserIcon className="ic text-[var(--muted-foreground)]" />
                <span>Профиль</span>
              </Link>

              <Link href={`${rolePrefix}/settings`} className="menu-item flex items-center gap-2" onClick={onCloseUserMenu}>
                <Settings className="ic text-[var(--muted-foreground)]" />
                <span>Настройки</span>
              </Link>

              <Link href="/services" className="menu-item flex items-center gap-2" onClick={onCloseUserMenu}>
                <Info className="ic text-[var(--muted-foreground)]" />
                <span>О клинике</span>
              </Link>

              <div className="menu-sep" />
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">Тема</span>
                <ThemeToggle />
              </div>
              <div className="menu-sep" />

              <button
                type="button"
                className="menu-item flex items-center gap-2 text-[var(--destructive)] w-full text-left"
                onClick={() => {
                  onCloseUserMenu();
                  onLogout();
                }}
              >
                <LogOut className="ic" />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
