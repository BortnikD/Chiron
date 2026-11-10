'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Service, Species, ServiceSpecies } from '@/modules/clinic/types';
import { formatApiError, formatCurrency } from '@/shared/lib';

export interface ServiceSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  speciesList: Species[];
  existingOverride?: ServiceSpecies | null;
  attachedSpeciesIds?: string[];
  onSave: (
    serviceId: string,
    speciesId: string,
    data: { durationMin: number | null; price: number | null },
    isEdit: boolean
  ) => Promise<void>;
}

export const ServiceSpeciesModal: React.FC<ServiceSpeciesModalProps> = ({
  isOpen,
  onClose,
  service,
  speciesList,
  existingOverride,
  attachedSpeciesIds = [],
  onSave,
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
      setDurationMin(existingOverride.durationMin != null ? existingOverride.durationMin : '');
      setPrice(existingOverride.price != null ? existingOverride.price : '');
    } else {
      const firstAvailable = speciesList.find((sp) => !attachedSpeciesIds.includes(sp.id));
      setSpeciesId(firstAvailable?.id || '');
      setDurationMin('');
      setPrice('');
    }
    setError(null);
  }, [isOpen, existingOverride, speciesList, attachedSpeciesIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !service) return null;

  const isEditing = Boolean(existingOverride);
  const currentSpecies = speciesList.find(
    (s) => s.id === (existingOverride ? existingOverride.speciesId : speciesId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSpeciesId = existingOverride ? existingOverride.speciesId : speciesId;
    if (!targetSpeciesId) {
      setError('Выберите вид животного');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        service.id,
        targetSpeciesId,
        {
          durationMin: durationMin !== '' ? Number(durationMin) : null,
          price: price !== '' ? Number(price) : null,
        },
        isEditing
      );
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка сохранения переопределения услуги'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ssm-modal-title"
      onClick={() => !saving && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="col" style={{ gap: 4 }}>
            <span id="ssm-modal-title" className="dialog-title">
              {isEditing
                ? `Переопределение: ${currentSpecies?.name || 'Вид'}`
                : 'Добавить переопределение для вида'}
            </span>
            <span className="dialog-desc">
              Индивидуальные параметры длительности и цены услуги «{service.name}»
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <div className="dialog-body">
            {!isEditing ? (
              <div className="field">
                <label className="field-label" htmlFor="ssm-species">
                  Вид животного <span className="req">*</span>
                </label>
                <select
                  id="ssm-species"
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
                <label className="field-label" htmlFor="ssm-species-ro">
                  Вид животного
                </label>
                <input
                  id="ssm-species-ro"
                  className="input"
                  value={currentSpecies?.name || existingOverride?.speciesId || ''}
                  disabled
                />
              </div>
            )}

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
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
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setDurationMin(e.target.value === '' || Number.isNaN(parsed) ? '' : parsed);
                  }}
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
                  placeholder={`Базовая: ${formatCurrency(service.basePrice)}`}
                  value={price}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setPrice(e.target.value === '' || Number.isNaN(parsed) ? '' : parsed);
                  }}
                />
              </div>
            </div>

            <span className="small muted">
              Пустые поля означают использование базовых параметров услуги (
              {service.baseDurationMin} мин, {formatCurrency(service.basePrice)}).
            </span>

            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{error}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : isEditing ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
