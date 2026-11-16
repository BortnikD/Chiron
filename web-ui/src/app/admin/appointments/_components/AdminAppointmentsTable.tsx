'use client';

import React, { useMemo } from 'react';
import {
  CalendarDays,
  Edit2,
  Repeat,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { DataTable, type DataTableColumn, type PaginationFooterProps } from '@/shared/components';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateTimeCompact,
  getSpeciesTone,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/shared/lib';
import { type ActiveFilterChip } from './utils';

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
  paginationProps?: PaginationFooterProps;
}

/**
 * Таблица записей на приём в административной панели на базе DataTable.
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
  paginationProps,
}) => {
  const hasFilters = activeFilters.length > 0;

  const columns: DataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: 'startAt',
        title: 'Дата и время ↑',
        width: '1.45fr',
        render: (a) => {
          const dt = formatDateTimeCompact(a.startAt);
          return (
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
          );
        },
      },
      {
        key: 'pet',
        title: 'Питомец',
        width: '1.1fr',
        render: (a) => {
          const p = pets.find((item) => item.id === a.petId);
          const tone = getSpeciesTone(p?.species?.name || p?.speciesName || p?.speciesId, speciesList);
          return (
            <span className="pet-cell">
              <PetAvatar
                pet={p}
                tone={tone}
                species={tone}
                iconSize={14}
                variant="thumb"
                className={`t-ava xs tone-${tone}`}
              />
              <span>{p?.name || 'Питомец'}</span>
            </span>
          );
        },
      },
      {
        key: 'owner',
        title: 'Владелец',
        width: '1fr',
        render: (a) => {
          const p = pets.find((item) => item.id === a.petId);
          const ownerName = (p?.ownerId && users.find((u) => u.id === p.ownerId)?.fullName) || '—';
          return <span className="muted">{ownerName}</span>;
        },
      },
      {
        key: 'service',
        title: 'Услуга',
        width: '1.3fr',
        render: (a) => {
          const serviceName = services.find((s) => s.id === a.serviceId)?.name || 'Услуга клиники';
          return <span>{serviceName}</span>;
        },
      },
      {
        key: 'vet',
        title: 'Врач',
        width: '1fr',
        render: (a) => {
          const rawVet = veterinarians.find((v) => v.id === a.veterinarianId);
          const vetName = getDoctorDisplay(rawVet).fullName;
          return <span>{vetName}</span>;
        },
      },
      {
        key: 'status',
        title: 'Статус',
        width: '1fr',
        render: (a) => {
          const sInfo = APPOINTMENT_STATUS_META[a.status] || {
            label: a.status,
            short: a.status,
            cls: 'badge-outline',
          };
          return <span className={`badge st ${sInfo.cls}`}>{sInfo.short}</span>;
        },
      },
      {
        key: 'price',
        title: 'Цена',
        width: '0.75fr',
        align: 'right',
        render: (a) => (
          <span className="right tnum">{formatCurrency(a.priceSnapshot || a.price)}</span>
        ),
      },
      {
        key: 'actions',
        title: 'Действия',
        width: '76px',
        align: 'right',
        render: (a) => (
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
        ),
      },
    ],
    [pets, users, services, veterinarians, speciesList, onEdit, onCancel, onDelete]
  );

  const pagProps = paginationProps || {
    page,
    pageSize,
    totalElements,
    totalPages,
    loading,
    pageSizes: [10, 25, 50],
    onPageChange,
    onPageSizeChange,
  };

  const activeChipsElement = hasFilters ? (
    <>
      <span className="small muted">Фильтры:</span>
      {activeFilters.map((f) => (
        <span key={f.key} className="badge badge-accent row" style={{ gap: 4 }}>
          {f.label}
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-xs"
            onClick={f.clear}
            aria-label={`Удалить фильтр ${f.label}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-xs text-destructive"
        onClick={onResetFilters}
      >
        Сбросить все
      </button>
    </>
  ) : undefined;

  const emptyAction = hasFilters ? (
    <div style={{ marginTop: '12px' }}>
      <button type="button" className="btn btn-outline" onClick={onResetFilters}>
        Сбросить фильтры
      </button>
    </div>
  ) : undefined;

  return (
    <DataTable<Appointment>
      columns={columns}
      data={appointments}
      selectedId={selectedAppt?.id}
      onRowClick={onSelect}
      loading={loading}
      emptyText="Записей не найдено"
      emptyIcon={emptyAction}
      title="Записи на приём"
      icon={<CalendarDays size={18} />}
      count={totalElements}
      activeFilterChips={activeChipsElement}
      paginationProps={pagProps}
      minWidth="940px"
    />
  );
};
