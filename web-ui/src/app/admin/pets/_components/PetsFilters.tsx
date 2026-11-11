'use client';

import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import {
  FilterDropdown,
  SearchCombobox,
  type FilterDropdownOption,
  type SearchComboboxOption,
} from '@/shared/components';
import type { GenderFilter, PetsFiltersProps } from './types';
import { GENDER_OPTIONS, STATUS_OPTIONS } from './constants';

/**
 * Панель фильтрации питомцев:
 * владелец (SearchCombobox), вид и пол (FilterDropdown), статус (.seg), поиск по кличке.
 */
export const PetsFilters: React.FC<PetsFiltersProps> = ({
  ownerFilter,
  onOwnerFilterChange,
  speciesFilter,
  onSpeciesFilterChange,
  genderFilter,
  onGenderFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  speciesList,
  users,
  onOpenCreate,
}) => {
  const ownerOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'ALL', label: 'Все владельцы' },
      ...users
        .filter((u) => u.role === 'CLIENT')
        .map((u) => ({
          value: u.id,
          label: u.fullName || u.email,
          hint: u.phone || u.email,
        })),
    ],
    [users]
  );

  const speciesOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Все виды' },
      ...speciesList.map((s) => ({ value: s.id, label: s.name })),
    ],
    [speciesList]
  );

  const genderOptions = useMemo<FilterDropdownOption[]>(
    () => GENDER_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    []
  );

  return (
    <section className="island filters" aria-label="Фильтры питомцев">
      <div className="field" style={{ minWidth: 185 }}>
        <label className="field-label" htmlFor="pt-owner">
          Владелец
        </label>
        <SearchCombobox
          id="pt-owner"
          value={ownerFilter}
          options={ownerOptions}
          onChange={onOwnerFilterChange}
          placeholder="Все владельцы"
        />
      </div>

      <div className="field" style={{ minWidth: 145 }}>
        <label className="field-label" htmlFor="pt-species">
          Вид
        </label>
        <FilterDropdown
          id="pt-species"
          value={speciesFilter}
          options={speciesOptions}
          onChange={onSpeciesFilterChange}
          ariaLabel="Вид животного"
        />
      </div>

      <div className="field" style={{ minWidth: 130 }}>
        <label className="field-label" htmlFor="pt-gender">
          Пол
        </label>
        <FilterDropdown
          id="pt-gender"
          value={genderFilter}
          options={genderOptions}
          onChange={(v) => onGenderFilterChange(v as GenderFilter)}
          ariaLabel="Пол питомца"
        />
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="seg">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`seg-item ${statusFilter === opt.value ? 'on' : ''}`}
              onClick={() => onStatusFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ width: 190 }}>
        <label className="field-label" htmlFor="pt-q">
          Кличка
        </label>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            id="pt-q"
            type="text"
            className="input"
            placeholder="Часть клички…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onOpenCreate}>
        <Plus size={16} />
        Добавить питомца
      </button>
    </section>
  );
};
