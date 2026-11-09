'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../api';
import { AddVaccinationModalProps, AddVaccinationFormData } from './types';

/**
 * Модальное окно добавления вакцинации для выбранного питомца.
 */
export const AddVaccinationModal: React.FC<AddVaccinationModalProps> = ({
  isOpen,
  pet,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<AddVaccinationFormData>({
    name: '',
    administeredOn: new Date().toISOString().substring(0, 10),
    nextDueOn: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        administeredOn: new Date().toISOString().substring(0, 10),
        nextDueOn: '',
      });
    }
  }, [isOpen]);

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await adminApi.createVaccination({
        petId: pet.id,
        name: form.name.trim(),
        administeredOn: form.administeredOn,
        nextDueOn: form.nextDueOn || null,
      });
      setForm({
        name: '',
        administeredOn: new Date().toISOString().substring(0, 10),
        nextDueOn: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка добавления прививки');
    } finally {
      setSaving(false);
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
        className="dialog dialog-sm"
        style={{ width: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Внести прививку</span>
          <span className="dialog-desc">Запись вакцинации для «{pet.name}»</span>
        </div>

        <form onSubmit={handleSubmit} className="col" style={{ gap: 14 }}>
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
              <label className="field-label" htmlFor="vac-due">
                Следующая дата
              </label>
              <input
                id="vac-due"
                type="date"
                className="input"
                value={form.nextDueOn}
                onChange={(e) => setForm({ ...form, nextDueOn: e.target.value })}
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
              disabled={saving}
            >
              {saving ? 'Сохранение…' : 'Внести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
