'use client';

import React from 'react';

/**
 * Скелетон-заглушка для первоначальной загрузки дашборда администратора.
 * Использует дизайн-токены Chiron и пульсирующую анимацию .skeleton.
 */
export function DashboardSkeleton() {
  return (
    <div className="col" style={{ gap: 'var(--gap)', width: '100%' }}>
      {/* KPI Cards skeleton */}
      <div className="kpi-grid">
        <div className="island kg skeleton" style={{ minHeight: '170px' }} />
        <div className="island kg skeleton" style={{ minHeight: '170px' }} />
        <div className="island kg skeleton" style={{ minHeight: '170px' }} />
      </div>

      {/* Row 1: Dynamics + Statuses */}
      <div className="dash-2col">
        <div className="island skeleton" style={{ minHeight: '340px' }} />
        <div className="island skeleton" style={{ minHeight: '340px' }} />
      </div>

      {/* Row 2: Vets */}
      <div className="island skeleton" style={{ minHeight: '320px' }} />

      {/* Row 3: Services + Species */}
      <div className="dash-2col">
        <div className="island skeleton" style={{ minHeight: '340px' }} />
        <div className="island skeleton" style={{ minHeight: '340px' }} />
      </div>
    </div>
  );
}
