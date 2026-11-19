'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Vaccination, Pet, Species, User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';

export interface VaccinationFormSubmitPayload {
  petId: string;
  name: string;
  administeredOn: string;
  nextDueOn: string | null;
  appointmentId?: string | null;
}

export interface VaccinationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: VaccinationFormSubmitPayload, editingId?: string) => Promise<void>;
  initialData?: Vaccination | null;
  lockedPetId?: string | null;
  lockedPetName?: string | null;
  petName?: string | null;
  appointmentId?: string | null;
  serviceName?: string | null;
  pets?: Pet[];
  speciesList?: Species[];
  users?: User[];
}

const EMPTY_PETS: Pet[] = [];
const EMPTY_SPECIES: Species[] = [];
const EMPTY_USERS: User[] = [];

export const VaccinationFormModal: React.FC<VaccinationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lockedPetId,
  lockedPetName,
  petName,
  appointmentId,
  serviceName,
  pets = EMPTY_PETS,
  speciesList = EMPTY_SPECIES,
  users = EMPTY_USERS,
}) => {
  const isEditing = Boolean(initialData);
  const todayIso = getMoscowTodayIso();

  const [petId, setPetId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [administeredOn, setAdministeredOn] = useState<string>(todayIso);
  const [nextDueOn, setNextDueOn] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePetId = lockedPetId || petId;

  // Options for pet selector if pet is not locked
  const petOptions = useMemo<SearchComboboxOption[]>(() => {
    return pets.map((p) => {
      const spName =
        p.species?.name ||
        p.speciesName ||
        speciesList.find((s) => s.id === p.speciesId)?.name ||
        '';
      const ownerName = users.find((u) => u.id === p.ownerId)?.fullName || '';
      const hint = [spName, ownerName].filter(Boolean).join(' · ');
      return { value: p.id, label: p.name, hint: hint || undefined };
    });
  }, [pets, speciesList, users]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPetId(initialData.petId || lockedPetId || '');
      setName(initialData.name || initialData.vaccineName || '');
      setAdministeredOn(
        (initialData.administeredOn || initialData.administeredAt || todayIso).slice(0, 10)
      );
      setNextDueOn(
        (initialData.nextDueOn || initialData.validUntil || '').slice(0, 10)
      );
    } else {
      setPetId(lockedPetId || pets[0]?.id || '');
      setName('');
      setAdministeredOn(todayIso);
      setNextDueOn('');
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData?.id, lockedPetId]);

  useEffect(() => {
    if (isOpen && !effectivePetId && pets.length > 0) {
      setPetId(pets[0].id);
    }
  }, [isOpen, effectivePetId, pets]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetPetId = effectivePetId || petId;
    if (!targetPetId) {
      setError('Выберите питомца');
      return;
    }
    if (!name.trim()) {
      setError('Укажите название вакцины');
      return;
    }
    if (!administeredOn) {
      setError('Укажите дату введения');
      return;
    }

    if (nextDueOn && nextDueOn < administeredOn) {
      setError('Дата следующей вакцинации не может быть раньше даты введения');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit(
        {
          petId: targetPetId,
          name: name.trim(),
          administeredOn,
          nextDueOn: nextDueOn ? nextDueOn : null,
          appointmentId: appointmentId || initialData?.appointmentId || null,
        },
        initialData?.id
      );
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось сохранить запись о вакцинации'));
    } finally {
      setSaving(false);
    }
  };

  const resolvedPetDisplayName =
    lockedPetName ||
    petName ||
    pets.find((p) => p.id === effectivePetId)?.name ||
    'Пациент';

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vax-modal-title"
      onClick={() => !saving && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
            <span id="vax-modal-title" className="dialog-title">
              {isEditing ? 'Редактирование прививки' : 'Новая прививка'}
            </span>
            <span className="dialog-desc">
              {lockedPetId
                ? `Внесение записи для «${resolvedPetDisplayName}»`
                : 'Внесение данных о вакцинации в электронный паспорт'}
            </span>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Закрыть"
            disabled={saving}
          >
            <X className="ic" />
          </button>
        </div>

        {appointmentId && (
          <div
            className="row gap-2 items-center p-2 rounded text-xs bg-[var(--accent-tint)] text-[var(--accent-foreground)]"
            style={{ margin: '0 20px 10px' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Привязано к текущему приёму{serviceName ? ` (${serviceName})` : ''}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="dialog-body">
          {error && (
            <div className="alert alert-destructive" role="alert">
              <AlertCircle className="ic" />
              <span>{error}</span>
            </div>
          )}

          {!lockedPetId && pets.length > 0 && (
            <div className="field">
              <label className="field-label" htmlFor="vax-pet-select">
                Питомец <span className="req">*</span>
              </label>
              <SearchCombobox
                options={petOptions}
                value={petId}
                onChange={setPetId}
                placeholder="Поиск по кличке или владельцу..."
                disabled={isEditing || saving}
              />
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="vax-name-input">
              Название препарата / вакцины <span className="req">*</span>
            </label>
            <input
              id="vax-name-input"
              type="text"
              className="input"
              placeholder="Например: Нобивак DHPPi + Lepto, Мультифел-4, Рабикан"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="field">
              <label className="field-label" htmlFor="vax-adm-date">
                Дата введения <span className="req">*</span>
              </label>
              <DatePicker
                id="vax-adm-date"
                value={administeredOn}
                onChange={setAdministeredOn}
                max={todayIso}
                placeholder="ГГГГ-ММ-ДД"
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vax-due-date">
                Следующая прививка
              </label>
              <DatePicker
                id="vax-due-date"
                value={nextDueOn}
                onChange={setNextDueOn}
                min={administeredOn || todayIso}
                placeholder="Не запланировано"
                disabled={saving}
              />
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Внести прививку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
