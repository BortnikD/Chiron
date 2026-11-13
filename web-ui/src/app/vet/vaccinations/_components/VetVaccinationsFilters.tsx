'use client';

import React, { useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import { DatePicker, FilterDropdown } from '@/shared/components';
import type { VaccinationStatusFilter } from '../_hooks/useVetVaccinations';

const STATUS_OPTIONS: Array<{ value: VaccinationStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'OVERDUE', label: 'Просрочена' },
  { value: 'SOON', label: 'Скоро' },
  { value: 'OK', label: 'В порядке' },
];

export interface VetVaccinationsFiltersProps {
  petFilter: string;
  onPetFilterChange: (petId: string) => void;
  patients: Pet[];
  nameQuery: string;
  onNameQueryChange: (q: string) => void;
  nextDueFrom: string;
  onNextDueFromChange: (iso: string) => void;
  nextDueTo: string;
  onNextDueToChange: (iso: string) => void;
  statusFilter: VaccinationStatusFilter;
  onStatusFilterChange: (status: VaccinationStatusFilter) => void;
  onAddClick: () => void;
}

export const VetVaccinationsFilters: React.FC<VetVaccinationsFiltersProps> = ({
  petFilter,
  onPetFilterChange,
  patients,
  nameQuery,
  onNameQueryChange,
  nextDueFrom,
  onNextDueFromChange,
  nextDueTo,
  onNextDueToChange,
  statusFilter,
  onStatusFilterChange,
  onAddClick,
}) => {
  const petOptions = useMemo(
    () => [
      { value: '', label: 'Все пациенты' },
      ...patients.map((p) => ({ value: p.id, label: p.name })),
    ],
    [patients]
  );

  return (
    <section className="island filters" aria-label="Фильтры прививок">
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

      <div className="field" style={{ width: '210px' }}>
        <label className="field-label" htmlFor="vx-q">
          Вакцина
        </label>
        <div className="input-icon">
          <Search className="ic" />
          <input
            id="vx-q"
            className="input"
            placeholder="Часть названия"
            value={nameQuery}
            onChange={(e) => onNameQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="vx-from">
          Ревакцинация с
        </label>
        <DatePicker
          id="vx-from"
          value={nextDueFrom}
          max={nextDueTo || undefined}
          onChange={onNextDueFromChange}
        />
      </div>

      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="vx-to">
          по
        </label>
        <DatePicker
          id="vx-to"
          value={nextDueTo}
          min={nextDueFrom || undefined}
          onChange={onNextDueToChange}
        />
      </div>

      <div className="field" style={{ width: '155px' }}>
        <span className="field-label">Срок</span>
        <FilterDropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(v) => onStatusFilterChange((v as VaccinationStatusFilter) || 'ALL')}
          ariaLabel="Фильтр по сроку ревакцинации"
        />
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onAddClick}>
        <Plus className="ic" />
        Внести прививку
      </button>
    </section>
  );
};
