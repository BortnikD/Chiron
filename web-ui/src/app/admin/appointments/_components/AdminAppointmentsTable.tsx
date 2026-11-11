'use client';

import React from 'react';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Repeat,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateTimeCompact,
  getSpeciesTone,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { PAGE_SIZES, type ActiveFilterChip } from './utils';

export interface AdminAppointmentsTableProps {
  appointments: Appointment[];
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  speciesList: Species[];
  selectedAppt: Appointment | null;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  activeFilters: ActiveFilterChip[];
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelect: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
  onCancel: (appt: Appointment) => void;
  onDelete: (appt: Appointment) => void;
}

/**
 * Табличный список записей на приём (.dtable, .active-filters, .pager).
 */
export const AdminAppointmentsTable: React.FC<AdminAppointmentsTableProps> = ({
  appointments,
  veterinarians,
  services,
  pets,
  users,
  speciesList,
  selectedAppt,
  loading,
  page,
  pageSize,
  totalPages,
  totalElements,
  activeFilters,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
  onSelect,
  onEdit,
  onCancel,
  onDelete,
}) => {
  const hasFilters = activeFilters.length > 0;

  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" size={18} />
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
                aria-label={`Убрать фильтр: ${f.label}`}
                onClick={f.clear}
              >
                <X className="ic" style={{ width: 12, height: 12 }} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.45fr 1.1fr 1fr 1.3fr 1fr 1fr 0.75fr 76px',
              minWidth: '940px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>Дата и время ↑</span>
            <span>Питомец</span>
            <span>Владелец</span>
            <span>Услуга</span>
            <span>Врач</span>
            <span>Статус</span>
            <span className="right">Цена</span>
            <span className="right">Действия</span>
          </div>

          {appointments.map((a) => {
            const isSelected = selectedAppt?.id === a.id;
            const dt = formatDateTimeCompact(a.startAt);
            const p = pets.find((item) => item.id === a.petId);
            const ownerName = (p?.ownerId && users.find((u) => u.id === p.ownerId)?.fullName) || '—';
            const serviceName = services.find((s) => s.id === a.serviceId)?.name || 'Услуга клиники';
            const rawVet = veterinarians.find((v) => v.id === a.veterinarianId);
            const vetName = getDoctorDisplay(rawVet).fullName;
            const tone = getSpeciesTone(p?.species?.name || p?.speciesName || p?.speciesId, speciesList);
            const sInfo = APPOINTMENT_STATUS_META[a.status] || {
              label: a.status,
              short: a.status,
              cls: 'badge-outline',
            };

            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                className={`trow ${isSelected ? 'sel' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(a)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(a);
                  }
                }}
              >
                <span className="row" style={{ gap: 6 }}>
                  <span className="cell-main tnum">{dt.date}</span>
                  <span className="muted tnum">{dt.time}</span>
                  {a.followUpOf && (
                    <Repeat
                      size={14}
                      style={{ color: 'var(--primary-text)' }}
                      aria-label="Повторный приём"
                    />
                  )}
                </span>

                <span className="pet-cell">
                  <span className={`t-ava xs tone-${tone}`}>
                    <SpeciesIcon species={tone} size={14} />
                  </span>
                  <span>{p?.name || 'Питомец'}</span>
                </span>

                <span className="muted">{ownerName}</span>
                <span>{serviceName}</span>
                <span>{vetName}</span>
                <span>
                  <span className={`badge st ${sInfo.cls}`}>{sInfo.short}</span>
                </span>
                <span className="right tnum">{formatCurrency(a.priceSnapshot || a.price)}</span>

                <span
                  className="right row"
                  style={{ gap: 4, justifyContent: 'flex-end' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-xs"
                    title="Редактировать запись"
                    aria-label="Редактировать"
                    onClick={() => onEdit(a)}
                  >
                    <Edit2 size={13} />
                  </button>
                  {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.status !== 'NO_SHOW' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-xs text-destructive"
                      title="Отменить запись"
                      aria-label="Отменить"
                      onClick={() => onCancel(a)}
                    >
                      <XCircle size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-xs text-destructive"
                    title="Удалить запись"
                    aria-label="Удалить"
                    onClick={() => onDelete(a)}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {loading && appointments.length === 0 && (
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка записей…</span>
          </div>
        )}

        {appointments.length === 0 && !loading && (
          <div className="empty">
            <div className="empty-art">
              <CalendarDays className="ic ic-40" />
            </div>
            <span className="empty-title">Записей не найдено</span>
            {hasFilters && (
              <button type="button" className="btn btn-outline" onClick={onResetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </div>

      <div className="island-foot">
        <div className="row small muted">
          <span>На странице</span>
          <div className="seg">
            {PAGE_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`seg-item ${pageSize === sz ? 'on' : ''}`}
                onClick={() => onPageSizeChange(sz)}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            aria-label="Назад"
          >
            <ChevronLeft className="ic" />
          </button>

          {Array.from({ length: Math.max(1, totalPages) }, (_, idx) => idx).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-ghost btn-sm ${p === page ? 'on' : ''}`}
              disabled={loading}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            aria-label="Вперёд"
          >
            <ChevronRight className="ic" />
          </button>
        </div>
      </div>
    </section>
  );
};
