'use client';

import React, { useState, useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { ST_COLORS } from './constants';
import { pct } from './utils';
import type { TopVeterinariansIslandProps } from './types';

interface HoveredDoctorState {
  docId: string;
  type: 'seg' | 'rev';
  label: string;
  color: string;
  text: string;
  centerPct?: number;
}

export const TopVeterinariansIsland = React.memo(function TopVeterinariansIsland({ vetsStats }: TopVeterinariansIslandProps) {
  const [hovered, setHovered] = useState<HoveredDoctorState | null>(null);

  const totalClinicRevenue = useMemo(() => {
    return vetsStats.reduce((sum, v) => sum + (v.revenue || 0), 0);
  }, [vetsStats]);

  const doctorRows = useMemo(() => {
    if (vetsStats.length === 0) return [];

    const maxRev = Math.max(1, ...vetsStats.map((v) => v.revenue));
    const maxAppts = Math.max(1, ...vetsStats.map((v) => v.appointments));

    return vetsStats.map((v) => {
      const total = v.appointments;
      const completed = v.completed;
      const cancelled = v.cancelled;
      const noshow = v.noShows;
      const active = Math.max(0, total - completed - cancelled - noshow);

      const trackW = total > 0 ? `${Math.max(10, (total / maxAppts) * 100).toFixed(1)}%` : '0%';
      const revW = v.revenue > 0 ? `${((v.revenue / maxRev) * 100).toFixed(1)}%` : '0%';

      let accPct = 0;
      const rawSegs = [
        { key: 'comp', count: completed, color: ST_COLORS.COMPLETED, label: 'Завершено' },
        { key: 'act', count: active, color: ST_COLORS.CONFIRMED, label: 'Предстоящие' },
        { key: 'canc', count: cancelled, color: ST_COLORS.CANCELLED, label: 'Отменено' },
        { key: 'ns', count: noshow, color: ST_COLORS.NO_SHOW, label: 'Неявка' },
      ].filter((s) => s.count > 0);

      const segs =
        total > 0
          ? rawSegs.map((s) => {
              const shareNum = (s.count / total) * 100;
              const centerPct = accPct + shareNum / 2;
              accPct += shareNum;
              return {
                key: s.key,
                w: `${shareNum.toFixed(1)}%`,
                color: s.color,
                label: s.label,
                count: s.count,
                share: `${shareNum.toFixed(1)}%`,
                num: String(s.count),
                centerPct,
                tip: `${s.label}: ${s.count} ${pluralRu(s.count, 'запись', 'записи', 'записей')} (${shareNum.toFixed(1)}%)`,
              };
            })
          : [];

      const avgCheck = completed > 0 ? Math.round(v.revenue / completed) : 0;
      const shareOfClinic = totalClinicRevenue > 0 ? pct(v.revenue, totalClinicRevenue) : '0%';

      return {
        id: v.veterinarianId,
        name: v.fullName,
        sub: `${total} ${pluralRu(total, 'запись', 'записи', 'записей')} · ${pct(completed, total)} завершено`,
        total,
        completed,
        trackW,
        revenueNum: v.revenue,
        revenue: formatCurrency(v.revenue),
        revW,
        avgCheck: avgCheck > 0 ? formatCurrency(avgCheck) : '—',
        shareOfClinic,
        segs,
      };
    });
  }, [vetsStats, totalClinicRevenue]);

  return (
    <section className="island" style={{ flex: 'none' }} aria-label="Статистика по врачам">
      <div className="island-head">
        <span className="island-title">
          <Stethoscope className="ic w-4 h-4 text-primary" />
          <span>По врачам</span>
        </span>
        <div className="legend">
          <span>
            <i style={{ background: ST_COLORS.COMPLETED }} />
            Завершено
          </span>
          <span>
            <i style={{ background: ST_COLORS.CONFIRMED }} />
            Предстоящие
          </span>
          <span>
            <i style={{ background: ST_COLORS.CANCELLED }} />
            Отменено
          </span>
          <span>
            <i style={{ background: ST_COLORS.NO_SHOW }} />
            Неявка
          </span>
          <span
            style={{
              height: '14px',
              width: '1px',
              background: 'var(--border)',
              margin: '0 4px',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          <span>
            <i style={{ background: 'var(--primary)' }} />
            Выручка
          </span>
        </div>
      </div>

      <div className="island-body">
        {doctorRows.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <Stethoscope className="ic ic-40" />
            <span className="empty-title">Нет приёмов по врачам за выбранный период</span>
          </div>
        ) : (
          <>
            <div className="vrow vrow-head small muted">
              <span>Врач</span>
              <span>Записи по статусам</span>
              <span style={{ paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
                Выручка по завершённым
              </span>
            </div>

            {doctorRows.map((r) => {
              const isDoctorHovered = hovered?.docId === r.id;

              return (
                <div key={r.id} className="vrow" style={{ alignItems: 'center' }}>
                  {/* Колонка 1: имя и стабильный статический подзаголовок (строка никогда не меняет высоту!) */}
                  <div className="col" style={{ gap: '1px', minWidth: 0 }}>
                    <span className="cell-main" style={{ fontWeight: 500 }}>
                      {r.name}
                    </span>
                    <span className="cell-sub">{r.sub}</span>
                  </div>

                  {/* Колонка 2: сегментированная полоса статусов */}
                  <div
                    className="row"
                    style={{
                      gap: '10px',
                      minWidth: 0,
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div className="stack-track" style={{ flex: 1, minWidth: '110px' }}>
                      {r.segs.map((g) => (
                        <span
                          key={g.key}
                          className="stack-seg"
                          style={{
                            width: g.w,
                            minWidth: '22px',
                            padding: '0 2px',
                            background: g.color,
                            cursor: 'pointer',
                            opacity: isDoctorHovered && hovered?.label !== g.label ? 0.35 : 1,
                            filter: isDoctorHovered && hovered?.label === g.label ? 'brightness(1.15)' : 'none',
                            transition: 'opacity 0.12s ease, filter 0.12s ease',
                          }}
                          title={g.tip}
                          onMouseEnter={() =>
                            setHovered({
                              docId: r.id,
                              type: 'seg',
                              label: g.label,
                              color: g.color,
                              centerPct: g.centerPct,
                              text: `${g.label}: ${g.count} ${pluralRu(g.count, 'запись', 'записи', 'записей')} (${g.share})`,
                            })
                          }
                          onMouseLeave={() => setHovered(null)}
                        >
                          <span className="stack-num">{g.num}</span>
                        </span>
                      ))}
                    </div>

                    <span
                      className="tnum"
                      style={{
                        width: '36px',
                        minWidth: '36px',
                        textAlign: 'center',
                        flex: 'none',
                        background: 'color-mix(in srgb, var(--muted) 80%, transparent)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '1px 4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                      }}
                      title={`Всего записей: ${r.total}`}
                    >
                      {r.total}
                    </span>

                    {/* Аккуратный парящий бейдж НАД полосой — позиционируется над активным сегментом */}
                    {isDoctorHovered && hovered?.type === 'seg' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 4px)',
                          left: `${Math.min(85, Math.max(12, hovered.centerPct ?? 50))}%`,
                          transform: 'translateX(-50%)',
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          boxShadow: 'var(--shadow-md)',
                          pointerEvents: 'none',
                          zIndex: 50,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          animation: 'fadeIn 0.12s ease',
                        }}
                      >
                        <i
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '2px',
                            background: hovered.color,
                            display: 'inline-block',
                          }}
                        />
                        <span>{hovered.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Колонка 3: полоса выручки с четким вертикальным разделителем колонок */}
                  <div
                    className="row"
                    style={{
                      gap: '10px',
                      minWidth: 0,
                      alignItems: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      paddingLeft: '16px',
                      borderLeft: '1px solid var(--border)',
                    }}
                    title={`Выручка: ${r.revenue} · Ср. чек: ${r.avgCheck}`}
                    onMouseEnter={() =>
                      setHovered({
                        docId: r.id,
                        type: 'rev',
                        label: 'Выручка',
                        color: 'var(--primary)',
                        text: `Выручка: ${r.revenue} · Ср. чек: ${r.avgCheck} (доля ${r.shareOfClinic})`,
                      })
                    }
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="bar-track" style={{ flex: 1, height: '10px', minWidth: '40px' }}>
                      <span
                        className="bar-fill"
                        style={{
                          width: r.revW,
                          minWidth: r.revenueNum > 0 ? '6px' : '0px',
                          background: 'var(--primary)',
                          opacity: isDoctorHovered && hovered?.type === 'rev' ? 1 : 0.85,
                        }}
                      />
                    </div>

                    <span
                      className="tnum cell-main"
                      style={{
                        width: '84px',
                        minWidth: '84px',
                        textAlign: 'right',
                        flex: 'none',
                        fontWeight: isDoctorHovered && hovered?.type === 'rev' ? 700 : 500,
                      }}
                    >
                      {r.revenue}
                    </span>

                    {/* Аккуратный парящий бейдж НАД полосой выручки */}
                    {isDoctorHovered && hovered?.type === 'rev' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 4px)',
                          right: '94px',
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          boxShadow: 'var(--shadow-md)',
                          pointerEvents: 'none',
                          zIndex: 50,
                          animation: 'fadeIn 0.12s ease',
                        }}
                      >
                        {hovered.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
});
