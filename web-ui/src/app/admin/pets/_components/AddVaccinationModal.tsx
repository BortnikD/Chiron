'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';
import type { AddVaccinationModalProps, AddVaccinationFormData } from './types';

/**
 * Модальное окно добавления вакцинации для выбранного питомца.
 */
export const AddVaccinationModal: React.FC<AddVaccinationModalProps> = ({
  isOpen,
  pet,
  onClose,
  onCreate,
}) => {
  const [form, setForm] = useState<AddVaccinationFormData>({
    name: '',
    administeredOn: getMoscowTodayIso(),
    nextDueOn: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        administeredOn: getMoscowTodayIso(),
        nextDueOn: '',
      });
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Укажите название вакцины');
      return;
    }
    if (!form.administeredOn) {
      setError('Укажите дату введения');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate({
        petId: pet.id,
        name: form.name.trim(),
        administeredOn: form.administeredOn,
        nextDueOn: form.nextDueOn || null,
      });
      setForm({
        name: '',
        administeredOn: getMoscowTodayIso(),
        nextDueOn: '',
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка добавления прививки'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={() => !saving && onClose()}>
      <div
        className="dialog dialog-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-vac-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="pet-vac-title" className="dialog-title">Внести прививку</h2>
              <p className="dialog-desc">Запись вакцинации для «{pet.name}»</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={saving}
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
            <div className="field">
              <label className="field-label" htmlFor="vac-name">
                Название вакцины <span className="req">*</span>
              </label>
              <input
                id="vac-name"
                className="input"
                placeholder="Нобивак DHPPi…"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="vac-adm">
                  Дата введения <span className="req">*</span>
                </label>
                <input
                  id="vac-adm"
                  type="date"
                  className="input"
                  value={form.administeredOn}
                  onChange={(e) => setForm({ ...form, administeredOn: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vac-due">Следующая дата</label>
                <input
                  id="vac-due"
                  type="date"
                  className="input"
                  value={form.nextDueOn}
                  onChange={(e) => setForm({ ...form, nextDueOn: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Внести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
