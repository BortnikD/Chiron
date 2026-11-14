'use client';

import React, { useMemo } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { AppointmentStatus, User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { APPOINTMENT_STATUS_META, formatCurrency, formatDateTimeCompact } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface CreateAppointmentFormState {
  veterinarianId: string;
  petId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  price: number;
  status: AppointmentStatus;
  followUpOf: string;
  clientComment: string;
}

export interface CreateAppointmentFieldsProps {
  form: CreateAppointmentFormState;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  appointments: Appointment[];
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
  appointments,
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
  const selectedPet = pets.find((p) => p.id === form.petId);
  const selectedSpeciesId = selectedPet?.speciesId;

  const petOptions = useMemo<SearchComboboxOption[]>(
    () =>
      pets.map((p) => ({
        value: p.id,
        label: p.name,
        hint: users.find((u) => u.id === p.ownerId)?.fullName || undefined,
        disabled: p.isArchived,
        title: p.isArchived ? 'Питомец в архиве' : undefined,
      })),
    [pets, users]
  );

  const serviceOptions = useMemo<SearchComboboxOption[]>(
    () =>
      services.map((s) => ({
        value: s.id,
        label: s.name,
        hint: `${formatCurrency(s.basePrice)}, ${s.baseDurationMin} мин`,
        disabled: !s.isActive,
        title: !s.isActive ? 'Услуга отключена' : undefined,
      })),
    [services]
  );

  const vetOptions = useMemo<SearchComboboxOption[]>(
    () =>
      veterinarians.map((v) => {
        const d = getDoctorDisplay(v);
        const noSpecies =
          Boolean(selectedSpeciesId) &&
          Array.isArray(v.speciesIds) &&
          v.speciesIds.length > 0 &&
          !v.speciesIds.includes(selectedSpeciesId!);
        const disabled = !v.isActive || noSpecies;
        return {
          value: v.id,
          label: d.fullName,
          hint: d.specName,
          disabled,
          title: !v.isActive
            ? 'Профиль врача неактивен'
            : noSpecies
              ? 'Нет допуска к виду животного'
              : undefined,
        };
      }),
    [veterinarians, selectedSpeciesId]
  );

  const followOptions = useMemo<SearchComboboxOption[]>(() => {
    const eligible = appointments.filter(
      (a) =>
        a.petId === form.petId && (a.status === 'CONFIRMED' || a.status === 'COMPLETED')
    );
    return [
      { value: '', label: 'Нет' },
      ...eligible.map((a) => {
        const dt = formatDateTimeCompact(a.startAt);
        const sName = services.find((s) => s.id === a.serviceId)?.name || 'Приём';
        return { value: a.id, label: `${dt.date} ${dt.time} — ${sName}` };
      }),
    ];
  }, [appointments, form.petId, services]);

  return (
    <div className="dialog-body">
      <div className="field">
        <label className="field-label" htmlFor="na-pet">
          Питомец <span className="req">*</span>
        </label>
        <SearchCombobox
          id="na-pet"
          value={form.petId}
          options={petOptions}
          onChange={(petId) =>
            onChangeForm((p) => ({ ...p, petId, followUpOf: '' }))
          }
          placeholder="Выберите питомца…"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="na-svc">
          Услуга <span className="req">*</span>
        </label>
        <SearchCombobox
          id="na-svc"
          value={form.serviceId}
          options={serviceOptions}
          onChange={onServiceChange}
          placeholder="Выберите услугу…"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="na-vet">
          Врач <span className="req">*</span>
        </label>
        <SearchCombobox
          id="na-vet"
          value={form.veterinarianId}
          options={vetOptions}
          onChange={(veterinarianId) => {
            onClearAvailStatus();
            onChangeForm((p) => ({ ...p, veterinarianId }));
          }}
          placeholder="Выберите врача…"
        />
        <span className="field-hint">
          Недоступные врачи и услуги отключены — причина во всплывающей подсказке
        </span>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="field">
          <label className="field-label" htmlFor="na-date">
            Дата <span className="req">*</span>
          </label>
          <DatePicker
            id="na-date"
            value={form.date}
            clearable={false}
            onChange={(date) => {
              onClearAvailStatus();
              onChangeForm((p) => ({ ...p, date }));
            }}
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

      <div className="row between wrap">
        <div className="field">
          <span className="field-label">
            Статус <span className="req">*</span>
          </span>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${form.status === 'PENDING' ? 'on' : ''}`}
              onClick={() => onChangeForm((p) => ({ ...p, status: 'PENDING' }))}
            >
              {APPOINTMENT_STATUS_META.PENDING.short}
            </button>
            <button
              type="button"
              className={`seg-item ${form.status === 'CONFIRMED' ? 'on' : ''}`}
              onClick={() => onChangeForm((p) => ({ ...p, status: 'CONFIRMED' }))}
            >
              {APPOINTMENT_STATUS_META.CONFIRMED.label}
            </button>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline"
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

      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="na-follow">
            Повторный к записи
          </label>
          <SearchCombobox
            id="na-follow"
            value={form.followUpOf}
            options={followOptions}
            onChange={(followUpOf) => onChangeForm((p) => ({ ...p, followUpOf }))}
            placeholder="Нет"
          />
        </div>
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
