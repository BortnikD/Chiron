'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { X, CalendarPlus, AlertCircle } from 'lucide-react';
import { formatCurrency, formatSlotTime, pluralRu } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type { ServiceDetailIslandProps } from './types';
import { SPECIALIZATION_CONTRAINDICATIONS, DEFAULT_CONTRAINDICATION } from './constants';

export function ServiceDetailIsland({
  service,
  onClose,
  specsMap,
  speciesMap,
  speciesList,
  serviceSpeciesList,
  activeSpeciesTab,
  onSpeciesTabChange,
  nearestSlots,
  veterinarians = [],
  isAuthenticated,
  role,
}: ServiceDetailIslandProps) {
  const assignedVets = useMemo(() => {
    if (!veterinarians || !service) return [];
    const specVets = veterinarians.filter(
      (v) => v.specializationId === service.specializationId && v.isActive
    );
    if (!activeSpeciesTab) return specVets;
    const hasSpeciesInfo = specVets.some((v) => Array.isArray(v.speciesIds));
    if (!hasSpeciesInfo) return specVets;
    return specVets.filter((v) =>
      Array.isArray(v.speciesIds) ? v.speciesIds.includes(activeSpeciesTab) : true
    );
  }, [veterinarians, service, activeSpeciesTab]);

  const detailSpeciesList = useMemo(
    () =>
      serviceSpeciesList.length > 0
        ? speciesList.filter((sp) => serviceSpeciesList.some((ss) => ss.speciesId === sp.id))
        : speciesList,
    [serviceSpeciesList, speciesList]
  );

  const hasSpeciesDiff =
    (service.effectivePrice != null && service.effectivePrice !== service.basePrice) ||
    (service.effectiveDurationMin != null &&
      service.effectiveDurationMin !== service.baseDurationMin);

  const contraindicationsText =
    SPECIALIZATION_CONTRAINDICATIONS[service.specializationId] || DEFAULT_CONTRAINDICATION;

  return (
    <section
      className="island detail-island"
      style={{ flex: 'none' }}
      aria-label="Карточка услуги"
    >
      <div className="island-head">
        <div className="col" style={{ gap: '2px', minWidth: 0 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {service.name}
          </span>
          <span className="cell-sub">
            {specsMap[service.specializationId] || 'Общий профиль'}
          </span>
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
          {service.description && <p>{service.description}</p>}

          {/* Характеристики услуги */}
          <dl className="kv" style={{ margin: 0 }}>
            <dt>Базовая цена</dt>
            <dd className="tnum">
              {formatCurrency(service.basePrice)}
            </dd>
            <dt>Длительность</dt>
            <dd className="tnum">
              {service.baseDurationMin ?? 30} мин
            </dd>
            {hasSpeciesDiff && (
              <>
                <dt>Для выбранного вида</dt>
                <dd className="tnum">
                  {formatCurrency(service.effectivePrice ?? service.basePrice)} ·{' '}
                  {service.effectiveDurationMin ?? service.baseDurationMin ?? 30} мин
                </dd>
              </>
            )}
            <dt>Буфер после</dt>
            <dd className="tnum">
              {service.bufferAfterMin ?? 10} мин
            </dd>
          </dl>

          {/* Противопоказания и подготовка */}
          <div className="note" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <AlertCircle className="ic" style={{ width: '15px', height: '15px', flex: 'none', color: 'var(--amber, #f59e0b)' }} />
              Противопоказания и подготовка
            </span>
            <span className="cell-sub" style={{ fontSize: '12.5px', lineHeight: '1.45', color: 'var(--foreground)' }}>
              {contraindicationsText}
            </span>
          </div>

          {/* Врачи, оказывающие данную услугу */}
          <div className="col" style={{ gap: '8px' }}>
            <div className="row between">
              <span className="section-title">Специалисты направления</span>
              <span className="small muted">
                {assignedVets.length > 0 ? `${assignedVets.length} врач.` : ''}
              </span>
            </div>
            {assignedVets.length > 0 ? (
              <div className="col" style={{ gap: '6px' }}>
                {assignedVets.map((v) => {
                  const { name, initials, title } = getDoctorDisplay(v, specsMap);
                  return (
                    <div
                      key={v.id}
                      className="row between"
                      style={{
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'var(--muted)',
                      }}
                    >
                      <div className="row" style={{ alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          className="t-ava sm round"
                          style={{ width: '28px', height: '28px', fontSize: '11px', flex: 'none' }}
                        >
                          {initials}
                        </span>
                        <div className="col" style={{ gap: '1px', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {name}
                          </span>
                          <span className="cell-sub" style={{ fontSize: '11px' }}>
                            {title ||
                              `Стаж ${v.experienceYears} ${pluralRu(v.experienceYears, 'год', 'года', 'лет')}`}
                          </span>
                        </div>
                      </div>
                      {isAuthenticated && role === 'CLIENT' && (
                        <Link
                          href={`/client/book?serviceId=${service.id}&vetId=${v.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ height: '26px', padding: '0 8px', fontSize: '12px', flex: 'none' }}
                          title="Записаться к врачу"
                        >
                          Выбрать
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="small muted">Прием ведут дежурные ветеринарные врачи</span>
            )}
          </div>

          {/* Таблица цен по видам животных */}
          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Цена и длительность по видам</span>
            <div className="dtable" style={{ '--cols': '1fr 1.2fr 1.2fr' } as React.CSSProperties}>
              <div className="thead" style={{ padding: 0 }}>
                <span>Вид</span>
                <span>Длительность</span>
                <span className="right">Цена</span>
              </div>
              {serviceSpeciesList.length > 0 ? (
                serviceSpeciesList.map((ss) => (
                  <div key={ss.speciesId} className="trow static compact">
                    <span>{speciesMap[ss.speciesId] || 'Животное'}</span>
                    <span className="tnum">
                      {ss.durationMin || service.baseDurationMin || 30} мин
                    </span>
                    <span className="right tnum">
                      {formatCurrency(ss.price ?? service.basePrice)}
                    </span>
                  </div>
                ))
              ) : (
                speciesList.map((sp) => (
                  <div key={sp.id} className="trow static compact">
                    <span>{sp.name}</span>
                    <span className="tnum">
                      {service.baseDurationMin || 30} мин
                    </span>
                    <span className="right tnum">
                      {formatCurrency(service.basePrice)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ближайшие свободные окна */}
          <div className="col" style={{ gap: '10px' }}>
            <div className="row between wrap">
              <span className="section-title">Ближайшие свободные окна</span>
              <div className="seg">
                {detailSpeciesList.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    className={`seg-item ${activeSpeciesTab === sp.id ? 'on' : ''}`}
                    onClick={() => onSpeciesTabChange(sp.id)}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="col" style={{ gap: '6px' }}>
              <span className="small">
                <b style={{ fontWeight: 600 }}>На ближайшие 3 дня</b>
              </span>
              {nearestSlots.length > 0 ? (
                <div className="chips">
                  {nearestSlots.map((slot) => {
                    const timeStr = formatSlotTime(slot.startAt);
                    if (!isAuthenticated) {
                      return (
                        <Link
                          key={slot.startAt}
                          href="/login"
                          className="slot"
                          title="Войдите для записи"
                        >
                          {timeStr}
                        </Link>
                      );
                    }
                    if (role === 'CLIENT') {
                      return (
                        <Link
                          key={slot.startAt}
                          href={`/client/book?serviceId=${service.id}&slot=${encodeURIComponent(slot.startAt)}`}
                          className="slot"
                          title="Записаться на это время"
                        >
                          {timeStr}
                        </Link>
                      );
                    }
                    return (
                      <span key={slot.startAt} className="slot" title="Свободное окно">
                        {timeStr}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="small muted">
                  Свободные окна не найдены на ближайшие дни
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="island-foot">
        <span className="small muted">
          {!isAuthenticated
            ? 'Для записи нужен вход'
            : role === 'CLIENT'
            ? 'Выберите врача и время'
            : role === 'VETERINARIAN'
            ? 'Справочник услуг клиники'
            : 'Справочник услуг'}
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
            href={`/client/book?serviceId=${service.id}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'ADMIN' ? (
          <Link
            href="/admin/services"
            className="btn btn-outline btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span>Управление в админке</span>
          </Link>
        ) : (
          <span className="badge badge-accent">Услуга клиники</span>
        )}
      </div>
    </section>
  );
}
