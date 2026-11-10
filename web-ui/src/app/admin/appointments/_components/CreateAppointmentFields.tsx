'use client';

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { formatCurrency } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface CreateAppointmentFormState {
  veterinarianId: string;
  petId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  price: number;
  clientComment: string;
}

export interface CreateAppointmentFieldsProps {
  form: CreateAppointmentFormState;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  availStatus: 'idle' | 'ok' | 'err';
  availMsg: string;
  checkingSlot: boolean;
  createError: string | null;
  onChangeForm: (updater: (prev: CreateAppointmentFormState) => CreateAppointmentFormState) => void;
  onServiceChange: (serviceId: string) => void;
  onStartChange: (start: string) => void;
  onEndChange: (end: string) => void;
  onClearAvailStatus: () => void;
  onCheckSlot: () => void;
}

export const CreateAppointmentFields: React.FC<CreateAppointmentFieldsProps> = ({
  form,
  veterinarians,
  services,
  pets,
  users,
  availStatus,
  availMsg,
  checkingSlot,
  createError,
  onChangeForm,
  onServiceChange,
  onStartChange,
  onEndChange,
  onClearAvailStatus,
  onCheckSlot,
}) => {
  return (
    <div className="dialog-body">
      <div className="field">
        <label className="field-label" htmlFor="na-pet">
          Питомец <span className="req">*</span>
        </label>
        <select
          id="na-pet"
          className="select"
          value={form.petId}
          onChange={(e) => onChangeForm((p) => ({ ...p, petId: e.target.value }))}
          required
        >
          <option value="">Выберите питомца…</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({users.find((u) => u.id === p.ownerId)?.fullName || '—'})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="na-svc">
          Услуга <span className="req">*</span>
        </label>
        <select
          id="na-svc"
          className="select"
          value={form.serviceId}
          onChange={(e) => onServiceChange(e.target.value)}
          required
        >
          <option value="">Выберите услугу…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({formatCurrency(s.basePrice)}, {s.baseDurationMin} мин)
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="na-vet">
          Врач <span className="req">*</span>
        </label>
        <select
          id="na-vet"
          className="select"
          value={form.veterinarianId}
          onChange={(e) => {
            onClearAvailStatus();
            onChangeForm((p) => ({ ...p, veterinarianId: e.target.value }));
          }}
          required
        >
          <option value="">Выберите врача…</option>
          {veterinarians.map((v) => (
            <option key={v.id} value={v.id}>
              {getDoctorDisplay(v).fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="field">
          <label className="field-label" htmlFor="na-date">
            Дата <span className="req">*</span>
          </label>
          <input
            id="na-date"
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => {
              onClearAvailStatus();
              onChangeForm((p) => ({ ...p, date: e.target.value }));
            }}
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
            onChange={(e) => onStartChange(e.target.value)}
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
            onChange={(e) => onEndChange(e.target.value)}
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
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              onChangeForm((p) => ({ ...p, price: Number.isNaN(parsed) ? 0 : parsed }));
            }}
            required
          />
        </div>
      </div>

      <div className="row between">
        <span className="small muted">Проверка доступности слота перед сохранением</span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onCheckSlot}
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
        <label className="field-label" htmlFor="na-comm">
          Комментарий клиента
        </label>
        <textarea
          id="na-comm"
          className="textarea"
          rows={2}
          maxLength={1000}
          value={form.clientComment}
          onChange={(e) => onChangeForm((p) => ({ ...p, clientComment: e.target.value }))}
        />
      </div>

      {createError && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle className="ic" size={16} />
          <div>{createError}</div>
        </div>
      )}
    </div>
  );
};
