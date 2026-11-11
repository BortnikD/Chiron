'use client';

import React, { useMemo } from 'react';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, Repeat, X } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import { getPetName } from '../../dashboard/_components/utils';

const PAGE_SIZES = [10, 20, 50];

export interface VetAppointmentsTableProps {
  appointments: Appointment[];
  totalElements: number;
  page: number;
  totalPages: number;
  size: number;
  loading: boolean;
  selectedAppt: Appointment | null;
  petsMap: Record<string, Pet>;
  servicesMap: Record<string, string>;
  speciesMap: Record<string, string>;
  petFilter: string;
  statusFilter: AppointmentStatus[];
  dateFrom: string;
  dateTo: string;
  onSelectAppointment: (appt: Appointment) => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onClearPet: () => void;
  onRemoveStatus: (st: AppointmentStatus) => void;
  onClearDateFrom: () => void;
  onClearDateTo: () => void;
  onResetAll: () => void;
}

export const VetAppointmentsTable: React.FC<VetAppointmentsTableProps> = ({
  appointments,
  totalElements,
  page,
  totalPages,
  size,
  loading,
  selectedAppt,
  petsMap,
  servicesMap,
  speciesMap,
  petFilter,
  statusFilter,
  dateFrom,
  dateTo,
  onSelectAppointment,
  onPageChange,
  onSizeChange,
  onClearPet,
  onRemoveStatus,
  onClearDateFrom,
  onClearDateTo,
  onResetAll,
}) => {
  const activeChips = useMemo(() => {
    const list: Array<{ key: string; label: string; clear: () => void }> = [];
    if (petFilter) {
      list.push({
        key: 'pet',
        label: `Пациент: ${petsMap[petFilter]?.name || 'выбран'}`,
        clear: onClearPet,
      });
    }
    statusFilter.forEach((st) => {
      list.push({
        key: `st-${st}`,
        label: APPOINTMENT_STATUS_META[st]?.short || st,
        clear: () => onRemoveStatus(st),
      });
    });
    if (dateFrom) {
      list.push({ key: 'from', label: `С ${formatIsoDateDisplay(dateFrom)}`, clear: onClearDateFrom });
    }
    if (dateTo) {
      list.push({ key: 'to', label: `По ${formatIsoDateDisplay(dateTo)}`, clear: onClearDateTo });
    }
    return list;
  }, [petFilter, petsMap, statusFilter, dateFrom, dateTo, onClearPet, onRemoveStatus, onClearDateFrom, onClearDateTo]);

  const pageNumbers = useMemo(() => {
    const total = Math.max(1, totalPages);
    const maxButtons = 5;
    let start = Math.max(0, page - Math.floor(maxButtons / 2));
    const end = Math.min(total - 1, start + maxButtons - 1);
    start = Math.max(0, end - maxButtons + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Мои записи <span className="count">Найдено: {totalElements}</span>
        </span>
        {activeChips.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onResetAll}>
            Сбросить всё
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="active-filters">
          {activeChips.map((chip) => (
            <span key={chip.key} className="chip on" style={{ cursor: 'default' }}>
              {chip.label}
              <button
                type="button"
                className="chip-x"
                aria-label="Убрать фильтр"
                onClick={chip.clear}
              >
                <X className="ic" style={{ width: '12px', height: '12px' }} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="table-wrap">
        {loading && appointments.length === 0 ? (
          <div className="col" style={{ gap: '8px', padding: '12px 16px' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton" style={{ height: '42px' }} />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <CalendarDays className="ic ic-40" />
            </div>
            <span className="empty-title">Записей не найдено</span>
            {activeChips.length > 0 && (
              <button type="button" className="btn btn-outline" onClick={onResetAll}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div
            className="dtable"
            style={{ '--cols': '1.6fr 1fr 1.6fr 1.3fr 0.8fr', minWidth: '720px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Дата и время</span>
              <span>Пациент</span>
              <span>Услуга</span>
              <span>Статус</span>
              <span className="right">Цена</span>
            </div>

            {appointments.map((a) => {
              const pet = a.pet || petsMap[a.petId];
              const petName = getPetName(a, petsMap);
              const speciesName =
                pet?.species?.name ||
                pet?.speciesName ||
                (pet?.speciesId && speciesMap[pet.speciesId]) ||
                '—';
              const tone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
                speciesMap
              );
              const serviceName =
                a.serviceName || a.service?.name || servicesMap[a.serviceId] || 'Приём';
              const stMeta = APPOINTMENT_STATUS_META[a.status];
              const isSel = selectedAppt?.id === a.id;

              return (
                <button
                  key={a.id}
                  type="button"
                  className={`trow ${isSel ? 'sel' : ''}`}
                  onClick={() => onSelectAppointment(a)}
                >
                  <span className="row" style={{ gap: '6px' }}>
                    <span className="cell-main tnum">{formatDateShort(a.startAt)}</span>
                    <span className="muted tnum">
                      {formatSlotTime(a.startAt)}–{formatSlotTime(a.endAt)}
                    </span>
                    {a.followUpOf && (
                      <span title="Повторный приём" style={{ color: 'var(--primary-text)', display: 'inline-flex' }}>
                        <Repeat className="ic" aria-label="Повторный приём" />
                      </span>
                    )}
                  </span>
                  <span className="pet-cell">
                    <PetAvatar
                      pet={pet}
                      tone={tone}
                      species={tone}
                      iconSize={14}
                      variant="thumb"
                      className={`t-ava xs tone-${tone}`}
                    />
                    <span>
                      {petName} <span className="muted">· {speciesName}</span>
                    </span>
                  </span>
                  <span>{serviceName}</span>
                  <span>
                    <span className={`badge st badge-${a.status}`} title={stMeta?.label || a.status}>
                      {stMeta?.short || a.status}
                    </span>
                  </span>
                  <span className="right tnum">
                    {formatCurrency(a.priceSnapshot ?? a.price ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="island-foot">
        <div className="row small muted">
          <span>На странице</span>
          <div className="seg">
            {PAGE_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                className={`seg-item ${size === n ? 'on' : ''}`}
                onClick={() => onSizeChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page <= 0}
            aria-label="Назад"
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <ChevronLeft className="ic" />
          </button>
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              type="button"
              className={`btn btn-ghost btn-sm ${pg === page ? 'on' : ''}`}
              onClick={() => onPageChange(pg)}
            >
              {pg + 1}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page >= totalPages - 1}
            aria-label="Вперёд"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          >
            <ChevronRight className="ic" />
          </button>
        </div>
      </div>
    </section>
  );
};
