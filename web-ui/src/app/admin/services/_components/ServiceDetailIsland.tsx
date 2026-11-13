'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
} from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import type { SaveServiceInput, ServiceEditFormState } from './constants';
import { ServiceMainEditForm } from './ServiceMainEditForm';
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
  const [editForm, setEditForm] = useState<ServiceEditFormState>({
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
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

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
    const dur = Number(editForm.baseDurationMin);
    const buf = Number(editForm.bufferAfterMin);
    if (Number.isNaN(dur) || dur < 1 || dur > 1440) {
      setSaveError('Длительность должна быть от 1 до 1440 мин');
      setDetailTab('main');
      return;
    }
    if (Number.isNaN(buf) || buf < 0 || buf > 240) {
      setSaveError('Буфер должен быть от 0 до 240 мин');
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
          basePrice: Number(editForm.basePrice) || 0,
          baseDurationMin: dur,
          bufferAfterMin: buf,
          isActive: editForm.isActive,
        },
        service.id
      );
      setSaveSuccess(true);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => setSaveSuccess(false), 2500);
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
    <section className="island detail-island" style={{ width: 480 }} aria-label="Услуга">
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
          Параметры
        </button>
        <button
          type="button"
          className={`tab-line ${detailTab === 'species' ? 'on' : ''}`}
          onClick={() => setDetailTab('species')}
        >
          Виды животных <span className="small muted">{serviceLinks.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {detailTab === 'main' ? (
          <ServiceMainEditForm
            form={editForm}
            specializations={specializations}
            onChange={setEditForm}
            saveError={saveError}
            saveSuccess={saveSuccess}
          />
        ) : (
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
