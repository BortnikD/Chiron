'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { VaccinationStatusTone } from './types';
import { STATUS_FILTERS } from './constants';

export interface VaccinationsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPetId: string;
  onPetChange: (petId: string) => void;
  statusFilter: VaccinationStatusTone;
  onStatusFilterChange: (status: VaccinationStatusTone) => void;
  pets: Pet[];
  onCreateClick: () => void;
}

/**
 * Панель фильтров: поиск по названию вакцины или питомцу, выбор питомца, статуса ревакцинации.
 */
export const VaccinationsFilters: React.FC<VaccinationsFiltersProps> = ({
  search,
  onSearchChange,
  selectedPetId,
  onPetChange,
  statusFilter,
  onStatusFilterChange,
  pets,
  onCreateClick,
}) => {
  return (
    <section
      className="island filters"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
        marginBottom: '14px',
      }}
      aria-label="Фильтры вакцинаций"
    >
      <div className="field" style={{ minWidth: '220px', flex: 1 }}>
        <label className="field-label" htmlFor="vx-search">
          Поиск вакцины или питомца
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

      <div className="field" style={{ minWidth: '180px' }}>
        <label className="field-label" htmlFor="vx-pet-filter">
          Питомец
        </label>
        <select
          id="vx-pet-filter"
          className="select"
          value={selectedPetId}
          onChange={(e) => onPetChange(e.target.value)}
        >
          <option value="all">Все питомцы</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label">Статус ревакцинации</span>
        <div className="seg" role="tablist">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`seg-item ${statusFilter === item.value ? 'on font-semibold' : ''}`}
              onClick={() => onStatusFilterChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onCreateClick}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <Plus className="ic" style={{ width: '16px', height: '16px' }} />
        <span>Вакцинация</span>
      </button>
    </section>
  );
};
