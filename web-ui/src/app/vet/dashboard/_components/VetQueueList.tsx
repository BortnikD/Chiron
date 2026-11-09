'use client';

import React, { useState } from 'react';
import {
  Clock,
  List,
  Calendar,
  Check,
  Play,
  UserX,
  Stethoscope,
  LayoutGrid,
} from 'lucide-react';
import { VetQueueListProps } from './types';
import { STATUS_SHORT, formatSlotTime, getPetName, getOwnerDisplay } from './utils';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';

/**
 * Список приёмов на сегодня:
 * отображает интерактивную таблицу приёмов (.trow) и таймлайн (.timeline),
 * статус, питомца, владельца, а также оперативные действия («Начать прием», «Завершить», «Неявка»).
 */
export const VetQueueList: React.FC<VetQueueListProps> = ({
  appointments,
  todayAppointments,
  selectedAppointment,
  nextAppointment,
  servicesMap,
  petsMap,
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
            className={`btn btn-xs ${filterTodayOnly ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterTodayOnly(!filterTodayOnly)}
            style={{ fontSize: '11px', height: '22px' }}
          >
            {filterTodayOnly ? 'Только сегодня' : 'Все приёмы'}
          </button>
        </div>

        <div className="row items-center" style={{ gap: '6px' }}>
          {/* Переключатель вида: Таблица / Таймлайн */}
          <div className="btn-group" style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('table')}
              title="Табличный вид очереди (.trow)"
            >
              <List size={13} className="ic" />
              <span>Таблица</span>
            </button>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('timeline')}
              title="Временная шкала дня (.timeline)"
            >
              <Clock size={13} className="ic" />
              <span>Таймлайн</span>
            </button>
          </div>
        </div>
      </div>

      <div className="island-body" style={{ padding: viewMode === 'table' ? 0 : undefined }}>
        {displayList.length === 0 ? (
          <div className="empty" style={{ padding: '40px' }}>
            <span className="empty-title">
              {filterTodayOnly ? 'На сегодня приёмов нет' : 'Список приёмов пуст'}
            </span>
            <span>Здесь появится список пациентов по расписанию</span>
          </div>
        ) : viewMode === 'table' ? (
          /* Табличный вид (.dtable, .trow) */
          <div className="table-wrap">
            <div
              className="dtable"
              style={
                {
                  '--cols': '85px minmax(130px, 1.4fr) minmax(110px, 1.2fr) minmax(120px, 1.4fr) 110px 170px',
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

                return (
                  <div
                    key={a.id}
                    className={`trow ${isSel ? 'sel' : ''}`}
                    onClick={() => onSelectAppointment(a)}
                  >
                    {/* Время слота */}
                    <span className="tnum font-medium" style={{ fontSize: '13px' }}>
                      {timeStart}
                      <span className="muted small" style={{ display: 'block', fontSize: '11px' }}>
                        до {timeEnd}
                      </span>
                    </span>

                    {/* Питомец */}
                    <span className="pet-cell">
                      <span className="t-ava sm" style={{ width: '22px', height: '22px' }}>
                        <SpeciesIcon species="cat" size={14} />
                      </span>
                      <span className="col" style={{ gap: 0, minWidth: 0 }}>
                        <span className="cell-main" style={{ fontWeight: 600 }}>
                          {petName}
                        </span>
                        {isNext && (
                          <span className="badge badge-accent" style={{ height: '16px', fontSize: '10px' }}>
                            Следующий
                          </span>
                        )}
                        {a.followUpOf && (
                          <span className="badge badge-outline" style={{ height: '16px', fontSize: '10px' }}>
                            Повторный
                          </span>
                        )}
                      </span>
                    </span>

                    {/* Владелец */}
                    <span className="cell-sub" style={{ fontSize: '12.5px' }}>
                      {ownerName}
                    </span>

                    {/* Услуга */}
                    <span className="cell-sub" style={{ fontSize: '12.5px' }}>
                      {servicesMap[a.serviceId] || 'Приём'}
                    </span>

                    {/* Статус */}
                    <span>
                      <span className={`badge st badge-${a.status}`}>
                        {STATUS_SHORT[a.status] || a.status}
                      </span>
                    </span>

                    {/* Оперативные действия */}
                    <div
                      className="row"
                      style={{ gap: '4px', justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Действие: Начать прием */}
                      {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            onSelectAppointment(a);
                            onUpdateStatus(a.id, 'IN_PROGRESS');
                          }}
                          title="Начать приём пациента"
                        >
                          <Play size={11} className="ic" />
                          <span>Начать</span>
                        </button>
                      )}

                      {/* Действие: Завершить */}
                      {(a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED') && (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => onUpdateStatus(a.id, 'COMPLETED')}
                          title="Завершить приём"
                        >
                          <Check size={11} className="ic" />
                          <span>Завершить</span>
                        </button>
                      )}

                      {/* Действие: Неявка */}
                      {a.status !== 'COMPLETED' && a.status !== 'NO_SHOW' && a.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="btn btn-destructive-outline btn-xs"
                          onClick={() => onUpdateStatus(a.id, 'NO_SHOW')}
                          title="Отметить неявку владельца"
                        >
                          <UserX size={11} className="ic" />
                          <span>Неявка</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Вид «Таймлайн» (.timeline, .tl-row) — 100% сохранение оригинальной верстки */
          <div className="timeline">
            {displayList.map((a) => {
              const isSel = selectedAppointment?.id === a.id;
              const isNext = nextAppointment?.id === a.id;
              const timeStart = formatSlotTime(a.startAt);
              const timeEnd = formatSlotTime(a.endAt);
              const petName = getPetName(a, petsMap);

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
                    <span className="pet-ava">
                      <SpeciesIcon species="cat" size={20} />
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
                      {STATUS_SHORT[a.status] || a.status}
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
