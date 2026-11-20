'use client';

import React from 'react';
import { Banknote, Calendar, UserPlus } from 'lucide-react';
import type { KpiMetricsGridProps } from './types';

export const KpiMetricsGrid = React.memo(function KpiMetricsGrid({ stats }: KpiMetricsGridProps) {
  return (
    <div className="kgroups">
      {/* Card 1: Финансы */}
      <section className="island kg" aria-label="Финансы">
        <div className="kg-head">
          <span className="kg-title">
            <Banknote className="ic w-4 h-4 text-primary" />
            <span>Финансы</span>
          </span>
        </div>

        <div className="col gap-2xs">
          <span className="kpi-label">Выручка по завершённым приёмам</span>
          <span className="kpi-value accent kpi-value-lg">
            {stats.revenue}
          </span>
        </div>

        <div
          className="col gap-xs"
          title={`Фактическая выручка: ${stats.revenue} · Прогнозируемый итог с учётом предстоящих записей: ${stats.totalPossible} (получено ${stats.recvPct})`}
        >
          <div className="bar-track kpi-bar-track">
            <span
              className="bar-fill kpi-bar-fill"
              style={{
                width: stats.recvW,
                background: 'var(--primary)',
              }}
            />
          </div>
          <div className="row between small muted text-xs">
            <span>
              Получено <b className="text-fg font-semibold">{stats.recvPct}</b>
            </span>
            <span>
              Прогноз: <span className="text-fg font-medium">{stats.totalPossible}</span>
            </span>
          </div>
        </div>

        <div className="kg-split">
          <div
            className="col gap-2xs"
            title="Рассчитано по всем предстоящим записям пациентов"
          >
            <span className="kpi-label">Ожидаемая выручка</span>
            <span className="kg-num">{stats.expected}</span>
            <span className="kpi-sub">предстоящие записи</span>
          </div>

          <div
            className="col gap-2xs"
            title={`Средняя стоимость одного завершённого визита (${stats.doneLabel})`}
          >
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
            <Calendar className="ic w-4 h-4 text-primary" />
            <span>Записи</span>
          </span>
        </div>

        <div className="row gap-sm items-baseline">
          <span className="kpi-value kpi-value-lg">
            {stats.total}
          </span>
          <span className="muted">{stats.totalSub}</span>
        </div>

        <div className="col gap-md">
          {stats.rates.map((r) => (
            <div
              key={r.label}
              className="col gap-xs"
              title={`${r.label}: ${r.value} (${r.count})`}
            >
              <div className="row between small">
                <span>{r.label}</span>
                <span className="tnum">
                  <b className="font-semibold">{r.value}</b> <span className="muted">· {r.count}</span>
                </span>
              </div>
              <div className="bar-track kpi-bar-track-sm">
                <span
                  className="bar-fill kpi-bar-fill"
                  style={{
                    width: r.w,
                    minWidth: (r.countNum ?? 0) > 0 ? '6px' : '0px',
                    background: r.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Card 3: Рост базы */}
      <section className="island kg" aria-label="Рост базы">
        <div className="kg-head">
          <span className="kg-title">
            <UserPlus className="ic w-4 h-4 text-primary" />
            <span>Рост базы</span>
          </span>
        </div>

        <div className="kg-split border-t-0 pt-0">
          <div className="col gap-2xs">
            <span className="kpi-label">Новых клиентов</span>
            <span
              className={`kpi-value ${stats.newClients > 0 ? 'accent text-primary' : 'text-fg'} kpi-value-lg`}
            >
              {stats.newClients > 0 ? `+${stats.newClients}` : stats.newClients}
            </span>
            <span className="kpi-sub">зарегистрировались</span>
          </div>

          <div className="col gap-2xs">
            <span className="kpi-label">Новых питомцев</span>
            <span
              className={`kpi-value ${stats.newPets > 0 ? 'accent text-primary' : 'text-fg'} kpi-value-lg`}
            >
              {stats.newPets > 0 ? `+${stats.newPets}` : stats.newPets}
            </span>
            <span className="kpi-sub">добавлены в базу</span>
          </div>
        </div>

        <div className="kg-split">
          <div className="col gap-2xs">
            <span className="kpi-label">Всего клиентов</span>
            <span className="kg-num">{stats.clientsTotal}</span>
            <span className="kpi-sub">в базе клиники</span>
          </div>

          <div className="col gap-2xs">
            <span className="kpi-label">Всего питомцев</span>
            <span className="kg-num">{stats.petsTotal}</span>
            <span className="kpi-sub">на учёте</span>
          </div>
        </div>
      </section>
    </div>
  );
});
