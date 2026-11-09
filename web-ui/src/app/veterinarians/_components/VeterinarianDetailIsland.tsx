'use client';

import React from 'react';
import Link from 'next/link';
import { X, CalendarPlus } from 'lucide-react';
import { VeterinarianDetailIslandProps } from './types';
import { DAY_ORDER, DAY_SHORT } from './constants';
import { getDoctorDisplay } from '../../../utils/doctorHelpers';
import { getDoctorFullName, formatTime } from './utils';

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
  const { initials, specName } = getDoctorDisplay(vet, specsMap);
  const fullName = getDoctorFullName(vet, specsMap);

  return (
    <section
      className="island detail-island"
      style={{ flex: 'none' }}
      aria-label="Профиль врача"
    >
      <div className="island-head">
        <div className="row" style={{ gap: '12px', minWidth: 0 }}>
          <span className="avatar avatar-lg" style={{ flexShrink: 0 }}>{initials}</span>
          <div className="col" style={{ gap: '2px', minWidth: 0, overflow: 'hidden' }}>
            <span
              className="h2"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                display: 'block',
              }}
              title={fullName}
            >
              {fullName}
            </span>
            <span className="cell-sub">
              {specName} · стаж {vet.experienceYears} лет
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

          {/* Кого лечит врач */}
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
                <span className="small muted">Все виды животных</span>
              )}
            </div>
          </div>

          {/* Недельный график работы */}
          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Недельный график</span>
            <div className="dtable" style={{ '--cols': '44px 1fr 1.4fr' } as React.CSSProperties}>
              {DAY_ORDER.map((dow) => {
                const sched = schedules.find((s) => s.dayOfWeek === dow);
                const dayLabel = DAY_SHORT[dow] || dow;

                if (!sched) {
                  return (
                    <div key={dow} className="trow static compact">
                      <span className="cell-main">{dayLabel}</span>
                      <span className="small muted">Выходной</span>
                      <span />
                    </div>
                  );
                }

                const workRange = `${formatTime(sched.startTime)}–${formatTime(sched.endTime)}`;
                const breakText =
                  sched.breakStart && sched.breakEnd
                    ? `перерыв ${formatTime(sched.breakStart)}–${formatTime(sched.breakEnd)}`
                    : 'без перерыва';

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

          {/* Отсутствия и особые часы */}
          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Отсутствия и особые часы</span>
            {exceptions.length > 0 ? (
              exceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="row between"
                  style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <div className="col" style={{ gap: 0 }}>
                    <span className="cell-main tnum">
                      {exc.startDate} {exc.endDate && exc.endDate !== exc.startDate ? `— ${exc.endDate}` : ''}
                    </span>
                    <span className="cell-sub">
                      {exc.reason || (exc.type === 'ABSENCE' ? 'Отпуск / больничный' : 'Особый график')}
                    </span>
                  </div>
                  <span className={`badge ${exc.type === 'ABSENCE' ? 'badge-destructive' : 'badge-accent'}`}>
                    {exc.type === 'ABSENCE' ? 'Отпуск / больничный' : 'Особые часы'}
                  </span>
                </div>
              ))
            ) : (
              <span className="small muted">В ближайшие 60 дней график без изменений</span>
            )}
          </div>
        </div>
      </div>

      <div className="island-foot">
        <span className="small muted">
          {!isAuthenticated
            ? 'Для записи нужен вход'
            : role === 'CLIENT'
            ? 'Выберите удобное время'
            : role === 'VETERINARIAN'
            ? 'График работы коллеги'
            : 'Справочник врачей клиники'}
        </span>
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'CLIENT' ? (
          <Link
            href={`/client/book?vetId=${vet.id}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'ADMIN' ? (
          <Link
            href="/admin/veterinarians"
            className="btn btn-outline btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span>Управление в админке</span>
          </Link>
        ) : (
          <span className="badge badge-accent">Врач клиники</span>
        )}
      </div>
    </section>
  );
};
