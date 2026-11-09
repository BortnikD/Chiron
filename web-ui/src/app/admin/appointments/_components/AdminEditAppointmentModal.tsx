'use client';

import React, { useState, useEffect } from 'react';
import {
  Appointment,
  Veterinarian,
  Service,
  Pet,
  User,
  AppointmentStatus,
  AdminUpdateAppointmentRequest,
} from '../../../../types';
import { clinicApi, adminApi } from '../../../../api';
import { Check, AlertCircle, X } from 'lucide-react';
import { ALL_STATUSES, STATUS_MAP, getVetName, getServiceName, getPet } from './utils';

export interface AdminEditAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

/**
 * Модальное окно редактирования/переноса записи администратором.
 */
export const AdminEditAppointmentModal: React.FC<AdminEditAppointmentModalProps> = ({
  isOpen,
  appointment,
  veterinarians,
  services,
  pets,
  users,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    veterinarianId: '',
    date: '',
    start: '',
    status: 'CONFIRMED' as AppointmentStatus,
    cancelledBy: '',
    cancelReason: '',
    vetNotes: '',
  });

  const [checkingSlot, setCheckingSlot] = useState(false);
  const [availStatus, setAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [availMsg, setAvailMsg] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    const d = new Date(appointment.startAt);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().slice(0, 5);

    setForm({
      veterinarianId: appointment.veterinarianId,
      date: dateStr,
      start: timeStr,
      status: appointment.status,
      cancelledBy: appointment.cancelledBy || '',
      cancelReason: appointment.cancelReason || appointment.cancellationReason || '',
      vetNotes: appointment.vetNotes || appointment.notes || '',
    });
    setAvailStatus('idle');
    setAvailMsg('');
    setSaveError(null);
  }, [isOpen, appointment]);

  const handleCheckSlot = async () => {
    if (!form.veterinarianId || !form.date || !form.start || !appointment) return;
    setCheckingSlot(true);
    setAvailStatus('idle');
    try {
      const selectedSvc = services.find((s) => s.id === appointment.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${form.date}T${form.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const isAvailable = await clinicApi.checkAvailability({
        veterinarianId: form.veterinarianId,
        startAt: startIso,
        endAt: endIso,
        excludeAppointmentId: appointment.id,
      });

      if (isAvailable) {
        setAvailStatus('ok');
        setAvailMsg('Слот свободен');
      } else {
        setAvailStatus('err');
        setAvailMsg('Слот занят другим приёмом или перерывом врача');
      }
    } catch (err: any) {
      setAvailStatus('err');
      setAvailMsg(err?.response?.data?.message || err?.message || 'Ошибка проверки доступности слота');
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
        const selectedSvc = services.find((s) => s.id === appointment.serviceId);
        const dur = selectedSvc?.baseDurationMin ?? 30;
        startAt = new Date(`${form.date}T${form.start}:00`).toISOString();
        endAt = new Date(new Date(startAt).getTime() + dur * 60000).toISOString();
      }

      const payload: AdminUpdateAppointmentRequest = {
        veterinarianId: form.veterinarianId,
        startAt,
        endAt,
        status: form.status,
        vetNotes: form.vetNotes || null,
        cancelReason:
          form.status === 'CANCELLED' ? form.cancelReason || 'Отменено администратором' : null,
      };

      const updated = await adminApi.updateAppointment(appointment.id, payload);
      onSuccess(updated || { ...appointment, ...payload, startAt, endAt });
      onClose();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Ошибка при сохранении записи');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const pet = getPet(appointment.petId, pets);
  const serviceName = getServiceName(appointment.serviceId, services);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-lg"
        style={{ width: 620 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="dialog-title">
                Редактирование записи #{appointment.id.slice(0, 8)}
              </span>
              <span className="dialog-desc">
                {pet?.name || 'Питомец'} — {serviceName}. Перенос даты, времени или смена врача.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="field">
              <span className="field-label">Врач</span>
              <select
                className="select"
                value={form.veterinarianId}
                onChange={(e) => setForm({ ...form, veterinarianId: e.target.value })}
                required
              >
                {veterinarians.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getVetName(v.id, veterinarians, users)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="me-date">
                  Дата
                </label>
                <input
                  id="me-date"
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="me-start">
                  Начало
                </label>
                <input
                  id="me-start"
                  type="time"
                  step="900"
                  className="input"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
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
              <div
                className="alert alert-info"
                style={{ borderColor: 'var(--st-completed-fg, #22c55e)' }}
              >
                <Check size={16} style={{ color: 'var(--st-completed-fg, #22c55e)' }} />
                <div>{availMsg}</div>
              </div>
            )}

            {availStatus === 'err' && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{availMsg}</div>
              </div>
            )}

            <div className="field">
              <span className="field-label">Статус записи</span>
              <div className="chips">
                {ALL_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`chip ${form.status === st ? 'on' : ''}`}
                    onClick={() => setForm({ ...form, status: st })}
                  >
                    {STATUS_MAP[st]?.short || st}
                  </button>
                ))}
              </div>
            </div>

            {form.status === 'CANCELLED' && (
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="me-cby">
                    Кем отменена
                  </label>
                  <input
                    id="me-cby"
                    className="input"
                    value={form.cancelledBy}
                    onChange={(e) => setForm({ ...form, cancelledBy: e.target.value })}
                    placeholder="Администратор"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="me-cr">
                    Причина отмены
                  </label>
                  <input
                    id="me-cr"
                    className="input"
                    value={form.cancelReason}
                    onChange={(e) => setForm({ ...form, cancelReason: e.target.value })}
                    placeholder="Причина отмены"
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="me-notes">
                Заметки врача
              </label>
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
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{saveError}</div>
              </div>
            )}
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
