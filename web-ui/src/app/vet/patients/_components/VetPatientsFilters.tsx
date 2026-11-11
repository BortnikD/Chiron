'use client';

import React, { useMemo } from 'react';
import { PawPrint, Search, LayoutGrid, List } from 'lucide-react';
import type { Species } from '@/modules/clinic/types';
import { FilterDropdown } from '@/shared/components';

export interface VetPatientsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  speciesFilter: string;
  onSpeciesFilterChange: (speciesId: string) => void;
  speciesList: Species[];
  count: number;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
}

export function VetPatientsFilters({
  search,
  onSearchChange,
  speciesFilter,
  onSpeciesFilterChange,
  speciesList,
  count,
  viewMode,
  onViewModeChange,
}: VetPatientsFiltersProps) {
  const speciesOptions = useMemo(
    () => [
      { value: '', label: 'Все виды' },
      ...speciesList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .map((s) => ({ value: s.id, label: s.name })),
    ],
    [speciesList]
  );

  return (
    <>
      <div className="island-head">
        <span className="island-title">
          <PawPrint size={18} />
          Пациенты <span className="count">{count}</span>
        </span>
        <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
          {onViewModeChange && viewMode && (
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${viewMode === 'table' ? 'on' : ''}`}
                onClick={() => onViewModeChange('table')}
                title="Таблица"
                aria-label="Отображение таблицей"
              >
                <List size={14} className="ic" />
              </button>
              <button
                type="button"
                className={`seg-item ${viewMode === 'cards' ? 'on' : ''}`}
                onClick={() => onViewModeChange('cards')}
                title="Карточки"
                aria-label="Отображение карточками"
              >
                <LayoutGrid size={14} className="ic" />
              </button>
            </div>
          )}

          <div style={{ width: '170px' }}>
            <FilterDropdown
              value={speciesFilter}
              options={speciesOptions}
              onChange={onSpeciesFilterChange}
              placeholder="Все виды"
              ariaLabel="Фильтр по виду"
            />
          </div>

          <div className="input-icon" style={{ width: '240px', maxWidth: '100%' }}>
            <Search size={14} className="ic" />
            <input
              type="text"
              className="input input-sm"
              placeholder="Кличка или вид…"
              aria-label="Поиск по кличке"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
