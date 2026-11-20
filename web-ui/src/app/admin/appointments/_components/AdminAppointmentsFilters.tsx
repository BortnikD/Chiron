'use client';

import React, { useMemo } from 'react';
import { CalendarPlus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { AppointmentStatus, User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { APPOINTMENT_STATUS_LIST, APPOINTMENT_STATUS_META, formatCurrency, getDoctorDisplay, getSpecStyle, getSpecTone, getUserComboboxOption } from '@/shared/lib';

export interface AdminAppointmentsFiltersProps {
  vetFilter: string;
  onVetFilterChange: (value: string) => void;
  petFilter: string;
  onPetFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  statusFilters: AppointmentStatus[];
  onToggleStatusFilter: (status: AppointmentStatus) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  veterinarians: Veterinarian[];
  pets: Pet[];
  users: User[];
  services: Service[];
  onCreateClick: () => void;
}

/**
 * Панель фильтрации записей на приём: 4 комбобокса (врач, питомец, владелец, услуга), даты и статусы.
 */
export const AdminAppointmentsFilters: React.FC<AdminAppointmentsFiltersProps> = ({
  vetFilter,
  onVetFilterChange,
  petFilter,
  onPetFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  serviceFilter,
  onServiceFilterChange,
  statusFilters,
  onToggleStatusFilter,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  veterinarians,
  pets,
  users,
  services,
  onCreateClick,
}) => {
  const vetOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все врачи' },
      ...veterinarians.map((v) => {
        const d = getDoctorDisplay(v);
        return {
          value: v.id,
          label: d.fullName,
          hint: d.specName,
          avatar: (
            <VetAvatar
              vet={v}
              initials={d.initials}
              tone={getSpecTone(v.specializationId)}
              style={getSpecStyle(v.specializationId)}
              variant="thumb"
              className="t-ava xs round"
              alt={d.fullName}
            />
          ),
        };
      }),
    ],
    [veterinarians]
  );

  const petOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все питомцы' },
      ...pets.map((p) => {
        const owner = users.find((u) => u.id === p.ownerId);
        const ownerName = owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.fullName : undefined;
        return {
          value: p.id,
          label: p.name,
          hint: ownerName,
          keywords: [p.name, p.breed, ownerName, owner?.phone].filter(Boolean) as string[],
        };
      }),
    ],
    [pets, users]
  );

  const ownerOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все владельцы' },
      ...users
        .filter((u) => u.role === 'CLIENT')
        .map(getUserComboboxOption),
    ],
    [users]
  );

  const serviceOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все услуги' },
      ...services.map((s) => ({
        value: s.id,
        label: s.name,
        hint: formatCurrency(s.basePrice),
      })),
    ],
    [services]
  );

  return (
    <section className="island filters" aria-label="Фильтры записей">
      <div className="field" style={{ minWidth: 180 }}>
        <label className="field-label" htmlFor="aa-vet">
          Врач
        </label>
        <SearchCombobox
          id="aa-vet"
          value={vetFilter}
          options={vetOptions}
          onChange={onVetFilterChange}
          placeholder="Все врачи"
        />
      </div>

      <div className="field" style={{ minWidth: 170 }}>
        <label className="field-label" htmlFor="aa-pet">
          Питомец
        </label>
        <SearchCombobox
          id="aa-pet"
          value={petFilter}
          options={petOptions}
          onChange={onPetFilterChange}
          placeholder="Все питомцы"
        />
      </div>

      <div className="field" style={{ minWidth: 185 }}>
        <label className="field-label" htmlFor="aa-owner">
          Владелец
        </label>
        <SearchCombobox
          id="aa-owner"
          value={ownerFilter}
          options={ownerOptions}
          onChange={onOwnerFilterChange}
          placeholder="Все владельцы"
        />
      </div>

      <div className="field" style={{ minWidth: 185 }}>
        <label className="field-label" htmlFor="aa-service">
          Услуга
        </label>
        <SearchCombobox
          id="aa-service"
          value={serviceFilter}
          options={serviceOptions}
          onChange={onServiceFilterChange}
          placeholder="Все услуги"
        />
      </div>

      <div className="row" style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'nowrap' }}>
        <div className="field" style={{ width: 140 }}>
          <label className="field-label" htmlFor="aa-from">
            С
          </label>
          <DatePicker
            id="aa-from"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={onDateFromChange}
            ariaLabel="Фильтр даты с"
          />
        </div>

        <div className="field" style={{ width: 140 }}>
          <label className="field-label" htmlFor="aa-to">
            По
          </label>
          <DatePicker
            id="aa-to"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={onDateToChange}
            ariaLabel="Фильтр даты по"
          />
        </div>
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="chips">
          {APPOINTMENT_STATUS_LIST.map((st) => {
            const on = statusFilters.includes(st);
            return (
              <button
                key={st}
                type="button"
                className={`chip ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => onToggleStatusFilter(st)}
              >
                {APPOINTMENT_STATUS_META[st].short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onCreateClick}>
        <CalendarPlus className="ic" size={16} />
        Создать запись
      </button>
    </section>
  );
};
