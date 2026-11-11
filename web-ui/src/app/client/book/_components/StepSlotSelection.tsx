import React from 'react';
import { CalendarOff, AlertCircle } from 'lucide-react';
import type { Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { DatePicker } from '@/shared/components';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { formatSlotTime } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type { GroupedDaySlots } from '../_hooks/useBookingSlots';

export interface StepSlotSelectionProps {
  fromDate: string;
  todayStr: string;
  onFromDateChange: (date: string) => void;
  horizonDays: number;
  onHorizonDaysChange: (days: number) => void;
  durationInfoText?: string;
  loadingSlots: boolean;
  slotsError?: string | null;
  conflictError?: string | null;
  onRetrySlots: () => void;
  availableSlots: AvailableSlotResponse[];
  slotsByDay: GroupedDaySlots[];
  selectedSlot: AvailableSlotResponse | null;
  onSelectSlot: (slot: AvailableSlotResponse) => void;
  isAnyVet: boolean;
  selectedSlotVetId: string | null;
  onSelectSlotVetId: (vetId: string) => void;
  vetsMap: Record<string, Veterinarian>;
  specsMap: Record<string, string>;
}

/**
 * Шаг 4: выбор даты старта, диапазона (7 / 14 дней), временного слота и врача (при «Любой врач»).
 */
export const StepSlotSelection: React.FC<StepSlotSelectionProps> = ({
  fromDate,
  todayStr,
  onFromDateChange,
  horizonDays,
  onHorizonDaysChange,
  durationInfoText,
  loadingSlots,
  slotsError,
  conflictError,
  onRetrySlots,
  availableSlots,
  slotsByDay,
  selectedSlot,
  onSelectSlot,
  isAnyVet,
  selectedSlotVetId,
  onSelectSlotVetId,
  vetsMap,
  specsMap,
}) => {
  const showMultiVetPicker =
    Boolean(isAnyVet && selectedSlot && selectedSlot.veterinarianIds.length > 1);

  return (
    <div className="col" style={{ gap: '12px' }}>
      {conflictError && (
        <div className="alert" role="alert">
          <AlertCircle className="ic" />
          <div>
            <b>Слот недоступен.</b> {conflictError}
          </div>
        </div>
      )}

      <div className="row wrap" style={{ gap: '12px', alignItems: 'flex-end' }}>
        <div className="field" style={{ width: '180px' }}>
          <label className="field-label" htmlFor="wz-from">
            С даты
          </label>
          <DatePicker
            id="wz-from"
            value={fromDate}
            min={todayStr}
            clearable={false}
            onChange={(iso) => {
              if (iso) onFromDateChange(iso);
            }}
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
        <div className="empty">
          <div className="spinner" />
          <span className="small muted">Поиск свободных окон...</span>
        </div>
      ) : slotsError ? (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle className="ic" />
          <div className="row between wrap grow" style={{ gap: '8px', alignItems: 'center' }}>
            <span>{slotsError}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetrySlots}>
              Повторить
            </button>
          </div>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="empty">
          <div className="empty-art">
            <CalendarOff className="ic ic-40" />
          </div>
          <span className="empty-title">Нет свободных окон</span>
          <span>Попробуйте другой период или другого врача</span>
        </div>
      ) : (
        <>
          {slotsByDay.map((group) => (
            <div
              key={group.dateKey}
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
                  const startStr = formatSlotTime(slot.startAt);
                  const endStr = formatSlotTime(slot.endAt);
                  const vetNames = slot.veterinarianIds
                    .map((id) => {
                      const v = vetsMap[id];
                      return v ? getDoctorDisplay(v, specsMap).name : 'Дежурный врач';
                    })
                    .join(', ');
                  const tip = vetNames
                    ? `${startStr}–${endStr} · свободны: ${vetNames}`
                    : `${startStr}–${endStr}`;

                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      title={tip}
                      className={`slot ${isSel ? 'on' : ''}`}
                      aria-pressed={isSel}
                      onClick={() => onSelectSlot(slot)}
                    >
                      {startStr}
                      {isAnyVet && slot.veterinarianIds.length > 0 && (
                        <span className="avatars">
                          {slot.veterinarianIds.slice(0, 3).map((id) => {
                            const v = vetsMap[id];
                            const ini = v ? getDoctorDisplay(v, specsMap).initials : 'ДВ';
                            return (
                              <VetAvatar
                                key={id}
                                vet={v}
                                initials={ini}
                                className="avatar avatar-xs"
                                alt={v ? getDoctorDisplay(v, specsMap).name : 'Дежурный врач'}
                              />
                            );
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {showMultiVetPicker && selectedSlot && (
            <div className="card" style={{ borderColor: 'var(--primary)' }}>
              <span className="cell-main">
                В {formatSlotTime(selectedSlot.startAt)} свободны несколько врачей — выберите одного
              </span>
              <div className="chips">
                {selectedSlot.veterinarianIds.map((vid) => {
                  const v = vetsMap[vid];
                  const display = v
                    ? getDoctorDisplay(v, specsMap)
                    : { name: 'Дежурный врач', initials: 'ДВ' };
                  const isPicked = selectedSlotVetId === vid;
                  return (
                    <button
                      key={vid}
                      type="button"
                      className={`chip ${isPicked ? 'on' : ''}`}
                      onClick={() => onSelectSlotVetId(vid)}
                    >
                      <VetAvatar
                        vet={v}
                        initials={display.initials}
                        className="avatar avatar-xs"
                        style={{ margin: 0 }}
                        alt={display.name}
                      />
                      {display.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
