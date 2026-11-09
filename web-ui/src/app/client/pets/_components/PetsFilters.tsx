'use client';

import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import { ArchiveFilter } from './types';

export interface PetsFiltersProps {
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция обновления поискового запроса */
  onSearchChange: (query: string) => void;
  /** Текущий фильтр по архиву: ACTIVE | ARCHIVED | ALL */
  archiveFilter: ArchiveFilter;
  /** Функция смены фильтра архива */
  onArchiveFilterChange: (filter: ArchiveFilter) => void;
  /** Функция открытия диалога добавления питомца */
  onAddPet: () => void;
}

/**
 * Панель фильтров списка питомцев:
 * быстрый поиск по кличке или виду, переключатель статуса архива и кнопка создания.
 */
export function PetsFilters({
  searchQuery,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  onAddPet,
}: PetsFiltersProps) {
  return (
    <section className="island filters" aria-label="Фильтры питомцев">
      <div className="field" style={{ width: '240px' }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon" style={{ position: 'relative' }}>
          <Search size={14} className="ic" />
          <input
            type="text"
            className="input"
            placeholder="Кличка или вид…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => onSearchChange('')}
              title="Очистить"
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                padding: 0,
              }}
            >
              <X size={13} className="ic" />
            </button>
          )}
        </div>
      </div>

      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Статус</span>
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
            В архиве
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

      <button
        type="button"
        className="btn btn-primary"
        onClick={onAddPet}
        style={{ height: '34px', alignSelf: 'flex-end' }}
      >
        <Plus className="ic" />
        <span>Добавить питомца</span>
      </button>
    </section>
  );
}
