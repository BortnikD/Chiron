'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import {
  Veterinarian,
  ScheduleException,
  ScheduleExceptionType,
  CreateScheduleExceptionRequest,
} from '../../../../types';
import { X, AlertCircle } from 'lucide-react';
import { tm } from './utils';

export interface ScheduleExceptionSaveData {
  exceptionId?: string;
  veterinarianId: string;
  type: ScheduleExceptionType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface ScheduleExceptionModalProps {
  isOpen: boolean;
  exception?: ScheduleException | null;
  vets: Veterinarian[];
  defaultVetId?: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialVetId?: string;
  exceptionId?: string;
  initialType?: ScheduleExceptionType;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialReason?: string;
  onSave?: (data: ScheduleExceptionSaveData) => Promise<void>;
}

/**
 * Модальное окно добавления и редактирования исключений из расписания (отпуск, больничный, командировка, особые часы).
 */
export const ScheduleExceptionModal: React.FC<ScheduleExceptionModalProps> = ({
  isOpen,
  exception,
  vets,
  defaultVetId,
  onClose,
  onSuccess,
  mode: propMode,
  initialVetId,
  exceptionId: propExceptionId,
  initialType = 'ABSENCE',
  initialStartDate,
  initialEndDate,
  initialStartTime = '10:00',
  initialEndTime = '16:00',
  initialReason = '',
  onSave,
}) => {
  const defaultToday = new Date().toISOString().split('T')[0];
  const isEdit = Boolean(exception || propMode === 'edit');
  const targetExceptionId = exception?.id || propExceptionId;

  const [vetId, setVetId] = useState(defaultVetId || initialVetId || (vets[0]?.id ?? ''));
  const [type, setType] = useState<ScheduleExceptionType>(initialType);
  const [startDate, setStartDate] = useState(defaultToday);
  const [endDate, setEndDate] = useState(defaultToday);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [reason, setReason] = useState(initialReason);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Синхронизация состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      if (exception) {
        setVetId(exception.veterinarianId);
        setType(exception.type);
        setStartDate(exception.startDate);
        setEndDate(exception.endDate);
        setStartTime(exception.startTime ? exception.startTime.slice(0, 5) : '10:00');
        setEndTime(exception.endTime ? exception.endTime.slice(0, 5) : '16:00');
        setReason(exception.reason || '');
      } else {
        setVetId(defaultVetId || initialVetId || (vets[0]?.id ?? ''));
        setType(initialType);
        setStartDate(initialStartDate || defaultToday);
        setEndDate(initialEndDate || defaultToday);
        setStartTime(initialStartTime ? initialStartTime.slice(0, 5) : '10:00');
        setEndTime(initialEndTime ? initialEndTime.slice(0, 5) : '16:00');
        setReason(initialReason || '');
      }
      setError(null);
      setSaving(false);
    }
  }, [
    isOpen,
    exception,
    defaultVetId,
    initialVetId,
    initialType,
    initialStartDate,
    initialEndDate,
    initialStartTime,
    initialEndTime,
    initialReason,
    vets,
    defaultToday,
  ]);

  if (!isOpen) return null;

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vetId) {
      setError('Выберите врача');
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
      const formattedStartTime = type === 'CUSTOM_HOURS' ? `${startTime.slice(0, 5)}:00` : null;
      const formattedEndTime = type === 'CUSTOM_HOURS' ? `${endTime.slice(0, 5)}:00` : null;
      const trimmedReason = reason.trim() || null;

      if (onSave) {
        await onSave({
          exceptionId: targetExceptionId,
          veterinarianId: vetId,
          type,
          startDate,
          endDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          reason: trimmedReason,
        });
      } else {
        // Если редактируем существующую запись, удаляем старую и создаем актуальную
        if (isEdit && targetExceptionId) {
          try {
            await adminApi.deleteScheduleException(targetExceptionId);
          } catch (delErr) {
            console.warn('Ошибка при удалении предыдущего исключения:', delErr);
          }
        }

        const payload: CreateScheduleExceptionRequest = {
          veterinarianId: vetId,
          type,
          startDate,
          endDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          reason: trimmedReason,
        };

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
            <span className="dialog-title">
              {isEdit ? 'Изменить исключение' : 'Новое исключение'}
            </span>
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
          <span className="dialog-desc">Отпуск, болезнь, командировка или индивидуальные часы работы</span>
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
                <span className="field-label">Врач</span>
                <select
                  className="select"
                  value={vetId}
                  onChange={(e) => setVetId(e.target.value)}
                  disabled={saving}
                  required
                >
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

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
