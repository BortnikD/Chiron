'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { DatePicker, FilterDropdown } from '@/shared/components';
import type { Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { getMoscowDateKey, getMoscowTodayIso } from '@/shared/lib';
import type { Gender } from '@/shared/types';
import type { PetFormData } from './types';

export interface PetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  speciesList: Species[];
  onSave: (data: PetFormData) => Promise<void> | void;
  onClose: () => void;
  saving?: boolean;
  error?: string | null;
}

interface FieldErrors {
  name?: string;
  speciesId?: string;
  gender?: string;
  weight?: string;
  birthDate?: string;
}

export function PetModal({
  isOpen,
  pet,
  speciesList,
  onSave,
  onClose,
  saving = false,
  error = null,
}: PetModalProps) {
  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const wasOpenRef = useRef(false);
  const prevPetIdRef = useRef<string | null>(null);
  const todayIso = useMemo(() => getMoscowTodayIso(), []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      prevPetIdRef.current = null;
      return;
    }

    const currentPetId = pet?.id ?? null;
    const shouldInit = !wasOpenRef.current || prevPetIdRef.current !== currentPetId;
    wasOpenRef.current = true;
    prevPetIdRef.current = currentPetId;

    if (shouldInit) {
      if (pet) {
        setName(pet.name);
        setSpeciesId(pet.speciesId);
        setGender(pet.gender);
        setBirthDate(pet.birthDate ? getMoscowDateKey(pet.birthDate) || pet.birthDate.slice(0, 10) : '');
        setWeightKg(pet.weightKg != null ? String(pet.weightKg) : '');
        setNotes(pet.notes || '');
        setIsArchived(Boolean(pet.isArchived));
      } else {
        setName('');
        setSpeciesId(speciesList[0]?.id || '');
        setGender('');
        setBirthDate('');
        setWeightKg('');
        setNotes('');
        setIsArchived(false);
      }
      setFieldErrors({});
    } else if (!pet && speciesList.length > 0) {
      setSpeciesId((prev) => prev || speciesList[0].id);
    }
  }, [isOpen, pet, speciesList]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, saving, onClose]);

  const speciesOptions = useMemo(
    () => speciesList.map((s) => ({ value: s.id, label: s.name })),
    [speciesList]
  );

  if (!isOpen) return null;

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!speciesId) errs.speciesId = 'Выберите вид';
    if (!gender) errs.gender = 'Выберите пол';
    if (birthDate && birthDate > todayIso) {
      errs.birthDate = 'Дата рождения не может быть в будущем';
    }
    if (weightKg.trim() !== '') {
      const parsed = Number(weightKg.replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0 || parsed > 9999.99) {
        errs.weight = 'От 0,01 до 9999,99 кг';
      }
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    const parsedWeight = weightKg.trim() !== '' ? Number(weightKg.replace(',', '.')) : null;

    await onSave({
      name: name.trim(),
      speciesId,
      gender: gender as Gender,
      birthDate: birthDate || null,
      weightKg: parsedWeight,
      notes: notes.trim() || null,
      ...(pet ? { isArchived } : {}),
    });
  };

  const modalTitle = pet ? 'Изменить питомца' : 'Новый питомец';

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
      onClick={() => !saving && onClose()}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <span className="dialog-title">{modalTitle}</span>
          <span className="dialog-desc">Поля со звёздочкой обязательны</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <div>{error}</div>
              </div>
            )}

            <div className="form-grid">
              <div className="field span-2">
                <label className="field-label" htmlFor="pt-name">
                  Кличка <span className="req">*</span>
                </label>
                <input
                  id="pt-name"
                  type="text"
                  maxLength={100}
                  className={`input ${fieldErrors.name ? 'invalid' : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Например: Барсик"
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>

              <div className="field span-2">
                <span className="field-label">
                  Вид <span className="req">*</span>
                </span>
                <FilterDropdown
                  id="pt-spec"
                  value={speciesId}
                  options={speciesOptions}
                  onChange={(val) => {
                    setSpeciesId(val);
                    setFieldErrors((prev) => ({ ...prev, speciesId: undefined }));
                  }}
                  placeholder="Выберите вид"
                  invalid={!!fieldErrors.speciesId}
                  searchable={speciesOptions.length > 7}
                  searchPlaceholder="Найти вид…"
                  ariaLabel="Вид животного"
                />
                {fieldErrors.speciesId && <span className="field-error">{fieldErrors.speciesId}</span>}
              </div>

              <div className="field">
                <span className="field-label">
                  Пол <span className="req">*</span>
                </span>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${gender === 'MALE' ? 'on' : ''}`}
                    onClick={() => {
                      setGender('MALE');
                      setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                    }}
                  >
                    Самец
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${gender === 'FEMALE' ? 'on' : ''}`}
                    onClick={() => {
                      setGender('FEMALE');
                      setFieldErrors((prev) => ({ ...prev, gender: undefined }));
                    }}
                  >
                    Самка
                  </button>
                </div>
                {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pt-birth">
                  Дата рождения
                </label>
                <DatePicker
                  id="pt-birth"
                  value={birthDate}
                  onChange={(iso) => {
                    setBirthDate(iso);
                    setFieldErrors((prev) => ({ ...prev, birthDate: undefined }));
                  }}
                  max={todayIso}
                  invalid={!!fieldErrors.birthDate}
                  ariaLabel="Дата рождения питомца"
                />
                {fieldErrors.birthDate && <span className="field-error">{fieldErrors.birthDate}</span>}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pt-weight">
                  Вес, кг
                </label>
                <input
                  id="pt-weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="9999.99"
                  className={`input ${fieldErrors.weight ? 'invalid' : ''}`}
                  value={weightKg}
                  onChange={(e) => {
                    setWeightKg(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, weight: undefined }));
                  }}
                  placeholder="4.2"
                />
                {fieldErrors.weight && <span className="field-error">{fieldErrors.weight}</span>}
              </div>

              {pet && (
                <div className="field">
                  <span className="field-label">Архив</span>
                  <div className="row" style={{ height: '36px' }}>
                    <button
                      type="button"
                      className={`switch ${isArchived ? 'on' : ''}`}
                      role="switch"
                      aria-checked={isArchived}
                      aria-label="В архиве"
                      onClick={() => setIsArchived((prev) => !prev)}
                    />
                    <span className="small muted">Запрет новых записей</span>
                  </div>
                </div>
              )}

              <div className="field span-2">
                <label className="field-label" htmlFor="pt-notes">
                  Заметки
                </label>
                <textarea
                  id="pt-notes"
                  className="textarea"
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Аллергии, особенности поведения"
                />
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
              {saving ? 'Сохранение…' : pet ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
