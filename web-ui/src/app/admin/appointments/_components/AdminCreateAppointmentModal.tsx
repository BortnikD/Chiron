'use client';

import React, { useState, useEffect } from 'react';
import {
  Appointment,
  Veterinarian,
  Service,
  Pet,
  User,
  AppointmentStatus,
  AdminCreateAppointmentRequest,
} from '../../../../types';
import { clinicApi, adminApi } from '../../../../api';
import { Check, AlertCircle, X } from 'lucide-react';
import { getVetName, getOwnerName } from './utils';

export interface AdminCreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: Appointment) => void;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
}

/**
 * Модальное окно создания записи на приём администратором клиники.
 */
export const AdminCreateAppointmentModal: React.FC<AdminCreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veterinarians,
  services,
  pets,
  users,
}) => {
  const [form, setForm] = useState({
    veterinarianId: '',
    petId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    start: '10:00',
    end: '10:30',
    price: 1500,
    status: 'CONFIRMED' as AppointmentStatus,
    clientComment: '',
  });

  const [availStatus, setAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [availMsg, setAvailMsg] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Инициализация значений по умолчанию при открытии
  useEffect(() => {
    if (!isOpen) return;
    setCreateError(null);
    setAvailStatus('idle');
    setAvailMsg('');
    const firstVet = veterinarians[0]?.id || '';
    const firstSvc = services[0];
    const firstPet = pets[0]?.id || '';

    setForm({
      veterinarianId: firstVet,
      petId: firstPet,
      serviceId: firstSvc?.id || '',
      date: new Date().toISOString().split('T')[0],
      start: '10:00',
      end: firstSvc?.baseDurationMin ? calculateEndTime('10:00', firstSvc.baseDurationMin) : '10:30',
      price: firstSvc?.basePrice || 1500,
      status: 'CONFIRMED',
      clientComment: '',
    });
  }, [isOpen, veterinarians, services, pets]);

  function calculateEndTime(startTime: string, durationMin: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = (h || 0) * 60 + (m || 0) + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  const handleServiceChange = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    const dur = svc?.baseDurationMin || 30;
    setForm((prev) => ({
      ...prev,
      serviceId: svcId,
      price: svc?.basePrice || 1500,
      end: calculateEndTime(prev.start, dur),
    }));
  };

  const handleStartChange = (newStart: string) => {
    const svc = services.find((s) => s.id === form.serviceId);
    const dur = svc?.baseDurationMin || 30;
    setForm((prev) => ({
      ...prev,
      start: newStart,
      end: calculateEndTime(newStart, dur),
    }));
  };

  const handleCheckSlot = async () => {
    if (!form.veterinarianId || !form.date || !form.start) return;
    setAvailStatus('idle');
    try {
      const selectedSvc = services.find((s) => s.id === form.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${form.date}T${form.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const isAvailable = await clinicApi.checkAvailability({
        veterinarianId: form.veterinarianId,
        startAt: startIso,
        endAt: endIso,
      });

      if (isAvailable) {
        setAvailStatus('ok');
        setAvailMsg('Слот свободен — можно создавать');
      } else {
        setAvailStatus('err');
        setAvailMsg('Слот недоступен в рабочем графике врача');
      }
    } catch (err: any) {
      setAvailStatus('err');
      setAvailMsg(err?.response?.data?.message || err?.message || 'Ошибка проверки слота');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petId || !form.serviceId || !form.veterinarianId) {
      setCreateError('Заполните все обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const selectedSvc = services.find((s) => s.id === form.serviceId);
      const dur = selectedSvc?.baseDurationMin ?? 30;
      const startIso = new Date(`${form.date}T${form.start}:00`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + dur * 60000).toISOString();

      const payload: AdminCreateAppointmentRequest = {
        veterinarianId: form.veterinarianId,
        petId: form.petId,
        serviceId: form.serviceId,
        startAt: startIso,
        endAt: endIso,
        priceSnapshot: form.price,
        clientComment: form.clientComment || null,
      };

      const created = await adminApi.createAppointment(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Ошибка при создании записи');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

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
              <span className="dialog-title">Новая запись</span>
              <span className="dialog-desc">
                Создание записи на приём с проверкой доступности слота
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
              <span className="field-label">
                Питомец <span className="req">*</span>
              </span>
              <select
                className="select"
                value={form.petId}
                onChange={(e) => setForm({ ...form, petId: e.target.value })}
                required
              >
                <option value="">Выберите питомца…</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({getOwnerName(p.ownerId, users)})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <span className="field-label">
                Услуга <span className="req">*</span>
              </span>
              <select
                className="select"
                value={form.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                required
              >
                <option value="">Выберите услугу…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.basePrice} ₽, {s.baseDurationMin} мин)
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <span className="field-label">
                Врач <span className="req">*</span>
              </span>
              <select
                className="select"
                value={form.veterinarianId}
                onChange={(e) => setForm({ ...form, veterinarianId: e.target.value })}
                required
              >
                <option value="">Выберите врача…</option>
                {veterinarians.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getVetName(v.id, veterinarians, users)}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="form-grid"
              style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
            >
              <div className="field">
                <label className="field-label" htmlFor="na-date">
                  Дата <span className="req">*</span>
                </label>
                <input
                  id="na-date"
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="na-start">
                  Начало <span className="req">*</span>
                </label>
                <input
                  id="na-start"
                  type="time"
                  step="900"
                  className="input"
                  value={form.start}
                  onChange={(e) => handleStartChange(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="na-end">
                  Конец <span className="req">*</span>
                </label>
                <input
                  id="na-end"
                  type="time"
                  step="900"
                  className="input"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="na-price">
                  Цена, ₽ <span className="req">*</span>
                </label>
                <input
                  id="na-price"
                  type="number"
                  min="0"
                  className="input"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="row between">
              <span className="small muted">Проверка доступности слота перед сохранением</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCheckSlot}
              >
                Проверить слот
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
              <label className="field-label" htmlFor="na-comm">
                Комментарий клиента
              </label>
              <textarea
                id="na-comm"
                className="textarea"
                rows={2}
                maxLength={1000}
                value={form.clientComment}
                onChange={(e) => setForm({ ...form, clientComment: e.target.value })}
              />
            </div>

            {createError && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{createError}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={creating}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Создание…' : 'Создать запись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
