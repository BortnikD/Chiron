'use client';

import React, { useState } from 'react';
import { Clock, List, Calendar, Check, UserX } from 'lucide-react';
import { APPOINTMENT_STATUS_META, formatSlotTime, getSpeciesTone } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import type { VetQueueListProps } from './types';
import { getPetName, getOwnerDisplay } from './utils';

/**
 * Список приёмов на сегодня:
 * отображает интерактивную таблицу приёмов (.trow) и таймлайн (.timeline),
 * статус, питомца, владельца, а также оперативные действия («Подтвердить», «Завершить», «Неявка»).
 */
export const VetQueueList: React.FC<VetQueueListProps> = ({
  appointments,
  todayAppointments,
  selectedAppointment,
  nextAppointment,
  servicesMap,
  petsMap,
  speciesMap,
  loading = false,
  onSelectAppointment,
  onUpdateStatus,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [filterTodayOnly, setFilterTodayOnly] = useState<boolean>(true);

  const displayList = filterTodayOnly ? todayAppointments : appointments;

  return (
    <section className="island grow" aria-label="Очередь приёмов">
      <div className="island-head">
        <div className="row items-center" style={{ gap: '8px' }}>
          <span className="island-title">
            <Calendar className="ic" />
            Очередь приёмов <span className="count">{displayList.length}</span>
          </span>
          <button
            type="button"
            className={`btn btn-sm ${filterTodayOnly ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTodayOnly(!filterTodayOnly)}
            style={{ fontSize: '12px', height: '26px', padding: '0 10px' }}
          >
            {filterTodayOnly ? 'Только сегодня' : 'Все приёмы'}
          </button>
        </div>

        <div className="seg">
          <button
            type="button"
            className={`seg-item ${viewMode === 'table' ? 'on' : ''}`}
            onClick={() => setViewMode('table')}
            title="Табличный вид очереди"
          >
            <List size={13} className="ic" />
            <span>Таблица</span>
          </button>
          <button
            type="button"
            className={`seg-item ${viewMode === 'timeline' ? 'on' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Временная шкала дня"
          >
            <Clock size={13} className="ic" />
            <span>Таймлайн</span>
          </button>
        </div>
      </div>

      <div className="island-body" style={{ padding: viewMode === 'table' ? 0 : undefined }}>
        {loading && displayList.length === 0 ? (
          <div className="col" style={{ gap: '8px', padding: '16px' }}>
            <div className="skeleton" style={{ height: '42px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '42px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '42px', borderRadius: '8px' }} />
          </div>
        ) : displayList.length === 0 ? (
          <div className="empty" style={{ padding: '40px' }}>
            <span className="empty-title">
              {filterTodayOnly ? 'На сегодня приёмов нет' : 'Список приёмов пуст'}
            </span>
            <span>Здесь появится список пациентов по расписанию</span>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-wrap">
            <div
              className="dtable"
              style={
                {
                  '--cols':
                    '80px minmax(130px, 1.4fr) minmax(105px, 1.1fr) minmax(115px, 1.3fr) 105px 185px',
                  minWidth: '800px',
                } as React.CSSProperties
              }
            >
              <div className="thead trow static">
                <span>Время</span>
                <span>Питомец</span>
                <span>Владелец</span>
                <span>Услуга</span>
                <span>Статус</span>
                <span style={{ textAlign: 'right' }}>Действия</span>
              </div>

              {displayList.map((a) => {
                const isSel = selectedAppointment?.id === a.id;
                const isNext = nextAppointment?.id === a.id;
                const petName = getPetName(a, petsMap);
                const ownerName = getOwnerDisplay(a, petsMap);
                const timeStart = formatSlotTime(a.startAt);
                const timeEnd = formatSlotTime(a.endAt);
                const pet = a.pet || petsMap?.[a.petId];
                const speciesTone = getSpeciesTone(
                  pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
                  speciesMap
                );

                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    className={`trow ${isSel ? 'sel' : ''}`}
                    onClick={() => onSelectAppointment(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectAppointment(a);
                      }
                    }}
                  >
                    <span className="tnum font-medium" style={{ fontSize: '13px' }}>
                      {timeStart}
                      <span className="muted small" style={{ display: 'block', fontSize: '11px' }}>
                        до {timeEnd}
                      </span>
                    </span>

                    <span className="pet-cell">
                      <span className={`t-ava sm tone-${speciesTone}`}>
                        <SpeciesIcon species={speciesTone} size={14} />
                      </span>
                      <span className="col" style={{ gap: '2px', minWidth: 0 }}>
                        <span className="cell-main" style={{ fontWeight: 600 }}>
                          {petName}
                        </span>
                        {isNext && (
                          <span
                            className="badge badge-accent"
                            style={{ height: '16px', fontSize: '10px', alignSelf: 'flex-start' }}
                          >
                            Следующий
                          </span>
                        )}
                        {a.followUpOf && (
                          <span
                            className="badge badge-outline"
                            style={{ height: '16px', fontSize: '10px', alignSelf: 'flex-start' }}
                          >
                            Повторный
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="cell-sub" style={{ fontSize: '12.5px' }}>
                      {ownerName}
                    </span>

                    <span className="cell-sub" style={{ fontSize: '12.5px' }}>
                      {servicesMap[a.serviceId] || 'Приём'}
                    </span>

                    <span>
                      <span className={`badge st badge-${a.status}`}>
                        {APPOINTMENT_STATUS_META[a.status]?.short || a.status}
                      </span>
                    </span>

                    <div
                      className="row"
                      style={{ gap: '4px', justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ height: '26px', padding: '0 8px', fontSize: '12px' }}
                          onClick={() => onUpdateStatus(a.id, 'CONFIRMED')}
                          title="Подтвердить запись"
                        >
                          <Check size={11} className="ic" />
                          <span>Подтвердить</span>
                        </button>
                      )}

                      {a.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ height: '26px', padding: '0 8px', fontSize: '12px' }}
                            onClick={() => onUpdateStatus(a.id, 'COMPLETED')}
                            title="Завершить приём"
                          >
                            <Check size={11} className="ic" />
                            <span>Завершить</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-destructive-outline btn-sm"
                            style={{ height: '26px', padding: '0 8px', fontSize: '12px' }}
                            onClick={() => onUpdateStatus(a.id, 'NO_SHOW')}
                            title="Отметить неявку владельца"
                          >
                            <UserX size={11} className="ic" />
                            <span>Неявка</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="timeline">
            {displayList.map((a) => {
              const isSel = selectedAppointment?.id === a.id;
              const isNext = nextAppointment?.id === a.id;
              const timeStart = formatSlotTime(a.startAt);
              const timeEnd = formatSlotTime(a.endAt);
              const petName = getPetName(a, petsMap);
              const pet = a.pet || petsMap?.[a.petId];
              const speciesTone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
                speciesMap
              );

              return (
                <div key={a.id} className="tl-row">
                  <span className="tl-time">
                    {timeStart}
                    <span className="tl-time-end">{timeEnd}</span>
                  </span>

                  <button
                    type="button"
                    className={`tl-card tl-appt ${isSel ? 'sel' : ''}`}
                    onClick={() => onSelectAppointment(a)}
                    style={{ textAlign: 'left', cursor: 'pointer', flex: 1 }}
                  >
                    <span className={`t-ava tone-${speciesTone}`}>
                      <SpeciesIcon species={speciesTone} size={20} />
                    </span>
                    <span className="col grow" style={{ gap: '1px' }}>
                      <span className="row" style={{ gap: '8px' }}>
                        <span className="cell-main">{petName}</span>
                        {isNext && (
                          <span className="badge badge-accent" style={{ height: '20px' }}>
                            Следующий
                          </span>
                        )}
                        {a.followUpOf && (
                          <span className="badge badge-outline" style={{ height: '20px' }}>
                            Повторный
                          </span>
                        )}
                      </span>
                      <span className="cell-sub">{servicesMap[a.serviceId] || 'Приём'}</span>
                    </span>
                    <span className={`badge st badge-${a.status}`}>
                      {APPOINTMENT_STATUS_META[a.status]?.short || a.status}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
