import React from 'react';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';
import type { Veterinarian } from '@/modules/clinic/types';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/shared/lib';
import { Check } from 'lucide-react';

export interface BookingSummaryIslandProps {
  petName?: string;
  speciesName?: string;
  serviceName?: string;
  doctorDisplay: string;
  selectedSlotStartAt?: string | null;
  selectedSlotEndAt?: string | null;
  serviceDurationMin?: number | null;
  servicePrice?: number | null;
  availableVetsForSlot?: Veterinarian[];
  selectedSlotVetId?: string | null;
  onSelectSlotVetId?: (vetId: string) => void;
  specsMap?: Record<string, string>;
  showSlotVetPicker?: boolean;
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
  availableVetsForSlot,
  selectedSlotVetId,
  onSelectSlotVetId,
  specsMap,
  showSlotVetPicker = false,
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
          <div className="col" style={{ gap: '4px' }}>
            <span className="small muted">Врач</span>
            <span className="cell-main" style={{ fontWeight: 600, fontSize: '15px' }}>
              {doctorDisplay}
            </span>

            {showSlotVetPicker && availableVetsForSlot && availableVetsForSlot.length > 1 && onSelectSlotVetId && (
              <div className="col" style={{ gap: '6px', marginTop: '6px' }}>
                <span className="small muted" style={{ fontSize: '12px' }}>
                  Выбор из {availableVetsForSlot.length} свободных:
                </span>
                <div className="col" style={{ gap: '6px' }}>
                  {availableVetsForSlot.map((v) => {
                    const isChosen = (selectedSlotVetId || availableVetsForSlot[0].id) === v.id;
                    const doc = getDoctorDisplay(v, specsMap);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectSlotVetId(v.id)}
                        className={`btn btn-sm ${isChosen ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'flex-start',
                          padding: '6px 10px',
                          width: '100%',
                          textAlign: 'left',
                          fontSize: '13.5px',
                          fontWeight: isChosen ? 600 : 500,
                        }}
                      >
                        <VetAvatar
                          vet={v}
                          initials={doc.initials}
                          style={{ width: 24, height: 24, fontSize: '11px', flexShrink: 0 }}
                          alt={doc.name}
                        />
                        <span
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {doc.name}
                        </span>
                        {isChosen && <Check size={15} style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
