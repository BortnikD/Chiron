'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { User } from '@/shared/types';
import { DataTable, UserRoleBadge, type DataTableColumn, type PaginationFooterProps } from '@/shared/components';
import { formatDateShort, formatPhoneDisplay, formatUserFullName, getUserInitials } from '@/shared/lib';

export interface AdminUsersTableProps {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectUser: (user: User) => void;
  paginationProps?: PaginationFooterProps;
}

/**
 * Таблица пользователей клиники с аватарками, ролями и контактной информацией на базе DataTable.
 */
export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  selectedUser,
  loading,
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
  onSelectUser,
  paginationProps,
}) => {
  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      {
        key: 'name',
        title: 'ФИО',
        width: '1.4fr',
        render: (u) => (
          <span className="row" style={{ gap: 8 }}>
            <span className={`t-ava sm round tone-${u.role}`}>
              {getUserInitials(u, 'ПЛ')}
            </span>
            <span className="cell-main">{formatUserFullName(u)}</span>
          </span>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        width: '1.4fr',
        render: (u) => <span className="muted">{u.email}</span>,
      },
      {
        key: 'phone',
        title: 'Телефон',
        width: '1.2fr',
        render: (u) => (
          <span className="tnum" style={{ whiteSpace: 'nowrap' }}>
            {formatPhoneDisplay(u.phone)}
          </span>
        ),
      },
      {
        key: 'role',
        title: 'Роль',
        width: '0.9fr',
        render: (u) => <UserRoleBadge role={u.role} />,
      },
      {
        key: 'created',
        title: 'Регистрация ↑',
        width: '0.8fr',
        render: (u) => (
          <span className="tnum">{u.createdAt ? formatDateShort(u.createdAt) : '—'}</span>
        ),
      },
    ],
    []
  );

  const pagProps = paginationProps || {
    page,
    pageSize,
    totalElements,
    totalPages,
    loading,
    pageSizes: [10, 20, 50],
    onPageChange,
    onPageSizeChange,
  };

  return (
    <DataTable<User>
      columns={columns}
      data={users}
      selectedId={selectedUser?.id}
      onRowClick={onSelectUser}
      loading={loading}
      emptyText="Пользователи не найдены"
      title="Пользователи"
      icon={<Users size={18} />}
      count={totalElements}
      paginationProps={pagProps}
      minWidth="760px"
    />
  );
};
