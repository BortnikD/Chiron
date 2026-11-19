'use client';

import React from 'react';
import { Syringe, AlertTriangle, Clock } from 'lucide-react';

export interface VaccinationsStatsProps {
  totalCount: number;
  overdueCount: number;
  soonCount: number;
}

/**
 * Верхняя аналитическая панель ключевых показателей реестра вакцинаций.
 */
export const VaccinationsStats: React.FC<VaccinationsStatsProps> = ({
  totalCount,
  overdueCount,
  soonCount,
}) => {
  return (
    <div className="kpi-grid">
      <div className="island kpi">
        <span className="kpi-label">
          <Syringe className="ic" />
          Всего записей в реестре
        </span>
        <span className="kpi-value">{totalCount}</span>
        <span className="kpi-sub">в журнале клиники</span>
      </div>

      <div className="island kpi">
        <span className="kpi-label">
          <AlertTriangle
            className="ic"
            style={{ color: overdueCount > 0 ? 'var(--st-noshow-fg)' : undefined }}
          />
          Просрочено
        </span>
        <span
          className="kpi-value"
          style={{ color: overdueCount > 0 ? 'var(--st-noshow-fg)' : undefined }}
        >
          {overdueCount}
        </span>
        <span className="kpi-sub">требуется ревакцинация</span>
      </div>

      <div className="island kpi">
        <span className="kpi-label">
          <Clock
            className="ic"
            style={{ color: soonCount > 0 ? 'var(--st-pending-fg)' : undefined }}
          />
          Срок в ближайшие 30 дней
        </span>
        <span
          className="kpi-value"
          style={{ color: soonCount > 0 ? 'var(--st-pending-fg)' : undefined }}
        >
          {soonCount}
        </span>
        <span className="kpi-sub">плановый период</span>
      </div>
    </div>
  );
};
