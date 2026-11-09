'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { User } from '../../../../types';
import { ROLE_META, getUserInitials } from './utils';

export interface AdminUsersTableProps {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  onSelectUser: (user: User) => void;
}

/**
 * Таблица пользователей клиники с аватарками, ролями и контактной информацией.
 */
export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  selectedUser,
  loading,
  onSelectUser,
}) => {
  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <Users size={18} />
          Пользователи <span className="count">Найдено: {users.length}</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.4fr 1.4fr 1fr 0.9fr 0.8fr',
              minWidth: '760px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>ФИО</span>
            <span>Email</span>
            <span>Телефон</span>
            <span>Роль</span>
            <span>Регистрация ↑</span>
          </div>

          {users.map((u) => {
            const isSelected = selectedUser?.id === u.id;
            const rInfo = ROLE_META[u.role] || { label: u.role, cls: 'badge-outline' };
            const created = u.createdAt ? u.createdAt.slice(0, 10) : '—';

            return (
              <button
                key={u.id}
                type="button"
                className={`trow ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectUser(u)}
              >
                <span className="row" style={{ gap: 8 }}>
                  <span className={`t-ava sm round tone-${u.role}`}>
                    {getUserInitials(u)}
                  </span>
                  <span className="cell-main">{u.fullName || `${u.firstName} ${u.lastName}`}</span>
                </span>
                <span className="muted">{u.email}</span>
                <span className="tnum">{u.phone || '—'}</span>
                <span>
                  <span className={`t-badge tone-${u.role}`}>{rInfo.label}</span>
                </span>
                <span className="tnum">{created}</span>
              </button>
            );
          })}
        </div>

        {users.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Пользователи не найдены</span>
          </div>
        )}
      </div>
    </section>
  );
};
