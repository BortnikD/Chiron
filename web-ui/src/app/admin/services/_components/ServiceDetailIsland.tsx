'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Check, Trash2 } from 'lucide-react';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
} from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import type { SaveServiceInput } from '../_hooks/useAdminServices';
import { ServiceSpeciesOverridesSection } from './ServiceSpeciesOverridesSection';

export interface ServiceDetailIslandProps {
  service: Service;
  specializations: Specialization[];
  speciesList: Species[];
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  onClose: () => void;
  onSaveService: (data: SaveServiceInput, id: string) => Promise<Service>;
  onLoadServiceSpecies: (serviceId: string) => Promise<ServiceSpecies[]>;
  onAttachSpecies: (serviceId: string, speciesId: string) => Promise<ServiceSpecies[]>;
  onDetachSpecies: (serviceId: string, speciesId: string) => Promise<void>;
  onSaveOverrides: (serviceId: string, links: ServiceSpecies[]) => Promise<void>;
  onDeleteClick: () => void;
  onOpenSpeciesModal?: (link?: ServiceSpecies | null) => void;
}

export const ServiceDetailIsland: React.FC<ServiceDetailIslandProps> = ({
  service,
  specializations,
  speciesList,
  serviceSpeciesMap,
  onClose,
  onSaveService,
  onLoadServiceSpecies,
  onAttachSpecies,
  onDetachSpecies,
  onSaveOverrides,
  onDeleteClick,
  onOpenSpeciesModal,
}) => {
  const [detailTab, setDetailTab] = useState<'main' | 'species'>('main');
  const [editForm, setEditForm] = useState({
    name: service.name,
    specializationId: service.specializationId,
    description: service.description || '',
    basePrice: service.basePrice,
    baseDurationMin: service.baseDurationMin,
    bufferAfterMin: service.bufferAfterMin,
    isActive: service.isActive,
  });

  const [serviceLinks, setServiceLinks] = useState<ServiceSpecies[]>(
    serviceSpeciesMap[service.id] || []
  );
  const [linksError, setLinksError] = useState<string | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  useEffect(() => {
    setEditForm({
      name: service.name,
      specializationId: service.specializationId,
      description: service.description || '',
      basePrice: service.basePrice,
      baseDurationMin: service.baseDurationMin,
      bufferAfterMin: service.bufferAfterMin,
      isActive: service.isActive,
    });
    setSaveSuccess(false);
    setSaveError(null);
  }, [service]);

  useEffect(() => {
    setServiceLinks(serviceSpeciesMap[service.id] || []);
  }, [service.id, serviceSpeciesMap]);

  useEffect(() => {
    let cancelled = false;
    setLinksError(null);
    onLoadServiceSpecies(service.id)
      .then((links) => {
        if (!cancelled) setServiceLinks(Array.isArray(links) ? links : []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLinksError(formatApiError(err, 'Не удалось загрузить привязки видов'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [service.id, onLoadServiceSpecies]);

  const handleSaveService = async () => {
    if (!editForm.name.trim() || !editForm.specializationId) {
      setSaveError('Заполните обязательные поля');
      setDetailTab('main');
      return;
    }

    setSavingService(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await onSaveService(
        {
          name: editForm.name.trim(),
          specializationId: editForm.specializationId,
          description: editForm.description.trim(),
          basePrice: Number(editForm.basePrice),
          baseDurationMin: Number(editForm.baseDurationMin),
          bufferAfterMin: Number(editForm.bufferAfterMin),
          isActive: editForm.isActive,
        },
        service.id
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      setSaveError(formatApiError(err, 'Ошибка сохранения услуги'));
      setDetailTab('main');
    } finally {
      setSavingService(false);
    }
  };

  const handleAttach = async (serviceId: string, speciesId: string) => {
    const updated = await onAttachSpecies(serviceId, speciesId);
    setServiceLinks(updated);
  };

  return (
    <section className="island detail-island" aria-label="Услуга">
      <div className="island-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h2">{service.name}</span>
          <span className="cell-sub">{specsMap[service.specializationId] || '—'}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line">
        <button
          type="button"
          className={`tab-line ${detailTab === 'main' ? 'on' : ''}`}
          onClick={() => setDetailTab('main')}
        >
          Основное
        </button>
        <button
          type="button"
          className={`tab-line ${detailTab === 'species' ? 'on' : ''}`}
          onClick={() => setDetailTab('species')}
        >
          Для видов <span className="small muted">{serviceLinks.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {detailTab === 'main' && (
          <div className="col" style={{ gap: 14 }}>
            <div className="field">
              <label className="field-label" htmlFor="sd-spec">
                Специализация <span className="req">*</span>
              </label>
              <select
                id="sd-spec"
                className="select"
                value={editForm.specializationId}
                onChange={(e) => setEditForm({ ...editForm, specializationId: e.target.value })}
              >
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="sd-name">
                Название <span className="req">*</span>
              </label>
              <input
                id="sd-name"
                className="input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="sd-desc">
                Описание
              </label>
              <textarea
                id="sd-desc"
                className="textarea"
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div className="field">
                <label className="field-label" htmlFor="sd-price">
                  Цена, ₽
                </label>
                <input
                  id="sd-price"
                  type="number"
                  min="0"
                  className="input"
                  value={editForm.basePrice}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setEditForm({ ...editForm, basePrice: Number.isNaN(parsed) ? 0 : parsed });
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="sd-dur">
                  Длит., мин
                </label>
                <input
                  id="sd-dur"
                  type="number"
                  min="1"
                  max="1440"
                  className="input"
                  value={editForm.baseDurationMin}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setEditForm({
                      ...editForm,
                      baseDurationMin: Number.isNaN(parsed) ? 30 : parsed,
                    });
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="sd-buf">
                  Буфер, мин
                </label>
                <input
                  id="sd-buf"
                  type="number"
                  min="0"
                  max="240"
                  className="input"
                  value={editForm.bufferAfterMin}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setEditForm({
                      ...editForm,
                      bufferAfterMin: Number.isNaN(parsed) ? 0 : parsed,
                    });
                  }}
                />
              </div>
            </div>

            <div className="row" style={{ height: 36, gap: 10 }}>
              <button
                type="button"
                className={`switch ${editForm.isActive ? 'on' : ''}`}
                role="switch"
                aria-checked={editForm.isActive}
                aria-label="Активна"
                onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
              />
              <span>Активна — видна в каталоге и доступна для записи</span>
            </div>

            {saveError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{saveError}</div>
              </div>
            )}

            {saveSuccess && (
              <div className="alert alert-success" role="status">
                <Check size={16} className="ic" />
                <div>Услуга обновлена</div>
              </div>
            )}
          </div>
        )}

        {detailTab === 'species' && (
          <div className="col" style={{ gap: 10 }}>
            {linksError && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{linksError}</div>
              </div>
            )}
            <ServiceSpeciesOverridesSection
              service={service}
              speciesList={speciesList}
              serviceLinks={serviceLinks}
              onChangeLinks={setServiceLinks}
              onAttachSpecies={handleAttach}
              onDetachSpecies={onDetachSpecies}
              onSaveOverrides={onSaveOverrides}
              onOpenSpeciesModal={onOpenSpeciesModal}
            />
          </div>
        )}
      </div>

      <div className="island-foot">
        <button type="button" className="btn btn-destructive-outline btn-sm" onClick={onDeleteClick}>
          <Trash2 size={14} />
          Удалить
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSaveService}
          disabled={savingService}
        >
          {savingService ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </section>
  );
};
