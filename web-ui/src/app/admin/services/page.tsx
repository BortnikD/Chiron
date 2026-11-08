'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi, clinicApi } from '../../../api';
import { Service, Specialization, Species, ServiceSpecies } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ClipboardList,
  Plus,
  Search,
  Trash2,
  Tags,
  PawPrint,
  AlertCircle,
  X,
  Check,
  Edit2,
} from 'lucide-react';

function AdminServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [serviceSpeciesMap, setServiceSpeciesMap] = useState<Record<string, ServiceSpecies[]>>({});
  const [loading, setLoading] = useState(true);

  // Top Nav Tab (from URL or switch)
  const [mainTab, setMainTab] = useState<'SERVICES' | 'SPECIES' | 'SPECIALIZATIONS'>('SERVICES');

  // Filters for services
  const [filterSpec, setFilterSpec] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Selected Service for Master-Detail panel
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailTab, setDetailTab] = useState<'main' | 'species'>('main');
  const [editForm, setEditForm] = useState({
    name: '',
    specializationId: '',
    description: '',
    basePrice: 1500,
    baseDurationMin: 30,
    bufferAfterMin: 10,
    isActive: true,
  });
  const [serviceLinks, setServiceLinks] = useState<ServiceSpecies[]>([]);
  const [savingService, setSavingService] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Attach species state
  const [attachSpeciesId, setAttachSpeciesId] = useState('');
  const [attachDur, setAttachDur] = useState<number | ''>('');
  const [attachPrice, setAttachPrice] = useState<number | ''>('');
  const [attaching, setAttaching] = useState(false);

  // Create Service Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    specializationId: '',
    description: '',
    basePrice: 1500,
    baseDurationMin: 30,
    bufferAfterMin: 10,
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Service Modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Species management state
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);

  // Specialization management state
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [specForm, setSpecForm] = useState({ id: '', name: '', description: '' });
  const [savingSpec, setSavingSpec] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcData, specData, speciesData] = await Promise.all([
        adminApi.getServices().catch(() => [] as Service[]),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      const safeServices = Array.isArray(svcData) ? svcData : [];
      const safeSpecs = Array.isArray(specData) ? specData : [];
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];

      setServices(safeServices);
      setSpecializations(safeSpecs);
      setSpeciesList(safeSpecies);

      // Load species links for all services
      const linkPromises = safeServices.map(async (svc) => {
        try {
          const links = await clinicApi.getServiceSpecies(svc.id);
          return { serviceId: svc.id, links: Array.isArray(links) ? links : [] };
        } catch {
          return { serviceId: svc.id, links: [] };
        }
      });
      const linkResults = await Promise.all(linkPromises);
      const linkMap: Record<string, ServiceSpecies[]> = {};
      linkResults.forEach((r) => {
        linkMap[r.serviceId] = r.links;
      });
      setServiceSpeciesMap(linkMap);

      if (selectedService) {
        const updated = safeServices.find((s: Service) => s.id === selectedService.id);
        if (updated) setSelectedService(updated);
      }
    } catch (err) {
      console.error('Failed to load services data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tabParam === 'specs' || tabParam === 'specializations') {
      setMainTab('SPECIALIZATIONS');
    } else if (tabParam === 'species') {
      setMainTab('SPECIES');
    } else {
      setMainTab('SERVICES');
    }
  }, [tabParam]);

  // When selected service changes, populate detail form
  useEffect(() => {
    if (!selectedService) return;
    setEditForm({
      name: selectedService.name,
      specializationId: selectedService.specializationId,
      description: selectedService.description || '',
      basePrice: selectedService.basePrice,
      baseDurationMin: selectedService.baseDurationMin,
      bufferAfterMin: selectedService.bufferAfterMin,
      isActive: selectedService.isActive,
    });
    setServiceLinks(serviceSpeciesMap[selectedService.id] || []);
    setSaveSuccess(false);
    setSaveError(null);

    // Refresh species links for selected service
    clinicApi
      .getServiceSpecies(selectedService.id)
      .then((links) => {
        const safe = Array.isArray(links) ? links : [];
        setServiceLinks(safe);
        setServiceSpeciesMap((prev) => ({ ...prev, [selectedService.id]: safe }));
      })
      .catch(() => {});
  }, [selectedService]);

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

  // Save Service
  const handleSaveService = async () => {
    if (!selectedService) return;
    setSavingService(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateService(selectedService.id, {
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
      await loadData();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Ошибка сохранения услуги');
    } finally {
      setSavingService(false);
    }
  };

  // Delete Service
  const handleDeleteService = async () => {
    if (!selectedService) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(selectedService.id);
      setIsDeleteConfirmOpen(false);
      setSelectedService(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления услуги');
    } finally {
      setDeleting(false);
    }
  };

  // Create Service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.specializationId) {
      setCreateError('Заполните обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createService({
        name: createForm.name.trim(),
        specializationId: createForm.specializationId,
        description: createForm.description.trim(),
        basePrice: Number(createForm.basePrice),
        baseDurationMin: Number(createForm.baseDurationMin),
        bufferAfterMin: Number(createForm.bufferAfterMin),
        isActive: createForm.isActive,
      });
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        specializationId: specializations[0]?.id || '',
        description: '',
        basePrice: 1500,
        baseDurationMin: 30,
        bufferAfterMin: 10,
        isActive: true,
      });
      await loadData();
      if (created) setSelectedService(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Ошибка создания услуги');
    } finally {
      setCreating(false);
    }
  };

  // Attach Species Override
  const handleAttachSpecies = async () => {
    if (!selectedService || !attachSpeciesId) return;
    setAttaching(true);
    try {
      await adminApi.createServiceSpecies(selectedService.id, {
        speciesId: attachSpeciesId,
        durationMin: attachDur !== '' ? Number(attachDur) : null,
        price: attachPrice !== '' ? Number(attachPrice) : null,
      });
      setAttachSpeciesId('');
      setAttachDur('');
      setAttachPrice('');
      const links = await clinicApi.getServiceSpecies(selectedService.id);
      const safe = Array.isArray(links) ? links : [];
      setServiceLinks(safe);
      setServiceSpeciesMap((prev) => ({ ...prev, [selectedService.id]: safe }));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка привязки вида к услуге');
    } finally {
      setAttaching(false);
    }
  };

  // Detach Species Override
  const handleDetachSpecies = async (speciesId: string) => {
    if (!selectedService) return;
    try {
      await adminApi.deleteServiceSpecies(selectedService.id, speciesId);
      const next = serviceLinks.filter((l) => l.speciesId !== speciesId);
      setServiceLinks(next);
      setServiceSpeciesMap((prev) => ({ ...prev, [selectedService.id]: next }));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка отвязки вида от услуги');
    }
  };

  // Save Species Overrides
  const handleSaveOverrides = async () => {
    if (!selectedService) return;
    try {
      for (const link of serviceLinks) {
        await adminApi.updateServiceSpecies(selectedService.id, link.speciesId, {
          durationMin: link.durationMin != null ? Number(link.durationMin) : null,
          price: link.price != null ? Number(link.price) : null,
        });
      }
      alert('Переопределения сохранены');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка сохранения переопределений');
    }
  };

  // Species Actions
  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeciesName.trim()) return;
    setSavingSpecies(true);
    try {
      await adminApi.createSpecies(newSpeciesName.trim());
      setIsSpeciesModalOpen(false);
      setNewSpeciesName('');
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка добавления вида');
    } finally {
      setSavingSpecies(false);
    }
  };

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm('Удалить вид животных?')) return;
    try {
      await adminApi.deleteSpecies(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления вида');
    }
  };

  // Specialization Actions
  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specForm.name.trim()) return;
    setSavingSpec(true);
    try {
      if (specForm.id) {
        await adminApi.updateSpecialization(specForm.id, {
          name: specForm.name.trim(),
          description: specForm.description.trim(),
        });
      } else {
        await adminApi.createSpecialization({
          name: specForm.name.trim(),
          description: specForm.description.trim(),
        });
      }
      setIsSpecModalOpen(false);
      setSpecForm({ id: '', name: '', description: '' });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка сохранения специализации');
    } finally {
      setSavingSpec(false);
    }
  };

  const handleDeleteSpec = async (id: string) => {
    if (!confirm('Удалить специализацию?')) return;
    try {
      await adminApi.deleteSpecialization(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления специализации');
    }
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    if (filterSpec !== 'ALL' && s.specializationId !== filterSpec) return false;
    if (filterSpecies !== 'ALL') {
      const attached = serviceSpeciesMap[s.id] || [];
      if (!attached.some((l) => l.speciesId === filterSpecies)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = s.name.toLowerCase();
      const spec = getSpecName(s.specializationId).toLowerCase();
      if (!name.includes(q) && !spec.includes(q)) return false;
    }
    return true;
  });

  // Attached species set for current service
  const attachedSpeciesIds = new Set(serviceLinks.map((l) => l.speciesId));
  const unattachedSpecies = speciesList.filter((sp) => !attachedSpeciesIds.has(sp.id));

  return (
    <AppShell
      crumbGroup="Справочники"
      crumb={mainTab === 'SPECIES' ? 'Виды животных' : mainTab === 'SPECIALIZATIONS' ? 'Специализации' : 'Услуги'}
    >
      {/* Tab Switcher */}
      <div className="tabs-line" style={{ marginBottom: 'var(--gap)' }}>
        <button
          className={`tab-line ${mainTab === 'SERVICES' ? 'on' : ''}`}
          onClick={() => {
            setMainTab('SERVICES');
            router.replace('/admin/services');
          }}
        >
          Услуги
        </button>
        <button
          className={`tab-line ${mainTab === 'SPECIES' ? 'on' : ''}`}
          onClick={() => {
            setMainTab('SPECIES');
            router.replace('/admin/services?tab=species');
          }}
        >
          Виды животных
        </button>
        <button
          className={`tab-line ${mainTab === 'SPECIALIZATIONS' ? 'on' : ''}`}
          onClick={() => {
            setMainTab('SPECIALIZATIONS');
            router.replace('/admin/services?tab=specs');
          }}
        >
          Специализации
        </button>
      </div>

      {mainTab === 'SERVICES' && (
        <div className="content-row">
          {/* Left Column: Filters + Table */}
          <div className="content-col grow">
            <section className="island filters" aria-label="Фильтры услуг">
              <div className="field">
                <span className="field-label">Специализация</span>
                <div className="dd">
                  <select
                    className="select dd-btn"
                    value={filterSpec}
                    onChange={(e) => setFilterSpec(e.target.value)}
                  >
                    <option value="ALL">Все специализации</option>
                    {specializations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <span className="field-label">Для вида</span>
                <div className="dd">
                  <select
                    className="select dd-btn"
                    value={filterSpecies}
                    onChange={(e) => setFilterSpecies(e.target.value)}
                  >
                    <option value="ALL">Любой вид</option>
                    {speciesList.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field" style={{ width: 180 }}>
                <span className="field-label">Поиск</span>
                <div className="input-icon">
                  <Search size={14} className="ic" />
                  <input
                    type="text"
                    className="input"
                    placeholder="Название…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="spacer" />

              <button
                className="btn btn-primary"
                onClick={() => {
                  setCreateError(null);
                  if (specializations.length > 0 && !createForm.specializationId) {
                    setCreateForm((prev) => ({
                      ...prev,
                      specializationId: specializations[0].id,
                    }));
                  }
                  setIsCreateOpen(true);
                }}
              >
                <Plus size={16} />
                Новая услуга
              </button>
            </section>

            <section className="island grow">
              <div className="island-head">
                <span className="island-title">
                  <ClipboardList size={18} />
                  Услуги <span className="count">{filteredServices.length} · включая неактивные</span>
                </span>
              </div>

              <div className="table-wrap">
                <div
                  className="dtable"
                  style={
                    {
                      '--cols': '1.7fr 1fr 0.7fr 0.7fr 0.6fr 1.3fr 0.7fr',
                      minWidth: '860px',
                    } as React.CSSProperties
                  }
                >
                  <div className="thead">
                    <span>Название ↑</span>
                    <span>Специализация</span>
                    <span className="right">Цена</span>
                    <span className="right">Длит.</span>
                    <span className="right">Буфер</span>
                    <span>Виды</span>
                    <span>Статус</span>
                  </div>

                  {filteredServices.map((r) => {
                    const isSelected = selectedService?.id === r.id;
                    const links = serviceSpeciesMap[r.id] || [];

                    return (
                      <button
                        key={r.id}
                        className={`trow ${isSelected ? 'sel' : ''}`}
                        onClick={() => setSelectedService(r)}
                      >
                        <span className="cell-main">{r.name}</span>
                        <span className="muted">{getSpecName(r.specializationId)}</span>
                        <span className="right tnum">{r.basePrice.toLocaleString('ru-RU')} ₽</span>
                        <span className="right tnum">{r.baseDurationMin} мин</span>
                        <span className="right tnum">{r.bufferAfterMin} мин</span>
                        <span className="chips">
                          {links.length > 0 ? (
                            links.map((l) => (
                              <span key={l.speciesId} className="badge badge-outline">
                                {getSpeciesName(l.speciesId)}
                              </span>
                            ))
                          ) : (
                            <span className="small muted">Нет видов</span>
                          )}
                        </span>
                        <span>
                          <span
                            className={`badge ${r.isActive ? 'badge-accent' : 'badge-outline'}`}
                          >
                            {r.isActive ? 'Активна' : 'Отключена'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filteredServices.length === 0 && !loading && (
                  <div className="empty">
                    <span className="empty-title">Услуги не найдены</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Master-Detail Island (480px) */}
          {selectedService && (
            <section className="island detail-island" style={{ width: 480 }} aria-label="Услуга">
              <div className="island-head">
                <div className="col" style={{ gap: 2 }}>
                  <span className="h2">{selectedService.name}</span>
                  <span className="cell-sub">{getSpecName(selectedService.specializationId)}</span>
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label="Закрыть"
                  onClick={() => setSelectedService(null)}
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
                      Пустые поля = базовое значение услуги ({selectedService.baseDurationMin} мин,{' '}
                      {selectedService.basePrice} ₽). Сохранение пустого поля отправляет null.
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
                            placeholder={`${selectedService.baseDurationMin} мин`}
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
                            placeholder={`${selectedService.basePrice} ₽`}
                            value={l.price != null ? l.price : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value);
                              const next = [...serviceLinks];
                              next[index] = { ...l, price: val };
                              setServiceLinks(next);
                            }}
                          />
                          <span className="row-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              aria-label={`Отвязать ${getSpeciesName(l.speciesId)}`}
                              onClick={() => handleDetachSpecies(l.speciesId)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>

                    {unattachedSpecies.length > 0 && (
                      <div className="row wrap" style={{ gap: 6 }}>
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
                  className="btn btn-destructive-outline btn-sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 size={14} />
                  Удалить
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveService}
                  disabled={savingService}
                >
                  {savingService ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SPECIES TAB */}
      {mainTab === 'SPECIES' && (
        <section className="island grow">
          <div className="island-head">
            <span className="island-title">
              <PawPrint size={18} />
              Виды животных <span className="count">{speciesList.length}</span>
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsSpeciesModalOpen(true)}
            >
              <Plus size={14} />
              Добавить вид
            </button>
          </div>

          <div className="table-wrap">
            <div
              className="dtable"
              style={{ '--cols': '1.5fr 1fr 100px', minWidth: '600px' } as React.CSSProperties}
            >
              <div className="thead">
                <span>Название</span>
                <span>Идентификатор</span>
                <span className="right">Действия</span>
              </div>

              {speciesList.map((sp) => (
                <div key={sp.id} className="trow static">
                  <span className="cell-main">{sp.name}</span>
                  <span className="tnum muted">{sp.id}</span>
                  <span className="row-actions right">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleDeleteSpecies(sp.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SPECIALIZATIONS TAB */}
      {mainTab === 'SPECIALIZATIONS' && (
        <section className="island grow">
          <div className="island-head">
            <span className="island-title">
              <Tags size={18} />
              Специализации врачей <span className="count">{specializations.length}</span>
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSpecForm({ id: '', name: '', description: '' });
                setIsSpecModalOpen(true);
              }}
            >
              <Plus size={14} />
              Добавить специализацию
            </button>
          </div>

          <div className="table-wrap">
            <div
              className="dtable"
              style={{ '--cols': '1.2fr 2fr 100px', minWidth: '700px' } as React.CSSProperties}
            >
              <div className="thead">
                <span>Специализация</span>
                <span>Описание</span>
                <span className="right">Действия</span>
              </div>

              {specializations.map((sp) => (
                <div key={sp.id} className="trow static">
                  <span className="cell-main">{sp.name}</span>
                  <span className="muted">{sp.description || '—'}</span>
                  <span className="row-actions right">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        setSpecForm({
                          id: sp.id,
                          name: sp.name,
                          description: sp.description || '',
                        });
                        setIsSpecModalOpen(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleDeleteSpec(sp.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modal: Create Service */}
      {isCreateOpen && (
        <div
          className="overlay"
          onClick={() => setIsCreateOpen(false)}
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
            className="dialog dialog-md"
            style={{ width: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Новая услуга</span>
              <span className="dialog-desc">Создание ветеринарной услуги клиники</span>
            </div>

            <form onSubmit={handleCreateService} className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="field-label">
                  Специализация <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.specializationId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, specializationId: e.target.value })
                  }
                  required
                >
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="cr-sname">
                  Название <span className="req">*</span>
                </label>
                <input
                  id="cr-sname"
                  className="input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="cr-sdesc">
                  Описание
                </label>
                <textarea
                  id="cr-sdesc"
                  className="textarea"
                  rows={2}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <div className="field">
                  <label className="field-label" htmlFor="cr-sprice">
                    Цена, ₽
                  </label>
                  <input
                    id="cr-sprice"
                    type="number"
                    min="0"
                    className="input"
                    value={createForm.basePrice}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, basePrice: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cr-sdur">
                    Длит., мин
                  </label>
                  <input
                    id="cr-sdur"
                    type="number"
                    min="1"
                    max="1440"
                    className="input"
                    value={createForm.baseDurationMin}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        baseDurationMin: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cr-sbuf">
                    Буфер, мин
                  </label>
                  <input
                    id="cr-sbuf"
                    type="number"
                    min="0"
                    max="240"
                    className="input"
                    value={createForm.bufferAfterMin}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        bufferAfterMin: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {createError && (
                <div className="alert" role="alert">
                  <AlertCircle size={16} />
                  <div>{createError}</div>
                </div>
              )}

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Создание…' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Species */}
      {isSpeciesModalOpen && (
        <div
          className="overlay"
          onClick={() => setIsSpeciesModalOpen(false)}
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
            style={{ width: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Добавить вид животных</span>
            </div>

            <form onSubmit={handleAddSpecies} className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="new-sp-name">
                  Название <span className="req">*</span>
                </label>
                <input
                  id="new-sp-name"
                  className="input"
                  placeholder="Кошка, Собака…"
                  value={newSpeciesName}
                  onChange={(e) => setNewSpeciesName(e.target.value)}
                  required
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsSpeciesModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpecies}
                >
                  {savingSpecies ? 'Сохранение…' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Specialization Form */}
      {isSpecModalOpen && (
        <div
          className="overlay"
          onClick={() => setIsSpecModalOpen(false)}
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
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">
                {specForm.id ? 'Редактировать специализацию' : 'Новая специализация'}
              </span>
            </div>

            <form onSubmit={handleSaveSpec} className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="spec-name">
                  Название <span className="req">*</span>
                </label>
                <input
                  id="spec-name"
                  className="input"
                  placeholder="Терапия, Хирургия…"
                  value={specForm.name}
                  onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="spec-desc">
                  Описание
                </label>
                <textarea
                  id="spec-desc"
                  className="textarea"
                  rows={2}
                  value={specForm.description}
                  onChange={(e) => setSpecForm({ ...specForm, description: e.target.value })}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsSpecModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpec}
                >
                  {savingSpec ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedService && (
        <div
          className="overlay"
          onClick={() => setIsDeleteConfirmOpen(false)}
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
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Удалить услугу?</span>
              <span className="dialog-desc">
                Услуга «{selectedService.name}» будет удалена. Записи с этой услугой могут быть затронуты.
              </span>
            </div>
            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                onClick={handleDeleteService}
                disabled={deleting}
              >
                {deleting ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Загрузка справочников…</div>}>
      <AdminServicesContent />
    </Suspense>
  );
}
