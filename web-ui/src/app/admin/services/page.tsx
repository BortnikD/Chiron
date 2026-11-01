'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, clinicApi } from '../../../api';
import { Service, Specialization, Species, ServiceSpecies } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ClipboardList,
  Plus,
  Clock,
  Search,
  Edit2,
  Trash2,
  Tags,
  Sliders,
  AlertCircle,
  FolderTree,
  RefreshCw,
  X,
  PawPrint,
} from 'lucide-react';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'SPECIES' | 'SPECIALIZATIONS'>('SERVICES');

  // Модальное окно добавления услуги
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specializationId: '',
    description: '',
    basePrice: 1500,
    baseDurationMin: 30,
    bufferAfterMin: 10,
    isActive: true,
  });
  const [creating, setCreating] = useState(false);

  // Модальное окно редактирования услуги
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    specializationId: '',
    description: '',
    basePrice: 1500,
    baseDurationMin: 30,
    bufferAfterMin: 10,
    isActive: true,
  });
  const [updating, setUpdating] = useState(false);

  // Модальное окно удаления услуги
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Модальное окно цен и ограничений по видам животных
  const [selectedServiceForSpecies, setSelectedServiceForSpecies] = useState<Service | null>(null);
  const [serviceSpeciesList, setServiceSpeciesList] = useState<ServiceSpecies[]>([]);
  const [loadingSpeciesOverrides, setLoadingSpeciesOverrides] = useState(false);
  const [newOverride, setNewOverride] = useState({
    speciesId: '',
    durationMin: 30,
    price: 1500,
  });
  const [savingOverride, setSavingOverride] = useState(false);

  // Модальное окно добавления вида животных
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);

  // Модальное окно добавления специализации
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [newSpecForm, setNewSpecForm] = useState({ name: '', description: '' });
  const [savingSpec, setSavingSpec] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcData, specData, speciesData] = await Promise.all([
        adminApi.getServices(),
        clinicApi.getSpecializations(),
        clinicApi.getSpecies(),
      ]);

      const safeServices = Array.isArray(svcData) ? svcData : [];
      const safeSpecs = Array.isArray(specData) ? specData : [];
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];

      setServices(safeServices);
      setSpecializations(safeSpecs);
      setSpeciesList(safeSpecies);

      if (safeSpecs.length > 0 && !form.specializationId) {
        setForm((prev) => ({ ...prev, specializationId: safeSpecs[0].id }));
      }
      if (safeSpecies.length > 0 && !newOverride.speciesId) {
        setNewOverride((prev) => ({ ...prev, speciesId: safeSpecies[0].id }));
      }
    } catch (err) {
      console.error(err);
      setServices([]);
      setSpecializations([]);
      setSpeciesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createService({
        name: form.name.trim(),
        specializationId: form.specializationId,
        description: form.description.trim(),
        basePrice: form.basePrice,
        baseDurationMin: form.baseDurationMin,
        bufferAfterMin: form.bufferAfterMin,
        isActive: form.isActive,
      });

      setIsModalOpen(false);
      setForm({
        name: '',
        specializationId: specializations[0]?.id || '',
        description: '',
        basePrice: 1500,
        baseDurationMin: 30,
        bufferAfterMin: 10,
        isActive: true,
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setEditForm({
      name: svc.name,
      specializationId: svc.specializationId,
      description: svc.description,
      basePrice: svc.basePrice,
      baseDurationMin: svc.baseDurationMin,
      bufferAfterMin: svc.bufferAfterMin,
      isActive: svc.isActive,
    });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setUpdating(true);
    try {
      await adminApi.updateService(editingService.id, {
        name: editForm.name.trim(),
        specializationId: editForm.specializationId,
        description: editForm.description.trim(),
        basePrice: editForm.basePrice,
        baseDurationMin: editForm.baseDurationMin,
        bufferAfterMin: editForm.bufferAfterMin,
        isActive: editForm.isActive,
      });

      setEditingService(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deletingServiceId) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(deletingServiceId);
      setDeletingServiceId(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Ограничения и цены по видам животных
  const openOverridesModal = async (svc: Service) => {
    setSelectedServiceForSpecies(svc);
    setLoadingSpeciesOverrides(true);
    try {
      const overrides = await clinicApi.getServiceSpecies(svc.id);
      setServiceSpeciesList(Array.isArray(overrides) ? overrides : []);
      setNewOverride({
        speciesId: speciesList[0]?.id || '',
        durationMin: svc.baseDurationMin,
        price: svc.basePrice,
      });
    } catch (err) {
      console.error(err);
      setServiceSpeciesList([]);
    } finally {
      setLoadingSpeciesOverrides(false);
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForSpecies) return;
    setSavingOverride(true);
    try {
      await adminApi.createServiceSpecies(selectedServiceForSpecies.id, {
        speciesId: newOverride.speciesId,
        durationMin: Number(newOverride.durationMin),
        price: Number(newOverride.price),
      });

      const updated = await clinicApi.getServiceSpecies(selectedServiceForSpecies.id);
      setServiceSpeciesList(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (speciesId: string) => {
    if (!selectedServiceForSpecies) return;
    try {
      await adminApi.deleteServiceSpecies(selectedServiceForSpecies.id, speciesId);
      setServiceSpeciesList((prev) => prev.filter((s) => s.speciesId !== speciesId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeciesName.trim()) return;
    setSavingSpecies(true);
    try {
      await adminApi.createSpecies(newSpeciesName.trim());
      setNewSpeciesName('');
      setIsSpeciesModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSpecies(false);
    }
  };

  const handleDeleteSpecies = async (id: string) => {
    try {
      await adminApi.deleteSpecies(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecForm.name.trim()) return;
    setSavingSpec(true);
    try {
      await adminApi.createSpecialization({
        name: newSpecForm.name.trim(),
        description: newSpecForm.description.trim(),
      });
      setNewSpecForm({ name: '', description: '' });
      setIsSpecModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSpec(false);
    }
  };

  const handleDeleteSpec = async (id: string) => {
    try {
      await adminApi.deleteSpecialization(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getSpecName = (id: string) => {
    return specializations.find((s) => s.id === id)?.name || 'Общая практика';
  };

  const getSpeciesName = (id: string) => {
    return speciesList.find((s) => s.id === id)?.name || id;
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Услуги и прейскурант"
      subtitle="Тарифы клиники, продолжительность процедур и справочники видов животных"
      actions={
        activeTab === 'SERVICES' ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="ic" />
            <span>Добавить услугу</span>
          </button>
        ) : activeTab === 'SPECIES' ? (
          <button
            type="button"
            onClick={() => setIsSpeciesModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="ic" />
            <span>Добавить вид</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSpecModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="ic" />
            <span>Добавить специализацию</span>
          </button>
        )
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Вкладки справочников и поиск */}
        <section className="island filters" aria-label="Разделы справочников">
          <div className="segmented" style={{ width: 'auto' }}>
            <button
              type="button"
              className={activeTab === 'SERVICES' ? 'on' : ''}
              onClick={() => setActiveTab('SERVICES')}
            >
              Услуги ({services.length})
            </button>
            <button
              type="button"
              className={activeTab === 'SPECIES' ? 'on' : ''}
              onClick={() => setActiveTab('SPECIES')}
            >
              Виды животных ({speciesList.length})
            </button>
            <button
              type="button"
              className={activeTab === 'SPECIALIZATIONS' ? 'on' : ''}
              onClick={() => setActiveTab('SPECIALIZATIONS')}
            >
              Специализации ({specializations.length})
            </button>
          </div>

          {activeTab === 'SERVICES' && (
            <div className="field" style={{ minWidth: '220px', marginLeft: 'auto' }}>
              <div className="input-icon">
                <Search className="ic" />
                <input
                  className="input input-sm"
                  placeholder="Поиск услуги..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Вкладка 1: Услуги и цены */}
        {activeTab === 'SERVICES' && (
          <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="island-head">
              <span className="island-title">
                <ClipboardList className="ic" />
                <span>Каталог ветеринарных услуг</span>
                <span className="count">Всего: {filtered.length}</span>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={loadData}
                title="Обновить"
              >
                <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px', padding: '16px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
                {filtered.map((svc) => (
                  <div
                    key={svc.id}
                    className="island"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge font-medium text-xs">
                        {getSpecName(svc.specializationId)}
                      </span>
                      <span className="tnum font-bold text-base font-mono">
                        {svc.basePrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm" style={{ margin: 0 }}>{svc.name}</h3>
                      <p className="muted text-xs line-clamp-2 mt-1" style={{ margin: '4px 0 0 0' }}>
                        {svc.description || 'Описание не указано'}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '6px 8px',
                        background: 'var(--island-subtle)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginTop: 'auto',
                      }}
                    >
                      <span className="muted flex items-center gap-1 font-mono text-xs">
                        <Clock className="ic text-slate-400" style={{ width: '13px', height: '13px' }} />
                        {svc.baseDurationMin} мин.
                      </span>
                      <span className={`badge ${svc.isActive ? 'b-completed' : 'b-cancelled'} text-[10px]`}>
                        {svc.isActive ? 'Активна' : 'Скрыта'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', paddingTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openOverridesModal(svc)}
                        style={{ border: '1px solid var(--border)', fontSize: '11px' }}
                      >
                        <Sliders className="ic" style={{ width: '12px', height: '12px' }} />
                        <span>Тарифы по видам</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openEditModal(svc)}
                          title="Редактировать"
                        >
                          <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                          onClick={() => setDeletingServiceId(svc.id)}
                          title="Удалить"
                        >
                          <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ padding: '48px 16px' }}>
                <div className="empty-art">
                  <ClipboardList className="ic" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
                </div>
                <span className="empty-title">Услуги не найдены</span>
                <p className="muted text-xs text-center max-w-sm mt-1">
                  По заданному запросу ничего не найдено.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Вкладка 2: Виды животных */}
        {activeTab === 'SPECIES' && (
          <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="island-head">
              <span className="island-title">
                <PawPrint className="ic" />
                <span>Виды обслуживаемых животных</span>
                <span className="count">Всего: {speciesList.length}</span>
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsSpeciesModalOpen(true)}
              >
                <Plus className="ic" />
                <span>Новый вид</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
              {speciesList.map((spec) => (
                <div
                  key={spec.id}
                  className="island"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span className="font-semibold text-sm">{spec.name}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                    onClick={() => handleDeleteSpecies(spec.id)}
                    title="Удалить вид"
                  >
                    <Trash2 className="ic" style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Вкладка 3: Специализации врачей */}
        {activeTab === 'SPECIALIZATIONS' && (
          <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="island-head">
              <span className="island-title">
                <Tags className="ic" />
                <span>Направления и специализации врачей</span>
                <span className="count">Всего: {specializations.length}</span>
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsSpecModalOpen(true)}
              >
                <Plus className="ic" />
                <span>Новая специализация</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {specializations.map((spec) => (
                <div
                  key={spec.id}
                  className="island"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 className="font-bold text-sm" style={{ margin: 0 }}>{spec.name}</h4>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                      onClick={() => handleDeleteSpec(spec.id)}
                      title="Удалить"
                    >
                      <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                    </button>
                  </div>
                  <p className="muted text-xs line-clamp-2" style={{ margin: 0 }}>
                    {spec.description || 'Описание направления отсутствует'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Модальное окно создания услуги */}
      {isModalOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="add-svc-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="add-svc-title">Добавить услугу</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsModalOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Название услуги</label>
                <input
                  className="input"
                  placeholder="Первичный осмотр терапевта"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field-label">Специализация</label>
                <select
                  className="select"
                  required
                  value={form.specializationId}
                  onChange={(e) => setForm({ ...form, specializationId: e.target.value })}
                >
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Базовая цена (₽)</label>
                  <input
                    type="number"
                    min={0}
                    className="input font-mono"
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Длительность (мин)</label>
                  <input
                    type="number"
                    min={5}
                    className="input font-mono"
                    required
                    value={form.baseDurationMin}
                    onChange={(e) => setForm({ ...form, baseDurationMin: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Описание</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Подробное описание процедуры..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Сохранение...' : 'Сохранить услугу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования услуги */}
      {editingService && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="edit-svc-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="edit-svc-title">Редактирование: {editingService.name}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditingService(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleUpdateService} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Название услуги</label>
                <input
                  className="input"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field-label">Специализация</label>
                <select
                  className="select"
                  required
                  value={editForm.specializationId}
                  onChange={(e) => setEditForm({ ...editForm, specializationId: e.target.value })}
                >
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Базовая цена (₽)</label>
                  <input
                    type="number"
                    min={0}
                    className="input font-mono"
                    required
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Длительность (мин)</label>
                  <input
                    type="number"
                    min={5}
                    className="input font-mono"
                    required
                    value={editForm.baseDurationMin}
                    onChange={(e) => setEditForm({ ...editForm, baseDurationMin: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Описание</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                <span>Услуга активна в каталоге</span>
              </label>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingService(null)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно настройки видов животных для услуги */}
      {selectedServiceForSpecies && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="overrides-title" style={{ maxWidth: '520px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="overrides-title">
                Тарифы по видам: {selectedServiceForSpecies.name}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setSelectedServiceForSpecies(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p className="text-xs muted">
                Переопределение стоимости и длительности услуги для конкретного вида животного (для остальных действует базовый тариф: {selectedServiceForSpecies.basePrice} ₽, {selectedServiceForSpecies.baseDurationMin} мин).
              </p>

              {loadingSpeciesOverrides ? (
                <div className="skeleton" style={{ height: '70px', borderRadius: '8px' }} />
              ) : serviceSpeciesList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {serviceSpeciesList.map((item) => (
                    <div
                      key={item.speciesId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'var(--island-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span className="font-semibold">{getSpeciesName(item.speciesId)}: </span>
                        <span className="tnum font-mono font-medium">{item.price ?? 'Базовая'} ₽, </span>
                        <span className="tnum font-mono muted">{item.durationMin ?? 'Базовая'} мин.</span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                        onClick={() => handleDeleteOverride(item.speciesId)}
                        title="Удалить"
                      >
                        <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted text-xs italic">Для всех видов применяются стандартные базовые параметры.</p>
              )}

              {/* Форма добавления */}
              <form
                onSubmit={handleAddOverride}
                style={{
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <span className="font-semibold text-xs">Задать персональный тариф</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                  <div className="field">
                    <label className="field-label">Вид</label>
                    <select
                      className="select input-sm"
                      value={newOverride.speciesId}
                      onChange={(e) => setNewOverride({ ...newOverride, speciesId: e.target.value })}
                    >
                      {speciesList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Цена (₽)</label>
                    <input
                      type="number"
                      className="input input-sm font-mono"
                      required
                      value={newOverride.price}
                      onChange={(e) => setNewOverride({ ...newOverride, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Время (мин)</label>
                    <input
                      type="number"
                      className="input input-sm font-mono"
                      required
                      value={newOverride.durationMin}
                      onChange={(e) => setNewOverride({ ...newOverride, durationMin: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm self-start"
                  disabled={savingOverride}
                >
                  {savingOverride ? 'Сохранение...' : 'Сохранить тариф'}
                </button>
              </form>
            </div>

            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedServiceForSpecies(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления вида животного */}
      {isSpeciesModalOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="add-species-title" style={{ maxWidth: '400px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="add-species-title">Новый вид животного</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsSpeciesModalOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateSpecies} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Название вида</label>
                <input
                  className="input"
                  placeholder="Собака / Кошка / Птица..."
                  required
                  value={newSpeciesName}
                  onChange={(e) => setNewSpeciesName(e.target.value)}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsSpeciesModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpecies}
                >
                  {savingSpecies ? 'Сохранение...' : 'Добавить вид'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно добавления специализации */}
      {isSpecModalOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="add-spec-title" style={{ maxWidth: '420px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="add-spec-title">Новая специализация</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsSpecModalOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateSpec} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Название направления</label>
                <input
                  className="input"
                  placeholder="Хирургия / Терапия / Офтальмология..."
                  required
                  value={newSpecForm.name}
                  onChange={(e) => setNewSpecForm({ ...newSpecForm, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field-label">Описание направления</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Краткое описание профиля..."
                  value={newSpecForm.description}
                  onChange={(e) => setNewSpecForm({ ...newSpecForm, description: e.target.value })}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsSpecModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpec}
                >
                  {savingSpec ? 'Сохранение...' : 'Добавить специализацию'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно удаления услуги */}
      {deletingServiceId && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="del-svc-title" style={{ maxWidth: '400px' }}>
            <div className="dialog-head">
              <span className="dialog-title text-[var(--accent-red)]" id="del-svc-title">
                Удаление услуги
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setDeletingServiceId(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="text-sm">
                Вы действительно хотите удалить эту услугу из системы?
              </p>
              <div className="dialog-foot" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeletingServiceId(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteService}
                  disabled={deleting}
                >
                  <Trash2 className="ic" />
                  <span>{deleting ? 'Удаление...' : 'Удалить'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
