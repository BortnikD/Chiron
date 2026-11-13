'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import type { AdminUpdateAppointmentRequest } from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import {
  APPOINTMENT_STATUS_LIST,
  APPOINTMENT_STATUS_META,
  canTransitionAppointmentStatus,
  formatApiError,
  formatSlotTime,
  getMoscowDateKey,
  timeToMinutes,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { buildUpdateAppointmentPayload, computeAppointmentEditRange } from './utils';

export interface AdminEditAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  onClose: () => void;
  onUpdate: (id: string, payload: AdminUpdateAppointmentRequest) => Promise<Appointment>;
  onCheckSlot: (params: {
    veterinarianId: string;
    startAt: string;
    endAt: string;
    excludeAppointmentId?: string;
  }) => Promise<boolean>;
}

export const AdminEditAppointmentModal: React.FC<AdminEditAppointmentModalProps> = ({
  isOpen,
  appointment,
  veterinarians,
  services,
  pets,
  onClose,
  onUpdate,
  onCheckSlot,
}) => {
  const [form, setForm] = useState({
    veterinarianId: '',
    date: '',
    start: '',
    end: '',
    status: 'CONFIRMED' as AppointmentStatus,
    cancelReason: '',
    clientComment: '',
    vetNotes: '',
  });

  const [checkingSlot, setCheckingSlot] = useState(false);
  const [availStatus, setAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [availMsg, setAvailMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    setForm({
      veterinarianId: appointment.veterinarianId,
      date: getMoscowDateKey(appointment.startAt),
      start: formatSlotTime(appointment.startAt),
      end: formatSlotTime(appointment.endAt),
      status: appointment.status,
      cancelReason: appointment.cancelReason || appointment.cancellationReason || '',
      clientComment: appointment.clientComment || '',
      vetNotes: appointment.vetNotes || appointment.notes || '',
    });
    setAvailStatus('idle');
    setAvailMsg('');
    setSaveError(null);
  }, [isOpen, appointment]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  const vetOptions = useMemo<SearchComboboxOption[]>(
    () =>
      veterinarians.map((v) => {
        const d = getDoctorDisplay(v);
        return { value: v.id, label: d.fullName, hint: d.specName, disabled: !v.isActive };
      }),
    [veterinarians]
  );

  const handleCheckSlot = async () => {
    if (!form.veterinarianId || !form.date || !form.start || !appointment) return;
    if (form.end && timeToMinutes(form.end) <= timeToMinutes(form.start)) {
      setAvailStatus('err');
      setAvailMsg('Время окончания должно быть позже времени начала');
      return;
    }
    const range = computeAppointmentEditRange(appointment, services, form.date, form.start, form.end);
    setCheckingSlot(true);
    setAvailStatus('idle');
    try {
      const ok = await onCheckSlot({
        veterinarianId: form.veterinarianId,
        startAt: range.startAt,
        endAt: range.endAt,
        excludeAppointmentId: appointment.id,
      });
      setAvailStatus(ok ? 'ok' : 'err');
      setAvailMsg(ok ? 'Слот свободен' : 'Слот занят другим приёмом или перерывом врача');
    } catch (err: unknown) {
      setAvailStatus('err');
      setAvailMsg(formatApiError(err, 'Ошибка проверки доступности слота'));
    } finally {
      setCheckingSlot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    if (form.end && timeToMinutes(form.end) <= timeToMinutes(form.start)) {
      setSaveError('Время окончания должно быть позже времени начала');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildUpdateAppointmentPayload(appointment, services, form);
      await onUpdate(appointment.id, payload);
      onClose();
    } catch (err: unknown) {
      setSaveError(formatApiError(err, 'Ошибка при сохранении записи'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const pet = pets.find((p) => p.id === appointment.petId);
  const serviceName = services.find((s) => s.id === appointment.serviceId)?.name || 'Услуга клиники';

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div
        className="dialog dialog-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="me-title"
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="me-title" className="dialog-title">
                Редактирование записи #{appointment.id.slice(0, 8)}
              </h2>
              <p className="dialog-desc">
                {pet?.name || 'Питомец'} — {serviceName}. Перенос даты, времени или смена врача.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={saving}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="me-vet">Врач</label>
              <SearchCombobox
                id="me-vet"
                value={form.veterinarianId}
                options={vetOptions}
                onChange={(veterinarianId) => {
                  setAvailStatus('idle');
                  setForm({ ...form, veterinarianId });
                }}
                placeholder="Выберите врача…"
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div className="field">
                <label className="field-label" htmlFor="me-date">Дата</label>
                <DatePicker
                  id="me-date"
                  value={form.date}
                  clearable={false}
                  onChange={(date) => {
                    setAvailStatus('idle');
                    setForm({ ...form, date });
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="me-start">Начало</label>
                <input
                  id="me-start"
                  type="time"
                  step="900"
                  className="input"
                  value={form.start}
                  onChange={(e) => {
                    setAvailStatus('idle');
                    setForm({ ...form, start: e.target.value });
                  }}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="me-end">Конец</label>
                <input
                  id="me-end"
                  type="time"
                  step="900"
                  className="input"
                  value={form.end}
                  onChange={(e) => {
                    setAvailStatus('idle');
                    setForm({ ...form, end: e.target.value });
                  }}
                  required
                />
              </div>
            </div>

            <div className="row between">
              <span className="small muted">Перенос проверяется с исключением текущей записи</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCheckSlot}
                disabled={checkingSlot}
              >
                {checkingSlot ? 'Проверка…' : 'Проверить слот'}
              </button>
            </div>

            {availStatus === 'ok' && (
              <div className="alert alert-success">
                <Check className="ic" size={16} />
                <div>{availMsg}</div>
              </div>
            )}
            {availStatus === 'err' && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" size={16} />
                <div>{availMsg}</div>
              </div>
            )}

            <div className="field">
              <span className="field-label">Статус записи</span>
              <div className="chips">
                {APPOINTMENT_STATUS_LIST.map((st) => {
                  const allowed = canTransitionAppointmentStatus(appointment.status, st);
                  return (
                    <button
                      key={st}
                      type="button"
                      className={`chip ${form.status === st ? 'on' : ''}`}
                      disabled={!allowed}
                      title={allowed ? undefined : 'Переход из текущего статуса недоступен'}
                      onClick={() => allowed && setForm({ ...form, status: st })}
                    >
                      {APPOINTMENT_STATUS_META[st]?.short || st}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.status === 'CANCELLED' && (
              <div className="field">
                <label className="field-label" htmlFor="me-cr">Причина отмены</label>
                <input
                  id="me-cr"
                  className="input"
                  value={form.cancelReason}
                  onChange={(e) => setForm({ ...form, cancelReason: e.target.value })}
                  placeholder="Причина отмены"
                />
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="me-comm">Комментарий клиента</label>
              <textarea
                id="me-comm"
                className="textarea"
                maxLength={1000}
                rows={2}
                value={form.clientComment}
                onChange={(e) => setForm({ ...form, clientComment: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="me-notes">Заметки врача</label>
              <textarea
                id="me-notes"
                className="textarea"
                maxLength={4000}
                rows={3}
                value={form.vetNotes}
                onChange={(e) => setForm({ ...form, vetNotes: e.target.value })}
                placeholder="Внутренние заметки и предписания врача…"
              />
            </div>

            {saveError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" size={16} />
                <div>{saveError}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
