'use client';

import React from 'react';
import {
  Calendar,
  CalendarDays,
  ArrowUpDown,
  Repeat,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import type { PageSizeOption } from '../_hooks/useClientAppointments';
import {
  type ActiveAppointmentFilterTag,
  buildPageNumbers,
  resolveVetName,
} from './utils';

export interface AppointmentsListProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  onSelectAppointment: (appointment: Appointment) => void;
  petsMap: Record<string, Pet>;
  servicesMap: Record<string, Service>;
  vetsMap: Record<string, Veterinarian>;
  speciesMap?: Record<string, string>;
  loading?: boolean;
  totalElements: number;
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  size: PageSizeOption;
  onSizeChange: (size: PageSizeOption) => void;
  direction: 'ASC' | 'DESC';
  onToggleDirection: () => void;
  activeFilters: ActiveAppointmentFilterTag[];
  onResetFilters: () => void;
}

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [10, 20, 50];

/**
 * Левый остров со списком записей на приём, активными тегами фильтров,
 * сортировкой по дате и серверной пагинацией.
 */
export function AppointmentsList({
  appointments,
  selectedAppointment,
  onSelectAppointment,
  petsMap,
  servicesMap,
  vetsMap,
  speciesMap = {},
  loading = false,
  totalElements,
  totalPages,
  page,
  onPageChange,
  size,
  onSizeChange,
  direction,
  onToggleDirection,
  activeFilters,
  onResetFilters,
}: AppointmentsListProps) {
  const hasFilters = activeFilters.length > 0;
  const pageNumbers = buildPageNumbers(page, Math.max(1, totalPages));

  return (
    <section className="island grow" aria-label="Список записей">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Записи <span className="count">Найдено: {totalElements}</span>
        </span>
        {hasFilters && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onResetFilters}>
            Сбросить всё
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="active-filters">
          {activeFilters.map((f) => (
            <span key={f.key} className="chip on" style={{ cursor: 'default' }}>
              {f.label}
              <button
                type="button"
                className="chip-x"
                aria-label="Убрать фильтр"
                onClick={f.onClear}
              >
                <X className="ic" style={{ width: '12px', height: '12px' }} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="table-wrap">
        {loading && appointments.length === 0 ? (
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка записей...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <CalendarDays className="ic ic-40" />
            </div>
            <span className="empty-title">Записей не найдено</span>
            <span>Измените фильтры или запишите питомца на приём</span>
            <button type="button" className="btn btn-outline" onClick={onResetFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div
            className="dtable"
            style={{
              '--cols': '1.6fr 0.9fr 1.5fr 1fr 1.3fr 0.8fr',
              minWidth: '780px',
            } as React.CSSProperties}
          >
            <div className="thead">
              <button
                type="button"
                className="linkish"
                title={direction === 'ASC' ? 'Сначала ранние' : 'Сначала поздние'}
                style={{
                  color: 'inherit',
                  fontWeight: 500,
                  display: 'inline-flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
                onClick={onToggleDirection}
              >
                Дата и время
                <ArrowUpDown className="ic" style={{ width: '13px', height: '13px' }} />
              </button>
              <span>Питомец</span>
              <span>Услуга</span>
              <span>Врач</span>
              <span>Статус</span>
              <span className="right">Цена</span>
            </div>

            {appointments.map((a) => {
              const isSel = selectedAppointment?.id === a.id;
              const pet = petsMap[a.petId] || a.pet;
              const svc = servicesMap[a.serviceId] || a.service;
              const tone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId,
                speciesMap
              );
              const meta = APPOINTMENT_STATUS_META[a.status];
              const statusShort = meta?.short || a.status;
              const statusLabel = meta?.label || a.status;
              const price = a.priceSnapshot ?? a.price;

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
                      <Repeat
                        className="ic"
                        style={{ color: 'var(--primary-text)' }}
                        aria-label="Повторный приём"
                      />
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
                    <span>{pet?.name || a.petName || 'Питомец'}</span>
                  </span>
                  <span>{svc?.name || a.serviceName || 'Услуга'}</span>
                  <span>{resolveVetName(a, vetsMap)}</span>
                  <span>
                    <span className={`badge st badge-${a.status}`} title={statusLabel}>
                      {statusShort}
                    </span>
                  </span>
                  <span className="right tnum">
                    {price != null ? formatCurrency(price) : '—'}
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
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`seg-item ${size === opt ? 'on' : ''}`}
                onClick={() => onSizeChange(opt)}
              >
                {opt}
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
            disabled={totalPages <= 1 || page + 1 >= totalPages}
            aria-label="Вперёд"
            onClick={() => onPageChange(Math.min(Math.max(0, totalPages - 1), page + 1))}
          >
            <ChevronRight className="ic" />
          </button>
        </div>
      </div>
    </section>
  );
}
