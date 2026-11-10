'use client';

import React from 'react';
import { Syringe, AlertTriangle, PawPrint } from 'lucide-react';

export interface VaccinationsSummaryCardsProps {
  totalCount: number;
  overdueCount: number;
  soonCount: number;
  petsCount: number;
}

export function VaccinationsSummaryCards({
  totalCount,
  overdueCount,
  soonCount,
  petsCount,
}: VaccinationsSummaryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Всего прививок</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span className="title-md font-mono">{totalCount}</span>
          <Syringe className="ic muted" style={{ width: '20px', height: '20px' }} />
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Требуют внимания</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span className="title-md font-mono" style={{ color: overdueCount > 0 ? '#ef4444' : undefined }}>
            {overdueCount + soonCount}
          </span>
          <AlertTriangle
            className="ic"
            style={{ width: '20px', height: '20px', color: overdueCount > 0 ? '#ef4444' : '#f59e0b' }}
          />
        </div>
        <span className="small muted" style={{ fontSize: '11px' }}>
          {overdueCount} просрочено, {soonCount} скоро
        </span>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span className="small muted">Питомцев в картотеке</span>
        <div className="row between" style={{ alignItems: 'baseline', marginTop: '4px' }}>
          <span className="title-md font-mono">{petsCount}</span>
          <PawPrint className="ic muted" style={{ width: '20px', height: '20px' }} />
        </div>
      </div>
    </div>
  );
}
