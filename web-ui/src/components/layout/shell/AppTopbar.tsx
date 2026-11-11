'use client';

import React, { RefObject } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Info,
  LogOut,
  Menu,
  Search,
  Settings,
  Stethoscope,
  User as UserIcon,
} from 'lucide-react';
import type { AppNotification, UserRole } from '@/shared/types';
import { formatSlotTime, type PhotoEntity } from '@/shared/lib';
import { PhotoAvatar } from '@/components/ui/EntityAvatar';
import { getNotifMeta } from '@/components/notifications/notifMeta';

interface AppTopbarProps {
  role: UserRole | null;
  roleShortLabel: string;
  shortName: string;
  initials: string;
  avatarPhoto?: PhotoEntity | null;
  crumbGroup: string;
  crumbLabel: string;
  crumb2?: string;
  actions?: React.ReactNode;
  unreadCount: number;
  wsConnected: boolean;
  bellTab: 'all' | 'unread';
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
  onChangeBellTab: (tab: 'all' | 'unread') => void;
  onClickNotification: (notif: AppNotification) => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
}

export function AppTopbar({
  role,
  roleShortLabel,
  shortName,
  initials,
  avatarPhoto,
  crumbGroup,
  crumbLabel,
  crumb2,
  actions,
  unreadCount,
  wsConnected,
  bellTab,
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
  onChangeBellTab,
  onClickNotification,
  onToggleUserMenu,
  onCloseUserMenu,
  onMarkAllRead,
  onLogout,
}: AppTopbarProps) {
  const rolePrefix = role === 'ADMIN' ? '/admin' : role === 'VETERINARIAN' ? '/vet' : '/client';

  const searchPlaceholder =
    role === 'ADMIN'
      ? 'Разделы, пользователи, питомцы'
      : role === 'VETERINARIAN'
      ? 'Разделы, пациенты, записи'
      : 'Разделы, питомцы, записи';

  return (
    <header className="island topbar">
      <button
        type="button"
        className="btn btn-ghost btn-icon mobile-only"
        onClick={onOpenMobile}
        aria-label="Открыть меню"
      >
        <Menu className="ic ic-20" />
      </button>

      <nav className="crumbs" aria-label="Хлебные крошки">
        <span>{crumbGroup}</span>
        <ChevronRight className="ic" style={{ width: '14px', height: '14px' }} />
        <span className="cur">{crumbLabel}</span>
        {crumb2 && (
          <>
            <ChevronRight className="ic" style={{ width: '14px', height: '14px' }} />
            <span className="cur">{crumb2}</span>
          </>
        )}
      </nav>

      <div className="spacer" />

      {actions}

      <button
        type="button"
        className="search-trigger"
        onClick={onOpenCmd}
        aria-label="Поиск (Ctrl+K)"
      >
        <Search className="ic" />
        <span>{searchPlaceholder}</span>
        <span className="kbd">Ctrl K</span>
      </button>

      <div className="rel" ref={bellMenuRef}>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={onToggleBell}
          aria-label="Уведомления"
          title="Уведомления"
        >
          <Bell className="ic ic-20" />
        </button>
        {role !== 'ADMIN' && unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}

        {bellDropdown && (
          role === 'ADMIN' ? (
            <div
              className="popover"
              style={{ right: 0, top: '44px', width: '340px', maxWidth: 'calc(100vw - 32px)' }}
              role="dialog"
              aria-label="Уведомления"
            >
              <div className="empty" style={{ padding: '28px 16px' }}>
                <div className="empty-art">
                  <Bell className="ic ic-40" />
                </div>
                <span className="empty-title">Уведомлений нет</span>
                <span>Администраторам уведомления не приходят</span>
              </div>
            </div>
          ) : (
            <div
              className="popover"
              style={{ right: 0, top: '44px', width: '400px', maxWidth: 'calc(100vw - 32px)' }}
              role="dialog"
              aria-label="Уведомления"
            >
              <div className="island-head" style={{ minHeight: '46px', padding: '10px 12px' }}>
                <span className="island-title">Уведомления</span>
                <div className="row" style={{ gap: '8px' }}>
                  <span
                    className="row small muted"
                    style={{ gap: '6px' }}
                    title="WebSocket STOMP /user/queue/notifications"
                  >
                    <span className={`dot ${wsConnected ? '' : 'off'}`} />
                    {wsConnected ? 'Подключено' : 'Отключено'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={onMarkAllRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="ic" />
                    Прочитать все
                  </button>
                </div>
              </div>

              <div style={{ padding: '0 12px 8px' }}>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${bellTab === 'all' ? 'on' : ''}`}
                    onClick={() => onChangeBellTab('all')}
                  >
                    Все
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${bellTab === 'unread' ? 'on' : ''}`}
                    onClick={() => onChangeBellTab('unread')}
                  >
                    Непрочитанные
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '360px', overflow: 'auto', padding: '0 6px 6px' }}>
                {loadingNotifications ? (
                  <div className="empty" style={{ padding: '28px 12px' }}>
                    <span className="small muted">Загрузка уведомлений...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="empty" style={{ padding: '28px 12px' }}>
                    <div className="empty-art">
                      <CheckCheck className="ic ic-40" />
                    </div>
                    <span>
                      {bellTab === 'unread' ? 'Все уведомления прочитаны' : 'Уведомлений пока нет'}
                    </span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const meta = getNotifMeta(n);
                    const isUnread = !n.readAt;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className={`notif ${isUnread ? 'unread' : ''}`}
                        onClick={() => onClickNotification(n)}
                      >
                        <span className={`notif-ic ${meta.cls}`}>{meta.icon}</span>
                        <span className="col" style={{ gap: '2px', textAlign: 'left' }}>
                          <span className="notif-title">{n.title || 'Уведомление'}</span>
                          <span className="notif-body">{n.body || ''}</span>
                        </span>
                        <span className="notif-time">
                          {n.createdAt ? formatSlotTime(n.createdAt) : ''}
                          {isUnread && <span className="dot accent" />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="island-foot" style={{ justifyContent: 'flex-end' }}>
                <Link
                  href={`${rolePrefix}/notifications`}
                  className="btn btn-outline btn-sm"
                  onClick={onCloseBell}
                >
                  Все уведомления
                </Link>
              </div>
            </div>
          )
        )}
      </div>

      <div className="rel" ref={userMenuRef}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '0 4px' }}
          onClick={onToggleUserMenu}
          aria-label="Меню профиля"
        >
          <PhotoAvatar
            photo={avatarPhoto}
            alt={shortName}
            className="avatar"
            variant="thumb"
            fallback={initials}
          />
        </button>

        {userDropdown && (
          <div className="popover menu" style={{ right: 0, top: '44px' }}>
            <div className="menu-label">
              {shortName} · {roleShortLabel}
            </div>

            {role === 'VETERINARIAN' && (
              <Link
                href="/vet/profile?tab=practice"
                className="menu-item"
                onClick={onCloseUserMenu}
              >
                <Stethoscope className="ic" />
                Профиль врача
              </Link>
            )}

            <Link href={`${rolePrefix}/profile`} className="menu-item" onClick={onCloseUserMenu}>
              <UserIcon className="ic" />
              Профиль
            </Link>

            <Link href={`${rolePrefix}/settings`} className="menu-item" onClick={onCloseUserMenu}>
              <Settings className="ic" />
              Настройки
            </Link>

            <Link href="/" className="menu-item" onClick={onCloseUserMenu}>
              <Info className="ic" />
              О клинике
            </Link>

            <div className="menu-sep" />

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onCloseUserMenu();
                onLogout();
              }}
            >
              <LogOut className="ic" />
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
