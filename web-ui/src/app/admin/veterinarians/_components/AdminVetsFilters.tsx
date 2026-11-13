'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Specialization, Species } from '@/modules/clinic/types';
import { FilterDropdown, type FilterDropdownOption } from '@/shared/components';
import type { VetActiveFilter } from '../_hooks/useAdminVeterinarians';

export interface AdminVetsFiltersProps {
  filterSpec: string;
  onFilterSpecChange: (value: string) => void;
  filterSpecies: string;
  onFilterSpeciesChange: (value: string) => void;
  filterActive: VetActiveFilter;
  onFilterActiveChange: (value: VetActiveFilter) => void;
  specializations: Specialization[];
  speciesList: Species[];
  onCreateClick: () => void;
}

const ACTIVE_OPTIONS: Array<{ value: VetActiveFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'INACTIVE', label: 'Неактивные' },
];

export const AdminVetsFilters: React.FC<AdminVetsFiltersProps> = ({
  filterSpec,
  onFilterSpecChange,
  filterSpecies,
  onFilterSpeciesChange,
  filterActive,
  onFilterActiveChange,
  specializations,
  speciesList,
  onCreateClick,
}) => {
  const specOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Все специализации' },
      ...specializations.map((s) => ({ value: s.id, label: s.name })),
    ],
    [specializations]
  );

  const speciesOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Любой допуск' },
      ...speciesList.map((sp) => ({ value: sp.id, label: sp.name })),
    ],
    [speciesList]
  );

  return (
    <section className="island filters" aria-label="Фильтры врачей">
      <div className="field" style={{ minWidth: 185 }}>
        <label className="field-label" htmlFor="vt-spec">
          Специализация
        </label>
        <FilterDropdown
          id="vt-spec"
          value={filterSpec}
          options={specOptions}
          onChange={onFilterSpecChange}
          ariaLabel="Фильтр по специализации"
        />
      </div>

      <div className="field" style={{ minWidth: 165 }}>
        <label className="field-label" htmlFor="vt-species">
          Допуск к виду
        </label>
        <FilterDropdown
          id="vt-species"
          value={filterSpecies}
          options={speciesOptions}
          onChange={onFilterSpeciesChange}
          ariaLabel="Фильтр по допуску к виду"
        />
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="seg">
          {ACTIVE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`seg-item ${filterActive === opt.value ? 'on' : ''}`}
              onClick={() => onFilterActiveChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onCreateClick}>
        <Plus size={16} />
        Создать профиль врача
      </button>
    </section>
  );
};
