'use client';

import React from 'react';
import Link from 'next/link';
import { X, CalendarPlus } from 'lucide-react';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { DOW_ORDER, DOW_LABELS, formatIsoDateDisplay, formatTime, pluralRu } from '@/shared/lib';
import type { VeterinarianDetailIslandProps } from './types';

export const VeterinarianDetailIsland: React.FC<VeterinarianDetailIslandProps> = ({
  vet,
  specsMap,
  speciesMap,
  permissions,
  schedules,
  exceptions,
  onClose,
  isAuthenticated,
  role,
}) => {
  const { fullName, initials, specName } = getDoctorDisplay(vet, specsMap);

  return (
    <section
      className="island detail-island"
      style={{ width: '460px' }}
      aria-label="Профиль врача"
    >
      <div className="island-head">
        <div className="row" style={{ minWidth: 0 }}>
          <span className="avatar avatar-lg">{initials}</span>
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span className="h2" title={fullName}>
              {fullName}
            </span>
            <span className="cell-sub">
              {specName} · стаж {vet.experienceYears}{' '}
              {pluralRu(vet.experienceYears, 'год', 'года', 'лет')}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X className="ic" />
        </button>
      </div>

      <div className="island-body">
        <div className="col" style={{ gap: '18px' }}>
          {vet.bio && <p>{vet.bio}</p>}

          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Лечит</span>
            <div className="chips">
              {permissions.length > 0 ? (
                permissions.map((spId) => (
                  <span key={spId} className="badge badge-outline">
                    {speciesMap[spId] || 'Животное'}
                  </span>
                ))
              ) : (
                <span className="small muted">Виды не указаны</span>
              )}
            </div>
          </div>

          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Недельный график</span>
            <div className="dtable" style={{ '--cols': '44px 1fr 1.4fr' } as React.CSSProperties}>
              {DOW_ORDER.map((dow) => {
                const sched = schedules.find((s) => s.dayOfWeek === dow);
                const dayLabel = DOW_LABELS[dow] || dow;

                if (!sched) {
                  return (
                    <div key={dow} className="trow static compact">
                      <span className="cell-main">{dayLabel}</span>
                      <span className="tnum muted">Выходной</span>
                      <span className="small muted" />
                    </div>
                  );
                }

                const workRange = `${formatTime(sched.startTime)}–${formatTime(sched.endTime)}`;
                const breakText =
                  sched.breakStart && sched.breakEnd
                    ? `перерыв ${formatTime(sched.breakStart)}–${formatTime(sched.breakEnd)}`
                    : '';

                return (
                  <div key={dow} className="trow static compact">
                    <span className="cell-main">{dayLabel}</span>
                    <span className="tnum">{workRange}</span>
                    <span className="small muted">{breakText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Отсутствия и особые часы</span>
            {exceptions.length > 0 ? (
              exceptions.map((exc) => {
                const isAbsence = exc.type === 'ABSENCE';
                const range =
                  exc.endDate && exc.endDate !== exc.startDate
                    ? `${formatIsoDateDisplay(exc.startDate)} – ${formatIsoDateDisplay(exc.endDate)}`
                    : formatIsoDateDisplay(exc.startDate);
                const hoursPrefix =
                  !isAbsence && exc.startTime && exc.endTime
                    ? `${formatTime(exc.startTime)}–${formatTime(exc.endTime)}`
                    : '';
                const subtitle = hoursPrefix
                  ? exc.reason
                    ? `${hoursPrefix} · ${exc.reason}`
                    : hoursPrefix
                  : exc.reason || (isAbsence ? 'Отсутствие' : 'Особый график');

                return (
                  <div
                    key={exc.id}
                    className="row between"
                    style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="col" style={{ gap: 0 }}>
                      <span className="cell-main tnum">{range}</span>
                      <span className="cell-sub">{subtitle}</span>
                    </div>
                    <span className={`badge ${isAbsence ? 'due-over' : 'badge-accent'}`}>
                      {isAbsence ? 'Не работает' : 'Особые часы'}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="small muted">В ближайшие 60 дней без изменений</span>
            )}
          </div>
        </div>
      </div>

      <div className="island-foot">
        <span className="small muted">
          {!isAuthenticated
            ? 'Для записи нужен вход'
            : role === 'CLIENT'
            ? 'Свободные окна — в мастере'
            : role === 'VETERINARIAN'
            ? 'График работы коллеги'
            : 'Справочник врачей клиники'}
        </span>
        {!isAuthenticated ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/client/book?vetId=${vet.id}`)}`}
            className="btn btn-primary"
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'CLIENT' ? (
          <Link href={`/client/book?vetId=${vet.id}`} className="btn btn-primary">
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'ADMIN' ? (
          <Link href="/admin/veterinarians" className="btn btn-outline btn-sm">
            <span>Управление в админке</span>
          </Link>
        ) : (
          <span className="badge badge-accent">Врач клиники</span>
        )}
      </div>
    </section>
  );
};
