'use client';

import React from 'react';
import { Syringe, AlertTriangle, PawPrint } from 'lucide-react';

export interface VaccinationsSummaryCardsProps {
  totalCount: number;
  overdueCount: number;
  soonCount: number;
  petsCount: number;
}

/**
 * Сводные KPI-карточки по прививкам питомцев.
 */
export function VaccinationsSummaryCards({
  totalCount,
  overdueCount,
  soonCount,
  petsCount,
}: VaccinationsSummaryCardsProps) {
  const attentionCount = overdueCount + soonCount;

  return (
    <div className="kpi-grid">
      <div className="island kpi">
        <span className="kpi-label">
          <Syringe className="ic" />
          Всего прививок
        </span>
        <span className="kpi-value">{totalCount}</span>
        <span className="kpi-sub">в электронном паспорте</span>
      </div>

      <div className="island kpi">
        <span className="kpi-label">
          <AlertTriangle
            className="ic"
            style={{
              color:
                overdueCount > 0
                  ? 'var(--st-noshow-fg)'
                  : soonCount > 0
                  ? 'var(--st-pending-fg)'
                  : undefined,
            }}
          />
          Требуют внимания
        </span>
        <span
          className="kpi-value"
          style={{
            color:
              overdueCount > 0
                ? 'var(--st-noshow-fg)'
                : soonCount > 0
                ? 'var(--st-pending-fg)'
                : undefined,
          }}
        >
          {attentionCount}
        </span>
        <span className="kpi-sub">
          {overdueCount} просрочено · {soonCount} в ближайшие 7 дн.
        </span>
      </div>

      <div className="island kpi">
        <span className="kpi-label">
          <PawPrint className="ic" />
          Питомцев
        </span>
        <span className="kpi-value">{petsCount}</span>
        <span className="kpi-sub">в картотеке</span>
      </div>
    </div>
  );
}
