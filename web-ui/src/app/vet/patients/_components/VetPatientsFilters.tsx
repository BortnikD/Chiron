'use client';

import React from 'react';
import { PawPrint, Search, LayoutGrid, List } from 'lucide-react';

export interface VetPatientsFiltersProps {
  /** Поисковый запрос по кличке или виду */
  search: string;
  /** Обработчик изменения строки поиска */
  onSearchChange: (value: string) => void;
  /** Количество отфильтрованных пациентов */
  count: number;
  /** Текущий режим отображения (таблица или карточки) */
  viewMode?: 'table' | 'cards';
  /** Обработчик переключения режима отображения */
  onViewModeChange?: (mode: 'table' | 'cards') => void;
}

/**
 * Шапка и строка поиска пациентов врача.
 * Включает заголовок со счётчиком, строку поиска по кличке/виду,
 * опциональный переключатель отображения (таблица/карточки) и системную подсказку.
 */
export function VetPatientsFilters({
  search,
  onSearchChange,
  count,
  viewMode,
  onViewModeChange,
}: VetPatientsFiltersProps) {
  return (
    <>
      <div className="island-head">
        <span className="island-title">
          <PawPrint size={18} />
          Пациенты <span className="count">{count}</span>
        </span>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
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
          <div className="input-icon" style={{ width: 260 }}>
            <Search size={14} className="ic" />
            <input
              type="text"
              className="input input-sm"
              placeholder="Кличка…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row" style={{ padding: '0 16px 10px' }}>
        <span className="dev-note">
          Отдельного списка пациентов в API нет — список собран из уникальных petId ваших записей
        </span>
      </div>
    </>
  );
}
