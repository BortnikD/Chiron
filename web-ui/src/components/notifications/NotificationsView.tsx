'use client';

import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api';
import { AppNotification } from '../../types';
import {
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Syringe,
  CheckCheck,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = () => {
    setLoading(true);
    notificationsApi
      .getNotifications(0, 100, onlyUnread)
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.items || [];
        setNotifications(items);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, [onlyUnread]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const getNotifMeta = (n: AppNotification) => {
    const t = n.type || '';
    if (t.includes('CANCEL')) {
      return {
        cls: 't-cancelled',
        icon: <XCircle className="ic" style={{ width: '16px', height: '16px' }} />,
      };
    }
    if (t.includes('CONFIRM')) {
      return {
        cls: 't-confirmed',
        icon: <CheckCircle className="ic" style={{ width: '16px', height: '16px' }} />,
      };
    }
    if (t.includes('RESCHED')) {
      return {
        cls: 't-rescheduled',
        icon: <Clock className="ic" style={{ width: '16px', height: '16px' }} />,
      };
    }
    if (t.includes('BOOK')) {
      return {
        cls: 't-booked',
        icon: <Calendar className="ic" style={{ width: '16px', height: '16px' }} />,
      };
    }
    if (
      n.vaccinationId ||
      n.title?.toLowerCase().includes('привив') ||
      n.title?.toLowerCase().includes('вакцин')
    ) {
      return {
        cls: 't-vaccine',
        icon: <Syringe className="ic" style={{ width: '16px', height: '16px' }} />,
      };
    }
    return {
      cls: '',
      icon: <Bell className="ic" style={{ width: '16px', height: '16px' }} />,
    };
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Группировка уведомлений: Сегодня, Вчера, Ранее
  const groupNotifications = (list: AppNotification[]) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { label: string; items: AppNotification[] }[] = [
      { label: 'Сегодня', items: [] },
      { label: 'Вчера', items: [] },
      { label: 'Ранее', items: [] },
    ];

    list.forEach((n) => {
      if (!n.createdAt) {
        groups[2].items.push(n);
        return;
      }
      const itemDate = new Date(n.createdAt).toDateString();
      if (itemDate === today) {
        groups[0].items.push(n);
      } else if (itemDate === yesterday) {
        groups[1].items.push(n);
      } else {
        groups[2].items.push(n);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  };

  const filtered = onlyUnread ? notifications.filter((n) => !n.readAt) : notifications;
  const groups = groupNotifications(filtered);

  return (
    <section className="island grow" style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
      <div className="island-head">
        <span className="island-title">
          <Bell className="ic" />
          Уведомления <span className="count">непрочитанных: {unreadCount}</span>
        </span>
        <div className="row wrap" style={{ gap: '12px', alignItems: 'center' }}>
          <span className="row small muted" style={{ gap: '6px' }}>
            <span className="dot live" />
            Подключено
          </span>
          <label className="row small" style={{ gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <button
              className={`switch ${onlyUnread ? 'on' : ''}`}
              role="switch"
              type="button"
              aria-checked={onlyUnread}
              aria-label="Только непрочитанные"
              onClick={() => setOnlyUnread(!onlyUnread)}
            />
            Только непрочитанные
          </label>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
          >
            <CheckCheck className="ic" style={{ width: '14px', height: '14px' }} />
            Прочитать все
          </button>
        </div>
      </div>

      <div className="island-body" style={{ padding: '0 10px 12px' }}>
        {loading ? (
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка уведомлений...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Bell className="ic ic-40" style={{ width: '40px', height: '40px' }} />
            </div>
            <span className="empty-title">Непрочитанных нет</span>
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
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <span className={`notif-ic ${meta.cls}`}>{meta.icon}</span>
                    <span className="col" style={{ gap: '2px', textAlign: 'left' }}>
                      <span className="notif-title">{n.title}</span>
                      <span className="notif-body">{n.body}</span>
                    </span>
                    <span className="notif-time">
                      {formatTimestamp(n.createdAt)}
                      {isUnread && <span className="dot accent" style={{ marginLeft: '4px' }} />}
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
        <div className="pager">
          <button type="button" className="btn btn-ghost btn-sm on">
            1
          </button>
        </div>
      </div>
    </section>
  );
};
