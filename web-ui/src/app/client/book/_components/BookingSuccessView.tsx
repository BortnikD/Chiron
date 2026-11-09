import React from 'react';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';

export interface BookingSuccessViewProps {
  petName?: string;
  serviceName?: string;
  appointmentId?: string | null;
  onNewBooking: () => void;
}

/**
 * Экран успешного бронирования с кнопками перехода в записи / кабинет.
 */
export const BookingSuccessView: React.FC<BookingSuccessViewProps> = ({
  petName,
  serviceName,
  onNewBooking,
}) => {
  return (
    <div className="empty" style={{ padding: '40px 16px' }}>
      <div
        className="empty-art"
        style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
      >
        <CalendarCheck className="ic ic-40" />
      </div>
      <span className="empty-title">Вы записаны</span>
      <span>
        Питомец: <b>{petName || 'Питомец'}</b>
        {serviceName ? ` · ${serviceName}` : ''}
      </span>
      <span className="badge st badge-PENDING">Ожидает подтверждения</span>
      <div className="row wrap" style={{ gap: '8px', marginTop: '14px', justifyContent: 'center' }}>
        <Link
          href="/client/appointments"
          className="btn btn-outline"
          style={{ textDecoration: 'none' }}
        >
          Открыть записи
        </Link>
        <Link
          href="/client/dashboard"
          className="btn btn-ghost"
          style={{ textDecoration: 'none' }}
        >
          В кабинет
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNewBooking}
        >
          Новая запись
        </button>
      </div>
    </div>
  );
};
