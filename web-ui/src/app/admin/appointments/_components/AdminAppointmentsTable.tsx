'use client';

import React from 'react';
import { Calendar, Repeat, Edit2, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateTimeCompact,
  getSpeciesTone,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface AdminAppointmentsTableProps {
  appointments: Appointment[];
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  selectedAppt: Appointment | null;
  loading: boolean;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  onSelect: (appt: Appointment) => void;
  onEdit?: (appt: Appointment) => void;
  onCancel?: (appt: Appointment) => void;
  onDelete?: (appt: Appointment) => void;
}

/**
 * Табличный список записей на приём (.dtable, .trow, бейджи, действия).
 */
export const AdminAppointmentsTable: React.FC<AdminAppointmentsTableProps> = ({
  appointments,
  veterinarians,
  services,
  pets,
  users,
  selectedAppt,
  loading,
  page = 0,
  totalPages = 1,
  totalElements,
  onPageChange,
  onSelect,
  onEdit,
  onCancel,
  onDelete,
}) => {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Calendar size={18} />
          Записи{' '}
          <span className="count">
            Найдено: {totalElements !== undefined && totalPages > 1 ? `${appointments.length} (всего ${totalElements})` : appointments.length}
          </span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.4fr 1.1fr 1fr 1.3fr 1fr 1fr 0.8fr 72px',
              minWidth: '920px',
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
                      style={{ color: 'var(--primary)' }}
                      aria-label="Повторный приём"
                    />
                  )}
                </span>

                <span className="pet-cell">
                  <span className={`t-ava xs tone-${getSpeciesTone(p?.species?.name || p?.speciesId)}`}>
                    {p?.name ? p.name.slice(0, 2).toUpperCase() : 'ПТ'}
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
                  {onEdit && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-xs"
                      title="Редактировать запись"
                      aria-label="Редактировать"
                      onClick={() => onEdit(a)}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {onCancel && a.status !== 'CANCELLED' && (
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
                  {onDelete && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-xs text-destructive"
                      title="Удалить запись"
                      aria-label="Удалить"
                      onClick={() => onDelete(a)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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
            <span className="empty-title">Записи не найдены</span>
          </div>
        )}
      </div>

      {onPageChange && totalPages > 1 && (
        <div
          className="row between"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          <span className="small muted">
            Страница {page + 1} из {totalPages}
          </span>

          <div className="pager">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon"
              disabled={page <= 0 || loading}
              onClick={() => onPageChange(Math.max(0, page - 1))}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="ic" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx).map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${p === page ? 'on' : 'btn-ghost'}`}
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
              aria-label="Следующая страница"
            >
              <ChevronRight className="ic" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
