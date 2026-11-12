import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { Service, AvailableSlotResponse } from '@/modules/clinic/types';
import { formatCurrency, formatDateShort, formatSlotTime } from '@/shared/lib';

export interface StepConfirmationProps {
  pet: Pet | null;
  speciesName: string;
  service: Service | null;
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
  doctorDisplay,
  selectedSlot,
  comment,
  onCommentChange,
  isVaccination = false,
}) => {
  const effectivePrice = service?.effectivePrice ?? service?.basePrice ?? service?.price;
  const whenLabel = selectedSlot
    ? `${formatDateShort(selectedSlot.startAt)}, ${formatSlotTime(selectedSlot.startAt)}–${formatSlotTime(selectedSlot.endAt)}`
    : '—';
  const activePreset = isVaccination ? getSelectedVaccinePreset(comment) : null;

  return (
    <div className="col" style={{ gap: '14px', maxWidth: '640px' }}>
      <span className="h2">Подтверждение</span>
      <dl className="kv" style={{ margin: 0 }}>
        <dt>Питомец</dt>
        <dd>{pet ? `${pet.name}${speciesName ? ` · ${speciesName}` : ''}` : '—'}</dd>
        <dt>Услуга</dt>
        <dd>{service?.name || '—'}</dd>
        <dt>Врач</dt>
        <dd>{doctorDisplay}</dd>
        <dt>Дата и время</dt>
        <dd className="tnum">{whenLabel}</dd>
        <dt>Стоимость</dt>
        <dd className="cell-main tnum">
          {effectivePrice != null ? formatCurrency(effectivePrice) : '—'}
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
