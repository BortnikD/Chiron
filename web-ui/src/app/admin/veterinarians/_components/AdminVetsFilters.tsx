'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Specialization, Species } from '../../../../types';

export interface AdminVetsFiltersProps {
  filterSpec: string;
  onFilterSpecChange: (value: string) => void;
  filterSpecies: string;
  onFilterSpeciesChange: (value: string) => void;
  specializations: Specialization[];
  speciesList: Species[];
  onCreateClick: () => void;
}

export const AdminVetsFilters: React.FC<AdminVetsFiltersProps> = ({
  filterSpec,
  onFilterSpecChange,
  filterSpecies,
  onFilterSpeciesChange,
  specializations,
  speciesList,
  onCreateClick,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры врачей">
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
        <span className="field-label">Допуск к виду</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={filterSpecies}
            onChange={(e) => onFilterSpeciesChange(e.target.value)}
          >
            <option value="ALL">Любой допуск</option>
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="spacer" />

      <button
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <Plus size={16} />
        Создать профиль врача
      </button>
    </section>
  );
};
