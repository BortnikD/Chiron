'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import { UpdatePetRequest } from '../../../../types';
import { EditPetModalProps, EditPetFormData } from './types';

/**
 * Модальное окно редактирования питомца.
 */
export const EditPetModal: React.FC<EditPetModalProps> = ({
  isOpen,
  pet,
  speciesList,
  onClose,
  onSuccess,
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

  useEffect(() => {
    if (pet && isOpen) {
      setForm({
        name: pet.name,
        speciesId: pet.speciesId,
        gender: pet.gender,
        birthDate: pet.birthDate || '',
        weightKg: pet.weightKg != null ? String(pet.weightKg) : '',
        notes: pet.notes || '',
        isArchived: pet.isArchived,
      });
    }
  }, [pet, isOpen]);

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const payload: UpdatePetRequest = {
        name: form.name.trim(),
        speciesId: form.speciesId,
        gender: form.gender,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        notes: form.notes || null,
        isArchived: form.isArchived,
      };

      await adminApi.updatePet(pet.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка обновления питомца');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="dialog dialog-md"
        style={{ width: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Редактировать питомца</span>
          <span className="dialog-desc">Изменение данных «{pet.name}»</span>
        </div>

        <form onSubmit={handleSubmit} className="col" style={{ gap: 14 }}>
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
              <span className="field-label">
                Вид <span className="req">*</span>
              </span>
              <select
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
              <label className="field-label" htmlFor="ed-pweight">
                Вес, кг
              </label>
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
              <label className="field-label" htmlFor="ed-pbirth">
                Дата рождения
              </label>
              <input
                id="ed-pbirth"
                type="date"
                className="input"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="ed-pnotes">
                Заметки
              </label>
              <textarea
                id="ed-pnotes"
                className="textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingEdit}
            >
              {savingEdit ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
