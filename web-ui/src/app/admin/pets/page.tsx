'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, clinicApi } from '../../../api';
import { Pet, Species, Gender, CreatePetRequest, UpdatePetRequest, User, Vaccination } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Heart,
  Plus,
  Edit2,
  Trash2,
  Search,
  Archive,
  User as UserIcon,
  AlertCircle,
  Syringe,
  ShieldCheck,
  Calendar,
  X,
  RefreshCw,
  PawPrint,
} from 'lucide-react';

export default function AdminPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Параметры фильтрации
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Модальное окно создания питомца
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    ownerId: '',
    speciesId: '',
    gender: 'MALE' as Gender,
    birthDate: '',
    weightKg: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Модальное окно редактирования питомца
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    speciesId: '',
    gender: 'MALE' as Gender,
    birthDate: '',
    weightKg: '',
    notes: '',
    isArchived: false,
  });
  const [updating, setUpdating] = useState(false);

  // Модальное окно удаления питомца
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Модальное окно вакцинаций
  const [selectedPetForVac, setSelectedPetForVac] = useState<Pet | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loadingVac, setLoadingVac] = useState(false);
  const [savingVac, setSavingVac] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);
  const [newVac, setNewVac] = useState({
    name: '',
    administeredOn: new Date().toISOString().substring(0, 10),
    nextDueOn: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const isArchivedParam =
        archivedFilter === 'ACTIVE' ? false : archivedFilter === 'ARCHIVED' ? true : undefined;

      const [petsRes, speciesRes, usersRes] = await Promise.all([
        adminApi.getPets(0, 100, {
          speciesId: speciesFilter || undefined,
          isArchived: isArchivedParam,
        }),
        clinicApi.getSpecies(),
        adminApi.getUsers(0, 100),
      ]);

      const safePets = petsRes?.items ?? (Array.isArray(petsRes) ? petsRes : []);
      const safeSpecies = Array.isArray(speciesRes) ? speciesRes : [];
      const safeClients = usersRes?.items ?? (Array.isArray(usersRes) ? usersRes : []);

      setPets(safePets);
      setSpeciesList(safeSpecies);
      setClients(safeClients);

      if (safeClients.length > 0 && !createForm.ownerId) {
        setCreateForm((prev) => ({
          ...prev,
          ownerId: safeClients[0].id,
          speciesId: safeSpecies[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [speciesFilter, archivedFilter]);

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const payload: CreatePetRequest & { ownerId: string } = {
        name: createForm.name.trim(),
        ownerId: createForm.ownerId,
        speciesId: createForm.speciesId,
        gender: createForm.gender,
        birthDate: createForm.birthDate || null,
        weightKg: createForm.weightKg ? parseFloat(createForm.weightKg) : null,
        notes: createForm.notes.trim() || null,
      };

      await adminApi.createPet(payload);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        ownerId: clients[0]?.id || '',
        speciesId: speciesList[0]?.id || '',
        gender: 'MALE',
        birthDate: '',
        weightKg: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setCreateError(err?.message || 'Не удалось зарегистрировать питомца');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setEditForm({
      name: pet.name,
      speciesId: pet.speciesId,
      gender: pet.gender,
      birthDate: pet.birthDate || '',
      weightKg: pet.weightKg ? pet.weightKg.toString() : '',
      notes: pet.notes || '',
      isArchived: pet.isArchived,
    });
  };

  const handleUpdatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet) return;
    setUpdating(true);

    try {
      const payload: UpdatePetRequest = {
        name: editForm.name.trim(),
        speciesId: editForm.speciesId,
        gender: editForm.gender,
        birthDate: editForm.birthDate || null,
        weightKg: editForm.weightKg ? parseFloat(editForm.weightKg) : null,
        notes: editForm.notes.trim() || null,
        isArchived: editForm.isArchived,
      };

      await adminApi.updatePet(editingPet.id, payload);
      setEditingPet(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePet = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await adminApi.deletePet(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const openVacModal = async (pet: Pet) => {
    setSelectedPetForVac(pet);
    setLoadingVac(true);
    setVacError(null);
    setNewVac({
      name: '',
      administeredOn: new Date().toISOString().substring(0, 10),
      nextDueOn: '',
    });
    try {
      const res = await adminApi.getVaccinations({ petId: pet.id });
      setVaccinations(res.items || []);
    } catch (err) {
      console.error(err);
      setVaccinations([]);
    } finally {
      setLoadingVac(false);
    }
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetForVac) return;
    setVacError(null);

    if (!newVac.name.trim()) {
      setVacError('Укажите наименование вакцины');
      return;
    }
    if (!newVac.administeredOn) {
      setVacError('Укажите дату вакцинации');
      return;
    }
    const today = new Date().toISOString().substring(0, 10);
    if (newVac.administeredOn > today) {
      setVacError('Дата вакцинации не может быть в будущем');
      return;
    }
    if (newVac.nextDueOn && newVac.nextDueOn <= newVac.administeredOn) {
      setVacError('Дата ревакцинации должна быть позже даты введения');
      return;
    }

    setSavingVac(true);
    try {
      await adminApi.createVaccination({
        petId: selectedPetForVac.id,
        name: newVac.name.trim(),
        administeredOn: newVac.administeredOn,
        nextDueOn: newVac.nextDueOn || null,
      });

      const res = await adminApi.getVaccinations({ petId: selectedPetForVac.id });
      setVaccinations(res.items || []);
      setNewVac({
        name: '',
        administeredOn: today,
        nextDueOn: '',
      });
    } catch (err: any) {
      setVacError(err?.message || 'Не удалось добавить вакцинацию');
    } finally {
      setSavingVac(false);
    }
  };

  const handleDeleteVaccination = async (id: string) => {
    if (!selectedPetForVac) return;
    try {
      await adminApi.deleteVaccination(id);
      setVaccinations((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getSpeciesName = (speciesId: string) => {
    const s = speciesList.find((item) => item.id === speciesId);
    return s?.name || 'Питомец';
  };

  const getOwnerName = (ownerId: string) => {
    const c = clients.find((item) => item.id === ownerId);
    return c?.fullName || `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Владелец';
  };

  const filteredPets = pets.filter((pet) => {
    const name = pet.name.toLowerCase();
    const owner = getOwnerName(pet.ownerId).toLowerCase();
    const spec = getSpeciesName(pet.speciesId).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || owner.includes(q) || spec.includes(q);
  });

  return (
    <AppShell
      title="Пациенты"
      subtitle="Единая база животных, медицинские карты и паспорта вакцинации"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="ic" />
          <span>Добавить питомца</span>
        </button>
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Панель фильтрации пациентов */}
        <section className="island filters" aria-label="Фильтры пациентов">
          <div className="field" style={{ minWidth: '240px', flex: 1 }}>
            <span className="field-label">Поиск</span>
            <div className="input-icon">
              <Search className="ic" />
              <input
                className="input input-sm"
                placeholder="Кличка, владелец, вид..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Вид животного</span>
            <select
              className="select input-sm"
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
            >
              <option value="">Все виды</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <span className="field-label">Статус</span>
            <div className="chips">
              {[
                { val: 'ALL', label: 'Все' },
                { val: 'ACTIVE', label: 'Активные' },
                { val: 'ARCHIVED', label: 'В архиве' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  className={`chip ${archivedFilter === chip.val ? 'on' : ''}`}
                  onClick={() => setArchivedFilter(chip.val as any)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {(search || speciesFilter || archivedFilter !== 'ALL') && (
            <div className="field" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
              <span className="field-label">&nbsp;</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setSpeciesFilter('');
                  setArchivedFilter('ALL');
                }}
              >
                <X className="ic" style={{ width: '13px', height: '13px' }} />
                <span>Сбросить</span>
              </button>
            </div>
          )}
        </section>

        {/* Список пациентов клиники */}
        <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="island-head">
            <span className="island-title">
              <PawPrint className="ic" />
              <span>Реестр пациентов</span>
              <span className="count">Всего: {filteredPets.length}</span>
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
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : filteredPets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
              {filteredPets.map((pet) => {
                const specName = getSpeciesName(pet.speciesId);
                const ownerName = getOwnerName(pet.ownerId);

                return (
                  <div
                    key={pet.id}
                    className="island"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="avatar"
                          style={{
                            width: '38px',
                            height: '38px',
                            fontWeight: 700,
                            fontSize: '14px',
                            background: 'var(--primary)',
                            color: 'var(--primary-text)',
                            borderRadius: '10px',
                          }}
                        >
                          {pet.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm" style={{ margin: 0 }}>{pet.name}</h3>
                          <span className="muted text-xs font-medium">{specName}</span>
                        </div>
                      </div>

                      <span className={`badge ${pet.isArchived ? 'b-cancelled' : 'b-completed'}`}>
                        {pet.isArchived ? 'В архиве' : 'Активен'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'var(--island-subtle)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserIcon className="ic text-slate-400" style={{ width: '13px', height: '13px' }} />
                        <span className="muted">Владелец:</span>
                        <span className="font-medium">{ownerName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                        <span>Пол: <strong className="font-medium">{pet.gender === 'MALE' ? 'Самец' : 'Самка'}</strong></span>
                        <span>Вес: <strong className="tnum font-mono">{pet.weightKg ? `${pet.weightKg} кг` : '—'}</strong></span>
                      </div>
                      {pet.birthDate && (
                        <span className="muted text-xs">
                          Родился: {new Date(pet.birthDate).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {pet.notes && (
                        <p className="muted italic text-xs line-clamp-2" style={{ margin: 0, borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                          «{pet.notes}»
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: 'auto', paddingTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openVacModal(pet)}
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <Syringe className="ic" style={{ width: '13px', height: '13px' }} />
                        <span>Прививки</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => openEditModal(pet)}
                        title="Редактировать"
                      >
                        <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                        onClick={() => setDeletingId(pet.id)}
                        title="Удалить"
                      >
                        <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ padding: '48px 16px' }}>
              <div className="empty-art">
                <PawPrint className="ic" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
              </div>
              <span className="empty-title">Питомцы не найдены</span>
              <p className="muted text-xs text-center max-w-sm mt-1">
                По заданным критериям фильтрации питомцы не найдены.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-3"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="ic" />
                <span>Добавить питомца</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно добавления питомца */}
      {isCreateOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="create-pet-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="create-pet-title">Добавить питомца</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {createError && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="ic shrink-0" />
                  <span className="text-xs">{createError}</span>
                </div>
              )}

              <div className="field">
                <label className="field-label">Владелец</label>
                <select
                  className="select"
                  required
                  value={createForm.ownerId}
                  onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
                >
                  <option value="" disabled>Выберите владельца...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || `${c.firstName} ${c.lastName}`} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Кличка</label>
                <input
                  className="input"
                  required
                  placeholder="Барсик"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Вид животного</label>
                  <select
                    className="select"
                    required
                    value={createForm.speciesId}
                    onChange={(e) => setCreateForm({ ...createForm, speciesId: e.target.value })}
                  >
                    {speciesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Пол</label>
                  <select
                    className="select"
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value as Gender })}
                  >
                    <option value="MALE">Самец</option>
                    <option value="FEMALE">Самка</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Дата рождения</label>
                  <input
                    type="date"
                    className="input"
                    value={createForm.birthDate}
                    onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input font-mono"
                    placeholder="4.5"
                    value={createForm.weightKg}
                    onChange={(e) => setCreateForm({ ...createForm, weightKg: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Особенности / Анамнез</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Хронические заболевания, аллергии..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Регистрация...' : 'Зарегистрировать питомца'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования данных питомца */}
      {editingPet && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="edit-pet-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="edit-pet-title">Редактирование: {editingPet.name}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditingPet(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleUpdatePet} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Кличка</label>
                <input
                  className="input"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Вид животного</label>
                  <select
                    className="select"
                    required
                    value={editForm.speciesId}
                    onChange={(e) => setEditForm({ ...editForm, speciesId: e.target.value })}
                  >
                    {speciesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Пол</label>
                  <select
                    className="select"
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as Gender })}
                  >
                    <option value="MALE">Самец</option>
                    <option value="FEMALE">Самка</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Дата рождения</label>
                  <input
                    type="date"
                    className="input"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input font-mono"
                    value={editForm.weightKg}
                    onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Особенности / Заметки</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={editForm.isArchived}
                  onChange={(e) => setEditForm({ ...editForm, isArchived: e.target.checked })}
                />
                <span>Архивировать питомца (сохранить историю, скрыть из активных)</span>
              </label>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingPet(null)}
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

      {/* Подтверждение удаления питомца */}
      {deletingId && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="del-pet-title" style={{ maxWidth: '420px' }}>
            <div className="dialog-head">
              <span className="dialog-title text-[var(--accent-red)]" id="del-pet-title">
                Удаление питомца
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setDeletingId(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="text-sm">
                Вы действительно хотите удалить данного питомца из клиники?
              </p>
              <p className="text-xs muted">
                Все связанные данные и история посещений будут удалены без возможности восстановления.
              </p>

              <div className="dialog-foot" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeletingId(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeletePet}
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

      {/* Паспорт вакцинаций питомца */}
      {selectedPetForVac && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="vac-title" style={{ maxWidth: '540px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="vac-title">
                Вакцинации: {selectedPetForVac.name}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setSelectedPetForVac(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vacError && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="ic shrink-0" />
                  <span className="text-xs">{vacError}</span>
                </div>
              )}

              {/* Список введённых вакцин */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="font-semibold text-xs muted uppercase tracking-wide">
                  История прививок
                </span>

                {loadingVac ? (
                  <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />
                ) : vaccinations.length === 0 ? (
                  <p className="muted text-xs italic" style={{ padding: '8px', background: 'var(--island-subtle)', borderRadius: '6px' }}>
                    Записей о вакцинации пока нет.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                    {vaccinations.map((vac) => {
                      const today = new Date().toISOString().substring(0, 10);
                      const isOverdue = vac.nextDueOn && vac.nextDueOn <= today;

                      return (
                        <div
                          key={vac.id}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="font-semibold">{vac.name || vac.vaccineName}</span>
                              {vac.nextDueOn && (
                                <span className={`badge ${isOverdue ? 'due-over' : 'due-later'} text-[10px]`}>
                                  {isOverdue ? 'Требуется ревакцинация' : 'Вакцинация действует'}
                                </span>
                              )}
                            </div>
                            <span className="muted text-xs tnum font-mono">
                              Введена: {vac.administeredOn || vac.administeredAt || '—'}
                              {vac.nextDueOn && ` · До: ${vac.nextDueOn}`}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                            onClick={() => handleDeleteVaccination(vac.id)}
                            title="Удалить запись"
                          >
                            <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Форма добавления вакцины */}
              <form
                onSubmit={handleAddVaccination}
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
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Syringe className="ic" style={{ width: '13px', height: '13px' }} />
                  <span>Добавить вакцинацию</span>
                </span>

                <div className="field">
                  <label className="field-label">Препарат</label>
                  <input
                    className="input input-sm"
                    required
                    placeholder="Нобивак DHPPi, Мультифел..."
                    value={newVac.name}
                    onChange={(e) => setNewVac({ ...newVac, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div className="field">
                    <label className="field-label">Дата введения</label>
                    <input
                      type="date"
                      className="input input-sm font-mono"
                      required
                      max={new Date().toISOString().substring(0, 10)}
                      value={newVac.administeredOn}
                      onChange={(e) => setNewVac({ ...newVac, administeredOn: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Ревакцинация до</label>
                    <input
                      type="date"
                      className="input input-sm font-mono"
                      value={newVac.nextDueOn}
                      onChange={(e) => setNewVac({ ...newVac, nextDueOn: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm self-start"
                  disabled={savingVac}
                >
                  {savingVac ? 'Сохранение...' : 'Записать вакцинацию'}
                </button>
              </form>
            </div>

            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedPetForVac(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
