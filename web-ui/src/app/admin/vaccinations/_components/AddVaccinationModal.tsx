'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import { Vaccination, Pet, VaccinationFormData } from './types';
import { createEmptyVaccinationForm } from './constants';

export interface AddVaccinationModalProps {
  isOpen: boolean;
  vaccination?: Vaccination | null;
  pets: Pet[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

/**
 * Модальное окно создания и редактирования записи о вакцинации питомца.
 */
export const AddVaccinationModal: React.FC<AddVaccinationModalProps> = ({
  isOpen,
  vaccination,
  pets,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(vaccination);

  const [form, setForm] = useState<VaccinationFormData>(() =>
    createEmptyVaccinationForm(pets[0]?.id || '')
  );
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (vaccination) {
      setForm({
        petId: vaccination.petId,
        name: vaccination.name || vaccination.vaccineName || '',
        administeredOn: vaccination.administeredOn || vaccination.administeredAt || '',
        nextDueOn: vaccination.nextDueOn || vaccination.validUntil || '',
        batchNumber: vaccination.batchNumber || '',
        notes: vaccination.notes || '',
      });
    } else {
      setForm(createEmptyVaccinationForm(pets[0]?.id || ''));
    }
    setModalError(null);
  }, [vaccination, isOpen, pets]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.petId) {
      setModalError('Выберите питомца');
      return;
    }
    if (!form.name.trim()) {
      setModalError('Укажите название вакцины');
      return;
    }
    if (!form.administeredOn) {
      setModalError('Укажите дату введения');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (isEditing && vaccination) {
        await adminApi.updateVaccination(vaccination.id, {
          name: form.name.trim(),
          administeredOn: form.administeredOn,
          nextDueOn: form.nextDueOn || undefined,
        });
      } else {
        await adminApi.createVaccination({
          petId: form.petId,
          name: form.name.trim(),
          administeredOn: form.administeredOn,
          nextDueOn: form.nextDueOn || null,
          batchNumber: form.batchNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      setModalError(
        err?.response?.data?.message || err?.message || 'Не удалось сохранить запись о вакцинации'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '100%' }}
      >
        <div className="dialog-head">
          <span className="dialog-title">
            {isEditing ? 'Редактирование вакцинации' : 'Новая запись о вакцинации'}
          </span>
          <span className="dialog-desc">
            Внесение данных о введённом биопрепарате в электронный паспорт питомца
          </span>
        </div>

        {modalError && (
          <div
            className="alert"
            style={{
              margin: '16px 20px 0',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '12px',
            }}
          >
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="dialog-body col" style={{ gap: '12px' }}>
            <div className="field">
              <label className="field-label" htmlFor="m-pet">
                Питомец <span className="req">*</span>
              </label>
              <select
                id="m-pet"
                className="select"
                value={form.petId}
                onChange={(e) => setForm({ ...form, petId: e.target.value })}
                disabled={isEditing}
                required
              >
                <option value="">Выберите питомца...</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species?.name || 'Питомец'})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="m-name">
                Название вакцины <span className="req">*</span>
              </label>
              <input
                id="m-name"
                className="input"
                placeholder="Например, Нобивак DHPPi + L"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="field">
                <label className="field-label" htmlFor="m-date">
                  Дата введения <span className="req">*</span>
                </label>
                <input
                  id="m-date"
                  type="date"
                  className="input"
                  value={form.administeredOn}
                  onChange={(e) => setForm({ ...form, administeredOn: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="m-next">
                  Следующая доза
                </label>
                <input
                  id="m-next"
                  type="date"
                  className="input"
                  value={form.nextDueOn}
                  onChange={(e) => setForm({ ...form, nextDueOn: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="m-batch">
                Серия партии (опционально)
              </label>
              <input
                id="m-batch"
                className="input"
                placeholder="Номер серии вакцины"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="m-notes">
                Примечания (опционально)
              </label>
              <textarea
                id="m-notes"
                className="input"
                rows={2}
                placeholder="Особые указания или реакции..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving
                ? 'Сохранение...'
                : isEditing
                ? 'Сохранить изменения'
                : 'Добавить вакцинацию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
