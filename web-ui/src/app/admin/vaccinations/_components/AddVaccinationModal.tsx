'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Vaccination, Pet } from '@/modules/client/types';
import { formatApiError } from '@/shared/lib';
import type { VaccinationSaveInput } from '../_hooks/useAdminVaccinations';
import type { VaccinationFormData } from './types';
import { createEmptyVaccinationForm } from './constants';

export interface AddVaccinationModalProps {
  isOpen: boolean;
  vaccination?: Vaccination | null;
  pets: Pet[];
  onClose: () => void;
  onSave: (data: VaccinationSaveInput, editingId?: string) => Promise<void>;
}

/**
 * Модальное окно создания и редактирования записи о вакцинации питомца.
 */
export const AddVaccinationModal: React.FC<AddVaccinationModalProps> = ({
  isOpen,
  vaccination,
  pets,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(vaccination);

  const [form, setForm] = useState<VaccinationFormData>(() =>
    createEmptyVaccinationForm(pets[0]?.id || '')
  );
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (vaccination) {
      setForm({
        petId: vaccination.petId,
        name: vaccination.name || vaccination.vaccineName || '',
        administeredOn: (vaccination.administeredOn || vaccination.administeredAt || '').slice(0, 10),
        nextDueOn: (vaccination.nextDueOn || vaccination.validUntil || '').slice(0, 10),
      });
    } else {
      setForm(createEmptyVaccinationForm(pets[0]?.id || ''));
    }
    setModalError(null);
  }, [vaccination, isOpen, pets]);

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
      await onSave(
        {
          petId: form.petId,
          name: form.name.trim(),
          administeredOn: form.administeredOn,
          nextDueOn: form.nextDueOn || null,
        },
        vaccination?.id
      );
      onClose();
    } catch (err: unknown) {
      setModalError(formatApiError(err, 'Не удалось сохранить запись о вакцинации'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-vax-title"
      onClick={() => !saving && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
            <span id="add-vax-title" className="dialog-title">
              {isEditing ? 'Редактирование вакцинации' : 'Новая запись о вакцинации'}
            </span>
            <span className="dialog-desc">
              Внесение данных о введённом биопрепарате в электронный паспорт питомца
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Закрыть"
            onClick={() => !saving && onClose()}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          <div className="dialog-body">
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
                <option value="">Выберите питомца…</option>
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

            {modalError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{modalError}</div>
              </div>
            )}
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
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving
                ? 'Сохранение…'
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
