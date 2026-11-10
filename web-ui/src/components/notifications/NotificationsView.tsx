'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/shared/api';
import { formatApiError, formatSlotTime, getMoscowDateKey, getMoscowTodayIso } from '@/shared/lib';
import type { AppNotification } from '@/shared/types';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CalendarPlus,
  CheckCircle,
  Clock,
  Syringe,
  CheckCheck,
  XCircle,
} from 'lucide-react';

function getNotifMeta(n: AppNotification) {
  const t = n.type || '';
  if (t.includes('NO_SHOW')) {
    return { cls: 't-noshow', icon: <AlertTriangle className="ic" /> };
  }
  if (t.includes('FOLLOW_UP')) {
    return { cls: 't-followup', icon: <CalendarPlus className="ic" /> };
  }
  if (t.includes('REMINDER')) {
    return { cls: 't-reminder', icon: <Clock className="ic" /> };
  }
  if (t.includes('CANCEL')) {
    return { cls: 't-cancelled', icon: <XCircle className="ic" /> };
  }
  if (t.includes('CONFIRM')) {
    return { cls: 't-confirmed', icon: <CheckCircle className="ic" /> };
  }
  if (t.includes('RESCHED')) {
    return { cls: 't-rescheduled', icon: <Clock className="ic" /> };
  }
  if (t.includes('BOOK')) {
    return { cls: 't-booked', icon: <Calendar className="ic" /> };
  }
  if (
    t.includes('VACC') ||
    n.vaccinationId ||
    n.title?.toLowerCase().includes('привив') ||
    n.title?.toLowerCase().includes('вакцин')
  ) {
    return { cls: 't-vaccine', icon: <Syringe className="ic" /> };
  }
  return { cls: '', icon: <Bell className="ic" /> };
}

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
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
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
  }, [onlyUnread]);

  useEffect(() => {
    loadNotifications();
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread
          ? prev.filter((n) => n.id !== id)
          : prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || nowIso } : n))
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
    } catch (err) {
      setError(formatApiError(err, 'Не удалось отметить уведомление'));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    setError(null);
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
    } catch (err) {
      setError(formatApiError(err, 'Не удалось отметить уведомления прочитанными'));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const filtered = onlyUnread ? notifications.filter((n) => !n.readAt) : notifications;
  const groups = groupNotifications(filtered);

  return (
    <section className="island grow" style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
      <div className="island-head">
        <span className="island-title">
          <Bell className="ic" />
          Уведомления <span className="count">непрочитанных: {unreadCount}</span>
        </span>
        <div className="row wrap" style={{ gap: '12px' }}>
          <div className="row small" style={{ gap: '8px' }}>
            <button
              id="notif-only-unread"
              className={`switch ${onlyUnread ? 'on' : ''}`}
              role="switch"
              type="button"
              aria-checked={onlyUnread}
              aria-label="Только непрочитанные"
              onClick={() => setOnlyUnread((v) => !v)}
            />
            <span
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setOnlyUnread((v) => !v)}
            >
              Только непрочитанные
            </span>
          </div>
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
            <span>Новые уведомления появятся здесь при изменениях по записям и прививкам</span>
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
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <span className={`notif-ic ${meta.cls}`}>{meta.icon}</span>
                    <span className="col" style={{ gap: '2px', textAlign: 'left' }}>
                      <span className="notif-title">{n.title}</span>
                      <span className="notif-body">{n.body}</span>
                    </span>
                    <span className="notif-time">
                      {formatSlotTime(n.createdAt)}
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
          Показано {filtered.length} из {notifications.length}
        </span>
      </div>
    </section>
  );
};
