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
      className="island w-320 flex-none"
      aria-label="Сводка записи"
    >
      <div className="island-head">
        <span className="island-title">Сводка</span>
      </div>
      <div className="island-body">
        <div className="col gap-md">
          <div className="col gap-2xs">
            <span className="small muted">Питомец</span>
            <span className="cell-main">
              {petName ? `${petName}${speciesName ? ` · ${speciesName}` : ''}` : '—'}
            </span>
          </div>
          <div className="col gap-2xs">
            <span className="small muted">
              {selectedServices && selectedServices.length > 1
                ? `Услуги (${selectedServices.length})`
                : 'Услуга'}
            </span>
            {selectedServices && selectedServices.length > 1 ? (
              <div className="col gap-xs mt-2xs">
                {selectedServices.map((s) => (
                  <div key={s.id} className="row between text-sm gap-xs">
                    <span className="font-medium truncate">
                      {s.name}
                    </span>
                    <span className="small muted tnum shrink-0">
                      {formatCurrency(s.effectivePrice ?? s.basePrice ?? s.price ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="cell-main">{serviceName || '—'}</span>
            )}
          </div>
          <div className="col gap-xs">
            <span className="small muted">Врач</span>
            <span className="cell-main font-semibold text-base">
              {doctorDisplay}
            </span>

            {isAnyVet && !selectedSlotStartAt && (
              <span className="small muted text-xs">
                Будет назначен по выбранному времени
              </span>
            )}

            {showSlotVetPicker && isAnyVet && availableVetsForSlot && availableVetsForSlot.length > 1 && onSelectSlotVetId && (
              <div className="col gap-xs mt-xs">
                <span className="small muted text-xs">
                  Выбор врача на это время ({availableVetsForSlot.length}):
                </span>
                <div className="col gap-xs">
                  {availableVetsForSlot.map((v) => {
                    const isChosen = (selectedSlotVetId || availableVetsForSlot[0].id) === v.id;
                    const doc = getDoctorDisplay(v, specsMap);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectSlotVetId(v.id)}
                        className={`btn ${isChosen ? 'btn-primary font-semibold' : 'btn-outline font-medium'} vet-picker-btn`}
                      >
                        <VetAvatar
                          vet={v}
                          initials={doc.initials}
                          className="vet-picker-ava"
                          alt={doc.name}
                        />
                        <div className="col gap-2xs min-w-0 flex-1 leading-tight">
                          <span className="truncate font-semibold text-sm">
                            {doc.name}
                          </span>
                          <span
                            className={`text-2xs leading-tight font-normal ${isChosen ? 'text-fg' : 'muted'}`}
                          >
                            {doc.specName}
                          </span>
                        </div>
                        {isChosen && <Check size={16} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showSlotVetPicker && isAnyVet && availableVetsForSlot && availableVetsForSlot.length === 1 && selectedSlotStartAt && (
              <span className="small muted text-xs mt-2xs">
                Назначен специалист клиники на это время
              </span>
            )}
          </div>
          <div className="col gap-2xs">
            <span className="small muted">Дата и время</span>
            <span className="cell-main tnum">{whenLabel}</span>
          </div>
          <div className="col gap-2xs">
            <span className="small muted">Длительность</span>
            <span className="tnum">
              {serviceDurationMin != null ? `${serviceDurationMin} мин` : '—'}
            </span>
          </div>
          <div className="col gap-2xs">
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
