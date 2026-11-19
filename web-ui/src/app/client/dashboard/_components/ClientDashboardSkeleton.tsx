'use client';

import React from 'react';
import { Skeleton } from '@/shared/components';

/**
 * Скелетон-заглушка для первоначальной загрузки личного кабинета клиента.
 * Полностью повторяет реальные CSS-классы страницы (.hm-hero, .hm-next, .hm-pets, .hm-grid, .hm-side),
 * гарантируя 100% отсутствие сдвигов верстки (CLS).
 */
export function ClientDashboardSkeleton() {
  return (
    <div className="content-row" aria-busy="true" aria-label="Загрузка кабинета">
      <div className="scroll-col grow">
        {/* Hero Section Skeleton */}
        <section className="island hm-hero" style={{ flex: 'none' }}>
          <div className="hm-hero-main">
            <div className="col" style={{ gap: '6px' }}>
              <Skeleton width="110px" height="13px" borderRadius="4px" />
              <Skeleton width="260px" height="28px" borderRadius="6px" />
              <Skeleton width="320px" height="15px" borderRadius="4px" />
            </div>

            {/* Quick action badges */}
            <div className="hm-badges" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Skeleton width="140px" height="34px" borderRadius="999px" />
              <Skeleton width="110px" height="34px" borderRadius="999px" />
              <Skeleton width="150px" height="34px" borderRadius="999px" />
              <Skeleton width="130px" height="34px" borderRadius="999px" />
            </div>
          </div>

          {/* Next appointment skeleton */}
          <div className="hm-next skeleton" style={{ minHeight: '130px', '--st': 'var(--border)' } as React.CSSProperties} />
        </section>

        {/* Pets Carousel Skeleton */}
        <section className="island" style={{ flex: 'none' }}>
          <div className="island-head">
            <span className="island-title">
              <Skeleton width="140px" height="18px" borderRadius="4px" />
            </span>
          </div>
          <div className="island-body" style={{ paddingTop: 0 }}>
            <div className="hm-pets">
              {[1, 2, 3].map((i) => (
                <div key={i} className="hm-pet skeleton" style={{ minHeight: '110px' }} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Grid: Appointments (left) + Side Column (right) */}
        <div className="hm-grid">
          <section className="island skeleton" style={{ minHeight: '320px' }} />
          <div className="col hm-side" style={{ gap: '8px', minWidth: 0 }}>
            <section className="island skeleton" style={{ minHeight: '155px' }} />
            <section className="island skeleton" style={{ minHeight: '155px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
