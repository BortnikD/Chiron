'use client';

import React, { useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { FilterDropdown } from '@/shared/components';
import type { Species } from '@/modules/clinic/types';
import type { ArchiveFilter } from './types';

export interface PetsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  archiveFilter: ArchiveFilter;
  onArchiveFilterChange: (filter: ArchiveFilter) => void;
  speciesList: Species[];
  selectedSpeciesId: string;
  onSpeciesChange: (speciesId: string) => void;
  onAddPet: () => void;
}

export function PetsFilters({
  searchQuery,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  speciesList,
  selectedSpeciesId,
  onSpeciesChange,
  onAddPet,
}: PetsFiltersProps) {
  const speciesOptions = useMemo(
    () => [
      { value: '', label: 'Все виды' },
      ...speciesList.map((s) => ({ value: s.id, label: s.name })),
    ],
    [speciesList]
  );

  return (
    <section className="island filters" aria-label="Фильтры питомцев">
      <div className="field" style={{ width: '220px' }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon" style={{ position: 'relative' }}>
          <Search className="ic" />
          <input
            type="text"
            className="input"
            placeholder="Кличка или заметки…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ paddingRight: searchQuery ? '30px' : undefined }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => onSearchChange('')}
              aria-label="Очистить поиск"
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
              }}
            >
              <X className="ic" />
            </button>
          )}
        </div>
      </div>

      <div className="field" style={{ width: '170px' }}>
        <span className="field-label">Вид</span>
        <FilterDropdown
          value={selectedSpeciesId}
          options={speciesOptions}
          onChange={onSpeciesChange}
          placeholder="Все виды"
          ariaLabel="Фильтр по виду животного"
        />
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Показать</span>
        <div className="seg" role="group" aria-label="Фильтр по архиву">
          <button
            type="button"
            className={`seg-item ${archiveFilter === 'ACTIVE' ? 'on' : ''}`}
            onClick={() => onArchiveFilterChange('ACTIVE')}
          >
            Активные
          </button>
          <button
            type="button"
            className={`seg-item ${archiveFilter === 'ARCHIVED' ? 'on' : ''}`}
            onClick={() => onArchiveFilterChange('ARCHIVED')}
          >
            Архив
          </button>
          <button
            type="button"
            className={`seg-item ${archiveFilter === 'ALL' ? 'on' : ''}`}
            onClick={() => onArchiveFilterChange('ALL')}
          >
            Все
          </button>
        </div>
      </div>

      <div className="spacer" />

      <button type="button" className="btn btn-primary" onClick={onAddPet}>
        <Plus className="ic" />
        <span>Добавить питомца</span>
      </button>
    </section>
  );
}
