'use client';

import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { VeterinariansFiltersProps } from './types';

export const VeterinariansFilters: React.FC<VeterinariansFiltersProps> = ({
  specializations,
  speciesList,
  selectedSpec,
  onSelectSpec,
  selectedSpecies,
  onSelectSpecies,
  searchQuery,
  onSearchChange,
  onResetFilters,
  hasFilters,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры">
      <div className="field">
        <span className="field-label">Специализация</span>
        <div className="dd" style={{ position: 'relative' }}>
          <select
            className="select dd-btn"
            value={selectedSpec}
            onChange={(e) => onSelectSpec(e.target.value)}
            style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}
          >
            <option value="ALL">Все специализации</option>
            {specializations.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="ic"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              width: '14px',
              height: '14px',
            }}
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Вид животного</span>
        <div className="dd" style={{ position: 'relative' }}>
          <select
            className="select dd-btn"
            value={selectedSpecies}
            onChange={(e) => onSelectSpecies(e.target.value)}
            style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}
          >
            <option value="ALL">Все виды</option>
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="ic"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              width: '14px',
              height: '14px',
            }}
          />
        </div>
      </div>

      <div className="field" style={{ flex: 1, minWidth: '220px' }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            className="ic"
            style={{
              position: 'absolute',
              left: '10px',
              width: '15px',
              height: '15px',
              color: 'var(--muted-foreground)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Поиск по имени врача..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input"
            style={{ paddingLeft: '34px', width: '100%' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="btn btn-ghost btn-icon btn-sm"
              style={{
                position: 'absolute',
                right: '6px',
                width: '24px',
                height: '24px',
              }}
              aria-label="Очистить поиск"
            >
              <X className="ic" style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onResetFilters}
          style={{ alignSelf: 'flex-end', height: '34px' }}
        >
          Сбросить
        </button>
      )}
    </section>
  );
};
