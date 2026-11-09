import React from 'react';
import { Veterinarian, AvailableSlotResponse } from '../../../../types';
import { getDoctorDisplay } from '../../../../utils/doctorHelpers';
import { Stethoscope, Check, Clock, Loader2 } from 'lucide-react';
import { SPEC_TONES, GroupedDaySlots, formatSlotTime } from './constants';

export interface StepDoctorAndSlotSelectionProps {
  veterinarians: Veterinarian[];
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
  availableSlots,
  slotsByDay,
  selectedSlot,
  onSelectSlot,
}) => {
  return (
    <div className="col" style={{ gap: '20px' }}>
      {/* 1. Выбор врача */}
      <div className="col" style={{ gap: '12px' }}>
        <div className="row between wrap">
          <span className="h2">Врач</span>
          <span className="small muted">Выберите конкретного специалиста или дежурного</span>
        </div>

        <div className="cards">
          {/* Карточка «Любой врач» */}
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

          {/* Карточки конкретных врачей */}
          {veterinarians.map((v) => {
            const isSel = !isAnyVet && selectedVet?.id === v.id;
            const tone = SPEC_TONES[v.specializationId] || 'ther';
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
                      <span className="cell-sub">стаж {v.experienceYears} лет</span>
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

        {/* Индикатор загрузки / пустой список / свободные слоты */}
        {loadingSlots ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
            <span>Поиск свободных окон...</span>
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
