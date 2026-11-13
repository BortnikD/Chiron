'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Vaccination, Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { DatePicker, SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { formatApiError } from '@/shared/lib';
import type { VaccinationSaveInput } from '../_hooks/useAdminVaccinations';
import type { VaccinationFormData } from './types';
import { createEmptyVaccinationForm } from './constants';

export interface AddVaccinationModalProps {
  isOpen: boolean;
  vaccination?: Vaccination | null;
  pets: Pet[];
  speciesList: Species[];
  users: User[];
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
  speciesList,
  users,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(vaccination);

  const [form, setForm] = useState<VaccinationFormData>(() =>
    createEmptyVaccinationForm(pets[0]?.id || '')
  );
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const petOptions = useMemo<SearchComboboxOption[]>(
    () =>
      pets.map((p) => {
        const spName =
          p.species?.name ||
          p.speciesName ||
          speciesList.find((s) => s.id === p.speciesId)?.name ||
          '';
        const ownerName = users.find((u) => u.id === p.ownerId)?.fullName || '';
        const hint = [spName, ownerName].filter(Boolean).join(' · ');
        return { value: p.id, label: p.name, hint: hint || undefined };
      }),
    [pets, speciesList, users]
  );

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
              {isEditing ? 'Редактирование прививки' : 'Новая прививка'}
            </span>
            <span className="dialog-desc">
              Внесение данных о вакцинации в электронный паспорт питомца
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
              <SearchCombobox
                id="m-pet"
                value={form.petId}
                options={petOptions}
                onChange={(petId) => setForm({ ...form, petId })}
                placeholder="Выберите питомца…"
                disabled={isEditing}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="m-name">
                Вакцина <span className="req">*</span>
              </label>
              <input
                id="m-name"
                className="input"
                maxLength={150}
                placeholder="Например, Нобивак DHPPi + L"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="m-date">
                  Дата введения <span className="req">*</span>
                </label>
                <DatePicker
                  id="m-date"
                  value={form.administeredOn}
                  clearable={false}
                  onChange={(administeredOn) => setForm({ ...form, administeredOn })}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="m-next">
                  Следующая доза
                </label>
                <DatePicker
                  id="m-next"
                  value={form.nextDueOn}
                  min={form.administeredOn || undefined}
                  onChange={(nextDueOn) => setForm({ ...form, nextDueOn })}
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
                  ? 'Сохранить'
                  : 'Добавить прививку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
