'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { EntityPhotoControl } from '@/components/ui/EntityPhotoControl';
import {
  DatePicker,
  FilterDropdown,
  SearchCombobox,
  type FilterDropdownOption,
  type SearchComboboxOption,
} from '@/shared/components';
import {
  buildPatchPayload,
  formatApiError,
  getMoscowTodayIso,
  getSpeciesTone,
} from '@/shared/lib';
import type { Gender, Pet, Species, User } from '@/shared/types';

export interface PetFormData {
  name: string;
  ownerId?: string;
  speciesId: string;
  gender: Gender;
  birthDate?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  breed?: string | null;
  isArchived?: boolean;
}

export interface PetFormModalProps {
  isOpen: boolean;
  mode: 'client' | 'admin';
  pet?: Pet | null;
  speciesList: Species[];
  users?: User[];
  onClose: () => void;
  onSubmit: (data: PetFormData, photoFile?: File | null) => Promise<void | Pet>;
  onUploadPhoto?: (petId: string, file: File) => Promise<void>;
  onDeletePhoto?: (petId: string) => Promise<void>;
}

const EMPTY_USERS: User[] = [];

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  mode,
  pet,
  speciesList,
  users = EMPTY_USERS,
  onClose,
  onSubmit,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const isEditing = Boolean(pet);
  const todayIso = useMemo(() => getMoscowTodayIso(), []);

  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [breed, setBreed] = useState('');
  const [notes, setNotes] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerOptions = useMemo<SearchComboboxOption[]>(() => {
    const clients = users.filter((u) => u.role === 'CLIENT');
    const source = clients.length > 0 ? clients : users;
    return source.map((u) => ({
      value: u.id,
      label: u.fullName || u.email,
      hint: u.phone || u.email,
    }));
  }, [users]);

  const speciesOptions = useMemo<FilterDropdownOption[]>(
    () => speciesList.map((s) => ({ value: s.id, label: s.name })),
    [speciesList]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (pet) {
      setName(pet.name || '');
      setOwnerId(pet.ownerId || '');
      setSpeciesId(pet.speciesId || speciesList[0]?.id || '');
      setGender(pet.gender || 'MALE');
      setBirthDate(pet.birthDate ? pet.birthDate.slice(0, 10) : '');
      setWeightKg(pet.weightKg != null ? String(pet.weightKg) : '');
      setBreed(pet.breed || '');
      setNotes(pet.notes || '');
      setIsArchived(Boolean(pet.isArchived ?? pet.archived));
      setPendingPhotoFile(null);
    } else {
      const clients = users.filter((u) => u.role === 'CLIENT');
      const firstOwner = (clients[0] || users[0])?.id || '';
      setName('');
      setOwnerId(firstOwner);
      setSpeciesId(speciesList[0]?.id || '');
      setGender('MALE');
      setBirthDate('');
      setWeightKg('');
      setBreed('');
      setNotes('');
      setIsArchived(false);
      setPendingPhotoFile(null);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pet?.id]);

  useEffect(() => {
    if (isOpen && !speciesId && speciesList.length > 0) {
      setSpeciesId(pet?.speciesId || speciesList[0].id);
    }
  }, [isOpen, speciesId, speciesList, pet?.speciesId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Укажите кличку питомца');
      return;
    }
    if (!speciesId) {
      setError('Выберите вид животного');
      return;
    }
    if (mode === 'admin' && !isEditing && !ownerId) {
      setError('Выберите владельца питомца');
      return;
    }

    const parsedWeight = weightKg.trim() ? parseFloat(weightKg) : null;
    if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 300)) {
      setError('Вес должен быть положительным числом до 300 кг');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currentPayload: PetFormData = {
        name: name.trim(),
        ownerId: mode === 'admin' ? ownerId : undefined,
        speciesId,
        gender,
        birthDate: birthDate || null,
        weightKg: parsedWeight,
        notes: notes.trim() || null,
        breed: breed.trim() || null,
        isArchived,
      };

      if (isEditing && pet) {
        const initial = {
          name: pet.name || '',
          speciesId: pet.speciesId || '',
          gender: pet.gender || 'MALE',
          birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : null,
          weightKg: pet.weightKg != null ? pet.weightKg : null,
          notes: pet.notes || null,
          breed: pet.breed || null,
          isArchived: Boolean(pet.isArchived ?? pet.archived),
        };
        const current = {
          name: name.trim(),
          speciesId,
          gender,
          birthDate: birthDate || null,
          weightKg: parsedWeight,
          notes: notes.trim() || null,
          breed: breed.trim() || null,
          isArchived,
        };
        const patch = buildPatchPayload(initial, current);
        await onSubmit(patch as PetFormData, pendingPhotoFile);
      } else {
        await onSubmit(currentPayload, pendingPhotoFile);
      }
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка сохранения питомца'));
    } finally {
      setSaving(false);
    }
  };

  const selectedSpecies = speciesList.find((s) => s.id === speciesId);
  const tone = getSpeciesTone(selectedSpecies?.name || speciesId, speciesList);

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="pet-modal-title" className="dialog-title">
                {isEditing ? `Редактировать «${pet?.name}»` : 'Добавить питомца'}
              </h2>
              <p className="dialog-desc">
                {isEditing
                  ? 'Изменение данных медицинской карточки питомца'
                  : 'Заполните информацию о новом питомце'}
              </p>
            </div>
            <button
              type="button"
              className="dialog-close"
              onClick={onClose}
              disabled={saving}
              aria-label="Закрыть"
            >
              <X className="ic" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="dialog-body">
          {error && (
            <div className="alert alert-destructive" role="alert">
              <AlertCircle className="ic" />
              <span>{error}</span>
            </div>
          )}

          {/* Фото питомца */}
          <EntityPhotoControl
            photo={pet ?? null}
            previewFallback={<SpeciesIcon species={selectedSpecies?.name} size={48} />}
            previewClassName="t-ava xl round"
            previewAlt={name || 'Питомец'}
            title="Фотография питомца"
            hint="JPEG или PNG до 5 МБ"
            disabled={saving}
            onUpload={pet && onUploadPhoto ? (f) => onUploadPhoto(pet.id, f) : undefined}
            onDelete={pet && onDeletePhoto ? () => onDeletePhoto(pet.id) : undefined}
            pendingFile={pendingPhotoFile}
            onSelectPendingFile={setPendingPhotoFile}
          />

          {/* Владелец (только режим admin при создании или отображении) */}
          {mode === 'admin' && !isEditing && (
            <div className="field">
              <label className="field-label" htmlFor="pet-owner-select">
                Владелец <span className="req">*</span>
              </label>
              <SearchCombobox
                options={ownerOptions}
                value={ownerId}
                onChange={setOwnerId}
                placeholder="Поиск клиента..."
                disabled={saving}
              />
            </div>
          )}

          {/* Кличка и Вид */}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="field">
              <label className="field-label" htmlFor="pet-name">
                Кличка <span className="req">*</span>
              </label>
              <input
                id="pet-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Барсик"
                maxLength={60}
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="pet-species">
                Вид животного <span className="req">*</span>
              </label>
              <FilterDropdown
                value={speciesId}
                options={speciesOptions}
                onChange={setSpeciesId}
                disabled={saving}
              />
            </div>
          </div>

          {/* Порода */}
          <div className="field">
            <label className="field-label" htmlFor="pet-breed">
              Порода <span className="small muted" style={{ fontWeight: 'normal' }}>(необязательно)</span>
            </label>
            <input
              id="pet-breed"
              type="text"
              className="input"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Например: Мейн-кун, Золотистый ретривер"
              maxLength={100}
              disabled={saving}
            />
          </div>

          {/* Пол, Вес, Дата рождения */}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div className="field">
              <label className="field-label">
                Пол <span className="req">*</span>
              </label>
              <div
                className="seg"
                role="radiogroup"
                style={{
                  display: 'flex',
                  height: '36px',
                  boxSizing: 'border-box',
                  padding: '3px',
                }}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'MALE'}
                  className={`seg-item ${gender === 'MALE' ? 'on' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setGender('MALE')}
                  disabled={saving}
                >
                  Самец
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'FEMALE'}
                  className={`seg-item ${gender === 'FEMALE' ? 'on' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setGender('FEMALE')}
                  disabled={saving}
                >
                  Самка
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="pet-birth">
                Дата рождения
              </label>
              <DatePicker
                id="pet-birth"
                value={birthDate}
                onChange={setBirthDate}
                max={todayIso}
                placeholder="ГГГГ-ММ-ДД"
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="pet-weight">
                Вес, кг
              </label>
              <input
                id="pet-weight"
                type="number"
                step="0.1"
                min="0.1"
                max="300"
                className="input"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="4.5"
                disabled={saving}
              />
            </div>
          </div>

          {/* Особенности / Заметки */}
          <div className="field">
            <label className="field-label" htmlFor="pet-notes">
              Особенности, чип, аллергии
            </label>
            <textarea
              id="pet-notes"
              className="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Чип №..., аллергия на антибиотики, стерилизован..."
              maxLength={1000}
              disabled={saving}
            />
          </div>

          {/* Архив (при редактировании) */}
          {isEditing && (
            <div className="field">
              <label className="checkbox-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  disabled={saving}
                />
                <span className="small">В архиве (скрывать в списках активных)</span>
              </label>
            </div>
          )}

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
              disabled={saving || !name.trim() || !speciesId}
            >
              {saving
                ? 'Сохранение...'
                : isEditing
                ? 'Сохранить изменения'
                : 'Создать питомца'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
