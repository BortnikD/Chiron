'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { vetApi } from '../../../../api';
import { Pet, CreateVaccinationRequest } from '../../../../types';

export interface VaccinationFormData {
  name: string;
  administeredOn: string;
  nextDueOn: string;
  notes: string;
}

export interface VetAddVaccinationModalProps {
  /** Флаг видимости модального окна */
  isOpen: boolean;
  /** Пациент, которому назначается вакцинация */
  patient: Pet | null;
  /** Обработчик закрытия модального окна */
  onClose: () => void;
  /** Обработчик успешного добавления вакцинации */
  onSuccess: () => void;
  /** Опциональный кастомный обработчик сохранения */
  onSave?: (payload: CreateVaccinationRequest) => Promise<void>;
}

const getInitialForm = (): VaccinationFormData => ({
  name: '',
  administeredOn: new Date().toISOString().substring(0, 10),
  nextDueOn: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
  notes: '',
});

/**
 * Модальное окно добавления вакцинации пациенту:
 * содержит форму с названием вакцины, датами введения и следующей ревакцинации,
 * заметками, валидацией и отображением ошибок API.
 */
export function VetAddVaccinationModal({
  isOpen,
  patient,
  onClose,
  onSuccess,
  onSave,
}: VetAddVaccinationModalProps) {
  const [vacForm, setVacForm] = useState<VaccinationFormData>(getInitialForm());
  const [savingVac, setSavingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);

  // Сброс формы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setVacForm(getInitialForm());
      setVacError(null);
      setSavingVac(false);
    }
  }, [isOpen]);

  if (!isOpen || !patient) {
    return null;
  }

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacForm.name.trim()) return;

    setVacError(null);
    setSavingVac(true);

    try {
      const payload: CreateVaccinationRequest = {
        petId: patient.id,
        name: vacForm.name.trim(),
        administeredOn: vacForm.administeredOn,
        nextDueOn: vacForm.nextDueOn || null,
        notes: vacForm.notes.trim() || null,
      };

      if (onSave) {
        await onSave(payload);
      } else {
        await vetApi.createVaccination(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setVacError(err?.response?.data?.message || err?.message || 'Ошибка сохранения прививки');
    } finally {
      setSavingVac(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={onClose}
    >
      <div
        className="dialog dialog-sm"
        style={{ width: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Внести прививку</span>
          <span className="dialog-desc">Запись вакцинации для «{patient.name}»</span>
        </div>

        <form onSubmit={handleAddVaccination}>
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="vet-vac-name">
                Название вакцины <span className="req">*</span>
              </label>
              <input
                id="vet-vac-name"
                className="input"
                placeholder="Нобивак DHPPi…"
                value={vacForm.name}
                onChange={(e) => setVacForm({ ...vacForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="vet-vac-adm">
                  Дата введения <span className="req">*</span>
                </label>
                <input
                  id="vet-vac-adm"
                  type="date"
                  className="input"
                  value={vacForm.administeredOn}
                  onChange={(e) =>
                    setVacForm({ ...vacForm, administeredOn: e.target.value })
                  }
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="vet-vac-due">
                  Следующая дата
                </label>
                <input
                  id="vet-vac-due"
                  type="date"
                  className="input"
                  value={vacForm.nextDueOn}
                  onChange={(e) => setVacForm({ ...vacForm, nextDueOn: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="vet-vac-notes">
                Заметки
              </label>
              <textarea
                id="vet-vac-notes"
                className="textarea"
                rows={2}
                value={vacForm.notes}
                onChange={(e) => setVacForm({ ...vacForm, notes: e.target.value })}
              />
            </div>

            {vacError && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{vacError}</div>
              </div>
            )}
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
              disabled={savingVac}
            >
              {savingVac ? 'Сохранение…' : 'Внести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
