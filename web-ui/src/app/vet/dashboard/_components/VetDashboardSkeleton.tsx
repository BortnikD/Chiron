'use client';

import React from 'react';
import { Skeleton, SkeletonCircle } from '@/shared/components';

/**
 * Скелетон-заглушка для кабинета врача (VetDashboardPage).
 * Воспроизводит таймлайн текущей смены (слева) и колонку ближайшего приёма/ожидания (справа).
 */
export function VetDashboardSkeleton() {
  return (
    <div className="content-col grow" aria-busy="true" aria-label="Загрузка смены">
      <div className="content-row" style={{ gap: 'var(--gap)' }}>
        {/* Left: Timeline Island Skeleton */}
        <section className="island grow" style={{ minWidth: '400px', padding: '18px' }}>
          <div className="row items-center between" style={{ marginBottom: '16px' }}>
            <div className="col" style={{ gap: '6px' }}>
              <Skeleton width="180px" height="20px" borderRadius="4px" />
              <Skeleton width="220px" height="13px" borderRadius="4px" />
            </div>
            <Skeleton width="90px" height="28px" borderRadius="8px" />
          </div>

          {/* Timeline rows */}
          <div className="col" style={{ gap: '12px', marginTop: '20px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                }}
              >
                <Skeleton width="48px" height="18px" borderRadius="4px" />
                <SkeletonCircle size={40} />
                <div className="col grow" style={{ gap: '6px' }}>
                  <Skeleton width="150px" height="16px" borderRadius="4px" />
                  <Skeleton width="200px" height="13px" borderRadius="4px" />
                </div>
                <Skeleton width="85px" height="24px" borderRadius="12px" />
              </div>
            ))}
          </div>
        </section>

        {/* Right: Next Appointment & Pending Column Skeleton */}
        <div className="col" style={{ width: '380px', gap: 'var(--gap)', flexShrink: 0 }}>
          {/* Next appointment skeleton */}
          <section className="island" style={{ padding: '18px' }}>
            <div className="row items-center between" style={{ marginBottom: '14px' }}>
              <Skeleton width="140px" height="16px" borderRadius="4px" />
              <Skeleton width="70px" height="20px" borderRadius="10px" />
            </div>
            <div className="col" style={{ gap: '10px' }}>
              <div className="row items-center" style={{ gap: '12px' }}>
                <SkeletonCircle size={46} />
                <div className="col grow" style={{ gap: '6px' }}>
                  <Skeleton width="120px" height="18px" borderRadius="4px" />
                  <Skeleton width="160px" height="13px" borderRadius="4px" />
                </div>
              </div>
              <Skeleton width="100%" height="32px" borderRadius="8px" />
            </div>
          </section>

          {/* Pending appointments skeleton */}
          <section className="island grow" style={{ padding: '18px' }}>
            <div className="row items-center between" style={{ marginBottom: '14px' }}>
              <Skeleton width="150px" height="16px" borderRadius="4px" />
              <Skeleton width="40px" height="18px" borderRadius="10px" />
            </div>
            <div className="col" style={{ gap: '8px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div className="row items-center between">
                    <Skeleton width="90px" height="14px" borderRadius="4px" />
                    <Skeleton width="60px" height="16px" borderRadius="8px" />
                  </div>
                  <Skeleton width="140px" height="12px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
