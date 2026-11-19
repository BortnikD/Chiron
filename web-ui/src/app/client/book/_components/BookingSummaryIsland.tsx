import React, { useMemo } from 'react';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/shared/lib';
import { Check } from 'lucide-react';

export interface BookingSummaryIslandProps {
  petName?: string;
  speciesName?: string;
  serviceName?: string;
  selectedServices?: Service[];
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
  isAnyVet?: boolean;
}

/**
 * Правый остров «Сводка» с актуальными параметрами оформляемой записи.
 */
export const BookingSummaryIsland: React.FC<BookingSummaryIslandProps> = ({
  petName,
  speciesName,
  serviceName,
  selectedServices,
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
  isAnyVet = false,
}) => {
  const whenLabel = useMemo(() => {
    if (!selectedSlotStartAt) return '—';
    const startStr = formatSlotTime(selectedSlotStartAt);
    let endStr = selectedSlotEndAt ? formatSlotTime(selectedSlotEndAt) : '';
    if (serviceDurationMin && selectedSlotStartAt) {
      const startMs = new Date(selectedSlotStartAt).getTime();
      const endMs = selectedSlotEndAt ? new Date(selectedSlotEndAt).getTime() : startMs;
      const slotDurMin = Math.round((endMs - startMs) / 60000);
      if (slotDurMin !== serviceDurationMin) {
        const expectedEndMs = startMs + serviceDurationMin * 60000;
        endStr = formatSlotTime(new Date(expectedEndMs).toISOString());
      }
    }
    return endStr
      ? `${formatDateShort(selectedSlotStartAt)}, ${startStr}–${endStr}`
      : `${formatDateShort(selectedSlotStartAt)} в ${startStr}`;
  }, [selectedSlotStartAt, selectedSlotEndAt, serviceDurationMin]);

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
            <span className="small muted">
              {selectedServices && selectedServices.length > 1
                ? `Услуги (${selectedServices.length})`
                : 'Услуга'}
            </span>
            {selectedServices && selectedServices.length > 1 ? (
              <div className="col" style={{ gap: '4px', marginTop: '2px' }}>
                {selectedServices.map((s) => (
                  <div key={s.id} className="row between" style={{ fontSize: '13px', gap: '6px' }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                    <span className="small muted tnum" style={{ flexShrink: 0 }}>
                      {formatCurrency(s.effectivePrice ?? s.basePrice ?? s.price ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="cell-main">{serviceName || '—'}</span>
            )}
          </div>
          <div className="col" style={{ gap: '4px' }}>
            <span className="small muted">Врач</span>
            <span className="cell-main" style={{ fontWeight: 600, fontSize: '15px' }}>
              {doctorDisplay}
            </span>

            {isAnyVet && !selectedSlotStartAt && (
              <span className="small muted" style={{ fontSize: '12px' }}>
                Будет назначен по выбранному времени
              </span>
            )}

            {showSlotVetPicker && isAnyVet && availableVetsForSlot && availableVetsForSlot.length > 1 && onSelectSlotVetId && (
              <div className="col" style={{ gap: '6px', marginTop: '6px' }}>
                <span className="small muted" style={{ fontSize: '12px' }}>
                  Выбор врача на это время ({availableVetsForSlot.length}):
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
                        className={`btn ${isChosen ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          justifyContent: 'flex-start',
                          padding: '8px 12px',
                          minHeight: '48px',
                          width: '100%',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: isChosen ? 600 : 500,
                          borderRadius: '8px',
                        }}
                      >
                        <VetAvatar
                          vet={v}
                          initials={doc.initials}
                          style={{ width: 28, height: 28, fontSize: '11px', flexShrink: 0 }}
                          alt={doc.name}
                        />
                        <div className="col" style={{ gap: '3px', minWidth: 0, flex: 1, lineHeight: 1.25 }}>
                          <span
                            style={{
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            {doc.name}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              lineHeight: 1.2,
                              color: isChosen ? 'rgba(0, 0, 0, 0.75)' : 'var(--muted-foreground)',
                              fontWeight: 400,
                            }}
                          >
                            {doc.specName}
                          </span>
                        </div>
                        {isChosen && <Check size={16} style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showSlotVetPicker && isAnyVet && availableVetsForSlot && availableVetsForSlot.length === 1 && selectedSlotStartAt && (
              <span className="small muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                Назначен специалист клиники на это время
              </span>
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
