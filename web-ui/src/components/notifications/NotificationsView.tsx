'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi } from '@/shared/api';
import { useToast } from '@/shared/components';
import { useAppShell } from '@/components/layout/AppShell';
import {
  formatApiError,
  formatSlotTime,
  getMoscowDateKey,
  getMoscowTodayIso,
} from '@/shared/lib';
import type { AppNotification } from '@/shared/types';
import { getNotifMeta, getNotificationHref } from './notifMeta';
import { AlertCircle, Bell, CheckCheck } from 'lucide-react';

const PAGE_SIZE = 20;

function groupNotifications(list: AppNotification[]) {
  const today = getMoscowTodayIso(0);
  const yesterday = getMoscowTodayIso(-1);

  const groups: { label: string; items: AppNotification[] }[] = [
    { label: 'Сегодня', items: [] },
    { label: 'Вчера', items: [] },
    { label: 'Ранее', items: [] },
  ];

  list.forEach((n) => {
    const itemDate = getMoscowDateKey(n.createdAt);
    if (itemDate === today) {
      groups[0].items.push(n);
    } else if (itemDate === yesterday) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

export const NotificationsView: React.FC = () => {
  const { role } = useAuth();
  const { wsConnected } = useAppShell();
  const { toast } = useToast();
  const router = useRouter();

  const [onlyUnread, setOnlyUnread] = useState(false);
  const [page, setPage] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (role === 'ADMIN') {
      setLoading(false);
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications(0, 100, onlyUnread);
      const items = Array.isArray(res) ? res : res?.items || [];
      setNotifications(items);
    } catch (err) {
      setError(formatApiError(err, 'Не удалось загрузить уведомления'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [onlyUnread, role]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleIncoming = (event: Event) => {
      const incoming = (event as CustomEvent<AppNotification>).detail;
      if (!incoming?.id) return;
      if (onlyUnread && incoming.readAt) return;
      setNotifications((prev) => [incoming, ...prev.filter((n) => n.id !== incoming.id)]);
    };

    const handleAllRead = () => {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
    };

    window.addEventListener('chiron:notification-received', handleIncoming);
    window.addEventListener('chiron:notifications-marked-all-read', handleAllRead);
    return () => {
      window.removeEventListener('chiron:notification-received', handleIncoming);
      window.removeEventListener('chiron:notifications-marked-all-read', handleAllRead);
    };
  }, [onlyUnread]);

  const handleOpenNotification = async (notif: AppNotification) => {
    if (!notif.readAt) {
      try {
        await notificationsApi.markAsRead(notif.id);
        const nowIso = new Date().toISOString();
        setNotifications((prev) =>
          onlyUnread
            ? prev.filter((n) => n.id !== notif.id)
            : prev.map((n) => (n.id === notif.id ? { ...n, readAt: n.readAt || nowIso } : n))
        );
        window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
      } catch (err) {
        setError(formatApiError(err, 'Не удалось отметить уведомление'));
      }
    }

    const href = getNotificationHref(notif, role);
    if (href) {
      router.push(href);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadBefore = notifications.filter((n) => !n.readAt).length;
    setMarkingAll(true);
    setError(null);
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
      if (unreadBefore > 0) {
        toast(`Отмечено прочитанными: ${unreadBefore}`);
      }
    } catch (err) {
      const msg = formatApiError(err, 'Не удалось отметить уведомления прочитанными');
      setError(msg);
      toast('Ошибка отметки уведомлений', msg, 'err');
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered = useMemo(
    () => (onlyUnread ? notifications.filter((n) => !n.readAt) : notifications),
    [notifications, onlyUnread]
  );

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const groups = groupNotifications(pageItems);

  if (role === 'ADMIN') {
    return (
      <section className="island grow" style={{ maxWidth: '860px', width: '100%' }}>
        <div className="island-head">
          <span className="island-title">
            <Bell className="ic" />
            Уведомления
          </span>
        </div>
        <div className="empty">
          <div className="empty-art">
            <Bell className="ic ic-40" />
          </div>
          <span className="empty-title">Администраторам уведомления не приходят</span>
          <span>
            Уведомления получают клиенты и врачи — о записях, отменах, переносах и ревакцинации
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="island grow" style={{ maxWidth: '860px', width: '100%' }}>
      <div className="island-head">
        <span className="island-title">
          <Bell className="ic" />
          Уведомления <span className="count">непрочитанных: {unreadCount}</span>
        </span>

        <div className="row wrap" style={{ gap: '10px', alignItems: 'center' }}>
          <span
            className="row small muted"
            style={{ gap: '6px' }}
            title="WebSocket STOMP /user/queue/notifications"
          >
            <span className={`dot ${wsConnected ? '' : 'off'}`} />
            {wsConnected ? 'Подключено' : 'Отключено'}
          </span>

          <label className="row small" style={{ gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <button
              id="notif-only-unread"
              className={`switch ${onlyUnread ? 'on' : ''}`}
              role="switch"
              type="button"
              aria-checked={onlyUnread}
              aria-label="Только непрочитанные"
              onClick={() => {
                setOnlyUnread((v) => !v);
                setPage(0);
              }}
            />
            Только непрочитанные
          </label>

          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
          >
            <CheckCheck className="ic" />
            Прочитать все
          </button>
        </div>
      </div>

      <div className="island-body" style={{ padding: '0 10px 12px' }}>
        {error && (
          <div className="alert alert-destructive" role="alert" style={{ margin: '0 6px 10px' }}>
            <AlertCircle className="ic" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="empty">
            <span className="small muted">Загрузка уведомлений...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Bell className="ic ic-40" />
            </div>
            <span className="empty-title">
              {onlyUnread ? 'Непрочитанных нет' : 'Уведомлений пока нет'}
            </span>
            <span>Новые уведомления появятся здесь и всплывут в углу экрана</span>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="col" style={{ gap: '2px', paddingBottom: '8px' }}>
              <span className="menu-label">{g.label}</span>
              {g.items.map((n) => {
                const meta = getNotifMeta(n);
                const isUnread = !n.readAt;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`notif ${isUnread ? 'unread' : ''}`}
                    onClick={() => void handleOpenNotification(n)}
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
              })}
            </div>
          ))
        )}
      </div>

      <div className="island-foot">
        <span className="small muted">
          Показано {pageItems.length} из {filtered.length}
        </span>

        {pageCount > 1 && (
          <div className="pager">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, idx) => (
              <button
                key={idx}
                type="button"
                className={`btn btn-ghost btn-sm ${idx === currentPage ? 'on' : ''}`}
                onClick={() => setPage(idx)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
