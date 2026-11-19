'use client';

import React from 'react';
import type { AppointmentStatus } from '@/shared/types';
import { APPOINTMENT_STATUS_META } from '@/shared/lib/constants';

export interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md';
  useShortLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Единый переиспользуемый бейдж для отображения статуса записи на приём.
 * Обеспечивает согласованную цветовую гамму дизайн-системы Chiron и устраняет дублирование.
 */
export const AppointmentStatusBadge = React.memo(function AppointmentStatusBadge({
  status,
  size = 'md',
  useShortLabel = false,
  className = '',
  style,
}: AppointmentStatusBadgeProps) {
  const meta = APPOINTMENT_STATUS_META[status as AppointmentStatus] || {
    label: status,
    short: status,
    cls: 'badge-outline',
  };

  const badgeClass = [
    'badge',
    'st',
    meta.cls,
    size === 'sm' ? 'badge-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labelText = useShortLabel ? meta.short : meta.label;

  return (
    <span className={badgeClass} style={style} data-status={status}>
      {labelText}
    </span>
  );
});
