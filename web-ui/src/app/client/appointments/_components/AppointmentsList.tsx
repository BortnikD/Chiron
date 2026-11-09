'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Appointment, Pet, Service } from '../../../../types';
import { SpeciesIcon, getSpeciesTone } from '../../../../components/ui/SpeciesIcon';
import { STATUS_SHORT } from './constants';

export interface AppointmentsListProps {
  /** Отфильтрованный список записей на приём */
  appointments: Appointment[];
  /** Текущая выбранная запись для детального просмотра */
  selectedAppointment: Appointment | null;
  /** Функция выбора записи */
  onSelectAppointment: (appointment: Appointment) => void;
  /** Словарь питомцев клиента по ID */
  petsMap: Record<string, Pet>;
  /** Словарь услуг клиники по ID */
  servicesMap: Record<string, Service>;
}

/**
 * Левый остров со списком записей на приём:
 * отображает интерактивную таблицу записей с бейджами статусов, датами,
 * питомцами, названиями услуг и ценами.
 */
export function AppointmentsList({
  appointments,
  selectedAppointment,
  onSelectAppointment,
  petsMap,
  servicesMap,
}: AppointmentsListProps) {
  return (
    <section className="island grow" aria-label="Список записей">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Записи <span className="count">Найдено: {appointments.length}</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={{
            '--cols': '1.6fr 1fr 1.5fr 1.1fr 0.8fr',
            minWidth: '760px',
          } as React.CSSProperties}
        >
          <div className="thead">
            <span>Дата и время</span>
            <span>Питомец</span>
            <span>Услуга</span>
            <span>Статус</span>
            <span>Цена</span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Записей с выбранными фильтрами не найдено
            </div>
          ) : (
            appointments.map((a) => {
              const isSel = selectedAppointment?.id === a.id;
              const pet = petsMap[a.petId];
              const svc = servicesMap[a.serviceId];

              const dateStr = new Date(a.startAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const timeStr = new Date(a.startAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow',
              });

              return (
                <button
                  key={a.id}
                  type="button"
                  className={`trow ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectAppointment(a)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="row" style={{ gap: '6px' }}>
                    <span className="cell-main tnum">{dateStr}</span>
                    <span className="muted tnum">{timeStr}</span>
                  </span>
                  <span className="pet-cell">
                    <span className={`t-ava xs ${getSpeciesTone(pet?.speciesId)}`}>
                      <SpeciesIcon species={pet?.speciesId || 'cat'} size={14} />
                    </span>
                    <span>{pet?.name || 'Питомец'}</span>
                  </span>
                  <span>{svc?.name || 'Услуга'}</span>
                  <span>
                    <span className={`badge st badge-${a.status}`}>
                      {STATUS_SHORT[a.status] || a.status}
                    </span>
                  </span>
                  <span className="right tnum">
                    {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : '—'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
