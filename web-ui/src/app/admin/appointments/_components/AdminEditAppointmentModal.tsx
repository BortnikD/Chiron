'use client';

import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import type { AdminUpdateAppointmentRequest } from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import {
  APPOINTMENT_STATUS_LIST,
  APPOINTMENT_STATUS_META,
  canTransitionAppointmentStatus,
  formatApiError,
  formatSlotTime,
  getMoscowDateKey,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

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
    status: 'CONFIRMED' as AppointmentStatus,
    cancelReason: '',
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
      status: appointment.status,
      cancelReason: appointment.cancelReason || appointment.cancellationReason || '',
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

  const computeRange = () => {
    if (!appointment) return null;
    const selectedSvc = services.find((s) => s.id === appointment.serviceId);
    const origDurMin = Math.round(
      (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60000
    );
    const dur = origDurMin > 0 ? origDurMin : (selectedSvc?.baseDurationMin ?? 30);
    const startAt = new Date(`${form.date}T${form.start}:00+03:00`).toISOString();
    const endAt = new Date(new Date(startAt).getTime() + dur * 60000).toISOString();
    return { startAt, endAt };
  };

  const handleCheckSlot = async () => {
    if (!form.veterinarianId || !form.date || !form.start || !appointment) return;
    const range = computeRange();
    if (!range) return;
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

    setSaving(true);
    setSaveError(null);
    try {
      let startAt = appointment.startAt;
      let endAt = appointment.endAt;

      if (form.date && form.start) {
        const range = computeRange();
        if (range) {
          startAt = range.startAt;
          endAt = range.endAt;
        }
      }

      const payload: AdminUpdateAppointmentRequest = {
        veterinarianId: form.veterinarianId,
        startAt,
        endAt,
        status: form.status,
        vetNotes: form.vetNotes.trim() || null,
        cancelReason:
          form.status === 'CANCELLED' ? form.cancelReason.trim() || 'Отменено администратором' : null,
      };

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

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="me-vet">Врач</label>
              <select
                id="me-vet"
                className="select"
                value={form.veterinarianId}
                onChange={(e) => {
                  setAvailStatus('idle');
                  setForm({ ...form, veterinarianId: e.target.value });
                }}
                required
              >
                {veterinarians.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getDoctorDisplay(v).fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="me-date">Дата</label>
                <input
                  id="me-date"
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => {
                    setAvailStatus('idle');
                    setForm({ ...form, date: e.target.value });
                  }}
                  required
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
