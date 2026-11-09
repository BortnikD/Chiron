'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { PetsFiltersProps } from './types';
import { GENDER_OPTIONS, STATUS_OPTIONS } from './constants';

/**
 * Панель фильтрации питомцев:
 * выбор вида, пола, статуса (активен/в архиве), поисковая строка и кнопка добавления.
 */
export const PetsFilters: React.FC<PetsFiltersProps> = ({
  speciesFilter,
  onSpeciesFilterChange,
  genderFilter,
  onGenderFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  speciesList,
  onOpenCreate,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры питомцев">
      <div className="field">
        <span className="field-label">Вид</span>
        <div className="dd">
          <select
            className="select dd-btn"
            value={speciesFilter}
            onChange={(e) => onSpeciesFilterChange(e.target.value)}
          >
            <option value="ALL">Все виды</option>
            {speciesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Пол</span>
        <div className="seg">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`seg-item ${genderFilter === opt.value ? 'on' : ''}`}
              onClick={() => onGenderFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
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

      <div className="field" style={{ width: 200 }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            type="text"
            className="input"
            placeholder="Кличка или владелец…"
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
        Добавить питомца
      </button>
    </section>
  );
};
