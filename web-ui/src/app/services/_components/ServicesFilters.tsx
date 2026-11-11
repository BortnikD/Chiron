'use client';

import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { FilterDropdown, type FilterDropdownOption } from '@/shared/components';
import { SPECIALIZATION_NAMES_RU } from '@/utils/doctorHelpers';
import type { ServicesFiltersProps, ServiceSortOption } from './types';

const SORT_OPTIONS: FilterDropdownOption[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'duration-asc', label: 'Короче по времени' },
  { value: 'duration-desc', label: 'Дольше по времени' },
];

export function ServicesFilters({
  specializations,
  speciesList,
  selectedSpec,
  onSelectSpec,
  selectedSpecies,
  onSelectSpecies,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  hasFilters,
  onReset,
}: ServicesFiltersProps) {
  const specOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Все специализации' },
      ...specializations.map((sp) => ({
        value: sp.id,
        label: SPECIALIZATION_NAMES_RU[sp.name] || SPECIALIZATION_NAMES_RU[sp.id] || sp.name,
      })),
    ],
    [specializations]
  );

  const speciesOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: 'ALL', label: 'Все виды' },
      ...speciesList.map((sp) => ({ value: sp.id, label: sp.name })),
    ],
    [speciesList]
  );

  return (
    <section className="island filters" aria-label="Фильтры">
      <div className="field">
        <span className="field-label">Специализация</span>
        <FilterDropdown
          id="sf-spec"
          ariaLabel="Специализация"
          value={selectedSpec}
          options={specOptions}
          onChange={onSelectSpec}
          placeholder="Все специализации"
        />
      </div>

      <div className="field">
        <span className="field-label">Вид животного</span>
        <FilterDropdown
          id="sf-species"
          ariaLabel="Вид животного"
          value={selectedSpecies}
          options={speciesOptions}
          onChange={onSelectSpecies}
          placeholder="Все виды"
        />
      </div>

      <div className="field">
        <span className="field-label">Сортировка</span>
        <FilterDropdown
          id="sf-sort"
          ariaLabel="Сортировка"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(val) => onSortChange(val as ServiceSortOption)}
        />
      </div>

      <div className="field" style={{ flex: '1 1 200px', minWidth: 0 }}>
        <label className="field-label" htmlFor="sf-search">
          Поиск
        </label>
        <div className="input-icon">
          <Search className="ic" />
          <input
            id="sf-search"
            type="text"
            placeholder="Название или описание..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input"
            style={{ paddingRight: searchQuery ? '32px' : undefined }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="btn btn-ghost btn-icon btn-sm"
              style={{
                position: 'absolute',
                right: '4px',
                width: '26px',
                height: '26px',
              }}
              title="Очистить поиск"
              aria-label="Очистить поиск"
            >
              <X style={{ width: '13px', height: '13px' }} />
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onReset}
          style={{ marginBottom: '3px' }}
        >
          Сбросить
        </button>
      )}
    </section>
  );
}
