'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CreateVaccinationRequest, Pet } from '@/modules/client/types';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';

export interface VaccinationFormData {
  name: string;
  administeredOn: string;
  nextDueOn: string;
}

export interface VetAddVaccinationModalProps {
  /** Флаг видимости модального окна */
  isOpen: boolean;
  /** Пациент, которому назначается вакцинация */
  patient: Pet | null;
  /** Обработчик закрытия модального окна */
  onClose: () => void;
  /** Обработчик сохранения вакцинации */
  onSubmit: (payload: CreateVaccinationRequest) => Promise<void>;
}

const getInitialForm = (): VaccinationFormData => ({
  name: '',
  administeredOn: getMoscowTodayIso(),
  nextDueOn: getMoscowTodayIso(365),
});

/**
 * Модальное окно добавления вакцинации пациенту:
 * содержит форму с названием вакцины, датами введения и следующей ревакцинации,
 * валидацией и отображением ошибок API.
 */
export function VetAddVaccinationModal({
  isOpen,
  patient,
  onClose,
  onSubmit,
}: VetAddVaccinationModalProps) {
  const [vacForm, setVacForm] = useState<VaccinationFormData>(getInitialForm);
  const [savingVac, setSavingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVacForm(getInitialForm());
      setVacError(null);
      setSavingVac(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingVac) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, savingVac, onClose]);

  if (!isOpen || !patient) {
    return null;
  }

  const todayIso = getMoscowTodayIso();

  const handleSubmit = async (e: React.FormEvent) => {
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
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setVacError(formatApiError(err, 'Ошибка сохранения прививки'));
    } finally {
      setSavingVac(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Внести прививку"
      onClick={() => !savingVac && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <span className="dialog-title">Внести прививку</span>
          <span className="dialog-desc">Запись вакцинации для «{patient.name}»</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {vacError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <div>{vacError}</div>
              </div>
            )}

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
                disabled={savingVac}
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
                  max={todayIso}
                  value={vacForm.administeredOn}
                  onChange={(e) =>
                    setVacForm({ ...vacForm, administeredOn: e.target.value })
                  }
                  disabled={savingVac}
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
                  disabled={savingVac}
                />
              </div>
            </div>
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={savingVac}
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingVac}>
              {savingVac ? 'Сохранение…' : 'Внести'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
