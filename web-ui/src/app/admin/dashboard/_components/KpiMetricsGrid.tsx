'use client';

import React from 'react';
import { Banknote, Calendar, UserPlus } from 'lucide-react';
import { KpiMetricsGridProps } from './types';

export function KpiMetricsGrid({ stats }: KpiMetricsGridProps) {
  return (
    <div className="kgroups">
      {/* Card 1: Финансы */}
      <section className="island kg" aria-label="Финансы">
        <div className="kg-head">
          <span className="kg-title">
            <Banknote className="ic w-4 h-4" />
            <span>Финансы</span>
          </span>
        </div>
        <div className="col" style={{ gap: '2px' }}>
          <span className="kpi-label">Выручка по завершённым приёмам</span>
          <span className="kpi-value accent" style={{ fontSize: '34px' }}>
            {stats.revenue}
          </span>
        </div>
        <div className="col" style={{ gap: '6px' }}>
          <div className="stack-track" style={{ height: '10px', borderRadius: '999px' }}>
            <span className="stack-seg" style={{ width: stats.recvW, background: 'var(--primary)' }} />
            <span
              className="stack-seg"
              style={{
                width: stats.expW,
                background: 'color-mix(in oklch, var(--primary) 35%, transparent)',
              }}
            />
          </div>
          <div className="row between small muted">
            <span>Получено {stats.recvPct}</span>
            <span>ещё ожидается {stats.expected}</span>
          </div>
        </div>
        <div className="kg-split">
          <div className="col" style={{ gap: '2px' }}>
            <span className="kpi-label">Ожидаемая выручка</span>
            <span className="kg-num">{stats.expected}</span>
            <span className="kpi-sub">предстоящие записи</span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="kpi-label">Средний чек</span>
            <span className="kg-num">{stats.avg}</span>
            <span className="kpi-sub">{stats.doneLabel}</span>
          </div>
        </div>
      </section>

      {/* Card 2: Записи */}
      <section className="island kg" aria-label="Записи">
        <div className="kg-head">
          <span className="kg-title">
            <Calendar className="ic w-4 h-4" />
            <span>Записи</span>
          </span>
        </div>
        <div className="row" style={{ gap: '10px', alignItems: 'baseline' }}>
          <span className="kpi-value" style={{ fontSize: '34px' }}>
            {stats.total}
          </span>
          <span className="muted">{stats.totalSub}</span>
        </div>
        <div className="col" style={{ gap: '12px' }}>
          {stats.rates.map((r) => (
            <div key={r.label} className="col" style={{ gap: '5px' }}>
              <div className="row between small">
                <span>{r.label}</span>
                <span className="tnum">
                  <b style={{ fontWeight: 600 }}>{r.value}</b> <span className="muted">· {r.count}</span>
                </span>
              </div>
              <div className="bar-track" style={{ height: '6px' }}>
                <span className="bar-fill" style={{ width: r.w, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Card 3: Рост базы */}
      <section className="island kg" aria-label="Рост базы">
        <div className="kg-head">
          <span className="kg-title">
            <UserPlus className="ic w-4 h-4" />
            <span>Рост базы</span>
          </span>
        </div>
        <div className="kg-split" style={{ borderTop: 0, paddingTop: 0 }}>
          <div className="col" style={{ gap: '2px' }}>
            <span className="kpi-label">Новых клиентов</span>
            <span className="kpi-value" style={{ fontSize: '34px' }}>
              {stats.newClients}
            </span>
            <span className="kpi-sub">зарегистрировались</span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="kpi-label">Новых питомцев</span>
            <span className="kpi-value" style={{ fontSize: '34px' }}>
              {stats.newPets}
            </span>
            <span className="kpi-sub">добавлены в базу</span>
          </div>
        </div>
        <span className="small muted" style={{ marginTop: 'auto' }}>
          Всего клиентов: {stats.clientsTotal} · питомцев: {stats.petsTotal}
        </span>
      </section>
    </div>
  );
}
