'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Specialization, Species } from '../../../../types';

export interface ServicesFiltersProps {
  filterSpec: string;
  onFilterSpecChange: (spec: string) => void;
  filterSpecies: string;
  onFilterSpeciesChange: (species: string) => void;
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
  search,
  onSearchChange,
  specializations,
  speciesList,
  onOpenCreate,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры услуг">
      <div className="field">
        <span className="field-label">Специализация</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={filterSpec}
            onChange={(e) => onFilterSpecChange(e.target.value)}
          >
            <option value="ALL">Все специализации</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Для вида</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={filterSpecies}
            onChange={(e) => onFilterSpeciesChange(e.target.value)}
          >
            <option value="ALL">Любой вид</option>
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field" style={{ width: 180 }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            type="text"
            className="input"
            placeholder="Название…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="spacer" />

      <button
        type="button"
        className="btn btn-primary"
        onClick={onOpenCreate}
      >
        <Plus size={16} />
        Новая услуга
      </button>
    </section>
  );
};
