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
}) => {
  const effectivePrice = service?.effectivePrice ?? service?.basePrice ?? service?.price;
  const whenLabel = selectedSlot
    ? `${formatDateShort(selectedSlot.startAt)}, ${formatSlotTime(selectedSlot.startAt)}–${formatSlotTime(selectedSlot.endAt)}`
    : '—';

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
