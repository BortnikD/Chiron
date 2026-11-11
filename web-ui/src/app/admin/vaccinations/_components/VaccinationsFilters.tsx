'use client';

import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import type { VaccinationStatusTone } from './types';
import { STATUS_FILTERS } from './constants';

export interface VaccinationsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPetId: string;
  onPetChange: (petId: string) => void;
  nextDueFrom: string;
  onNextDueFromChange: (iso: string) => void;
  nextDueTo: string;
  onNextDueToChange: (iso: string) => void;
  statusFilter: VaccinationStatusTone;
  onStatusFilterChange: (status: VaccinationStatusTone) => void;
  pets: Pet[];
  users: User[];
  onCreateClick: () => void;
}

/**
 * Панель фильтров вакцинаций: питомец (SearchCombobox), вакцина, диапазон ревакцинации (DatePicker), статус (.seg).
 */
export const VaccinationsFilters: React.FC<VaccinationsFiltersProps> = ({
  search,
  onSearchChange,
  selectedPetId,
  onPetChange,
  nextDueFrom,
  onNextDueFromChange,
  nextDueTo,
  onNextDueToChange,
  statusFilter,
  onStatusFilterChange,
  pets,
  users,
  onCreateClick,
}) => {
  const petOptions = useMemo<SearchComboboxOption[]>(
    () => [
      { value: 'all', label: 'Все питомцы' },
      ...pets.map((p) => ({
        value: p.id,
        label: p.name,
        hint: users.find((u) => u.id === p.ownerId)?.fullName || undefined,
      })),
    ],
    [pets, users]
  );

  return (
    <section
      className="island filters"
      style={{ marginBottom: '14px' }}
      aria-label="Фильтры прививок"
    >
      <div className="field" style={{ minWidth: '185px' }}>
        <label className="field-label" htmlFor="vx-pet-filter">
          Питомец
        </label>
        <SearchCombobox
          id="vx-pet-filter"
          value={selectedPetId}
          options={petOptions}
          onChange={onPetChange}
          placeholder="Все питомцы"
        />
      </div>

      <div className="field" style={{ minWidth: '200px', flex: 1 }}>
        <label className="field-label" htmlFor="vx-search">
          Вакцина
        </label>
        <div className="input-icon">
          <Search className="ic" />
          <input
            id="vx-search"
            className="input"
            placeholder="Название препарата или кличка…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
          ariaLabel="Ревакцинация с"
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
          ariaLabel="Ревакцинация по"
        />
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
        <div className="seg" role="tablist">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`seg-item ${statusFilter === item.value ? 'on' : ''}`}
              onClick={() => onStatusFilterChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onCreateClick}>
        <Plus className="ic" size={16} />
        <span>Добавить прививку</span>
      </button>
    </section>
  );
};
