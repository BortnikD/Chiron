import React, { useMemo } from 'react';
import { Stethoscope, Check, Clock, Loader2, AlertCircle } from 'lucide-react';
import type { Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { formatSlotTime, getSpecTone, pluralRu } from '@/shared/lib';
import type { GroupedDaySlots } from '../_hooks/useBookingSlots';

export interface StepDoctorAndSlotSelectionProps {
  veterinarians: Veterinarian[];
  serviceSpecializationId?: string | null;
  petSpeciesId?: string | null;
  specsMap: Record<string, string>;
  isAnyVet: boolean;
  selectedVet: Veterinarian | null;
  onSelectAnyVet: () => void;
  onSelectVet: (vet: Veterinarian) => void;
  fromDate: string;
  todayStr: string;
  onFromDateChange: (date: string) => void;
  horizonDays: number;
  onHorizonDaysChange: (days: number) => void;
  durationInfoText?: string;
  loadingSlots: boolean;
  slotsError?: string | null;
  onRetrySlots?: () => void;
  availableSlots: AvailableSlotResponse[];
  slotsByDay: GroupedDaySlots[];
  selectedSlot: AvailableSlotResponse | null;
  onSelectSlot: (slot: AvailableSlotResponse | null) => void;
}

/**
 * Шаг 3: выбор врача («любой врач» или конкретный специалист),
 * выбор даты в календаре и временного слота (.slot).
 */
export const StepDoctorAndSlotSelection: React.FC<StepDoctorAndSlotSelectionProps> = ({
  veterinarians,
  serviceSpecializationId,
  petSpeciesId,
  specsMap,
  isAnyVet,
  selectedVet,
  onSelectAnyVet,
  onSelectVet,
  fromDate,
  todayStr,
  onFromDateChange,
  horizonDays,
  onHorizonDaysChange,
  durationInfoText,
  loadingSlots,
  slotsError,
  onRetrySlots,
  availableSlots,
  slotsByDay,
  selectedSlot,
  onSelectSlot,
}) => {
  const filteredVeterinarians = useMemo(() => {
    const hasAnySpeciesIds = veterinarians.some(
      (v) => Array.isArray(v.speciesIds) && v.speciesIds.length > 0
    );
    return veterinarians.filter((v) => {
      if (v.isActive === false) return false;
      if (serviceSpecializationId && v.specializationId !== serviceSpecializationId) return false;
      if (
        petSpeciesId &&
        hasAnySpeciesIds &&
        Array.isArray(v.speciesIds) &&
        !v.speciesIds.includes(petSpeciesId)
      ) {
        return false;
      }
      return true;
    });
  }, [veterinarians, serviceSpecializationId, petSpeciesId]);

  return (
    <div className="col" style={{ gap: '20px' }}>
      {/* 1. Выбор врача */}
      <div className="col" style={{ gap: '12px' }}>
        <div className="row between wrap">
          <span className="h2">Врач</span>
          <span className="small muted">Выберите конкретного специалиста или дежурного</span>
        </div>

        <div className="cards">
          <button
            type="button"
            className={`tcard tone-ther ${isAnyVet ? 'sel' : ''}`}
            onClick={onSelectAnyVet}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <div className="tcard-head">
              <span className="t-ava lg round">
                <Stethoscope className="ic ic-20" />
              </span>
              <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                <span className="tcard-title">Любой врач</span>
                <span className="cell-sub">Покажем все свободные окна</span>
              </span>
              {isAnyVet && (
                <span className="tcard-check">
                  <Check className="ic" />
                </span>
              )}
            </div>
          </button>

          {filteredVeterinarians.map((v) => {
            const isSel = !isAnyVet && selectedVet?.id === v.id;
            const tone = getSpecTone(v.specializationId);
            const { name, initials, specName } = getDoctorDisplay(v, specsMap);

            return (
              <button
                key={v.id}
                type="button"
                className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                onClick={() => onSelectVet(v)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="tcard-head">
                  <span className="t-ava lg round">{initials}</span>
                  <span className="col grow" style={{ gap: '3px', minWidth: 0 }}>
                    <span className="tcard-title">{name}</span>
                    <span className="row" style={{ gap: '6px' }}>
                      <span className="t-badge">{specName}</span>
                      <span className="cell-sub">
                        стаж {v.experienceYears}{' '}
                        {pluralRu(v.experienceYears, 'год', 'года', 'лет')}
                      </span>
                    </span>
                  </span>
                  {isSel && (
                    <span className="tcard-check">
                      <Check className="ic" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sep" />

      {/* 2. Выбор даты и времени (слота) */}
      <div className="col" style={{ gap: '12px' }}>
        <span className="h2">Дата и время приёма</span>

        <div className="row wrap" style={{ gap: '12px', alignItems: 'flex-end' }}>
          <div className="field" style={{ width: '180px' }}>
            <label className="field-label" htmlFor="wz-from">
              С даты
            </label>
            <input
              id="wz-from"
              type="date"
              className="input"
              value={fromDate}
              min={todayStr}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="field-label">Период</span>
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${horizonDays === 7 ? 'on' : ''}`}
                onClick={() => onHorizonDaysChange(7)}
              >
                7 дней
              </button>
              <button
                type="button"
                className={`seg-item ${horizonDays === 14 ? 'on' : ''}`}
                onClick={() => onHorizonDaysChange(14)}
              >
                14 дней
              </button>
            </div>
          </div>

          {durationInfoText && (
            <span className="small muted" style={{ paddingBottom: '8px' }}>
              {durationInfoText}
            </span>
          )}
        </div>

        {loadingSlots ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
            <span>Поиск свободных окон...</span>
          </div>
        ) : slotsError ? (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle className="ic" />
            <div className="row between wrap grow" style={{ gap: '8px', alignItems: 'center' }}>
              <span>{slotsError}</span>
              {onRetrySlots && (
                <button type="button" className="btn btn-outline btn-sm" onClick={onRetrySlots}>
                  Повторить
                </button>
              )}
            </div>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Clock className="ic ic-40" />
            </div>
            <span className="empty-title">Нет свободных окон</span>
            <span>Попробуйте выбрать другой период или врача</span>
          </div>
        ) : (
          slotsByDay.map((group) => (
            <div
              key={group.dateLabel}
              className="col"
              style={{ gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div className="row between">
                <span className="cell-main">
                  {group.dow}, {group.dateLabel}
                </span>
                <span className="cell-sub">{group.note}</span>
              </div>
              <div className="chips">
                {group.slots.map((slot) => {
                  const isSel = selectedSlot?.startAt === slot.startAt;
                  const timeStr = formatSlotTime(slot.startAt);

                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      className={`slot ${isSel ? 'on sel' : ''}`}
                      aria-pressed={isSel}
                      onClick={() => onSelectSlot(slot)}
                    >
                      {timeStr}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
