'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type {
  Appointment,
  CreateVaccinationRequest,
  Pet,
  UpdateVaccinationRequest,
  Vaccination,
} from '@/modules/client/types';
import { DatePicker, FilterDropdown } from '@/shared/components';
import { formatApiError, formatDateShort, getMoscowTodayIso } from '@/shared/lib';

export interface VetAddVaccinationModalProps {
  isOpen: boolean;
  mode?: 'create' | 'edit';
  vaccination?: Vaccination | null;
  patient?: Pet | null;
  patients?: Pet[];
  appointment?: Appointment | null;
  serviceName?: string;
  onClose: () => void;
  onSubmit?: (payload: CreateVaccinationRequest) => Promise<void>;
  onUpdate?: (id: string, payload: UpdateVaccinationRequest) => Promise<void>;
}

interface FieldErrors {
  petId?: string;
  name?: string;
  administeredOn?: string;
  nextDueOn?: string;
}

const EMPTY_PATIENTS: Pet[] = [];

/**
 * Модальное окно внесения или редактирования прививки пациента.
 */
export function VetAddVaccinationModal({
  isOpen,
  mode,
  vaccination,
  patient,
  patients = EMPTY_PATIENTS,
  appointment,
  serviceName,
  onClose,
  onSubmit,
  onUpdate,
}: VetAddVaccinationModalProps) {
  const resolvedMode: 'create' | 'edit' = mode ?? (vaccination ? 'edit' : 'create');
  const todayIso = getMoscowTodayIso();

  const [petId, setPetId] = useState('');
  const [name, setName] = useState('');
  const [administeredOn, setAdministeredOn] = useState(todayIso);
  const [nextDueOn, setNextDueOn] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const initKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      initKeyRef.current = null;
      return;
    }
    const currentKey = `${resolvedMode}:${vaccination?.id || ''}:${patient?.id || ''}:${appointment?.id || ''}`;
    if (initKeyRef.current === currentKey) return;
    initKeyRef.current = currentKey;

    setFieldErrors({});
    setApiError(null);
    setSaving(false);

    if (resolvedMode === 'edit' && vaccination) {
      setPetId(vaccination.petId);
      setName(vaccination.name || '');
      setAdministeredOn(vaccination.administeredOn || todayIso);
      setNextDueOn(vaccination.nextDueOn || '');
    } else {
      const defaultAdmin = appointment
        ? appointment.startAt.slice(0, 10)
        : todayIso;
      setPetId(patient?.id || patients[0]?.id || '');
      setName('');
      setAdministeredOn(defaultAdmin <= todayIso ? defaultAdmin : todayIso);
      setNextDueOn('');
    }
  }, [isOpen, resolvedMode, vaccination, patient, patients, appointment, todayIso]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, saving, onClose]);

  const petOptions = useMemo(() => {
    const list = patient && !patients.some((p) => p.id === patient.id) ? [patient, ...patients] : patients;
    return list
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .map((p) => ({ value: p.id, label: p.name }));
  }, [patient, patients]);

  const resolvedPatientName = useMemo(() => {
    if (patient && (!petId || patient.id === petId)) return patient.name;
    return patients.find((p) => p.id === petId)?.name || 'Пациент';
  }, [patient, patients, petId]);

  if (!isOpen) return null;

  const isPetLocked = resolvedMode === 'edit' || Boolean(patient);
  const apptLabel = appointment
    ? `${formatDateShort(appointment.startAt)} · ${serviceName || 'Приём'}`
    : vaccination?.appointmentId
      ? 'Связана с приёмом'
      : 'Без привязки';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FieldErrors = {};

    if (!petId) errs.petId = 'Выберите пациента';
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!administeredOn) errs.administeredOn = 'Обязательное поле';
    else if (administeredOn > todayIso) errs.administeredOn = 'Не может быть в будущем';
    if (nextDueOn && administeredOn && nextDueOn < administeredOn) {
      errs.nextDueOn = 'Не раньше даты введения';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setApiError(null);
    setSaving(true);
    try {
      if (resolvedMode === 'edit' && vaccination && onUpdate) {
        await onUpdate(vaccination.id, {
          name: name.trim(),
          administeredOn,
          nextDueOn: nextDueOn || null,
        });
      } else if (onSubmit) {
        await onSubmit({
          petId,
          appointmentId: appointment?.id || null,
          name: name.trim(),
          administeredOn,
          nextDueOn: nextDueOn || null,
        });
      }
      onClose();
    } catch (err: unknown) {
      setApiError(formatApiError(err, 'Ошибка сохранения прививки'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={resolvedMode === 'edit' ? 'Изменить прививку' : 'Внести прививку'}
      onClick={() => !saving && onClose()}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start', gap: '12px' }}>
            <div className="col" style={{ gap: '4px' }}>
              <span className="dialog-title">
                {resolvedMode === 'edit' ? 'Изменить прививку' : 'Внести прививку'}
              </span>
              <span className="dialog-desc">
                {resolvedMode === 'edit'
                  ? `Обновление записи вакцинации для «${resolvedPatientName}»`
                  : isPetLocked
                    ? `Новая запись вакцинации для «${resolvedPatientName}»`
                    : 'Регистрация вакцинации пациента'}
              </span>
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
            {apiError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <div>{apiError}</div>
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <span className="field-label">
                  Пациент <span className="req">*</span>
                </span>
                {isPetLocked ? (
                  <input
                    className="input"
                    value={resolvedPatientName}
                    readOnly
                    aria-label="Пациент"
                  />
                ) : (
                  <FilterDropdown
                    value={petId}
                    options={petOptions}
                    onChange={(v) => {
                      setPetId(v);
                      setFieldErrors((p) => ({ ...p, petId: undefined }));
                    }}
                    placeholder="Выберите пациента"
                    searchable
                    invalid={!!fieldErrors.petId}
                    disabled={saving}
                    ariaLabel="Пациент"
                  />
                )}
                {fieldErrors.petId && <span className="field-error">{fieldErrors.petId}</span>}
              </div>

              <div className="field">
                <span className="field-label">Приём</span>
                <input className="input" value={apptLabel} readOnly aria-label="Приём" />
                <span className="field-hint">Необязательно; приём того же пациента</span>
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="vx-name">
                  Вакцина <span className="req">*</span>
                </label>
                <input
                  id="vx-name"
                  name="vaccineName"
                  type="text"
                  autoFocus
                  className={`input ${fieldErrors.name ? 'invalid' : ''}`}
                  maxLength={150}
                  placeholder="Например, Нобивак DHPPi"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((p) => ({ ...p, name: undefined }));
                  }}
                  disabled={saving}
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vx-admin">
                  Дата введения <span className="req">*</span>
                </label>
                <DatePicker
                  id="vx-admin"
                  value={administeredOn}
                  max={todayIso}
                  onChange={(iso) => {
                    setAdministeredOn(iso);
                    setFieldErrors((p) => ({ ...p, administeredOn: undefined }));
                  }}
                  invalid={!!fieldErrors.administeredOn}
                  clearable={false}
                  disabled={saving}
                />
                {fieldErrors.administeredOn && (
                  <span className="field-error">{fieldErrors.administeredOn}</span>
                )}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vx-next">
                  Следующая доза
                </label>
                <DatePicker
                  id="vx-next"
                  value={nextDueOn}
                  min={administeredOn || undefined}
                  onChange={(iso) => {
                    setNextDueOn(iso);
                    setFieldErrors((p) => ({ ...p, nextDueOn: undefined }));
                  }}
                  invalid={!!fieldErrors.nextDueOn}
                  clearable
                  disabled={saving}
                />
                {fieldErrors.nextDueOn && (
                  <span className="field-error">{fieldErrors.nextDueOn}</span>
                )}
              </div>
            </div>
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? 'Сохранение…'
                : resolvedMode === 'edit'
                  ? 'Сохранить'
                  : 'Внести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
