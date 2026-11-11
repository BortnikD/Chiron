'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AdminCreateAppointmentRequest } from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { formatApiError, getMoscowTodayIso, timeToMinutes } from '@/shared/lib';
import {
  CreateAppointmentFields,
  type CreateAppointmentFormState,
} from './CreateAppointmentFields';

export interface AdminCreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: AdminCreateAppointmentRequest) => Promise<Appointment>;
  onCheckSlot: (params: {
    veterinarianId: string;
    startAt: string;
    endAt: string;
  }) => Promise<boolean>;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  appointments: Appointment[];
}

function calculateEndTime(startTime: string, durationMin: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + durationMin;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export const AdminCreateAppointmentModal: React.FC<AdminCreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onCheckSlot,
  veterinarians,
  services,
  pets,
  users,
  appointments,
}) => {
  const [form, setForm] = useState<CreateAppointmentFormState>({
    veterinarianId: '',
    petId: '',
    serviceId: '',
    date: getMoscowTodayIso(),
    start: '10:00',
    end: '10:30',
    price: 1500,
    status: 'CONFIRMED',
    followUpOf: '',
    clientComment: '',
  });
  const [endEdited, setEndEdited] = useState(false);
  const [availStatus, setAvailStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [availMsg, setAvailMsg] = useState('');
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCreateError(null);
    setAvailStatus('idle');
    setAvailMsg('');
    setEndEdited(false);
    const firstSvc = services.find((s) => s.isActive) || services[0];
    const firstPet = pets.find((p) => !p.isArchived) || pets[0];
    const firstVet = veterinarians.find((v) => v.isActive) || veterinarians[0];
    setForm({
      veterinarianId: firstVet?.id || '',
      petId: firstPet?.id || '',
      serviceId: firstSvc?.id || '',
      date: getMoscowTodayIso(),
      start: '10:00',
      end: firstSvc?.baseDurationMin
        ? calculateEndTime('10:00', firstSvc.baseDurationMin)
        : '10:30',
      price: firstSvc?.basePrice || 1500,
      status: 'CONFIRMED',
      followUpOf: '',
      clientComment: '',
    });
  }, [isOpen, veterinarians, services, pets]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, creating, onClose]);

  const handleServiceChange = (svcId: string) => {
    const svc = services.find((s) => s.id === svcId);
    const dur = svc?.baseDurationMin || 30;
    setAvailStatus('idle');
    setForm((prev) => ({
      ...prev,
      serviceId: svcId,
      price: svc?.basePrice || 1500,
      end: endEdited ? prev.end : calculateEndTime(prev.start, dur),
    }));
  };

  const handleStartChange = (newStart: string) => {
    const svc = services.find((s) => s.id === form.serviceId);
    const dur = svc?.baseDurationMin || 30;
    setAvailStatus('idle');
    setForm((prev) => ({
      ...prev,
      start: newStart,
      end: endEdited ? prev.end : calculateEndTime(newStart, dur),
    }));
  };

  const handleEndChange = (newEnd: string) => {
    setEndEdited(true);
    setAvailStatus('idle');
    setForm((prev) => ({ ...prev, end: newEnd }));
  };

  const buildTimeRange = () => {
    if (!form.date || !form.start || !form.end) {
      return { error: 'Укажите дату, время начала и окончания приёма' };
    }
    if (timeToMinutes(form.end) <= timeToMinutes(form.start)) {
      return { error: 'Время окончания должно быть позже времени начала' };
    }
    return {
      startAt: new Date(`${form.date}T${form.start}:00+03:00`).toISOString(),
      endAt: new Date(`${form.date}T${form.end}:00+03:00`).toISOString(),
    };
  };

  const handleCheckSlot = async () => {
    if (!form.veterinarianId) {
      setAvailStatus('err');
      setAvailMsg('Выберите врача для проверки слота');
      return;
    }
    const range = buildTimeRange();
    if ('error' in range) {
      setAvailStatus('err');
      setAvailMsg(range.error || 'Некорректное время приёма');
      return;
    }
    setCheckingSlot(true);
    setAvailStatus('idle');
    try {
      const ok = await onCheckSlot({
        veterinarianId: form.veterinarianId,
        startAt: range.startAt,
        endAt: range.endAt,
      });
      setAvailStatus(ok ? 'ok' : 'err');
      setAvailMsg(
        ok ? 'Слот свободен — можно создавать' : 'Слот недоступен в рабочем графике врача'
      );
    } catch (err: unknown) {
      setAvailStatus('err');
      setAvailMsg(formatApiError(err, 'Ошибка проверки слота'));
    } finally {
      setCheckingSlot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petId || !form.serviceId || !form.veterinarianId) {
      setCreateError('Заполните все обязательные поля');
      return;
    }
    const range = buildTimeRange();
    if ('error' in range) {
      setCreateError(range.error || 'Некорректное время приёма');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await onCreate({
        veterinarianId: form.veterinarianId,
        petId: form.petId,
        serviceId: form.serviceId,
        startAt: range.startAt,
        endAt: range.endAt,
        priceSnapshot: form.price,
        status: form.status,
        followUpOf: form.followUpOf || null,
        clientComment: form.clientComment.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setCreateError(formatApiError(err, 'Ошибка при создании записи'));
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={() => !creating && onClose()}>
      <div
        className="dialog dialog-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="na-title"
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="na-title" className="dialog-title">
                Новая запись
              </h2>
              <p className="dialog-desc">Создание записи на приём с проверкой доступности слота</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={creating}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          <CreateAppointmentFields
            form={form}
            veterinarians={veterinarians}
            services={services}
            pets={pets}
            users={users}
            appointments={appointments}
            availStatus={availStatus}
            availMsg={availMsg}
            checkingSlot={checkingSlot}
            createError={createError}
            onChangeForm={setForm}
            onServiceChange={handleServiceChange}
            onStartChange={handleStartChange}
            onEndChange={handleEndChange}
            onClearAvailStatus={() => setAvailStatus('idle')}
            onCheckSlot={handleCheckSlot}
          />

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={creating}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Создание…' : 'Создать запись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
