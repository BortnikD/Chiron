import React from 'react';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { APPOINTMENT_STATUS_META, formatDateShort, formatSlotTime } from '@/shared/lib';

export interface BookingSuccessViewProps {
  petName?: string;
  serviceName?: string;
  doctorDisplay?: string;
  slotStartAt?: string;
  appointmentId?: string | null;
  onNewBooking: () => void;
}

/**
 * Экран успешного создания записи («Вы записаны»).
 */
export const BookingSuccessView: React.FC<BookingSuccessViewProps> = ({
  petName,
  serviceName,
  doctorDisplay,
  slotStartAt,
  appointmentId,
  onNewBooking,
}) => {
  const detailsParts: string[] = [];
  if (petName) detailsParts.push(petName);
  const headText =
    detailsParts.length > 0 && serviceName
      ? `${detailsParts[0]} — ${serviceName}`
      : serviceName || petName || 'Запись оформлена';

  const whenPart = slotStartAt
    ? `${formatDateShort(slotStartAt)} в ${formatSlotTime(slotStartAt)}`
    : '';
  const summaryLine = [headText, whenPart, doctorDisplay ? `врач ${doctorDisplay}` : '']
    .filter(Boolean)
    .join(', ');

  const openHref = appointmentId
    ? `/client/appointments?sel=${encodeURIComponent(appointmentId)}`
    : '/client/appointments';

  return (
    <div className="empty">
      <div
        className="empty-art"
        style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
      >
        <CalendarCheck className="ic ic-40" />
      </div>
      <span className="empty-title">Вы записаны</span>
      <span>{summaryLine}</span>
      <span className={`badge st ${APPOINTMENT_STATUS_META.PENDING.cls}`}>
        {APPOINTMENT_STATUS_META.PENDING.label}
      </span>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <Link href={openHref} className="btn btn-outline">
          Открыть запись
        </Link>
        <button type="button" className="btn btn-primary" onClick={onNewBooking}>
          Новая запись
        </button>
      </div>
    </div>
  );
};
