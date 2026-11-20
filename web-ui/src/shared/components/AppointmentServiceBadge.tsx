'use client';

import React from 'react';
import type { Appointment } from '@/shared/types';

export interface AppointmentServiceBadgeProps {
  appointment: Appointment;
  fallbackName?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Единый компонент отображения услуги записи с бейджем количества дополнительных услуг.
 * Обеспечивает 100% единообразие между кабинетами Клиента, Ветеринара и Администратора.
 */
export const AppointmentServiceBadge = React.memo(function AppointmentServiceBadge({
  appointment,
  fallbackName,
  className = '',
  style,
}: AppointmentServiceBadgeProps) {
  const rawServiceName =
    appointment.services?.[0]?.nameSnapshot ||
    appointment.serviceName ||
    fallbackName ||
    'Услуга';

  // Проверяем наличие суффикса вида "(+1)" в строке названия
  const match = rawServiceName.match(/\s*\(\+(\d+)\)$/);
  const matchedExtraCount = match ? parseInt(match[1], 10) : 0;

  // Определяем количество услуг либо по массиву services, либо по извлечённому суффиксу
  const servicesCount =
    appointment.services && appointment.services.length > 1
      ? appointment.services.length
      : matchedExtraCount > 0
        ? matchedExtraCount + 1
        : 1;

  // Очищаем основное название от сырого текстового суффикса вида "(+1)"
  const primaryName = rawServiceName.replace(/\s*\(\+\d+\)$/, '').trim();

  const tooltip =
    appointment.services && appointment.services.length > 1
      ? appointment.services.map((s) => s.nameSnapshot).join(', ')
      : undefined;

  const extraCount = servicesCount - 1;

  return (
    <span
      className={`service-badge-wrap ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        maxWidth: '100%',
        minWidth: 0,
        verticalAlign: 'middle',
        ...style,
      }}
      title={tooltip || primaryName}
    >
      <span
        style={{
          flex: '0 1 auto',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {primaryName}
      </span>
      {extraCount > 0 && (
        <span
          className="badge badge-accent"
          style={{
            fontSize: '10.5px',
            padding: '1px 5px',
            height: '18px',
            lineHeight: 1,
            backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
            color: 'var(--primary-text, var(--primary))',
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          title={tooltip}
        >
          +{extraCount}
        </span>
      )}
    </span>
  );
});
