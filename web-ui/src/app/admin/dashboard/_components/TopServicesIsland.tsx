'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { pct } from './utils';
import type { TopServicesIslandProps } from './types';

export const TopServicesIsland = React.memo(function TopServicesIsland({ servicesStats }: TopServicesIslandProps) {
  const [svcMetric, setSvcMetric] = useState<'rev' | 'count'>('rev');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalClinicRevenue = useMemo(() => {
    return servicesStats.reduce((sum, s) => sum + (s.revenue || 0), 0);
  }, [servicesStats]);

  const totalAppointments = useMemo(() => {
    return servicesStats.reduce((sum, s) => sum + (s.appointments || 0), 0);
  }, [servicesStats]);

  const servicesList = useMemo(() => {
    if (servicesStats.length === 0) return [];

    const sorted = [...servicesStats].sort((a, b) =>
      svcMetric === 'rev' ? b.revenue - a.revenue : b.appointments - a.appointments
    );
    const maxVal = Math.max(
      1,
      ...sorted.map((s) => (svcMetric === 'rev' ? s.revenue : s.appointments))
    );

    return sorted.map((s, idx) => {
      const shareOfClinic = totalClinicRevenue > 0 ? pct(s.revenue, totalClinicRevenue) : '0%';
      const shareOfAppts = totalAppointments > 0 ? pct(s.appointments, totalAppointments) : '0%';

      const spec = s.specializationName || 'Услуга клиники';
      const subInfo =
        svcMetric === 'rev'
          ? `${spec} · ${s.completed} ${pluralRu(s.completed, 'приём', 'приёма', 'приёмов')}`
          : `${spec} · ${formatCurrency(s.revenue)}`;

      const shareLabel = svcMetric === 'rev' ? `${shareOfClinic}` : `${shareOfAppts}`;

      return {
        id: s.serviceId,
        rank: idx + 1,
        name: s.name,
        subInfo,
        shareLabel,
        appointments: s.appointments,
        completed: s.completed,
        revenue: formatCurrency(s.revenue),
        value: svcMetric === 'rev' ? formatCurrency(s.revenue) : String(s.appointments),
        w: `${Math.max(4, (((svcMetric === 'rev' ? s.revenue : s.appointments) / maxVal) * 100)).toFixed(1)}%`,
        tip: `${s.name}: записей ${s.appointments}, завершено ${s.completed}, выручка ${formatCurrency(s.revenue)} (доля ${shareOfClinic})`,
      };
    });
  }, [servicesStats, svcMetric, totalClinicRevenue, totalAppointments]);

  return (
    <section className="island" aria-label="Статистика по услугам">
      <div className="island-head">
        <span className="island-title">
          <ClipboardList className="ic w-4 h-4 text-primary" />
          <span>По услугам</span>
        </span>
        <div className="seg">
          <button
            type="button"
            className={`seg-item ${svcMetric === 'rev' ? 'on' : ''}`}
            onClick={() => setSvcMetric('rev')}
          >
            Выручка
          </button>
          <button
            type="button"
            className={`seg-item ${svcMetric === 'count' ? 'on' : ''}`}
            onClick={() => setSvcMetric('count')}
          >
            Записи
          </button>
        </div>
      </div>

      <div className="island-body">
        {servicesList.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <ClipboardList className="ic ic-40" />
            <span className="empty-title">Нет статистики по услугам за период</span>
          </div>
        ) : (
          <div className="col" style={{ gap: '4px' }}>
            {servicesList.map((r, idx) => {
              const isHovered = hoveredId === r.id;

              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    background: isHovered
                      ? 'color-mix(in srgb, var(--primary) 9%, var(--muted))'
                      : 'transparent',
                  }}
                  title={r.tip}
                  onMouseEnter={() => setHoveredId(r.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Номер в рейтинге */}
                  <span
                    style={{
                      width: '18px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: idx < 3 ? 'var(--primary)' : 'var(--muted-foreground)',
                      textAlign: 'center',
                      flex: 'none',
                    }}
                  >
                    {r.rank}
                  </span>

                  {/* Название и специализация */}
                  <div className="col" style={{ gap: 0, minWidth: '140px', flex: '1 1 180px' }}>
                    <span
                      className="cell-main"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      className="cell-sub"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '11.5px',
                      }}
                    >
                      {r.subInfo}
                    </span>
                  </div>

                  {/* Аккуратная 6px полоса прогресса */}
                  <div
                    className="bar-track"
                    style={{
                      height: '6px',
                      borderRadius: '999px',
                      flex: '1.2 1 100px',
                      minWidth: '40px',
                      background: 'var(--muted)',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      className="bar-fill"
                      style={{
                        width: r.w,
                        minWidth: '6px',
                        background: 'var(--primary)',
                        borderRadius: '999px',
                        opacity: isHovered ? 1 : 0.85,
                        boxShadow: isHovered
                          ? '0 0 6px color-mix(in srgb, var(--primary) 50%, transparent)'
                          : 'none',
                        transition: 'opacity 0.15s ease',
                      }}
                    />
                  </div>

                  {/* Значение и процентная доля */}
                  <div
                    className="col"
                    style={{ gap: 0, minWidth: '78px', alignItems: 'flex-end', flex: 'none' }}
                  >
                    <span
                      className="tnum cell-main"
                      style={{
                        fontWeight: isHovered ? 700 : 600,
                        fontSize: '13px',
                      }}
                    >
                      {r.value}
                    </span>
                    <span
                      className="cell-sub"
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {r.shareLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
