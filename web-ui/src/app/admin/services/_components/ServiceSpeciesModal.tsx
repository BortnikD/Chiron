'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../../../api';
import { Service, Species, ServiceSpecies } from '../../../../types';

export interface ServiceSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  speciesList: Species[];
  existingOverride?: ServiceSpecies | null;
  attachedSpeciesIds?: string[];
  onSuccess: () => Promise<void> | void;
}

export const ServiceSpeciesModal: React.FC<ServiceSpeciesModalProps> = ({
  isOpen,
  onClose,
  service,
  speciesList,
  existingOverride,
  attachedSpeciesIds = [],
  onSuccess,
}) => {
  const [speciesId, setSpeciesId] = useState('');
  const [durationMin, setDurationMin] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSpecies = speciesList.filter(
    (sp) => !attachedSpeciesIds.includes(sp.id) || sp.id === existingOverride?.speciesId
  );

  useEffect(() => {
    if (!isOpen) return;

    if (existingOverride) {
      setSpeciesId(existingOverride.speciesId);
      setDurationMin(
        existingOverride.durationMin != null ? existingOverride.durationMin : ''
      );
      setPrice(existingOverride.price != null ? existingOverride.price : '');
    } else {
      const firstAvailable = speciesList.find(
        (sp) => !attachedSpeciesIds.includes(sp.id)
      );
      setSpeciesId(firstAvailable?.id || '');
      setDurationMin('');
      setPrice('');
    }
    setError(null);
  }, [isOpen, existingOverride, speciesList, attachedSpeciesIds]);

  if (!isOpen || !service) return null;

  const isEditing = !!existingOverride;
  const currentSpecies = speciesList.find(
    (s) => s.id === (isEditing ? existingOverride.speciesId : speciesId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speciesId) {
      setError('Выберите вид животного');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dur = durationMin !== '' ? Number(durationMin) : null;
      const pr = price !== '' ? Number(price) : null;

      if (isEditing) {
        // PATCH: обновление переопределений
        await adminApi.updateServiceSpecies(service.id, existingOverride.speciesId, {
          durationMin: dur,
          price: pr,
        });
      } else {
        // POST: создание переопределения
        await adminApi.createServiceSpecies(service.id, {
          speciesId,
          durationMin: dur,
          price: pr,
        });
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Ошибка сохранения переопределения услуги'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-sm"
        style={{ width: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">
            {isEditing
              ? `Переопределение: ${currentSpecies?.name || 'Вид'}`
              : 'Добавить переопределение для вида'}
          </span>
          <span className="dialog-desc">
            Индивидуальные параметры длительности и цены услуги «{service.name}»
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {!isEditing ? (
              <div className="field">
                <span className="field-label">
                  Вид животного <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  required
                >
                  <option value="">Выберите вид…</option>
                  {availableSpecies.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <span className="field-label">Вид животного</span>
                <input
                  className="input"
                  value={currentSpecies?.name || existingOverride.speciesId}
                  disabled
                />
              </div>
            )}

            <div
              className="form-grid"
              style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <div className="field">
                <label className="field-label" htmlFor="ssm-dur">
                  Длительность, мин
                </label>
                <input
                  id="ssm-dur"
                  type="number"
                  min="1"
                  max="1440"
                  className="input"
                  placeholder={`Базовая: ${service.baseDurationMin} мин`}
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(
                      e.target.value === '' ? '' : parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="ssm-price">
                  Цена, ₽
                </label>
                <input
                  id="ssm-price"
                  type="number"
                  min="0"
                  className="input"
                  placeholder={`Базовая: ${service.basePrice} ₽`}
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === '' ? '' : parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <span className="small muted">
              Пустые поля означают использование базовых параметров услуги (
              {service.baseDurationMin} мин, {service.basePrice} ₽).
            </span>

            {error && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{error}</div>
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Сохранение…'
                : isEditing
                ? 'Сохранить'
                : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
