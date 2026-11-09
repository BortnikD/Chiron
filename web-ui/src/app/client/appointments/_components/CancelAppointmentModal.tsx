'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Appointment } from '../../../../types';

export interface CancelAppointmentModalProps {
  /** Флаг открытия модального окна */
  isOpen: boolean;
  /** Запись, которую планируется отменить */
  appointment: Appointment | null;
  /** Текст причины отмены */
  reason: string;
  /** Функция изменения текста причины */
  onReasonChange: (reason: string) => void;
  /** Функция подтверждения отмены */
  onConfirm: () => void;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Флаг процесса отправки запроса отмены */
  loading: boolean;
  /** Сообщение об ошибке (при наличии) */
  error: string | null;
}

/**
 * Модальное окно подтверждения отмены записи на приём:
 * содержит подтверждение даты, поле для указания причины отмены и блок отображения ошибки.
 */
export function CancelAppointmentModal({
  isOpen,
  appointment,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  loading,
  error,
}: CancelAppointmentModalProps) {
  if (!isOpen || !appointment) {
    return null;
  }

  const apptDateStr = new Date(appointment.startAt).toLocaleDateString('ru-RU');

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog" style={{ width: '420px', maxWidth: 'calc(100vw - 32px)' }}>
        <div className="dialog-head">
          <span className="dialog-title">Отмена записи</span>
          <span className="dialog-desc">
            Вы уверены, что хотите отменить приём на {apptDateStr}?
          </span>
        </div>

        <div className="dialog-body">
          {error && (
            <div className="alert alert-destructive">
              <AlertCircle className="ic" />
              <div>{error}</div>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="c-reason">
              Причина отмены (необязательно)
            </label>
            <textarea
              id="c-reason"
              className="textarea"
              rows={2}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Изменились планы, питомец поправился..."
            />
          </div>
        </div>

        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Назад
          </button>
          <button
            type="button"
            className="btn btn-destructive"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Отмена...' : 'Подтвердить отмену'}
          </button>
        </div>
      </div>
    </div>
  );
}
