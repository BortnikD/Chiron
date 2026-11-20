'use client';

import React from 'react';
import Link from 'next/link';
import { X, CalendarPlus } from 'lucide-react';
import { getDoctorDisplay } from '@/shared/lib';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  DOW_ORDER,
  DOW_LABELS,
  formatIsoDateDisplay,
  formatTime,
  getSpecTone,
  getSpeciesTone,
  getSpeciesStyle,
  pluralRu,
} from '@/shared/lib';
import type { VeterinarianDetailIslandProps } from './types';

export const VeterinarianDetailIsland: React.FC<VeterinarianDetailIslandProps> = ({
  vet,
  specsMap,
  speciesMap,
  speciesList,
  specializations,
  services = [],
  permissions,
  schedules,
  exceptions,
  onClose,
  isAuthenticated,
  role,
}) => {
  const { fullName, initials, specName } = getDoctorDisplay(vet, specsMap);
  const specTone = getSpecTone(vet.specializationId);
  const vetSpecIds =
    vet.specializationIds && vet.specializationIds.length > 0
      ? vet.specializationIds
      : vet.specializationId
      ? [vet.specializationId]
      : [];
  const allSpecNames =
    vetSpecIds
      .map((id) => specsMap[id])
      .filter(Boolean)
      .join(', ') || specName;
  const vetServices = services.filter(
    (s) => s.isActive !== false && vetSpecIds.includes(s.specializationId)
  );

  return (
    <section
      className="island detail-island"
      aria-label="Профиль врача"
    >
      <button
        type="button"
        className="detail-pinned-close"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X className="ic" />
      </button>

      <div className="island-head">
        <div className="row min-w-0">
          <VetAvatar
            vet={vet}
            initials={initials}
            className="avatar avatar-lg detail-head-ava"
            alt={fullName}
          />
          <div className="col gap-xs min-w-0">
            <span className="h2" title={fullName}>
              {fullName}
            </span>
            <span className="cell-sub">
              {allSpecNames} · стаж {vet.experienceYears}{' '}
              {pluralRu(vet.experienceYears, 'год', 'года', 'лет')}
            </span>
          </div>
        </div>
      </div>

      <div className="island-body">
        <div className="col gap-2xl">
          {vet.bio && <p>{vet.bio}</p>}

          {/* Специализации врача */}
          <div className="col gap-md">
            <span className="section-title">
              {vetSpecIds.length > 1 ? 'Специализации' : 'Специализация'}
            </span>
            <div className="chips">
              {vetSpecIds.map((sId) => {
                const spec = specializations?.find((s) => s.id === sId);
                const label = spec?.name || specsMap[sId] || specName;
                const specColor = spec?.color;
                const tone = getSpecTone(sId);
                return (
                  <span
                    key={sId}
                    className={`t-badge tone-${tone}`}
                    style={
                      specColor
                        ? {
                            color: specColor,
                            borderColor: `${specColor}40`,
                            backgroundColor: `${specColor}15`,
                          }
                        : undefined
                    }
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Оказываемые услуги */}
          {vetServices.length > 0 && (
            <div className="col gap-md">
              <span className="section-title">
                Оказываемые услуги ({vetServices.length})
              </span>
              <div className="chips">
                {vetServices.map((svc) => (
                  <span key={svc.id} className="badge badge-outline" title={svc.name}>
                    {svc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="col gap-md">
            <span className="section-title">Лечит</span>
            <div className="chips">
              {permissions.length > 0 ? (
                permissions.map((spId) => {
                  const spName = speciesMap[spId] || 'Животное';
                  const sp = speciesList?.find((s) => s.id === spId);
                  const spTone = getSpeciesTone(sp?.name || sp?.iconKey || spName, speciesList);
                  const style = getSpeciesStyle(spId, speciesList);
                  return (
                    <span
                      key={spId}
                      className={`sp-chip tone-${spTone}`}
                      style={style}
                    >
                      <SpeciesIcon species={sp?.iconKey || spTone} size={14} className="ic" />
                      {spName}
                    </span>
                  );
                })
              ) : (
                <span className="small muted">Виды не указаны</span>
              )}
            </div>
          </div>

          <div className="col gap-md">
            <span className="section-title">Недельный график</span>
            <div className="dtable keep-table" style={{ '--cols': '44px 1fr 1.4fr' } as React.CSSProperties}>
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

          <div className="col gap-md">
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
                    className="row between py-xs border-b"
                  >
                    <div className="col gap-0">
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
