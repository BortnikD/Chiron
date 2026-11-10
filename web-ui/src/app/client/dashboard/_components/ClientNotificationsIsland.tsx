'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import type { AppNotification } from '@/shared/types';
import { formatSlotTime } from '@/shared/lib';

export interface ClientNotificationsIslandProps {
  notifications: AppNotification[];
}

export function ClientNotificationsIsland({
  notifications,
}: ClientNotificationsIslandProps) {
  const unreadNotifsCount = notifications.filter((n) => !n.readAt).length;

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
          <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
            Новых уведомлений нет
          </div>
        ) : (
          notifications.slice(0, 3).map((n) => (
            <div key={n.id} className={`notif ${!n.readAt ? 'unread' : ''}`}>
              <span
                className="notif-ic"
                style={{
                  background: 'var(--primary-soft)',
                  color: 'var(--primary-text)',
                }}
              >
                <Bell className="ic" />
              </span>
              <span className="col" style={{ gap: '2px', textAlign: 'left', minWidth: 0 }}>
                <span className="notif-title">{n.title || 'Оповещение'}</span>
                <span className="notif-body">{n.body || ''}</span>
              </span>
              {n.createdAt && (
                <span className="notif-time">
                  {formatSlotTime(n.createdAt)}
                  {!n.readAt && <span className="dot accent" />}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
