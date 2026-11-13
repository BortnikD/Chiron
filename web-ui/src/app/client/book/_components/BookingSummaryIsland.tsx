import React from 'react';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';

export interface BookingSummaryIslandProps {
  petName?: string;
  speciesName?: string;
  serviceName?: string;
  doctorDisplay: string;
  selectedSlotStartAt?: string;
  selectedSlotEndAt?: string;
  serviceDurationMin?: number | null;
  servicePrice?: number | null;
}

/**
 * Правый остров «Сводка» с актуальными параметрами оформляемой записи.
 */
export const BookingSummaryIsland: React.FC<BookingSummaryIslandProps> = ({
  petName,
  speciesName,
  serviceName,
  doctorDisplay,
  selectedSlotStartAt,
  selectedSlotEndAt,
  serviceDurationMin,
  servicePrice,
}) => {
  const whenLabel = selectedSlotStartAt
    ? selectedSlotEndAt
      ? `${formatDateShort(selectedSlotStartAt)}, ${formatSlotTime(selectedSlotStartAt)}–${formatSlotTime(selectedSlotEndAt)}`
      : `${formatDateShort(selectedSlotStartAt)} в ${formatSlotTime(selectedSlotStartAt)}`
    : '—';

  return (
    <aside
      className="island"
      style={{ width: '320px', flex: 'none' }}
      aria-label="Сводка записи"
    >
      <div className="island-head">
        <span className="island-title">Сводка</span>
      </div>
      <div className="island-body">
        <div className="col" style={{ gap: '14px' }}>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Питомец</span>
            <span className="cell-main">
              {petName ? `${petName}${speciesName ? ` · ${speciesName}` : ''}` : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Услуга</span>
            <span className="cell-main">{serviceName || '—'}</span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Врач</span>
            <span className="cell-main">{doctorDisplay}</span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Дата и время</span>
            <span className="cell-main tnum">{whenLabel}</span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Длительность</span>
            <span className="tnum">
              {serviceDurationMin != null ? `${serviceDurationMin} мин` : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Стоимость</span>
            <span className="kpi-value accent">
              {servicePrice != null ? formatCurrency(servicePrice) : '—'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
