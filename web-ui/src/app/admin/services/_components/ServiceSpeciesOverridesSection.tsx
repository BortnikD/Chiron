'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Check, Trash2, Plus, Edit2 } from 'lucide-react';
import type { Service, Species, ServiceSpecies } from '@/modules/clinic/types';
import { formatApiError, formatCurrency, toIdNameMap } from '@/shared/lib';

export interface ServiceSpeciesOverridesSectionProps {
  service: Service;
  speciesList: Species[];
  serviceLinks: ServiceSpecies[];
  onChangeLinks: React.Dispatch<React.SetStateAction<ServiceSpecies[]>>;
  onAttachSpecies: (serviceId: string, speciesId: string) => Promise<void>;
  onDetachSpecies: (serviceId: string, speciesId: string) => Promise<void>;
  onSaveOverrides: (serviceId: string, links: ServiceSpecies[]) => Promise<void>;
  onOpenSpeciesModal?: (link?: ServiceSpecies | null) => void;
}

export const ServiceSpeciesOverridesSection: React.FC<ServiceSpeciesOverridesSectionProps> = ({
  service,
  speciesList,
  serviceLinks,
  onChangeLinks,
  onAttachSpecies,
  onDetachSpecies,
  onSaveOverrides,
  onOpenSpeciesModal,
}) => {
  const [attachSpeciesId, setAttachSpeciesId] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [speciesSuccess, setSpeciesSuccess] = useState<string | null>(null);

  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  useEffect(() => {
    setAttachSpeciesId('');
    setSpeciesError(null);
    setSpeciesSuccess(null);
  }, [service.id]);

  const attachedSpeciesIds = new Set(serviceLinks.map((l) => l.speciesId));
  const unattachedSpecies = speciesList.filter((sp) => !attachedSpeciesIds.has(sp.id));

  const handleAttach = async () => {
    if (!attachSpeciesId) return;
    setAttaching(true);
    setSpeciesError(null);
    setSpeciesSuccess(null);
    try {
      await onAttachSpecies(service.id, attachSpeciesId);
      setAttachSpeciesId('');
    } catch (err: unknown) {
      setSpeciesError(formatApiError(err, 'Ошибка привязки вида к услуге'));
    } finally {
      setAttaching(false);
    }
  };

  const handleDetach = async (speciesId: string) => {
    setSpeciesError(null);
    setSpeciesSuccess(null);
    try {
      await onDetachSpecies(service.id, speciesId);
      onChangeLinks((prev) => prev.filter((l) => l.speciesId !== speciesId));
    } catch (err: unknown) {
      setSpeciesError(formatApiError(err, 'Ошибка отвязки вида от услуги'));
    }
  };

  const handleSave = async () => {
    setSavingOverrides(true);
    setSpeciesError(null);
    setSpeciesSuccess(null);
    try {
      await onSaveOverrides(service.id, serviceLinks);
      setSpeciesSuccess('Переопределения сохранены');
      setTimeout(() => setSpeciesSuccess(null), 2500);
    } catch (err: unknown) {
      setSpeciesError(formatApiError(err, 'Ошибка сохранения переопределений'));
    } finally {
      setSavingOverrides(false);
    }
  };

  return (
    <div className="col" style={{ gap: 12 }}>
      <span className="small muted">
        Пустые поля = базовое значение услуги ({service.baseDurationMin} мин,{' '}
        {formatCurrency(service.basePrice)}). Сохранение пустого поля отправляет null.
      </span>

      <div className="dtable" style={{ '--cols': '0.9fr 1fr 1fr 70px' } as React.CSSProperties}>
        <div className="thead" style={{ padding: 0 }}>
          <span>Вид</span>
          <span>Длительность</span>
          <span>Цена</span>
          <span />
        </div>

        {serviceLinks.map((l, index) => (
          <div key={l.speciesId} className="trow static" style={{ padding: '6px 0' }}>
            <span className="cell-main">{speciesMap[l.speciesId] || '—'}</span>
            <input
              className="input input-sm"
              type="number"
              min="1"
              max="1440"
              aria-label={`Длительность для вида ${speciesMap[l.speciesId] || ''}`}
              placeholder={`${service.baseDurationMin} мин`}
              value={l.durationMin != null ? l.durationMin : ''}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                const val = e.target.value === '' || Number.isNaN(parsed) ? null : parsed;
                onChangeLinks((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, durationMin: val } : item))
                );
              }}
            />
            <input
              className="input input-sm"
              type="number"
              min="0"
              aria-label={`Цена для вида ${speciesMap[l.speciesId] || ''}`}
              placeholder={formatCurrency(service.basePrice)}
              value={l.price != null ? l.price : ''}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                const val = e.target.value === '' || Number.isNaN(parsed) ? null : parsed;
                onChangeLinks((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, price: val } : item))
                );
              }}
            />
            <span className="row-actions">
              {onOpenSpeciesModal && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label={`Редактировать ${speciesMap[l.speciesId] || '—'}`}
                  title="Настроить в окне"
                  onClick={() => onOpenSpeciesModal(l)}
                >
                  <Edit2 size={13} />
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label={`Отвязать ${speciesMap[l.speciesId] || '—'}`}
                title="Отвязать"
                onClick={() => handleDetach(l.speciesId)}
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {unattachedSpecies.length > 0 && (
        <div className="row wrap" style={{ gap: 6, alignItems: 'center' }}>
          <div style={{ width: 180 }}>
            <select
              className="select"
              aria-label="Выбрать вид для привязки"
              value={attachSpeciesId}
              onChange={(e) => setAttachSpeciesId(e.target.value)}
            >
              <option value="">Привязать вид…</option>
              {unattachedSpecies.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleAttach}
            disabled={!attachSpeciesId || attaching}
          >
            <Plus size={14} />
            Привязать
          </button>
          {onOpenSpeciesModal && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onOpenSpeciesModal(null)}
            >
              <Plus size={14} />
              В модалке
            </button>
          )}
        </div>
      )}

      {serviceLinks.length === 0 && (
        <div className="alert alert-info">
          <AlertCircle size={16} className="ic" />
          <div>Услуга не привязана ни к одному виду — записаться на неё нельзя</div>
        </div>
      )}

      {speciesError && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle size={16} className="ic" />
          <div>{speciesError}</div>
        </div>
      )}

      {speciesSuccess && (
        <div className="alert alert-success" role="status">
          <Check size={16} className="ic" />
          <div>{speciesSuccess}</div>
        </div>
      )}

      {serviceLinks.length > 0 && (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={handleSave}
          disabled={savingOverrides}
        >
          {savingOverrides ? 'Сохранение…' : 'Сохранить переопределения'}
        </button>
      )}
    </div>
  );
};
