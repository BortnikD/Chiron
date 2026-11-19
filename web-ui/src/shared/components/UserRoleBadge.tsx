import React from 'react';
import type { UserRole } from '@/shared/types';
import { USER_ROLE_META } from '@/shared/lib/constants';

export interface UserRoleBadgeProps {
  role?: UserRole | string | null;
  short?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  short = false,
  className = '',
  style,
}) => {
  if (!role) return null;
  const meta = USER_ROLE_META[role as UserRole] || {
    label: role,
    cls: 'badge-outline',
  };
  const label = short && role === 'ADMIN' ? 'Админ' : meta.label;
  const toneCls =
    role === 'VETERINARIAN'
      ? 'badge-accent'
      : role === 'ADMIN'
      ? 'badge-outline'
      : 'badge-outline';
  const customColor =
    role === 'ADMIN' ? { color: 'var(--chart-4)', ...style } : style;

  return (
    <span
      className={`badge ${toneCls} small ${className}`.trim()}
      style={{ fontSize: '10.5px', padding: '1px 6px', ...customColor }}
    >
      {label}
    </span>
  );
};
