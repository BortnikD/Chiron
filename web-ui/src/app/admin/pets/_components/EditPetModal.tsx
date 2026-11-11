'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { EntityPhotoControl } from '@/components/ui/EntityPhotoControl';
import { DatePicker, FilterDropdown, type FilterDropdownOption } from '@/shared/components';
import { formatApiError, getMoscowTodayIso, getSpeciesTone } from '@/shared/lib';
import type { EditPetModalProps, EditPetFormData } from './types';

/**
 * Модальное окно редактирования питомца.
 */
export const EditPetModal: React.FC<EditPetModalProps> = ({
  isOpen,
  pet,
  speciesList,
  onClose,
  onUpdate,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const [form, setForm] = useState<EditPetFormData>({
    name: '',
    speciesId: '',
    gender: 'MALE',
    birthDate: '',
    weightKg: '',
    notes: '',
    isArchived: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayIso = getMoscowTodayIso();

  const speciesOptions = useMemo<FilterDropdownOption[]>(
    () => speciesList.map((s) => ({ value: s.id, label: s.name })),
    [speciesList]
  );

  useEffect(() => {
    if (pet && isOpen) {
      setForm({
        name: pet.name,
        speciesId: pet.speciesId,
        gender: pet.gender,
        birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : '',
        weightKg: pet.weightKg != null ? String(pet.weightKg) : '',
        notes: pet.notes || '',
        isArchived: pet.isArchived,
      });
      setError(null);
    }
  }, [pet, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingEdit) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, savingEdit, onClose]);

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.speciesId) {
      setError('Укажите кличку и вид питомца');
      return;
    }

    setSavingEdit(true);
    setError(null);

    try {
      await onUpdate(pet.id, {
        name: form.name.trim(),
        speciesId: form.speciesId,
        gender: form.gender,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        notes: form.notes.trim() || null,
        isArchived: form.isArchived,
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка обновления питомца'));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="overlay" onClick={() => !savingEdit && onClose()}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ed-pet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="ed-pet-title" className="dialog-title">Редактировать питомца</h2>
              <p className="dialog-desc">Изменение данных «{pet.name}»</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={savingEdit}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" size={16} />
                <span>{error}</span>
              </div>
            )}
            {(onUploadPhoto || onDeletePhoto) && (
              <div style={{ marginBottom: 14 }}>
                <EntityPhotoControl
                  photo={pet}
                  previewClassName={`t-ava lg tone-${getSpeciesTone(
                    pet.species?.name || speciesList.find((s) => s.id === form.speciesId)?.name || form.speciesId,
                    speciesList
                  )}`}
                  previewAlt={pet.name}
                  previewFallback={
                    <SpeciesIcon
                      species={getSpeciesTone(
                        pet.species?.name || speciesList.find((s) => s.id === form.speciesId)?.name || form.speciesId,
                        speciesList
                      )}
                      size={24}
                    />
                  }
                  disabled={savingEdit}
                  onUpload={onUploadPhoto ? (file) => onUploadPhoto(pet.id, file) : undefined}
                  onDelete={onDeletePhoto ? () => onDeletePhoto(pet.id) : undefined}
                />
              </div>
            )}
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="ed-pname">
                  Кличка <span className="req">*</span>
                </label>
                <input
                  id="ed-pname"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ed-pspecies">
                  Вид <span className="req">*</span>
                </label>
                <FilterDropdown
                  id="ed-pspecies"
                  value={form.speciesId}
                  options={speciesOptions}
                  onChange={(speciesId) => setForm({ ...form, speciesId })}
                  placeholder="Выберите вид…"
                />
              </div>

              <div className="field">
                <span className="field-label">Пол</span>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${form.gender === 'MALE' ? 'on' : ''}`}
                    onClick={() => setForm({ ...form, gender: 'MALE' })}
                  >
                    Самец
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${form.gender === 'FEMALE' ? 'on' : ''}`}
                    onClick={() => setForm({ ...form, gender: 'FEMALE' })}
                  >
                    Самка
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ed-pweight">Вес, кг</label>
                <input
                  id="ed-pweight"
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999.99"
                  className="input"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="ed-pbirth">Дата рождения</label>
                <DatePicker
                  id="ed-pbirth"
                  value={form.birthDate}
                  max={todayIso}
                  onChange={(birthDate) => setForm({ ...form, birthDate })}
                  ariaLabel="Дата рождения питомца"
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="ed-pnotes">Заметки</label>
                <textarea
                  id="ed-pnotes"
                  className="textarea"
                  rows={2}
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={savingEdit}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingEdit}>
              {savingEdit ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
