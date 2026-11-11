'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import {
  DatePicker,
  SearchCombobox,
  type SearchComboboxOption,
} from '@/shared/components';
import type { ScheduleExceptionType } from '@/shared/types';
import { formatApiError, getMoscowTodayIso, timeToMinutes } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type { ScheduleExceptionSavePayload } from './types';

export interface ScheduleExceptionModalProps {
  isOpen: boolean;
  exception?: ScheduleException | null;
  vets: Veterinarian[];
  specsMap?: Record<string, string>;
  defaultVetId?: string;
  onClose: () => void;
  onSave: (data: ScheduleExceptionSavePayload) => Promise<void>;
}

export const ScheduleExceptionModal: React.FC<ScheduleExceptionModalProps> = ({
  isOpen,
  exception,
  vets,
  specsMap,
  defaultVetId,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(exception);

  const [vetId, setVetId] = useState(defaultVetId || (vets[0]?.id ?? ''));
  const [type, setType] = useState<ScheduleExceptionType>('ABSENCE');
  const [startDate, setStartDate] = useState(() => getMoscowTodayIso());
  const [endDate, setEndDate] = useState(() => getMoscowTodayIso());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const vetOptions = useMemo<SearchComboboxOption[]>(
    () =>
      vets.map((v) => {
        const doc = getDoctorDisplay(v, specsMap);
        return { value: v.id, label: doc.fullName, hint: doc.specName };
      }),
    [vets, specsMap]
  );

  useEffect(() => {
    if (!isOpen) return;
    const today = getMoscowTodayIso();
    if (exception) {
      setVetId(exception.veterinarianId);
      setType(exception.type);
      setStartDate(exception.startDate);
      setEndDate(exception.endDate);
      setStartTime(exception.startTime ? exception.startTime.slice(0, 5) : '10:00');
      setEndTime(exception.endTime ? exception.endTime.slice(0, 5) : '16:00');
      setReason(exception.reason || '');
    } else {
      setVetId(defaultVetId || (vets[0]?.id ?? ''));
      setType('ABSENCE');
      setStartDate(today);
      setEndDate(today);
      setStartTime('10:00');
      setEndTime('16:00');
      setReason('');
    }
    setError(null);
    setSaving(false);
  }, [isOpen, exception, defaultVetId, vets]);

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
    if (!vetId) {
      setError('Выберите врача');
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError('Дата «по» не может быть раньше даты «с»');
      return;
    }
    if (
      type === 'CUSTOM_HOURS' &&
      (!startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime))
    ) {
      setError('Для особых часов укажите время с–по');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        exceptionId: exception?.id,
        veterinarianId: vetId,
        type,
        startDate,
        endDate,
        startTime: type === 'CUSTOM_HOURS' ? `${startTime.slice(0, 5)}:00` : null,
        endTime: type === 'CUSTOM_HOURS' ? `${endTime.slice(0, 5)}:00` : null,
        reason: reason.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось сохранить исключение'));
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
        aria-labelledby="exc-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'center' }}>
            <h2 id="exc-modal-title" className="dialog-title">
              {isEdit ? 'Изменить исключение' : 'Новое исключение'}
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
            Диапазон дат включительно. «Особые часы» заменяют недельные часы, перерыв не
            применяется.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="exc-vet">
                Врач <span className="req">*</span>
              </label>
              <SearchCombobox
                id="exc-vet"
                value={vetId}
                options={vetOptions}
                onChange={setVetId}
                disabled={saving || isEdit}
                placeholder="Найдите врача…"
                ariaLabel="Найдите врача"
              />
            </div>

            <div className="field">
              <span className="field-label">
                Тип <span className="req">*</span>
              </span>
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
                <label className="field-label" htmlFor="exc-sdate">
                  С <span className="req">*</span>
                </label>
                <DatePicker
                  id="exc-sdate"
                  value={startDate}
                  onChange={setStartDate}
                  clearable={false}
                  disabled={saving}
                  ariaLabel="Дата с"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="exc-edate">
                  По <span className="req">*</span>
                </label>
                <DatePicker
                  id="exc-edate"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={setEndDate}
                  clearable={false}
                  disabled={saving}
                  ariaLabel="Дата по"
                />
              </div>

              {type === 'CUSTOM_HOURS' && (
                <>
                  <div className="field">
                    <label className="field-label" htmlFor="exc-stime">
                      Время с <span className="req">*</span>
                    </label>
                    <input
                      id="exc-stime"
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
                    <label className="field-label" htmlFor="exc-etime">
                      Время по <span className="req">*</span>
                    </label>
                    <input
                      id="exc-etime"
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

              <div className="field span-2">
                <label className="field-label" htmlFor="exc-reason">
                  Причина
                </label>
                <textarea
                  id="exc-reason"
                  className="textarea"
                  style={{ minHeight: 60 }}
                  maxLength={1000}
                  placeholder="Например: Отпуск, Конференция, Вечерний приём"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
