'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import {
  ScheduleExceptionType,
  CreateScheduleExceptionRequest,
} from '../../../../types';
import { X, AlertCircle } from 'lucide-react';
import { tm } from './utils';

export interface VetExceptionModalProps {
  isOpen: boolean;
  vetId: string;
  onClose: () => void;
  onSuccess: () => void;
  onSave?: (data: CreateScheduleExceptionRequest) => Promise<void>;
}

/**
 * Модальное окно добавления исключения из графика (отпуск, больничный, командировка, особый график).
 */
export const VetExceptionModal: React.FC<VetExceptionModalProps> = ({
  isOpen,
  vetId,
  onClose,
  onSuccess,
  onSave,
}) => {
  const defaultToday = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<ScheduleExceptionType>('ABSENCE');
  const [startDate, setStartDate] = useState(defaultToday);
  const [endDate, setEndDate] = useState(defaultToday);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType('ABSENCE');
      setStartDate(defaultToday);
      setEndDate(defaultToday);
      setStartTime('09:00');
      setEndTime('18:00');
      setReason('');
      setError(null);
      setSaving(false);
    }
  }, [isOpen, defaultToday]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vetId) {
      setError('Идентификатор врача не найден');
      return;
    }

    if (!startDate || !endDate || endDate < startDate) {
      setError('Дата окончания не может быть раньше даты начала');
      return;
    }

    if (
      type === 'CUSTOM_HOURS' &&
      (!startTime || !endTime || tm(endTime) <= tm(startTime))
    ) {
      setError('Для особых часов укажите корректное время начала и окончания');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formattedStartTime =
        type === 'CUSTOM_HOURS' ? `${startTime.slice(0, 5)}:00` : null;
      const formattedEndTime =
        type === 'CUSTOM_HOURS' ? `${endTime.slice(0, 5)}:00` : null;
      const trimmedReason = reason.trim() || null;

      const payload: CreateScheduleExceptionRequest = {
        veterinarianId: vetId,
        type,
        startDate,
        endDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        reason: trimmedReason,
      };

      if (onSave) {
        await onSave(payload);
      } else {
        await adminApi.createScheduleException(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить исключение');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="dialog dialog-sm" role="dialog" aria-modal="true">
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'center' }}>
            <span className="dialog-title">Новое исключение</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={saving}
              aria-label="Закрыть"
            >
              <X className="ic" />
            </button>
          </div>
          <span className="dialog-desc">
            Отпуск, больничный, командировка или индивидуальные часы работы
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="dialog-body">
            {error && (
              <div className="alert alert-err" style={{ marginBottom: '12px' }}>
                <AlertCircle className="ic" />
                <span>{error}</span>
              </div>
            )}

            <div className="col" style={{ gap: '12px' }}>
              <div className="field">
                <span className="field-label">Тип исключения</span>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${type === 'ABSENCE' ? 'on' : ''}`}
                    onClick={() => setType('ABSENCE')}
                    disabled={saving}
                  >
                    Отсутствие
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${type === 'CUSTOM_HOURS' ? 'on' : ''}`}
                    onClick={() => setType('CUSTOM_HOURS')}
                    disabled={saving}
                  >
                    Особые часы
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label">
                    С даты <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label">
                    По дату <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>

                {type === 'CUSTOM_HOURS' && (
                  <>
                    <div className="field">
                      <label className="field-label">
                        Время с <span className="req">*</span>
                      </label>
                      <input
                        type="time"
                        step={900}
                        className="input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">
                        Время по <span className="req">*</span>
                      </label>
                      <input
                        type="time"
                        step={900}
                        className="input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={saving}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="field">
                <label className="field-label">Причина</label>
                <textarea
                  className="textarea"
                  placeholder="Например: Ежегодный отпуск, Обучение, Дежурство"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={saving}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
