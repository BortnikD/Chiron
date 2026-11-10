'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, PawPrint, Syringe, Bell, CalendarPlus } from 'lucide-react';
import { pluralRu } from '@/shared/lib';

export interface ClientQuickActionsProps {
  upcomingCount: number;
  petsCount: number;
  vacAttnCount: number;
  unreadNotifsCount: number;
}

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
            <span>{pluralRu(upcomingCount, 'запись впереди', 'записи впереди', 'записей впереди')}</span>
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
            <span>{pluralRu(petsCount, 'питомец', 'питомца', 'питомцев')}</span>
          </span>
        </Link>

        <Link
          href="/client/vaccinations"
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
            <span>{pluralRu(vacAttnCount, 'прививка к сроку', 'прививки к сроку', 'прививок к сроку')}</span>
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
            <span>{pluralRu(unreadNotifsCount, 'новое событие', 'новых события', 'новых событий')}</span>
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
