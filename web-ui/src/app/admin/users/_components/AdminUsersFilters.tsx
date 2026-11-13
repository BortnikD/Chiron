'use client';

import React from 'react';
import { Search, UserPlus } from 'lucide-react';
import { DatePicker } from '@/shared/components';

export interface AdminUsersFiltersProps {
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  createdFrom: string;
  onCreatedFromChange: (iso: string) => void;
  createdTo: string;
  onCreatedToChange: (iso: string) => void;
  onCreateClick: () => void;
}

/**
 * Панель фильтрации пользователей по ролям, поисковой строке и дате регистрации.
 */
export const AdminUsersFilters: React.FC<AdminUsersFiltersProps> = ({
  roleFilter,
  onRoleFilterChange,
  search,
  onSearchChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  onCreateClick,
}) => {
  return (
    <section className="island filters" aria-label="Фильтры пользователей">
      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Роль</span>
        <div className="seg">
          <button
            type="button"
            className={`seg-item ${roleFilter === 'ALL' ? 'on' : ''}`}
            onClick={() => onRoleFilterChange('ALL')}
          >
            Все
          </button>
          <button
            type="button"
            className={`seg-item ${roleFilter === 'CLIENT' ? 'on' : ''}`}
            onClick={() => onRoleFilterChange('CLIENT')}
          >
            Клиенты
          </button>
          <button
            type="button"
            className={`seg-item ${roleFilter === 'VETERINARIAN' ? 'on' : ''}`}
            onClick={() => onRoleFilterChange('VETERINARIAN')}
          >
            Врачи
          </button>
          <button
            type="button"
            className={`seg-item ${roleFilter === 'ADMIN' ? 'on' : ''}`}
            onClick={() => onRoleFilterChange('ADMIN')}
          >
            Админы
          </button>
        </div>
      </div>

      <div className="field" style={{ width: 240 }}>
        <label className="field-label" htmlFor="us-q">
          Поиск
        </label>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            id="us-q"
            type="text"
            className="input"
            placeholder="ФИО, email или телефон…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ width: 150 }}>
        <label className="field-label" htmlFor="us-from">
          Регистрация с
        </label>
        <DatePicker
          id="us-from"
          value={createdFrom}
          max={createdTo || undefined}
          onChange={onCreatedFromChange}
          ariaLabel="Регистрация с"
        />
      </div>

      <div className="field" style={{ width: 150 }}>
        <label className="field-label" htmlFor="us-to">
          по
        </label>
        <DatePicker
          id="us-to"
          value={createdTo}
          min={createdFrom || undefined}
          onChange={onCreatedToChange}
          ariaLabel="Регистрация по"
        />
      </div>

      <div className="spacer" />

      <button
        type="button"
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <UserPlus size={16} />
        Создать пользователя
      </button>
    </section>
  );
};
