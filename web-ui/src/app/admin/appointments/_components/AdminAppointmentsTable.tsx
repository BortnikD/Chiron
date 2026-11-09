'use client';

import React from 'react';
import { Appointment, Veterinarian, Service, Pet, User } from '../../../../types';
import { Calendar, Repeat, Edit2, XCircle, Trash2 } from 'lucide-react';
import { getSpeciesTone } from '../../../../components/ui/SpeciesIcon';
import {
  STATUS_MAP,
  getVetName,
  getServiceName,
  getPet,
  getOwnerName,
  formatDateTime,
  formatPrice,
} from './utils';

export interface AdminAppointmentsTableProps {
  appointments: Appointment[];
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  selectedAppt: Appointment | null;
  loading: boolean;
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
          Записи <span className="count">Найдено: {appointments.length}</span>
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
            const dt = formatDateTime(a.startAt);
            const p = getPet(a.petId, pets);
            const sInfo = STATUS_MAP[a.status] || {
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
                  <span className={`t-ava xs ${getSpeciesTone(p?.speciesId)}`}>
                    {p?.name ? p.name.slice(0, 2).toUpperCase() : 'ПТ'}
                  </span>
                  <span>{p?.name || 'Питомец'}</span>
                </span>

                <span className="muted">{getOwnerName(p?.ownerId, users)}</span>
                <span>{getServiceName(a.serviceId, services)}</span>
                <span>{getVetName(a.veterinarianId, veterinarians, users)}</span>
                <span>
                  <span className={`badge st ${sInfo.cls}`}>{sInfo.short}</span>
                </span>
                <span className="right tnum">{formatPrice(a.priceSnapshot || a.price)}</span>

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
            <span className="empty-title">Загрузка записей…</span>
          </div>
        )}

        {appointments.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Записи не найдены</span>
          </div>
        )}
      </div>
    </section>
  );
};
