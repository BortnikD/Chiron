'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Trash2, Plus, Edit2 } from 'lucide-react';
import { adminApi, clinicApi } from '../../../../api';
import { Service, Specialization, Species, ServiceSpecies } from '../../../../types';

export interface ServiceDetailIslandProps {
  service: Service;
  specializations: Specialization[];
  speciesList: Species[];
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onDeleteClick: () => void;
  onOpenSpeciesModal?: (link?: ServiceSpecies | null) => void;
}

export const ServiceDetailIsland: React.FC<ServiceDetailIslandProps> = ({
  service,
  specializations,
  speciesList,
  serviceSpeciesMap,
  onClose,
  onRefresh,
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
  const [savingService, setSavingService] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Attach species state
  const [attachSpeciesId, setAttachSpeciesId] = useState('');
  const [attachDur, setAttachDur] = useState<number | ''>('');
  const [attachPrice, setAttachPrice] = useState<number | ''>('');
  const [attaching, setAttaching] = useState(false);

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
    setServiceLinks(serviceSpeciesMap[service.id] || []);
    setSaveSuccess(false);
    setSaveError(null);

    // Refresh species links for the selected service
    clinicApi
      .getServiceSpecies(service.id)
      .then((links) => {
        const safe = Array.isArray(links) ? links : [];
        setServiceLinks(safe);
      })
      .catch(() => {});
  }, [service, serviceSpeciesMap]);

  const getSpecName = (specId?: string) => {
    if (!specId) return '—';
    const s = specializations.find((sp) => sp.id === specId);
    return s ? s.name : '—';
  };

  const getSpeciesName = (spId?: string) => {
    if (!spId) return '—';
    const s = speciesList.find((sp) => sp.id === spId);
    return s ? s.name : '—';
  };

  // Save Service Main Info
  const handleSaveService = async () => {
    setSavingService(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateService(service.id, {
        name: editForm.name.trim(),
        specializationId: editForm.specializationId,
        description: editForm.description.trim(),
        basePrice: Number(editForm.basePrice),
        baseDurationMin: Number(editForm.baseDurationMin),
        bufferAfterMin: Number(editForm.bufferAfterMin),
        isActive: editForm.isActive,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await onRefresh();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Ошибка сохранения услуги');
    } finally {
      setSavingService(false);
    }
  };

  // Attach Species Override
  const handleAttachSpecies = async () => {
    if (!attachSpeciesId) return;
    setAttaching(true);
    try {
      await adminApi.createServiceSpecies(service.id, {
        speciesId: attachSpeciesId,
        durationMin: attachDur !== '' ? Number(attachDur) : null,
        price: attachPrice !== '' ? Number(attachPrice) : null,
      });
      setAttachSpeciesId('');
      setAttachDur('');
      setAttachPrice('');
      const links = await clinicApi.getServiceSpecies(service.id);
      const safe = Array.isArray(links) ? links : [];
      setServiceLinks(safe);
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка привязки вида к услуге');
    } finally {
      setAttaching(false);
    }
  };

  // Detach Species Override
  const handleDetachSpecies = async (speciesId: string) => {
    try {
      await adminApi.deleteServiceSpecies(service.id, speciesId);
      const next = serviceLinks.filter((l) => l.speciesId !== speciesId);
      setServiceLinks(next);
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка отвязки вида от услуги');
    }
  };

  // Save Species Overrides in batch (using PATCH)
  const handleSaveOverrides = async () => {
    try {
      for (const link of serviceLinks) {
        await adminApi.updateServiceSpecies(service.id, link.speciesId, {
          durationMin: link.durationMin != null ? Number(link.durationMin) : null,
          price: link.price != null ? Number(link.price) : null,
        });
      }
      alert('Переопределения сохранены');
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка сохранения переопределений');
    }
  };

  const attachedSpeciesIds = new Set(serviceLinks.map((l) => l.speciesId));
  const unattachedSpecies = speciesList.filter((sp) => !attachedSpeciesIds.has(sp.id));

  return (
    <section className="island detail-island" style={{ width: 480 }} aria-label="Услуга">
      <div className="island-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h2">{service.name}</span>
          <span className="cell-sub">{getSpecName(service.specializationId)}</span>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line">
        <button
          className={`tab-line ${detailTab === 'main' ? 'on' : ''}`}
          onClick={() => setDetailTab('main')}
        >
          Основное
        </button>
        <button
          className={`tab-line ${detailTab === 'species' ? 'on' : ''}`}
          onClick={() => setDetailTab('species')}
        >
          Для видов <span className="small muted">{serviceLinks.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {/* Tab 1: Main */}
        {detailTab === 'main' && (
          <div className="col" style={{ gap: 14 }}>
            <div className="field">
              <span className="field-label">
                Специализация <span className="req">*</span>
              </span>
              <select
                className="select"
                value={editForm.specializationId}
                onChange={(e) =>
                  setEditForm({ ...editForm, specializationId: e.target.value })
                }
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
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>

            <div
              className="form-grid"
              style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
            >
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      basePrice: parseInt(e.target.value) || 0,
                    })
                  }
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      baseDurationMin: parseInt(e.target.value) || 30,
                    })
                  }
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      bufferAfterMin: parseInt(e.target.value) || 0,
                    })
                  }
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
                onClick={() =>
                  setEditForm({ ...editForm, isActive: !editForm.isActive })
                }
              />
              <span>Активна — видна в каталоге и доступна для записи</span>
            </div>

            {saveError && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{saveError}</div>
              </div>
            )}

            {saveSuccess && (
              <div className="alert alert-info" style={{ borderColor: 'var(--primary)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} />
                <div>Услуга обновлена</div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Species Overrides */}
        {detailTab === 'species' && (
          <div className="col" style={{ gap: 12 }}>
            <span className="small muted">
              Пустые поля = базовое значение услуги ({service.baseDurationMin} мин,{' '}
              {service.basePrice} ₽). Сохранение пустого поля отправляет null.
            </span>

            <div
              className="dtable"
              style={{ '--cols': '0.9fr 1fr 1fr 70px' } as React.CSSProperties}
            >
              <div className="thead" style={{ padding: 0 }}>
                <span>Вид</span>
                <span>Длительность</span>
                <span>Цена</span>
                <span />
              </div>

              {serviceLinks.map((l, index) => (
                <div key={l.speciesId} className="trow static" style={{ padding: '6px 0' }}>
                  <span className="cell-main">{getSpeciesName(l.speciesId)}</span>
                  <input
                    className="input input-sm"
                    type="number"
                    min="1"
                    max="1440"
                    placeholder={`${service.baseDurationMin} мин`}
                    value={l.durationMin != null ? l.durationMin : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value);
                      const next = [...serviceLinks];
                      next[index] = { ...l, durationMin: val };
                      setServiceLinks(next);
                    }}
                  />
                  <input
                    className="input input-sm"
                    type="number"
                    min="0"
                    placeholder={`${service.basePrice} ₽`}
                    value={l.price != null ? l.price : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value);
                      const next = [...serviceLinks];
                      next[index] = { ...l, price: val };
                      setServiceLinks(next);
                    }}
                  />
                  <span className="row-actions">
                    {onOpenSpeciesModal && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label={`Редактировать ${getSpeciesName(l.speciesId)}`}
                        title="Настроить в окне"
                        onClick={() => onOpenSpeciesModal(l)}
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      aria-label={`Отвязать ${getSpeciesName(l.speciesId)}`}
                      title="Отвязать"
                      onClick={() => handleDetachSpecies(l.speciesId)}
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
                  onClick={handleAttachSpecies}
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
              <div className="alert">
                <AlertCircle size={16} />
                <div>Услуга не привязана ни к одному виду — записаться на неё нельзя</div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={handleSaveOverrides}
            >
              Сохранить переопределения
            </button>
          </div>
        )}
      </div>

      <div className="island-foot">
        <button
          type="button"
          className="btn btn-destructive-outline btn-sm"
          onClick={onDeleteClick}
        >
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
