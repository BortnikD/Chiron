'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatApiError, getMoscowTodayIso, getSpeciesTone } from '@/shared/lib';
import type { CreatePetModalProps, CreatePetFormData } from './types';
import { DEFAULT_CREATE_FORM } from './constants';

/**
 * Модальное окно создания питомца с валидацией обязательных полей.
 */
export const CreatePetModal: React.FC<CreatePetModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  speciesList,
  users,
}) => {
  const [form, setForm] = useState<CreatePetFormData>(DEFAULT_CREATE_FORM);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const todayIso = getMoscowTodayIso();

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
    if (isOpen) {
      setCreateError(null);
      setPendingPhotoFile(null);
      const clients = users.filter((u) => u.role === 'CLIENT');
      const firstOwner = (clients[0] || users[0])?.id || '';
      setForm({
        ...DEFAULT_CREATE_FORM,
        speciesId: speciesList[0]?.id || '',
        ownerId: firstOwner,
      });
    }
  }, [isOpen, speciesList, users]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, creating, onClose]);

  if (!isOpen) return null;

  const selectedSpeciesName = speciesList.find((s) => s.id === form.speciesId)?.name;
  const tone = getSpeciesTone(selectedSpeciesName || form.speciesId, speciesList);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.speciesId || !form.ownerId) {
      setCreateError('Заполните обязательные поля');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      await onCreate(
        {
          name: form.name.trim(),
          speciesId: form.speciesId,
          ownerId: form.ownerId,
          gender: form.gender,
          birthDate: form.birthDate || null,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          notes: form.notes.trim() || null,
        },
        pendingPhotoFile
      );
      setForm(DEFAULT_CREATE_FORM);
      setPendingPhotoFile(null);
      onClose();
    } catch (err: unknown) {
      setCreateError(formatApiError(err, 'Ошибка создания питомца'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="overlay" onClick={() => !creating && onClose()}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr-pet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="cr-pet-title" className="dialog-title">Добавить питомца</h2>
              <p className="dialog-desc">Регистрация питомца за клиентом клиники</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={creating}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div style={{ marginBottom: 14 }}>
              <EntityPhotoControl
                photo={null}
                pendingFile={pendingPhotoFile}
                onSelectPendingFile={setPendingPhotoFile}
                previewClassName={`t-ava lg tone-${tone}`}
                previewAlt={form.name.trim() || 'Новый питомец'}
                previewFallback={<SpeciesIcon species={tone} size={24} />}
                disabled={creating}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cr-powner">
                Владелец <span className="req">*</span>
              </label>
              <SearchCombobox
                id="cr-powner"
                value={form.ownerId}
                options={ownerOptions}
                onChange={(ownerId) => setForm({ ...form, ownerId })}
                placeholder="Выберите владельца…"
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="cr-pname">
                  Кличка <span className="req">*</span>
                </label>
                <input
                  id="cr-pname"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="cr-pspecies">
                  Вид <span className="req">*</span>
                </label>
                <FilterDropdown
                  id="cr-pspecies"
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
                <label className="field-label" htmlFor="cr-pweight">Вес, кг</label>
                <input
                  id="cr-pweight"
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
                <label className="field-label" htmlFor="cr-pbirth">Дата рождения</label>
                <DatePicker
                  id="cr-pbirth"
                  value={form.birthDate}
                  max={todayIso}
                  onChange={(birthDate) => setForm({ ...form, birthDate })}
                  ariaLabel="Дата рождения питомца"
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="cr-pnotes">Заметки</label>
                <textarea
                  id="cr-pnotes"
                  className="textarea"
                  rows={2}
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {createError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" size={16} />
                <span>{createError}</span>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={creating}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Создание…' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
