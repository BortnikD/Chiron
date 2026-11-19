import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { Service, AvailableSlotResponse } from '@/modules/clinic/types';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';

export interface StepConfirmationProps {
  pet: Pet | null;
  speciesName: string;
  service: Service | null;
  selectedServices?: Service[];
  servicePrice?: number | null;
  serviceDurationMin?: number | null;
  doctorDisplay: string;
  selectedSlot: AvailableSlotResponse | null;
  comment: string;
  onCommentChange: (val: string) => void;
  isVaccination?: boolean;
}

const VACCINE_PRESETS = ['Комплексная вакцина', 'Бешенство'];
const VACCINE_PREFIX_RE = /^(?:Ревакцинация|Желаемая вакцина):\s*([^\n]+)(?:\n|$)/i;

function getSelectedVaccinePreset(comment: string): string | null {
  const match = comment.match(/^(?:Ревакцинация|Желаемая вакцина):\s*([^\n]+)/i);
  return match ? match[1].trim().toLowerCase() : null;
}

function applyVaccinePreset(comment: string, vaccine: string): string {
  const match = comment.match(VACCINE_PREFIX_RE);
  const rest = match ? comment.slice(match[0].length) : comment;

  if (match && match[1].trim().toLowerCase() === vaccine.toLowerCase()) {
    return rest.trimStart();
  }

  const header = `Желаемая вакцина: ${vaccine}`;
  return (rest ? `${header}\n${rest}` : header).slice(0, 1000);
}

/**
 * Шаг 5: подтверждение деталей записи, ввод комментария для врача, итоговая стоимость.
 */
export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  pet,
  speciesName,
  service,
  selectedServices = [],
  servicePrice,
  serviceDurationMin,
  doctorDisplay,
  selectedSlot,
  comment,
  onCommentChange,
  isVaccination = false,
}) => {
  const isMulti = selectedServices.length > 1;
  const totalPrice =
    servicePrice ??
    (isMulti
      ? selectedServices.reduce(
          (sum, s) => sum + (s.effectivePrice ?? s.basePrice ?? s.price ?? 0),
          0
        )
      : service?.effectivePrice ?? service?.basePrice ?? service?.price);

  const totalDuration =
    serviceDurationMin ??
    (isMulti
      ? selectedServices.reduce(
          (sum, s) =>
            sum + (s.effectiveDurationMin ?? s.baseDurationMin ?? s.durationMin ?? 30),
          0
        )
      : service?.effectiveDurationMin ?? service?.baseDurationMin ?? service?.durationMin);

  const whenLabel = useMemo(() => {
    if (!selectedSlot) return '—';
    const startStr = formatSlotTime(selectedSlot.startAt);
    let endStr = formatSlotTime(selectedSlot.endAt);
    if (totalDuration && selectedSlot.startAt) {
      const startMs = new Date(selectedSlot.startAt).getTime();
      const endMs = new Date(selectedSlot.endAt).getTime();
      const slotDurMin = Math.round((endMs - startMs) / 60000);
      if (slotDurMin !== totalDuration) {
        const expectedEndMs = startMs + totalDuration * 60000;
        endStr = formatSlotTime(new Date(expectedEndMs).toISOString());
      }
    }
    return `${formatDateShort(selectedSlot.startAt)}, ${startStr}–${endStr}`;
  }, [selectedSlot, totalDuration]);
  const activePreset = isVaccination ? getSelectedVaccinePreset(comment) : null;

  return (
    <div className="col" style={{ gap: '14px', maxWidth: '640px' }}>
      <span className="h2">Подтверждение</span>
      <dl className="kv" style={{ margin: 0 }}>
        <dt>Питомец</dt>
        <dd>{pet ? `${pet.name}${speciesName ? ` · ${speciesName}` : ''}` : '—'}</dd>

        <dt>{isMulti ? `Услуги (${selectedServices.length})` : 'Услуга'}</dt>
        <dd>
          {isMulti ? (
            <div className="col" style={{ gap: '6px', width: '100%' }}>
              {selectedServices.map((s, idx) => (
                <div
                  key={s.id}
                  className="row between"
                  style={{
                    gap: '12px',
                    padding: '6px 10px',
                    backgroundColor: 'var(--card-subtle, rgba(255, 255, 255, 0.03))',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '13px' }}>
                    <b style={{ marginRight: '6px', color: 'var(--primary-text, var(--primary))' }}>
                      {idx + 1}.
                    </b>
                    {s.name}
                  </span>
                  <span className="tnum" style={{ fontSize: '13px', fontWeight: 600 }}>
                    {formatCurrency(s.effectivePrice ?? s.basePrice ?? s.price ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            service?.name || '—'
          )}
        </dd>

        <dt>Врач</dt>
        <dd>{doctorDisplay}</dd>

        <dt>Дата и время</dt>
        <dd className="tnum">{whenLabel}</dd>

        <dt>Длительность</dt>
        <dd className="tnum">{totalDuration ? `${totalDuration} мин` : '—'}</dd>

        <dt>Итоговая стоимость</dt>
        <dd
          className="cell-main tnum"
          style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}
        >
          {totalPrice != null ? formatCurrency(totalPrice) : '—'}
        </dd>
      </dl>

      {isVaccination && (
        <div className="field">
          <span className="field-label">Желаемая вакцина (передаётся в комментарии)</span>
          <div className="row wrap" style={{ gap: '8px' }}>
            {VACCINE_PRESETS.map((preset) => {
              const isSel = activePreset === preset.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-outline'}`}
                  aria-pressed={isSel}
                  onClick={() => onCommentChange(applyVaccinePreset(comment, preset))}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <span className="field-hint">
            Врач подтвердит препарат на приёме и внесёт прививку в паспорт после вакцинации.
          </span>
        </div>
      )}

      <div className="field">
        <label className="field-label" htmlFor="wz-comment">
          Комментарий для врача
        </label>
        <textarea
          id="wz-comment"
          className="textarea"
          maxLength={1000}
          rows={3}
          placeholder="Что беспокоит, особенности питомца"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value.slice(0, 1000))}
        />
        <span className="field-hint">{comment.length} / 1000</span>
      </div>

      <div className="alert alert-info">
        <AlertCircle className="ic" />
        <div>
          Запись создаётся со статусом «Ожидает подтверждения». Цену рассчитывает клиника.
        </div>
      </div>
    </div>
  );
};
