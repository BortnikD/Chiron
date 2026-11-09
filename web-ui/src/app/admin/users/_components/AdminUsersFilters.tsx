'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';

export interface AdminUsersFiltersProps {
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onCreateClick: () => void;
}

/**
 * Панель фильтрации пользователей по ролям и поисковой строке.
 */
export const AdminUsersFilters: React.FC<AdminUsersFiltersProps> = ({
  roleFilter,
  onRoleFilterChange,
  search,
  onSearchChange,
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

      <div className="field" style={{ width: 260 }}>
        <span className="field-label">Поиск</span>
        <div className="input-icon">
          <Search size={14} className="ic" />
          <input
            type="text"
            className="input"
            placeholder="ФИО, email или телефон…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="spacer" />

      <button
        type="button"
        className="btn btn-primary"
        onClick={onCreateClick}
      >
        <Plus size={16} />
        Создать пользователя
      </button>
    </section>
  );
};
