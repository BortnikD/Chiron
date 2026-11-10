'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Service } from '@/modules/clinic/types';
import type { CreateFollowUpRequest } from '@/modules/vet/types';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';

export interface VetFollowUpModalProps {
  isOpen: boolean;
  defaultServiceId: string;
  services: Service[];
  onClose: () => void;
  onSubmit: (data: CreateFollowUpRequest) => Promise<void>;
}

/**
 * Модальное окно назначения повторного приёма для контроля результатов лечения.
 */
export const VetFollowUpModal: React.FC<VetFollowUpModalProps> = ({
  isOpen,
  defaultServiceId,
  services,
  onClose,
  onSubmit,
}) => {
  const [followUpDate, setFollowUpDate] = useState(() => getMoscowTodayIso(7));
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpServiceId, setFollowUpServiceId] = useState(defaultServiceId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFollowUpDate(getMoscowTodayIso(7));
    setFollowUpTime('10:00');
    setFollowUpServiceId(defaultServiceId || services[0]?.id || '');
    setError(null);
    setSubmitting(false);
  }, [isOpen, defaultServiceId, services]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const [hoursStr, minutesStr] = followUpTime.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (!followUpDate || hoursStr == null || minutesStr == null || Number.isNaN(hours) || Number.isNaN(minutes)) {
      setError('Укажите корректные дату и время приёма');
      return;
    }

    const start = new Date(
      `${followUpDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+03:00`
    );

    if (Number.isNaN(start.getTime())) {
      setError('Укажите корректные дату и время приёма');
      return;
    }

    const targetSvc = services.find((s) => s.id === followUpServiceId) || services[0];
    const dur = targetSvc?.baseDurationMin || 30;
    const end = new Date(start.getTime() + dur * 60000);

    setSubmitting(true);
    try {
      await onSubmit({
        serviceId: targetSvc?.id || defaultServiceId || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось назначить повторный приём'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Назначить повторный приём"
      onClick={() => !submitting && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <span className="dialog-title">Назначить повторный приём</span>
          <span className="dialog-desc">
            Создание связанного визита для контроля результатов лечения
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <div>{error}</div>
              </div>
            )}

            <div className="form-grid">
              <div className="field span-2">
                <label className="field-label" htmlFor="fu-svc">
                  Услуга
                </label>
                <select
                  id="fu-svc"
                  className="select"
                  value={followUpServiceId}
                  onChange={(e) => setFollowUpServiceId(e.target.value)}
                  disabled={submitting}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.baseDurationMin} мин)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="fu-date">
                  Дата приёма
                </label>
                <input
                  id="fu-date"
                  type="date"
                  className="input"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="fu-time">
                  Время
                </label>
                <input
                  id="fu-time"
                  type="time"
                  className="input"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Назначение...' : 'Назначить приём'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
