'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import {
  DayOfWeek,
  WorkSchedule,
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
} from '../../../../types';
import { X, AlertCircle } from 'lucide-react';
import { DOWS_FULL, INDEX_TO_DOW, DOW_TO_INDEX, tm } from './utils';

export interface WorkScheduleSaveData {
  scheduleId?: string;
  veterinarianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface WorkScheduleModalProps {
  isOpen: boolean;
  schedule?: WorkSchedule | null;
  dayIndex?: number;
  veterinarianId: string;
  doctorName: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  scheduleId?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialBreakStart?: string;
  initialBreakEnd?: string;
  onSave?: (data: WorkScheduleSaveData) => Promise<void>;
}

/**
 * Модальное окно создания и редактирования рабочего графика врача на определенный день недели.
 * Включает валидацию временных рамок, выбор дня недели, шаг интервалов (слотов) и перерывы.
 */
export const WorkScheduleModal: React.FC<WorkScheduleModalProps> = ({
  isOpen,
  schedule,
  dayIndex: propDayIndex,
  veterinarianId,
  doctorName,
  onClose,
  onSuccess,
  mode: propMode,
  scheduleId: propScheduleId,
  initialStartTime = '09:00',
  initialEndTime = '18:00',
  initialBreakStart = '13:00',
  initialBreakEnd = '14:00',
  onSave,
}) => {
  const isEdit = Boolean(schedule || propMode === 'edit');
  const targetScheduleId = schedule?.id || propScheduleId;

  const [dayIndex, setDayIndex] = useState(0);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [breakStart, setBreakStart] = useState(initialBreakStart);
  const [breakEnd, setBreakEnd] = useState(initialBreakEnd);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Синхронизация состояния формы при открытии модального окна или изменении входных данных
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setDayIndex(DOW_TO_INDEX[schedule.dayOfWeek] ?? (propDayIndex ?? 0));
        setStartTime(schedule.startTime.slice(0, 5));
        setEndTime(schedule.endTime.slice(0, 5));
        setBreakStart(schedule.breakStart ? schedule.breakStart.slice(0, 5) : '');
        setBreakEnd(schedule.breakEnd ? schedule.breakEnd.slice(0, 5) : '');
      } else {
        setDayIndex(propDayIndex ?? 0);
        setStartTime(initialStartTime.slice(0, 5));
        setEndTime(initialEndTime.slice(0, 5));
        setBreakStart(initialBreakStart ? initialBreakStart.slice(0, 5) : '');
        setBreakEnd(initialBreakEnd ? initialBreakEnd.slice(0, 5) : '');
      }
      setError(null);
      setSaving(false);
    }
  }, [
    isOpen,
    schedule,
    propDayIndex,
    initialStartTime,
    initialEndTime,
    initialBreakStart,
    initialBreakEnd,
  ]);

  if (!isOpen) return null;

  // Обработка отправки формы с проверкой корректности временных рамок
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veterinarianId) {
      setError('Не выбран врач');
      return;
    }

    if (tm(endTime) <= tm(startTime)) {
      setError('Время окончания должно быть позже начала');
      return;
    }

    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      setError('Укажите обе границы перерыва или очистите обе');
      return;
    }

    if (
      breakStart &&
      (tm(breakStart) < tm(startTime) ||
        tm(breakEnd) > tm(endTime) ||
        tm(breakEnd) <= tm(breakStart))
    ) {
      setError('Перерыв должен находиться внутри рабочего времени');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formattedStartTime = `${startTime}:00`;
      const formattedEndTime = `${endTime}:00`;
      const formattedBreakStart = breakStart ? `${breakStart}:00` : null;
      const formattedBreakEnd = breakEnd ? `${breakEnd}:00` : null;

      if (onSave) {
        await onSave({
          scheduleId: targetScheduleId,
          veterinarianId,
          dayOfWeek: INDEX_TO_DOW[dayIndex],
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          breakStart: formattedBreakStart,
          breakEnd: formattedBreakEnd,
        });
      } else if (isEdit && targetScheduleId) {
        const payload: UpdateWorkScheduleRequest = {
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          breakStart: formattedBreakStart,
          breakEnd: formattedBreakEnd,
        };
        await adminApi.updateWorkSchedule(targetScheduleId, payload);
      } else {
        const payload: CreateWorkScheduleRequest = {
          veterinarianId,
          dayOfWeek: INDEX_TO_DOW[dayIndex],
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          breakStart: formattedBreakStart,
          breakEnd: formattedBreakEnd,
        };
        await adminApi.createWorkSchedule(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить рабочий день');
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
              {isEdit
                ? `Изменить: ${DOWS_FULL[dayIndex]}`
                : `Новый рабочий день: ${DOWS_FULL[dayIndex]}`}
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
          <span className="dialog-desc">
            {doctorName} · {isEdit ? 'Изменение графика' : 'Добавление дня в график'}
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

            {/* Выбор дня недели для графика */}
            <div className="field">
              <label className="field-label">День недели</label>
              <select
                className="select"
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                disabled={isEdit || saving}
              >
                {DOWS_FULL.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">
                  Начало <span className="req">*</span>
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
                  Конец <span className="req">*</span>
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

              <div className="field">
                <label className="field-label">Перерыв с</label>
                <input
                  type="time"
                  step={900}
                  className="input"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="field-label">Перерыв до</label>
                <input
                  type="time"
                  step={900}
                  className="input"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <span className="field-hint" style={{ marginTop: '8px', display: 'block' }}>
              Шаг интервалов — 15 минут. День недели привязан к позиции в неделе.
            </span>
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
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
