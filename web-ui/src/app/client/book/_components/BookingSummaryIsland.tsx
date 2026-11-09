import React from 'react';
import { formatSlotTime } from './constants';

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
            <span className="cell-main">
              {selectedSlotStartAt
                ? `${new Date(selectedSlotStartAt).toLocaleDateString('ru-RU')} в ${formatSlotTime(selectedSlotStartAt)}`
                : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: '2px' }}>
            <span className="small muted">Стоимость</span>
            <span className="cell-main" style={{ fontSize: '16px', fontWeight: 700 }}>
              {servicePrice != null ? `${servicePrice.toLocaleString('ru-RU')} ₽` : '—'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
