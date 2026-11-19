'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, CalendarPlus, CalendarOff, Check, AlertCircle, Plus } from 'lucide-react';
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
  clientPets,
  clientSpeciesIds,
}: ServiceDetailIslandProps) {
  const router = useRouter();
  const [selectedSlotStartAt, setSelectedSlotStartAt] = React.useState<string | null>(null);

  const detailSpeciesList = useMemo(() => {
    const list =
      serviceSpeciesList.length > 0
        ? speciesList.filter((sp) => serviceSpeciesList.some((ss) => ss.speciesId === sp.id))
        : speciesList;

    // Если клиент авторизован и у него есть питомцы:
    // показываем в табах только те виды, которые есть у клиента среди его активных питомцев
    if (role === 'CLIENT' && clientSpeciesIds && clientSpeciesIds.size > 0) {
      const owned = list.filter((sp) => clientSpeciesIds.has(sp.id));
      if (owned.length > 0) {
        return owned;
      }
    }
    return list;
  }, [serviceSpeciesList, speciesList, role, clientSpeciesIds]);

  const isSpeciesNotOwned = Boolean(
    role === 'CLIENT' &&
      clientSpeciesIds &&
      clientSpeciesIds.size > 0 &&
      activeSpeciesTab &&
      !clientSpeciesIds.has(activeSpeciesTab)
  );

  const matchingPets = useMemo(() => {
    if (!clientPets || !activeSpeciesTab) return [];
    return clientPets.filter((p) => !p.isArchived && p.speciesId === activeSpeciesTab);
  }, [clientPets, activeSpeciesTab]);

  const getBookUrl = (slotStartAt?: string | null) => {
    const params = new URLSearchParams();
    params.set('serviceId', service.id);
    if (activeSpeciesTab) {
      params.set('speciesId', activeSpeciesTab);
    }
    const targetSlot = slotStartAt || selectedSlotStartAt;
    if (targetSlot) {
      params.set('slot', targetSlot);
    }
    return `/client/book?${params.toString()}`;
  };

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
    <section className="island detail-island" aria-label="Услуга">
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
                    onClick={() => {
                      onSpeciesTabChange(sp.id);
                      setSelectedSlotStartAt(null);
                    }}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            </div>

            {isSpeciesNotOwned ? (
              <div
                className="col"
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <span className="small muted">
                  У вас пока нет питомцев подходящего вида для этой услуги.
                </span>
                <Link href="/client/pets?action=create" className="btn btn-outline btn-sm">
                  Добавить питомца
                </Link>
              </div>
            ) : (
              <>
                {matchingPets.length > 0 && (
                  <span className="small muted" style={{ fontSize: '12px' }}>
                    Ваш питомец:{' '}
                    <b>
                      {Array.from(
                        new Set(
                          matchingPets.map((p) =>
                            p.breed ? `${p.name} (${p.breed})` : p.name
                          )
                        )
                      ).join(', ')}
                    </b>
                  </span>
                )}

                {selectedSlotStartAt && (
                  <div
                    className="row between items-center"
                    style={{
                      padding: '8px 12px',
                      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                      border: '1px solid var(--primary)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      gap: '8px',
                    }}
                  >
                    <span>
                      Выбрано: <b>{formatSlotTime(selectedSlotStartAt)}</b> (вид:{' '}
                      <b>{speciesMap[activeSpeciesTab] || 'Животное'}</b>)
                    </span>
                    <div className="row items-center" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          const url = getBookUrl(selectedSlotStartAt);
                          router.push(!isAuthenticated ? `/login?next=${encodeURIComponent(url)}` : url);
                        }}
                      >
                        Записаться
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setSelectedSlotStartAt(null)}
                        title="Сбросить выбор времени"
                        style={{ padding: '2px 5px', height: 'auto' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

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
                          const isSel = selectedSlotStartAt === slot.startAt;
                          const bookUrl = getBookUrl(slot.startAt);

                          return (
                            <button
                              key={slot.startAt}
                              type="button"
                              className={`slot ${isSel ? 'on' : ''}`}
                              title={isSel ? 'Выбрано. Нажмите ещё раз для перехода к записи' : 'Выбрать это время'}
                              onClick={() => {
                                if (isSel) {
                                  router.push(!isAuthenticated ? `/login?next=${encodeURIComponent(bookUrl)}` : bookUrl);
                                } else {
                                  setSelectedSlotStartAt(slot.startAt);
                                }
                              }}
                            >
                              {timeStr}
                            </button>
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
              </>
            )}
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
            href={`/login?next=${encodeURIComponent(getBookUrl())}`}
            className="btn btn-primary"
          >
            <CalendarPlus className="ic" />
            <span>
              {selectedSlotStartAt ? `Записаться на ${formatSlotTime(selectedSlotStartAt)}` : 'Записаться'}
            </span>
          </Link>
        ) : role === 'CLIENT' ? (
          isSpeciesNotOwned ? (
            <Link href="/client/pets?action=create" className="btn btn-outline btn-sm">
              <span>Добавить питомца для записи</span>
            </Link>
          ) : (
            <Link href={getBookUrl()} className="btn btn-primary">
              <CalendarPlus className="ic" />
              <span>
                {selectedSlotStartAt ? `Записаться на ${formatSlotTime(selectedSlotStartAt)}` : 'Записаться'}
              </span>
            </Link>
          )
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
