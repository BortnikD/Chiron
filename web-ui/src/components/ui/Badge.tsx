import React from 'react';
import { AppointmentStatus } from '../../types';
import { Clock, CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react';

export interface BadgeProps {
  status?: AppointmentStatus | string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  if (status) {
    switch (status) {
      case 'PENDING':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 ${sizeClasses}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ожидает подтверждения</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 ${sizeClasses}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Подтвержден</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 ${sizeClasses}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Завершен</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 ${sizeClasses}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Отменен</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 ${sizeClasses}`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Неявка</span>
          </span>
        );
      default:
        break;
    }
  }

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 ring-slate-500/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset ${
        variantStyles[variant || 'default']
      } ${sizeClasses}`}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {children}
    </span>
  );
};
