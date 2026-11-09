'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, PawPrint, Syringe, Bell, CalendarPlus } from 'lucide-react';
import { ClientQuickActionsProps } from './types';

export function ClientQuickActions({
  upcomingCount,
  petsCount,
  vacAttnCount,
  unreadNotifsCount,
}: ClientQuickActionsProps) {
  return (
    <>
      <div className="hm-stats">
        <Link
          href="/client/appointments"
          className="hm-stat"
          style={{ '--tone': 'var(--primary)', textDecoration: 'none' } as React.CSSProperties}
        >
          <span className="hm-stat-ic">
            <Calendar className="ic" />
          </span>
          <span className="hm-stat-txt">
            <b>{upcomingCount}</b>
            <span>
              {upcomingCount === 1
                ? 'запись впереди'
                : upcomingCount < 5
                ? 'записи впереди'
                : 'записей впереди'}
            </span>
          </span>
        </Link>

        <Link
          href="/client/pets"
          className="hm-stat"
          style={{ '--tone': 'var(--chart-2)', textDecoration: 'none' } as React.CSSProperties}
        >
          <span className="hm-stat-ic">
            <PawPrint className="ic" />
          </span>
          <span className="hm-stat-txt">
            <b>{petsCount}</b>
            <span>{petsCount === 1 ? 'питомец' : petsCount < 5 ? 'питомца' : 'питомцев'}</span>
          </span>
        </Link>

        <Link
          href="/client/appointments?tab=VACC"
          className="hm-stat"
          style={{
            '--tone': vacAttnCount > 0 ? 'var(--st-noshow-fg)' : 'var(--muted-foreground)',
            textDecoration: 'none',
          } as React.CSSProperties}
        >
          <span className="hm-stat-ic">
            <Syringe className="ic" />
          </span>
          <span className="hm-stat-txt">
            <b>{vacAttnCount}</b>
            <span>прививки к сроку</span>
          </span>
        </Link>

        <Link
          href="/client/dashboard#notifs"
          className="hm-stat"
          style={{ '--tone': 'var(--chart-3)', textDecoration: 'none' } as React.CSSProperties}
        >
          <span className="hm-stat-ic">
            <Bell className="ic" />
          </span>
          <span className="hm-stat-txt">
            <b>{unreadNotifsCount}</b>
            <span>
              {unreadNotifsCount === 1
                ? 'новое событие'
                : unreadNotifsCount < 5
                ? 'новых события'
                : 'новых событий'}
            </span>
          </span>
        </Link>
      </div>

      <div className="row wrap" style={{ gap: '8px' }}>
        <Link href="/client/book" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
          <CalendarPlus className="ic" />
          <span>Записаться на приём</span>
        </Link>
      </div>
    </>
  );
}
