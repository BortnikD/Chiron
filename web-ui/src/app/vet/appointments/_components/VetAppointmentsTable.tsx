'use client';

import React, { useMemo } from 'react';
import { Calendar, CalendarDays, Repeat, X } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { DataTable, type DataTableColumn, type PaginationFooterProps } from '@/shared/components';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import { getPetName } from '../../dashboard/_components/utils';

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
  paginationProps?: PaginationFooterProps;
}

/**
 * Таблица записей на приём в кабинете врача на базе DataTable.
 */
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
  paginationProps,
}) => {
  const activeChips = useMemo(() => {
    const list: Array<{ key: string; label: string; clear: () => void }> = [];
    if (petFilter && petsMap[petFilter]) {
      list.push({ key: 'pet', label: `Пациент: ${petsMap[petFilter].name}`, clear: onClearPet });
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

  const columns: DataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: 'dateTime',
        title: 'Дата и время',
        width: '1.6fr',
        render: (a) => (
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
        ),
      },
      {
        key: 'patient',
        title: 'Пациент',
        width: '1fr',
        render: (a) => {
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
          return (
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
          );
        },
      },
      {
        key: 'service',
        title: 'Услуга',
        width: '1.6fr',
        render: (a) => {
          const serviceName =
            a.serviceName || a.service?.name || servicesMap[a.serviceId] || 'Приём';
          return <span>{serviceName}</span>;
        },
      },
      {
        key: 'status',
        title: 'Статус',
        width: '1.3fr',
        render: (a) => {
          const stMeta = APPOINTMENT_STATUS_META[a.status];
          return (
            <span className={`badge st badge-${a.status}`} title={stMeta?.label || a.status}>
              {stMeta?.short || a.status}
            </span>
          );
        },
      },
      {
        key: 'price',
        title: 'Цена',
        width: '0.8fr',
        align: 'right',
        render: (a) => (
          <span className="right tnum">
            {formatCurrency(a.priceSnapshot ?? a.price ?? 0)}
          </span>
        ),
      },
    ],
    [petsMap, servicesMap, speciesMap]
  );

  const pagProps = paginationProps || {
    page,
    pageSize: size,
    totalElements,
    totalPages,
    loading,
    pageSizes: [10, 20, 50],
    onPageChange,
    onPageSizeChange: onSizeChange,
  };

  const activeChipsElement = activeChips.length > 0 ? (
    <>
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
    </>
  ) : undefined;

  const emptyAction = activeChips.length > 0 ? (
    <div style={{ marginTop: '12px' }}>
      <button type="button" className="btn btn-outline" onClick={onResetAll}>
        Сбросить фильтры
      </button>
    </div>
  ) : undefined;

  return (
    <DataTable<Appointment>
      columns={columns}
      data={appointments}
      selectedId={selectedAppt?.id}
      onRowClick={onSelectAppointment}
      loading={loading}
      emptyText="Записей не найдено"
      emptyIcon={emptyAction}
      title="Мои записи"
      icon={<Calendar className="ic" />}
      count={totalElements}
      headerActions={
        activeChips.length > 0 ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onResetAll}>
            Сбросить всё
          </button>
        ) : undefined
      }
      activeFilterChips={activeChipsElement}
      paginationProps={pagProps}
      minWidth="720px"
    />
  );
};
