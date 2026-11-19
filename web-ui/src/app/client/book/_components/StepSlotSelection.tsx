import React from 'react';
import { CalendarOff, AlertCircle, Check, UserCheck } from 'lucide-react';
import type { Veterinarian, AvailableSlotResponse } from '@/modules/clinic/types';
import { DatePicker, Skeleton } from '@/shared/components';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { formatMoscowMonthDay, formatSlotTime } from '@/shared/lib';
import { getDoctorDisplay } from '@/shared/lib';
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
  selectedSlotVetId?: string | null;
  onSelectSlotVetId?: (vetId: string) => void;
  isAnyVet: boolean;
  selectedVet?: Veterinarian | null;
  initialSlot?: string | null;
  onResetToAnyVet?: () => void;
  vetsMap: Record<string, Veterinarian>;
  specsMap: Record<string, string>;
}

/**
 * Шаг 4: выбор даты старта, диапазона (7 / 14 дней) и временного слота.
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
  selectedSlotVetId,
  onSelectSlotVetId,
  isAnyVet,
  selectedVet,
  initialSlot,
  onResetToAnyVet,
  vetsMap,
  specsMap,
}) => {
  const selectedSlotVets = React.useMemo(() => {
    if (!selectedSlot) return [];
    return selectedSlot.veterinarianIds
      .map((id) => vetsMap[id])
      .filter((v): v is Veterinarian => Boolean(v));
  }, [selectedSlot, vetsMap]);
  const nearestSlot = React.useMemo(() => {
    return availableSlots.length > 0 ? availableSlots[0] : null;
  }, [availableSlots]);

  return (
    <div className="col" style={{ gap: '12px' }}>
      {conflictError && (
        <div
          className="alert alert-destructive row between items-center wrap"
          role="alert"
          style={{ gap: '10px' }}
        >
          <div className="row items-center" style={{ gap: '8px', flex: 1, minWidth: '220px' }}>
            <AlertCircle className="ic" style={{ flexShrink: 0 }} />
            <div>
              <b>Время только что занято другим клиентом.</b> {conflictError}
              {nearestSlot && (
                <div style={{ marginTop: '2px', fontSize: '12.5px' }}>
                  Ближайшее доступное окно: <b>{formatMoscowMonthDay(nearestSlot.startAt)} в {formatSlotTime(nearestSlot.startAt)}</b>
                </div>
              )}
            </div>
          </div>
          {nearestSlot && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onSelectSlot(nearestSlot)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Выбрать {formatSlotTime(nearestSlot.startAt)}
            </button>
          )}
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

      {initialSlot && !selectedSlot && !isAnyVet && selectedVet && (
        <div
          className="row between items-center wrap"
          style={{
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            borderRadius: '8px',
            fontSize: '13px',
            gap: '10px',
          }}
        >
          <div className="row items-center" style={{ gap: '8px', flex: 1, minWidth: '220px' }}>
            <AlertCircle size={16} className="accent" style={{ flexShrink: 0 }} />
            <span>
              У врача <b>{selectedVet.fullName}</b> время {formatMoscowMonthDay(initialSlot)} в{' '}
              <b>{formatSlotTime(initialSlot)}</b> недоступно. Выберите любое свободное окно ниже или вернитесь к «Любому врачу».
            </span>
          </div>
          {onResetToAnyVet && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onResetToAnyVet}
              style={{ whiteSpace: 'nowrap' }}
            >
              Вернуться к «Любому врачу» ({formatSlotTime(initialSlot)})
            </button>
          )}
        </div>
      )}

      {loadingSlots ? (
        <div className="col" style={{ gap: '16px', padding: '12px 0' }}>
          {[1, 2, 3].map((d) => (
            <div key={`day-skel-${d}`} className="col" style={{ gap: '8px' }}>
              <div className="row items-center" style={{ gap: '8px' }}>
                <Skeleton width="130px" height="16px" borderRadius="4px" />
                <Skeleton width="60px" height="14px" borderRadius="4px" />
              </div>
              <div className="row wrap" style={{ gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <Skeleton key={s} width="64px" height="32px" borderRadius="8px" />
                ))}
              </div>
            </div>
          ))}
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
        </>
      )}
    </div>
  );
};
