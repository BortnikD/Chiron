import React from 'react';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';

export interface BookingSummaryIslandProps {
  petName?: string;
  speciesName?: string;
  serviceName?: string;
  doctorDisplay: string;
  selectedSlotStartAt?: string;
  servicePrice?: number;
}

/**
 * Правая панель/сводка выбранных параметров визита.
 */
export const BookingSummaryIsland: React.FC<BookingSummaryIslandProps> = ({
  petName,
  speciesName,
  serviceName,
  doctorDisplay,
  selectedSlotStartAt,
  servicePrice,
}) => {
  return (
    <aside
      className="island"
      style={{ flex: '0 1 320px', width: 'clamp(220px, 26vw, 320px)' }}
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
            <span className="cell-main">
              {selectedSlotStartAt
                ? `${formatDateShort(selectedSlotStartAt)} в ${formatSlotTime(selectedSlotStartAt)}`
                : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Стоимость</span>
            <span className="cell-main" style={{ fontSize: '16px', fontWeight: 700 }}>
              {servicePrice != null ? formatCurrency(servicePrice) : '—'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
