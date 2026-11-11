'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { notificationsApi } from '@/shared/api';
import type { AppNotification } from '@/shared/types';
import { formatSlotTime, getMoscowDateKey, getMoscowTodayIso, formatDateRu } from '@/shared/lib';
import { getNotifMeta, getNotificationHref } from '@/components/notifications/notifMeta';

export interface ClientNotificationsIslandProps {
  notifications: AppNotification[];
  unreadCount?: number;
}

function formatNotifTimestamp(iso?: string | null): string {
  if (!iso) return '';
  const key = getMoscowDateKey(iso);
  const todayKey = getMoscowTodayIso(0);
  if (key === todayKey) return formatSlotTime(iso);
  return formatDateRu(iso, { day: '2-digit', month: '2-digit' });
}

export function ClientNotificationsIsland({
  notifications,
  unreadCount,
}: ClientNotificationsIslandProps) {
  const router = useRouter();
  const unreadNotifsCount =
    unreadCount ?? notifications.filter((n) => !n.readAt).length;

  const handleOpenNotif = useCallback(
    async (n: AppNotification) => {
      if (!n.readAt) {
        try {
          await notificationsApi.markAsRead(n.id);
          window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
        } catch {
          // Игнорируем сбой пометки прочтения, всё равно переходим
        }
      }
      const href = getNotificationHref(n, 'CLIENT');
      router.push(href || '/client/notifications');
    },
    [router]
  );

  return (
    <section className="island hm-notifs" id="notifs">
      <div className="island-head">
        <span className="island-title">
          <Bell className="ic" />
          Уведомления {unreadNotifsCount > 0 && <span className="count">{unreadNotifsCount} новых</span>}
        </span>
        <Link href="/client/notifications" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
      <div className="island-body" style={{ padding: '0 6px 8px' }}>
        {notifications.length === 0 ? (
          <div className="empty" style={{ padding: '20px' }}>
            <span className="small muted">Новых уведомлений нет</span>
          </div>
        ) : (
          notifications.slice(0, 3).map((n) => {
            const meta = getNotifMeta(n);
            return (
              <button
                key={n.id}
                type="button"
                className={`notif ${!n.readAt ? 'unread' : ''}`}
                onClick={() => void handleOpenNotif(n)}
              >
                <span className={`notif-ic ${meta.cls}`}>{meta.icon}</span>
                <span className="col" style={{ gap: '2px', textAlign: 'left', minWidth: 0 }}>
                  <span className="notif-title">{n.title || 'Оповещение'}</span>
                  <span className="notif-body">{n.body || ''}</span>
                </span>
                {n.createdAt && (
                  <span className="notif-time">
                    {formatNotifTimestamp(n.createdAt)}
                    {!n.readAt && <span className="dot accent" />}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
