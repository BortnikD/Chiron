'use client';

import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { ServicesFiltersProps, ServiceSortOption } from './types';

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
  return (
    <section className="island filters" aria-label="Фильтры">
      {/* Сегментные фильтры категорий / специализаций */}
      <div className="field" style={{ width: '100%' }}>
        <span className="field-label">Специализация</span>
        <div className="seg" role="tablist" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedSpec === 'ALL'}
            className={`seg-item seg-btn ${selectedSpec === 'ALL' ? 'on' : ''}`}
            onClick={() => onSelectSpec('ALL')}
          >
            Все специализации
          </button>
          {specializations.map((sp) => (
            <button
              key={sp.id}
              type="button"
              role="tab"
              aria-selected={selectedSpec === sp.id}
              className={`seg-item seg-btn ${selectedSpec === sp.id ? 'on' : ''}`}
              onClick={() => onSelectSpec(sp.id)}
            >
              {sp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Селектор вида животного */}
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

      {/* Сортировка по цене / длительности */}
      <div className="field">
        <span className="field-label">Сортировка</span>
        <div className="dd" style={{ position: 'relative' }}>
          <select
            className="select dd-btn"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ServiceSortOption)}
            style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}
          >
            <option value="default">По умолчанию</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="duration-asc">По длительности (короткие)</option>
            <option value="duration-desc">По длительности (длинные)</option>
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

      {/* Поиск по названию / описанию */}
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
            placeholder="Поиск по названию или описанию..."
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
              title="Очистить поиск"
            >
              <X className="ic" style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Кнопка сброса при активных фильтрах */}
      {hasFilters && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onReset}
          style={{ alignSelf: 'flex-end', height: '34px' }}
        >
          Сбросить
        </button>
      )}
    </section>
  );
}
