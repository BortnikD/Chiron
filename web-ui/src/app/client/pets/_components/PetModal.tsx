'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import type { Gender } from '@/shared/types';
import type { PetFormData } from './types';

export interface PetModalProps {
  /** Флаг открытия модального окна */
  isOpen: boolean;
  /** Редактируемый питомец (или null при создании) */
  pet: Pet | null;
  /** Список доступных видов животных */
  speciesList: Species[];
  /** Функция сохранения формы */
  onSave: (data: PetFormData) => Promise<void> | void;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Флаг состояния сохранения */
  saving?: boolean;
  /** Ошибка сохранения с сервера */
  error?: string | null;
}

/**
 * Модальное окно добавления / редактирования питомца
 * (кличка, вид, пол, дата рождения, вес, особенности).
 */
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
  const [gender, setGender] = useState<Gender>('MALE');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const prevPetIdRef = useRef<string | null>(null);

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
        setBirthDate(pet.birthDate ? pet.birthDate.split('T')[0] : '');
        setWeightKg(pet.weightKg != null ? String(pet.weightKg) : '');
        setNotes(pet.notes || '');
      } else {
        setName('');
        setSpeciesId(speciesList[0]?.id || '');
        setGender('MALE');
        setBirthDate('');
        setWeightKg('');
        setNotes('');
      }
      setLocalError(null);
    } else if (!pet && speciesList.length > 0) {
      setSpeciesId((prev) => prev || speciesList[0].id);
    }
  }, [isOpen, pet, speciesList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Укажите кличку питомца');
      return;
    }
    if (!speciesId) {
      setLocalError('Выберите вид животного');
      return;
    }

    setLocalError(null);
    await onSave({
      name: name.trim(),
      speciesId,
      gender,
      birthDate: birthDate || undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const displayError = error || localError;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog" style={{ width: '480px', maxWidth: 'calc(100vw - 32px)' }}>
        <div className="dialog-head">
          <span className="dialog-title">
            {pet ? 'Редактировать питомца' : 'Новый питомец'}
          </span>
          <span className="dialog-desc">
            Укажите основные сведения о животном для оформления электронной медкарты
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {displayError && (
              <div className="alert alert-destructive">
                <AlertCircle className="ic" />
                <div>{displayError}</div>
              </div>
            )}

            <div className="form-grid">
              <div className="field span-2">
                <label className="field-label" htmlFor="p-name">
                  Кличка <span className="req">*</span>
                </label>
                <input
                  id="p-name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Барсик"
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="p-spec">
                  Вид животного <span className="req">*</span>
                </label>
                <select
                  id="p-spec"
                  className="select"
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                >
                  {speciesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span className="field-label">Пол</span>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${gender === 'MALE' ? 'on' : ''}`}
                    onClick={() => setGender('MALE')}
                  >
                    Самец
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${gender === 'FEMALE' ? 'on' : ''}`}
                    onClick={() => setGender('FEMALE')}
                  >
                    Самка
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="p-birth">
                  Дата рождения
                </label>
                <input
                  id="p-birth"
                  type="date"
                  className="input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="p-weight">
                  Вес (кг)
                </label>
                <input
                  id="p-weight"
                  type="number"
                  step="0.1"
                  className="input"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="4.2"
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="p-notes">
                  Особенности здоровья, аллергии или чип
                </label>
                <textarea
                  id="p-notes"
                  className="textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Хронические заболевания, особенности поведения..."
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
              {saving ? 'Сохранение...' : pet ? 'Сохранить изменения' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
