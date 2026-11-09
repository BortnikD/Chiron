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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Всего записей в реестре</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span className="title-md font-mono">{totalCount}</span>
          <Syringe className="ic muted" style={{ width: '20px', height: '20px' }} />
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Просрочено</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span
            className="title-md font-mono"
            style={{ color: overdueCount > 0 ? '#ef4444' : undefined }}
          >
            {overdueCount}
          </span>
          <AlertTriangle
            className="ic"
            style={{
              width: '20px',
              height: '20px',
              color: overdueCount > 0 ? '#ef4444' : 'var(--muted-foreground)',
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Срок в ближайшие 30 дней</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span
            className="title-md font-mono"
            style={{ color: soonCount > 0 ? '#f59e0b' : undefined }}
          >
            {soonCount}
          </span>
          <Clock
            className="ic"
            style={{
              width: '20px',
              height: '20px',
              color: soonCount > 0 ? '#f59e0b' : 'var(--muted-foreground)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
