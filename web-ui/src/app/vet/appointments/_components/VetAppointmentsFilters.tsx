'use client';

import React, { useMemo } from 'react';
import { CalendarDays, List } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import { DatePicker, FilterDropdown } from '@/shared/components';
import { APPOINTMENT_STATUS_LIST, APPOINTMENT_STATUS_META } from '@/shared/lib';
import type { AppointmentsTab, AppointmentsViewMode } from '../_hooks/useVetAppointments';

const TABS: Array<{ id: AppointmentsTab; label: string }> = [
  { id: 'upcoming', label: 'Предстоящие' },
  { id: 'history', label: 'История' },
  { id: 'all', label: 'Все' },
];

export interface VetAppointmentsFiltersProps {
  viewMode: AppointmentsViewMode;
  onViewModeChange: (mode: AppointmentsViewMode) => void;
  tab: AppointmentsTab;
  onTabChange: (tab: AppointmentsTab) => void;
  petFilter: string;
  onPetFilterChange: (petId: string) => void;
  patients: Pet[];
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  statusFilter: AppointmentStatus[];
  onToggleStatus: (status: AppointmentStatus) => void;
}

export const VetAppointmentsFilters: React.FC<VetAppointmentsFiltersProps> = ({
  viewMode,
  onViewModeChange,
  tab,
  onTabChange,
  petFilter,
  onPetFilterChange,
  patients,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  statusFilter,
  onToggleStatus,
}) => {
  const isTable = viewMode === 'table';

  const petOptions = useMemo(
    () => [
      { value: '', label: 'Все пациенты' },
      ...patients.map((p) => ({ value: p.id, label: p.name })),
    ],
    [patients]
  );

  return (
    <section className="island filters" aria-label="Фильтры">
      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Вид</span>
        <div className="seg">
          <button
            type="button"
            className={`seg-item ${isTable ? 'on' : ''}`}
            onClick={() => onViewModeChange('table')}
          >
            <List className="ic" />
            Таблица
          </button>
          <button
            type="button"
            className={`seg-item ${!isTable ? 'on' : ''}`}
            onClick={() => onViewModeChange('cal')}
          >
            <CalendarDays className="ic" />
            Календарь
          </button>
        </div>
      </div>

      {isTable && (
        <div className="field" style={{ width: 'auto' }}>
          <span className="field-label">Показать</span>
          <div className="seg">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`seg-item ${tab === t.id ? 'on' : ''}`}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <span className="field-label">Пациент</span>
        <FilterDropdown
          value={petFilter}
          options={petOptions}
          onChange={onPetFilterChange}
          placeholder="Все пациенты"
          searchable
          ariaLabel="Фильтр по пациенту"
        />
      </div>

      {isTable && (
        <>
          <div className="field" style={{ width: '150px' }}>
            <label className="field-label" htmlFor="ap-from">
              С
            </label>
            <DatePicker
              id="ap-from"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={onDateFromChange}
            />
          </div>

          <div className="field" style={{ width: '150px' }}>
            <label className="field-label" htmlFor="ap-to">
              По
            </label>
            <DatePicker
              id="ap-to"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={onDateToChange}
            />
          </div>
        </>
      )}

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="chips">
          {APPOINTMENT_STATUS_LIST.map((st) => {
            const on = statusFilter.includes(st);
            return (
              <button
                key={st}
                type="button"
                className={`chip ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => onToggleStatus(st)}
              >
                {APPOINTMENT_STATUS_META[st].short}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
