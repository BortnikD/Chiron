'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';

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
  /** Словарь видов животных по ID */
  speciesMap?: Record<string, string>;
  /** Общее количество записей по текущим фильтрам */
  totalElements?: number;
  /** Общее количество страниц */
  totalPages?: number;
  /** Текущая страница (0-based) */
  page?: number;
  /** Колбэк смены страницы */
  onPageChange?: (page: number) => void;
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
  speciesMap = {},
  totalElements,
  totalPages = 0,
  page = 0,
  onPageChange,
}: AppointmentsListProps) {
  return (
    <section className="island grow" aria-label="Список записей">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Записи <span className="count">Найдено: {totalElements ?? appointments.length}</span>
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
              const tone = getSpeciesTone(pet?.species?.name || pet?.speciesId, speciesMap);
              const statusShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;

              return (
                <button
                  key={a.id}
                  type="button"
                  className={`trow ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectAppointment(a)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="row" style={{ gap: '6px' }}>
                    <span className="cell-main tnum">{formatDateShort(a.startAt)}</span>
                    <span className="muted tnum">{formatSlotTime(a.startAt)}</span>
                  </span>
                  <span className="pet-cell">
                    <span className={`t-ava xs tone-${tone}`}>
                      <SpeciesIcon species={tone} size={14} />
                    </span>
                    <span>{pet?.name || 'Питомец'}</span>
                  </span>
                  <span>{svc?.name || 'Услуга'}</span>
                  <span>
                    <span className={`badge st badge-${a.status}`}>{statusShort}</span>
                  </span>
                  <span className="right tnum">
                    {a.priceSnapshot != null ? formatCurrency(a.priceSnapshot) : '—'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="island-foot">
          <span className="small muted">
            Страница {page + 1} из {totalPages}
          </span>
          <div className="row" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
            >
              Назад
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
