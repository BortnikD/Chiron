import React from 'react';
import { Pet, Service, AvailableSlotResponse } from '../../../../types';
import { AlertCircle } from 'lucide-react';
import { formatSlotTime } from './constants';

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
 * Шаг 4: подтверждение деталей записи, ввод комментария клиента, расчет стоимости.
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
  return (
    <div className="col" style={{ gap: '14px', maxWidth: '640px' }}>
      <span className="h2">Подтверждение записи</span>
      <dl className="kv" style={{ margin: 0 }}>
        <dt>Питомец</dt>
        <dd>
          {pet ? `${pet.name}${speciesName ? ` · ${speciesName}` : ''}` : '—'}
        </dd>
        <dt>Услуга</dt>
        <dd>{service?.name || '—'}</dd>
        <dt>Врач</dt>
        <dd>{doctorDisplay}</dd>
        <dt>Дата и время</dt>
        <dd className="tnum">
          {selectedSlot
            ? `${new Date(selectedSlot.startAt).toLocaleDateString('ru-RU')} в ${formatSlotTime(selectedSlot.startAt)}`
            : '—'}
        </dd>
        <dt>Стоимость</dt>
        <dd className="cell-main tnum">
          {service?.basePrice != null ? `${service.basePrice.toLocaleString('ru-RU')} ₽` : '—'}
        </dd>
      </dl>

      <div className="field">
        <label className="field-label" htmlFor="wz-comment">
          Комментарий для врача (необязательно)
        </label>
        <textarea
          id="wz-comment"
          className="textarea"
          maxLength={1000}
          rows={3}
          placeholder="Что беспокоит, тревожные симптомы или особенности питомца"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
        />
        <span className="field-hint">{comment.length} / 1000 символов</span>
      </div>

      <div className="alert alert-info">
        <AlertCircle className="ic" />
        <div>
          Запись создаётся со статусом «Ожидает подтверждения». Точную стоимость рассчитает клиника на приёме.
        </div>
      </div>
    </div>
  );
};
