'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { formatApiError } from '@/shared/lib';
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
                <select
                  id="ed-pspecies"
                  className="select"
                  value={form.speciesId}
                  onChange={(e) => setForm({ ...form, speciesId: e.target.value })}
                  required
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
                  step="0.1"
                  min="0"
                  className="input"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="ed-pbirth">Дата рождения</label>
                <input
                  id="ed-pbirth"
                  type="date"
                  className="input"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="ed-pnotes">Заметки</label>
                <textarea
                  id="ed-pnotes"
                  className="textarea"
                  rows={2}
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
