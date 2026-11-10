'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { WorkSchedule } from '@/modules/admin/types';
import { DOW_FULL, DOW_ORDER, DOW_TO_INDEX, formatApiError, timeToMinutes } from '@/shared/lib';
import type { WorkScheduleSavePayload } from '../_hooks/useAdminSchedules';

export interface WorkScheduleModalProps {
  isOpen: boolean;
  schedule?: WorkSchedule | null;
  dayIndex?: number;
  veterinarianId: string;
  doctorName: string;
  onClose: () => void;
  onSave: (data: WorkScheduleSavePayload) => Promise<void>;
}

export const WorkScheduleModal: React.FC<WorkScheduleModalProps> = ({
  isOpen,
  schedule,
  dayIndex: propDayIndex,
  veterinarianId,
  doctorName,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(schedule);

  const [dayIndex, setDayIndex] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (schedule) {
      setDayIndex(DOW_TO_INDEX[schedule.dayOfWeek] ?? propDayIndex ?? 0);
      setStartTime(schedule.startTime.slice(0, 5));
      setEndTime(schedule.endTime.slice(0, 5));
      setBreakStart(schedule.breakStart ? schedule.breakStart.slice(0, 5) : '');
      setBreakEnd(schedule.breakEnd ? schedule.breakEnd.slice(0, 5) : '');
    } else {
      setDayIndex(propDayIndex ?? 0);
      setStartTime('09:00');
      setEndTime('18:00');
      setBreakStart('13:00');
      setBreakEnd('14:00');
    }
    setError(null);
    setSaving(false);
  }, [isOpen, schedule, propDayIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veterinarianId) {
      setError('Не выбран врач');
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('Время окончания должно быть позже начала');
      return;
    }
    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      setError('Укажите обе границы перерыва или очистите обе');
      return;
    }
    if (
      breakStart &&
      (timeToMinutes(breakStart) < timeToMinutes(startTime) ||
        timeToMinutes(breakEnd) > timeToMinutes(endTime) ||
        timeToMinutes(breakEnd) <= timeToMinutes(breakStart))
    ) {
      setError('Перерыв должен находиться внутри рабочего времени');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        scheduleId: schedule?.id,
        veterinarianId,
        dayOfWeek: DOW_ORDER[dayIndex],
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        breakStart: breakStart ? `${breakStart}:00` : null,
        breakEnd: breakEnd ? `${breakEnd}:00` : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось сохранить рабочий день'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div
        className="dialog dialog-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'center' }}>
            <h2 id="ws-modal-title" className="dialog-title">
              {isEdit
                ? `Изменить: ${DOW_FULL[dayIndex]}`
                : `Новый рабочий день: ${DOW_FULL[dayIndex]}`}
            </h2>
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
          <p className="dialog-desc">
            {doctorName} · {isEdit ? 'Изменение графика' : 'Добавление дня в график'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="dialog-body">
            {error && (
              <div className="alert alert-destructive" role="alert" style={{ marginBottom: '12px' }}>
                <AlertCircle className="ic" />
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="ws-dow">День недели</label>
              <select
                id="ws-dow"
                className="select"
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                disabled={isEdit || saving}
              >
                {DOW_FULL.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="ws-start">
                  Начало <span className="req">*</span>
                </label>
                <input
                  id="ws-start"
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
                <label className="field-label" htmlFor="ws-end">
                  Конец <span className="req">*</span>
                </label>
                <input
                  id="ws-end"
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
                <label className="field-label" htmlFor="ws-brk-start">Перерыв с</label>
                <input
                  id="ws-brk-start"
                  type="time"
                  step={900}
                  className="input"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ws-brk-end">Перерыв до</label>
                <input
                  id="ws-brk-end"
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
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
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
