'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
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
import { NotificationDetailIsland } from './NotificationDetailIsland';
import { AlertCircle, Bell, CheckCheck, Filter } from 'lucide-react';

const PAGE_SIZE = 25;

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
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
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
      // Если выбранное уведомление обновилось или отсутствует, синхронизируем выбор
      setSelectedNotification((prev) => {
        if (!prev) return items[0] || null;
        const found = items.find((it) => it.id === prev.id);
        return found || items[0] || null;
      });
    } catch (err) {
      setError(formatApiError(err, 'Не удалось загрузить уведомления'));
      setNotifications([]);
      setSelectedNotification(null);
    } finally {
      setLoading(false);
    }
  }, [onlyUnread]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Real-time WebSocket обновления
  useEffect(() => {
    const handleIncoming = (event: Event) => {
      const incoming = (event as CustomEvent<AppNotification>).detail;
      if (!incoming?.id) return;
      if (onlyUnread && incoming.readAt) return;
      setNotifications((prev) => [incoming, ...prev.filter((n) => n.id !== incoming.id)]);
      setSelectedNotification((prev) => prev || incoming);
    };

    const handleAllRead = () => {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      setSelectedNotification((prev) =>
        prev ? { ...prev, readAt: prev.readAt || now } : null
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
      setSelectedNotification((prev) =>
        prev && prev.id === id ? { ...prev, readAt: prev.readAt || nowIso } : prev
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
    } catch (err) {
      toast('Ошибка', formatApiError(err, 'Не удалось отметить уведомление'), 'err');
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
      setSelectedNotification((prev) =>
        prev ? { ...prev, readAt: prev.readAt || now } : null
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

  // Фильтрация по непрочитанным и по типу события
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (onlyUnread && n.readAt) return false;
      if (selectedType !== 'ALL') {
        const meta = getNotifMeta(n);
        if (meta.shortType !== selectedType && meta.label !== selectedType) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, onlyUnread, selectedType]);

  // Доступные типы событий для быстрых фильтров
  const availableTypes = useMemo(() => {
    const typesMap = new Map<string, { shortType: string; tone: string }>();
    notifications.forEach((n) => {
      const meta = getNotifMeta(n);
      if (!typesMap.has(meta.shortType)) {
        typesMap.set(meta.shortType, { shortType: meta.shortType, tone: meta.tone });
      }
    });
    return Array.from(typesMap.values());
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const groups = groupNotifications(pageItems);

  return (
    <div className="content-row">
      {/* Левая колонка: Реестр событий с фильтрами */}
      <section className="island grow content-col" style={{ minWidth: 0 }}>
        {/* Шапка реестра */}
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
              {wsConnected ? 'Онлайн' : 'Офлайн'}
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
              Только новые
            </label>

            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || unreadCount === 0}
            >
              <CheckCheck className="ic" size={15} />
              Прочитать все
            </button>
          </div>
        </div>

        {/* Фильтры по типам событий (чипы) */}
        {availableTypes.length > 1 && (
          <div
            className="row wrap"
            style={{
              padding: '6px 14px 10px',
              gap: '6px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Filter size={13} /> Тип:
            </span>
            <button
              type="button"
              className={`btn btn-xs ${selectedType === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setSelectedType('ALL');
                setPage(0);
              }}
            >
              Все ({notifications.length})
            </button>
            {availableTypes.map((t) => (
              <button
                key={t.shortType}
                type="button"
                className={`btn btn-xs ${selectedType === t.shortType ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setSelectedType(t.shortType);
                  setPage(0);
                }}
              >
                {t.shortType}
              </button>
            ))}
          </div>
        )}

        {/* Список уведомлений */}
        <div className="island-body" style={{ padding: '8px 12px 14px' }}>
          {error && (
            <div className="alert alert-destructive" role="alert" style={{ margin: '0 0 10px' }}>
              <AlertCircle className="ic" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="empty">
              <span className="spinner" aria-hidden="true" />
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
              <span className="small muted">
                {onlyUnread
                  ? 'Все входящие события прочитаны'
                  : 'Новые уведомления о записях и визитах появятся здесь автоматически'}
              </span>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="col" style={{ gap: '4px', paddingBottom: '10px' }}>
                <span className="menu-label">{g.label}</span>
                {g.items.map((n) => {
                  const meta = getNotifMeta(n);
                  const isUnread = !n.readAt;
                  const isSelected = selectedNotification?.id === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`notif ${isUnread ? 'unread' : ''} ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedNotification(n)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                      }}
                    >
                      {/* Иконка события */}
                      <span className={`notif-ic ${meta.cls}`} style={{ width: 34, height: 34, flexShrink: 0 }}>
                        {meta.icon}
                      </span>

                      {/* Текст и бейдж типа события */}
                      <span className="col" style={{ gap: '3px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                        <div className="row wrap items-center" style={{ gap: '6px' }}>
                          <span
                            className={`sp-chip tone-${meta.tone}`}
                            style={{
                              fontSize: '11px',
                              padding: '1px 7px',
                              height: '19px',
                              borderRadius: '5px',
                              fontWeight: 600,
                            }}
                          >
                            {meta.shortType}
                          </span>
                          <span className="notif-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title || 'Уведомление'}
                          </span>
                        </div>
                        <span
                          className="notif-body"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            opacity: 0.85,
                          }}
                        >
                          {n.body || ''}
                        </span>
                      </span>

                      {/* Время и точка непрочитанного */}
                      <span className="notif-time" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px' }}>{n.createdAt ? formatSlotTime(n.createdAt) : ''}</span>
                        {isUnread && <span className="dot accent" style={{ width: 8, height: 8 }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Пагинатор */}
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

      {/* Правая колонка: Детальный функциональный островок */}
      <NotificationDetailIsland
        notification={selectedNotification}
        role={role}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={handleMarkAsRead}
      />
    </div>
  );
};
