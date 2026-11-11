'use client';

import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Specialization, Species } from '@/modules/clinic/types';
import { FilterDropdown, type FilterDropdownOption } from '@/shared/components';
import { SERVICE_ACTIVE_OPTIONS, type ServiceActiveFilter } from './constants';

export interface ServicesFiltersProps {
  filterSpec: string;
  onFilterSpecChange: (spec: string) => void;
  filterSpecies: string;
  onFilterSpeciesChange: (species: string) => void;
  filterActive: ServiceActiveFilter;
  onFilterActiveChange: (active: ServiceActiveFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  specializations: Specialization[];
  speciesList: Species[];
  onOpenCreate: () => void;
}

export const ServicesFilters: React.FC<ServicesFiltersProps> = ({
  filterSpec,
  onFilterSpecChange,
  filterSpecies,
  onFilterSpeciesChange,
  filterActive,
  onFilterActiveChange,
  search,
  onSearchChange,
  specializations,
  speciesList,
  onOpenCreate,
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
      { value: 'ALL', label: 'Любой вид' },
      ...speciesList.map((sp) => ({ value: sp.id, label: sp.name })),
    ],
    [speciesList]
  );

  return (
    <section className="island filters" aria-label="Фильтры услуг">
      <div className="field" style={{ minWidth: 185 }}>
        <label className="field-label" htmlFor="sv-spec">
          Специализация
        </label>
        <FilterDropdown
          id="sv-spec"
          value={filterSpec}
          options={specOptions}
          onChange={onFilterSpecChange}
          ariaLabel="Фильтр по специализации"
        />
      </div>

      <div className="field" style={{ minWidth: 155 }}>
        <label className="field-label" htmlFor="sv-species">
          Для вида
        </label>
        <FilterDropdown
          id="sv-species"
          value={filterSpecies}
          options={speciesOptions}
          onChange={onFilterSpeciesChange}
          ariaLabel="Фильтр по виду животного"
        />
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="seg">
          {SERVICE_ACTIVE_OPTIONS.map((opt) => (
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

      <div className="field" style={{ width: 185 }}>
        <label className="field-label" htmlFor="sv-search">
          Поиск
        </label>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            id="sv-search"
            type="text"
            className="input"
            placeholder="Название…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onOpenCreate}>
        <Plus size={16} />
        Новая услуга
      </button>
    </section>
  );
};
