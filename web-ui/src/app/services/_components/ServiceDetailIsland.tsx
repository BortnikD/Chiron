'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { X, CalendarPlus, CalendarOff } from 'lucide-react';
import {
  DOW_SHORT,
  formatCurrency,
  formatIsoDateDisplay,
  formatSlotTime,
  getMoscowDateKey,
  pluralRu,
} from '@/shared/lib';
import type { AvailableSlotResponse } from '@/modules/clinic/types';
import type { ServiceDetailIslandProps } from './types';

function formatDayDow(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const idx = (dt.getUTCDay() + 6) % 7;
  return DOW_SHORT[idx] || '';
}

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
  loadingSlots = false,
  isAuthenticated,
  role,
}: ServiceDetailIslandProps) {
  const detailSpeciesList = useMemo(
    () =>
      serviceSpeciesList.length > 0
        ? speciesList.filter((sp) => serviceSpeciesList.some((ss) => ss.speciesId === sp.id))
        : speciesList,
    [serviceSpeciesList, speciesList]
  );

  const groupedSlotDays = useMemo(() => {
    const byDate = new Map<string, AvailableSlotResponse[]>();
    for (const slot of nearestSlots) {
      const dateKey = getMoscowDateKey(slot.startAt);
      if (!dateKey) continue;
      const arr = byDate.get(dateKey);
      if (arr) arr.push(slot);
      else byDate.set(dateKey, [slot]);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
      .map(([isoDate, slots]) => ({
        isoDate,
        dow: formatDayDow(isoDate),
        label: formatIsoDateDisplay(isoDate),
        totalCount: slots.length,
        slots: slots.slice(0, 8),
      }));
  }, [nearestSlots]);

  const baseDuration = service.baseDurationMin ?? service.durationMin ?? 30;
  const baseBuffer = service.bufferAfterMin ?? 10;

  return (
    <section className="island detail-island" style={{ width: '460px' }} aria-label="Услуга">
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

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Базовая цена</dt>
            <dd className="tnum">{formatCurrency(service.basePrice)}</dd>
            <dt>Длительность</dt>
            <dd className="tnum">{baseDuration} мин</dd>
            <dt>Буфер после</dt>
            <dd className="tnum">{baseBuffer} мин</dd>
          </dl>

          <div className="col" style={{ gap: '8px' }}>
            <span className="section-title">Цена и длительность по видам</span>
            <div className="dtable keep-table" style={{ '--cols': '1fr 1.2fr 1.2fr' } as React.CSSProperties}>
              <div className="thead" style={{ padding: 0 }}>
                <span>Вид</span>
                <span>Длительность</span>
                <span className="right">Цена</span>
              </div>
              {serviceSpeciesList.length > 0
                ? serviceSpeciesList.map((ss) => {
                    const dur = ss.durationMin ?? baseDuration;
                    const price = ss.price ?? service.basePrice;
                    return (
                      <div key={ss.speciesId} className="trow static compact">
                        <span>{speciesMap[ss.speciesId] || 'Животное'}</span>
                        <span className="tnum">
                          {dur} мин{' '}
                          {ss.durationMin == null && <span className="small muted">базовая</span>}
                        </span>
                        <span className="right tnum">
                          {formatCurrency(price)}{' '}
                          {ss.price == null && <span className="small muted">базовая</span>}
                        </span>
                      </div>
                    );
                  })
                : speciesList.map((sp) => (
                    <div key={sp.id} className="trow static compact">
                      <span>{sp.name}</span>
                      <span className="tnum">
                        {baseDuration} мин <span className="small muted">базовая</span>
                      </span>
                      <span className="right tnum">
                        {formatCurrency(service.basePrice)}{' '}
                        <span className="small muted">базовая</span>
                      </span>
                    </div>
                  ))}
            </div>
          </div>

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

            {loadingSlots ? (
              <span className="small muted">Загрузка свободных окон...</span>
            ) : groupedSlotDays.length > 0 ? (
              groupedSlotDays.map((day) => (
                <div key={day.isoDate} className="col" style={{ gap: '6px' }}>
                  <span className="small">
                    <b style={{ fontWeight: 600 }}>
                      {day.dow}, {day.label}
                    </b>{' '}
                    <span className="muted">
                      · {day.totalCount} {pluralRu(day.totalCount, 'окно', 'окна', 'окон')}
                    </span>
                  </span>
                  <div className="chips">
                    {day.slots.map((slot) => {
                      const timeStr = formatSlotTime(slot.startAt);
                      if (!isAuthenticated) {
                        const bookUrl = `/client/book?serviceId=${service.id}&slot=${encodeURIComponent(slot.startAt)}`;
                        return (
                          <Link
                            key={slot.startAt}
                            href={`/login?next=${encodeURIComponent(bookUrl)}`}
                            className="slot"
                            title="Войдите, чтобы записаться"
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
                        <span
                          key={slot.startAt}
                          className="slot"
                          style={{ cursor: 'default' }}
                          title="Свободное окно"
                        >
                          {timeStr}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty" style={{ padding: '16px' }}>
                <CalendarOff className="ic ic-20" />
                <span>Нет свободных окон, попробуйте другой период</span>
              </div>
            )}

            <span className="small muted">Показаны 3 ближайших дня, первые 8 окон</span>
          </div>
        </div>
      </div>

      <div className="island-foot">
        <span className="small muted">
          {!isAuthenticated
            ? 'Для записи нужен вход'
            : role === 'CLIENT'
            ? 'Запись — через мастер'
            : role === 'VETERINARIAN'
            ? 'Справочник услуг клиники'
            : 'Справочник услуг'}
        </span>
        {!isAuthenticated ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/client/book?serviceId=${service.id}`)}`}
            className="btn btn-primary"
          >
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'CLIENT' ? (
          <Link href={`/client/book?serviceId=${service.id}`} className="btn btn-primary">
            <CalendarPlus className="ic" />
            <span>Записаться</span>
          </Link>
        ) : role === 'ADMIN' ? (
          <Link href="/admin/services" className="btn btn-outline btn-sm">
            <span>Управление в админке</span>
          </Link>
        ) : (
          <span className="badge badge-accent">Услуга клиники</span>
        )}
      </div>
    </section>
  );
}
