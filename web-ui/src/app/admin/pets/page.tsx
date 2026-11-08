'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, clinicApi } from '../../../api';
import {
  Pet,
  Species,
  Gender,
  CreatePetRequest,
  UpdatePetRequest,
  User,
  Vaccination,
  Appointment,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  PawPrint,
  Plus,
  Edit2,
  Trash2,
  Archive,
  Search,
  Syringe,
  Calendar,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

export default function AdminPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Master-Detail selection
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccinations'>('overview');
  const [petAppointments, setPetAppointments] = useState<Appointment[]>([]);
  const [petVaccinations, setPetVaccinations] = useState<Vaccination[]>([]);

  // Create Modal
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

  // Edit Modal / Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    speciesId: '',
    gender: 'MALE' as Gender,
    birthDate: '',
    weightKg: '',
    notes: '',
    isArchived: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Vaccination Modal
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);
  const [vacForm, setVacForm] = useState({
    name: '',
    administeredOn: new Date().toISOString().substring(0, 10),
    nextDueOn: '',
  });
  const [savingVac, setSavingVac] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const isArchivedParam =
        statusFilter === 'ACTIVE' ? false : statusFilter === 'ARCHIVED' ? true : undefined;

      const [petsRes, speciesRes, usersRes] = await Promise.all([
        adminApi.getPets(0, 100, {
          speciesId: speciesFilter !== 'ALL' ? speciesFilter : undefined,
          isArchived: isArchivedParam,
        }).catch(() => ({ items: [] })),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        adminApi.getUsers(0, 100).catch(() => ({ items: [] })),
      ]);

      const safePets = petsRes?.items || [];
      const safeSpecies = Array.isArray(speciesRes) ? speciesRes : [];
      const safeUsers = usersRes?.items || [];

      setPets(safePets);
      setSpeciesList(safeSpecies);
      setUsers(safeUsers);

      if (selectedPet) {
        const updated = safePets.find((p: Pet) => p.id === selectedPet.id);
        if (updated) setSelectedPet(updated);
      }
    } catch (err) {
      console.error('Failed to load pets data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [speciesFilter, statusFilter]);

  // When a pet is selected, load its appointments and vaccinations
  useEffect(() => {
    if (!selectedPet) return;

    Promise.all([
      adminApi.getAppointments(0, 50, { petId: selectedPet.id }).catch(() => ({ items: [] })),
      adminApi.getVaccinations({ petId: selectedPet.id }).catch(() => ({ items: [] })),
    ]).then(([apptsRes, vacRes]) => {
      setPetAppointments(apptsRes?.items || []);
      setPetVaccinations(vacRes?.items || []);
    });
  }, [selectedPet]);

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return '—';
    const user = users.find((u) => u.id === ownerId);
    return user ? user.fullName : '—';
  };

  const getSpeciesName = (spId?: string) => {
    if (!spId) return '—';
    const sp = speciesList.find((s) => s.id === spId);
    return sp ? sp.name : '—';
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} г. ${months > 0 ? `${months} м.` : ''}`.trim();
    if (months > 0) return `${months} мес.`;
    return 'Меньше месяца';
  };

  const handleToggleArchive = async () => {
    if (!selectedPet) return;
    try {
      await adminApi.updatePet(selectedPet.id, {
        isArchived: !selectedPet.isArchived,
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка обновления статуса питомца');
    }
  };

  const handleDeletePet = async () => {
    if (!selectedPet) return;
    setDeleting(true);
    try {
      await adminApi.deletePet(selectedPet.id);
      setIsDeleteConfirmOpen(false);
      setSelectedPet(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении питомца');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.speciesId || !createForm.ownerId) {
      setCreateError('Заполните обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload: CreatePetRequest = {
        name: createForm.name,
        speciesId: createForm.speciesId,
        ownerId: createForm.ownerId,
        gender: createForm.gender,
        birthDate: createForm.birthDate || null,
        weightKg: createForm.weightKg ? parseFloat(createForm.weightKg) : null,
        notes: createForm.notes || null,
      };
      const created = await adminApi.createPet(payload);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        ownerId: '',
        speciesId: '',
        gender: 'MALE',
        birthDate: '',
        weightKg: '',
        notes: '',
      });
      await loadData();
      if (created) setSelectedPet(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Ошибка создания питомца');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = () => {
    if (!selectedPet) return;
    setEditForm({
      name: selectedPet.name,
      speciesId: selectedPet.speciesId,
      gender: selectedPet.gender,
      birthDate: selectedPet.birthDate || '',
      weightKg: selectedPet.weightKg != null ? String(selectedPet.weightKg) : '',
      notes: selectedPet.notes || '',
      isArchived: selectedPet.isArchived,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    setSavingEdit(true);
    try {
      const payload: UpdatePetRequest = {
        name: editForm.name,
        speciesId: editForm.speciesId,
        gender: editForm.gender,
        birthDate: editForm.birthDate || null,
        weightKg: editForm.weightKg ? parseFloat(editForm.weightKg) : null,
        notes: editForm.notes || null,
        isArchived: editForm.isArchived,
      };
      await adminApi.updatePet(selectedPet.id, payload);
      setIsEditOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка обновления питомца');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !vacForm.name) return;
    setSavingVac(true);
    try {
      await adminApi.createVaccination({
        petId: selectedPet.id,
        name: vacForm.name,
        administeredOn: vacForm.administeredOn,
        nextDueOn: vacForm.nextDueOn || null,
      });
      setIsAddVacOpen(false);
      setVacForm({
        name: '',
        administeredOn: new Date().toISOString().substring(0, 10),
        nextDueOn: '',
      });
      const vacs = await adminApi.getVaccinations({ petId: selectedPet.id });
      setPetVaccinations(vacs?.items || []);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка добавления прививки');
    } finally {
      setSavingVac(false);
    }
  };

  // Filtered pets
  const filteredPets = pets.filter((p) => {
    if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const pName = p.name.toLowerCase();
      const oName = getOwnerName(p.ownerId).toLowerCase();
      if (!pName.includes(q) && !oName.includes(q)) return false;
    }
    return true;
  });

  return (
    <AppShell crumbGroup="Клиника" crumb="Питомцы">
      <div className="content-row">
        {/* Left Column: Filters + Table */}
        <div className="content-col grow">
          <section className="island filters" aria-label="Фильтры питомцев">
            <div className="field">
              <span className="field-label">Вид</span>
              <div className="dd">
                <select
                  className="select dd-btn"
                  value={speciesFilter}
                  onChange={(e) => setSpeciesFilter(e.target.value)}
                >
                  <option value="ALL">Все виды</option>
                  {speciesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field" style={{ width: 'auto' }}>
              <span className="field-label">Пол</span>
              <div className="seg">
                <button
                  type="button"
                  className={`seg-item ${genderFilter === 'ALL' ? 'on' : ''}`}
                  onClick={() => setGenderFilter('ALL')}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={`seg-item ${genderFilter === 'MALE' ? 'on' : ''}`}
                  onClick={() => setGenderFilter('MALE')}
                >
                  Самец
                </button>
                <button
                  type="button"
                  className={`seg-item ${genderFilter === 'FEMALE' ? 'on' : ''}`}
                  onClick={() => setGenderFilter('FEMALE')}
                >
                  Самка
                </button>
              </div>
            </div>

            <div className="field" style={{ width: 200 }}>
              <span className="field-label">Поиск</span>
              <div className="input-icon">
                <Search size={14} className="ic" />
                <input
                  type="text"
                  className="input"
                  placeholder="Кличка или владелец…"
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
                if (speciesList.length > 0 && !createForm.speciesId) {
                  setCreateForm((prev) => ({
                    ...prev,
                    speciesId: speciesList[0].id,
                    ownerId: users[0]?.id || '',
                  }));
                }
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              Добавить питомца
            </button>
          </section>

          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <PawPrint size={18} />
                Питомцы <span className="count">Найдено: {filteredPets.length}</span>
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable"
                style={
                  {
                    '--cols': '1.2fr 0.8fr 0.7fr 0.8fr 0.7fr 1.3fr 0.7fr',
                    minWidth: '820px',
                  } as React.CSSProperties
                }
              >
                <div className="thead">
                  <span>Кличка</span>
                  <span>Вид</span>
                  <span>Пол</span>
                  <span>Возраст</span>
                  <span>Вес</span>
                  <span>Владелец</span>
                  <span>Статус</span>
                </div>

                {filteredPets.map((p) => {
                  const isSelected = selectedPet?.id === p.id;
                  const age = calculateAge(p.birthDate);
                  const weight = p.weightKg != null ? `${String(p.weightKg).replace('.', ',')} кг` : '—';

                  return (
                    <button
                      key={p.id}
                      className={`trow ${isSelected ? 'sel' : ''}`}
                      onClick={() => setSelectedPet(p)}
                    >
                      <span className="pet-cell">
                        <span className={`t-ava sm tone-${p.speciesId}`}>
                          <PawPrint size={14} />
                        </span>
                        <span className="cell-main">{p.name}</span>
                      </span>
                      <span>{getSpeciesName(p.speciesId)}</span>
                      <span>{p.gender === 'MALE' ? 'Самец' : 'Самка'}</span>
                      <span className="tnum">{age}</span>
                      <span className="tnum">{weight}</span>
                      <span className="muted">{getOwnerName(p.ownerId)}</span>
                      <span>
                        <span className={`badge ${p.isArchived ? 'badge-outline' : 'badge-accent'}`}>
                          {p.isArchived ? 'Архив' : 'Активен'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredPets.length === 0 && !loading && (
                <div className="empty">
                  <span className="empty-title">Питомцы не найдены</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Master-Detail Island (460px) */}
        {selectedPet && (
          <section className="island detail-island" style={{ width: 460 }} aria-label="Питомец">
            <div className="island-head">
              <div className="row">
                <span className="pet-ava">
                  <PawPrint size={20} />
                </span>
                <div className="col" style={{ gap: 0 }}>
                  <span className="h2">{selectedPet.name}</span>
                  <span className="cell-sub">
                    {getSpeciesName(selectedPet.speciesId)} ·{' '}
                    {selectedPet.gender === 'MALE' ? 'Самец' : 'Самка'} ·{' '}
                    {calculateAge(selectedPet.birthDate)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedPet(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Actions Row */}
            <div className="row wrap" style={{ gap: 6, padding: '0 16px 12px' }}>
              <button className="btn btn-outline btn-sm" onClick={openEditDialog}>
                <Edit2 size={14} />
                Изменить
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleToggleArchive}>
                <Archive size={14} />
                {selectedPet.isArchived ? 'Вернуть из архива' : 'В архив'}
              </button>
              <button
                className="btn btn-destructive-outline btn-sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                <Trash2 size={14} />
                Удалить
              </button>
            </div>

            {/* Tabs Header */}
            <div className="tabs-line">
              <button
                className={`tab-line ${activeTab === 'overview' ? 'on' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Обзор
              </button>
              <button
                className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                Записи <span className="small muted">{petAppointments.length}</span>
              </button>
              <button
                className={`tab-line ${activeTab === 'vaccinations' ? 'on' : ''}`}
                onClick={() => setActiveTab('vaccinations')}
              >
                Прививки <span className="small muted">{petVaccinations.length}</span>
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: 14 }}>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="col" style={{ gap: 14 }}>
                  <dl className="kv" style={{ margin: 0 }}>
                    <dt>Владелец</dt>
                    <dd>{getOwnerName(selectedPet.ownerId)}</dd>
                    <dt>Вид</dt>
                    <dd>{getSpeciesName(selectedPet.speciesId)}</dd>
                    <dt>Пол</dt>
                    <dd>{selectedPet.gender === 'MALE' ? 'Самец' : 'Самка'}</dd>
                    <dt>Дата рождения</dt>
                    <dd className="tnum">{selectedPet.birthDate || 'Не указана'}</dd>
                    <dt>Вес</dt>
                    <dd className="tnum">
                      {selectedPet.weightKg != null
                        ? `${String(selectedPet.weightKg).replace('.', ',')} кг`
                        : '—'}
                    </dd>
                    <dt>Заметки</dt>
                    <dd>{selectedPet.notes || '—'}</dd>
                    <dt>Статус</dt>
                    <dd>{selectedPet.isArchived ? 'В архиве' : 'Активен'}</dd>
                  </dl>
                </div>
              )}

              {/* Tab 2: Appointments */}
              {activeTab === 'appointments' && (
                <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                  {petAppointments.map((a) => {
                    const d = new Date(a.startAt);
                    const dd = d.getDate();
                    const mon = d.toLocaleDateString('ru-RU', { month: 'short' });
                    const time = d.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={a.id} className="lrow">
                        <span className="datebox">
                          <b>{dd}</b>
                          <span>{mon}</span>
                        </span>
                        <span className="col" style={{ gap: 1 }}>
                          <span className="cell-main">{a.service?.name || 'Услуга'}</span>
                          <span className="cell-sub">{time}</span>
                        </span>
                        <span className={`badge st badge-${a.status}`}>{a.status}</span>
                      </div>
                    );
                  })}

                  {petAppointments.length === 0 && (
                    <div className="empty" style={{ padding: 24 }}>
                      Записей нет
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Vaccinations */}
              {activeTab === 'vaccinations' && (
                <div className="col" style={{ gap: 6 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start', marginBottom: 8 }}
                    onClick={() => setIsAddVacOpen(true)}
                  >
                    <Syringe size={14} />
                    Внести прививку
                  </button>

                  <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                    {petVaccinations.map((v) => (
                      <div key={v.id} className="lrow">
                        <span
                          className="pet-ava"
                          style={{ width: 36, height: 36, borderRadius: 10 }}
                        >
                          <Syringe size={16} />
                        </span>
                        <span className="col" style={{ gap: 1 }}>
                          <span className="cell-main">{v.name}</span>
                          <span className="cell-sub">Введена {v.administeredOn}</span>
                        </span>
                        {v.nextDueOn && (
                          <span className="badge badge-accent">до {v.nextDueOn}</span>
                        )}
                      </div>
                    ))}

                    {petVaccinations.length === 0 && (
                      <div className="empty" style={{ padding: 24 }}>
                        Прививок нет
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal: Create Pet */}
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
              <span className="dialog-title">Добавить питомца</span>
              <span className="dialog-desc">Регистрация питомца за клиентом клиники</span>
            </div>

            <form onSubmit={handleCreateSubmit} className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="field-label">
                  Владелец <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.ownerId}
                  onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
                  required
                >
                  <option value="">Выберите владельца…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="cr-pname">
                    Кличка <span className="req">*</span>
                  </label>
                  <input
                    id="cr-pname"
                    className="input"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <span className="field-label">
                    Вид <span className="req">*</span>
                  </span>
                  <select
                    className="select"
                    value={createForm.speciesId}
                    onChange={(e) => setCreateForm({ ...createForm, speciesId: e.target.value })}
                    required
                  >
                    <option value="">Выберите вид…</option>
                    {speciesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <span className="field-label">Пол</span>
                  <div className="seg">
                    <button
                      type="button"
                      className={`seg-item ${createForm.gender === 'MALE' ? 'on' : ''}`}
                      onClick={() => setCreateForm({ ...createForm, gender: 'MALE' })}
                    >
                      Самец
                    </button>
                    <button
                      type="button"
                      className={`seg-item ${createForm.gender === 'FEMALE' ? 'on' : ''}`}
                      onClick={() => setCreateForm({ ...createForm, gender: 'FEMALE' })}
                    >
                      Самка
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="cr-pweight">
                    Вес, кг
                  </label>
                  <input
                    id="cr-pweight"
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    value={createForm.weightKg}
                    onChange={(e) => setCreateForm({ ...createForm, weightKg: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cr-pbirth">
                    Дата рождения
                  </label>
                  <input
                    id="cr-pbirth"
                    type="date"
                    className="input"
                    value={createForm.birthDate}
                    onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cr-pnotes">
                    Заметки
                  </label>
                  <textarea
                    id="cr-pnotes"
                    className="textarea"
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
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
                  {creating ? 'Создание…' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pet */}
      {isEditOpen && selectedPet && (
        <div
          className="overlay"
          onClick={() => setIsEditOpen(false)}
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
              <span className="dialog-title">Редактировать питомца</span>
              <span className="dialog-desc">Изменение данных «{selectedPet.name}»</span>
            </div>

            <form onSubmit={handleEditSubmit} className="col" style={{ gap: 14 }}>
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="ed-pname">
                    Кличка <span className="req">*</span>
                  </label>
                  <input
                    id="ed-pname"
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <span className="field-label">
                    Вид <span className="req">*</span>
                  </span>
                  <select
                    className="select"
                    value={editForm.speciesId}
                    onChange={(e) => setEditForm({ ...editForm, speciesId: e.target.value })}
                    required
                  >
                    {speciesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <span className="field-label">Пол</span>
                  <div className="seg">
                    <button
                      type="button"
                      className={`seg-item ${editForm.gender === 'MALE' ? 'on' : ''}`}
                      onClick={() => setEditForm({ ...editForm, gender: 'MALE' })}
                    >
                      Самец
                    </button>
                    <button
                      type="button"
                      className={`seg-item ${editForm.gender === 'FEMALE' ? 'on' : ''}`}
                      onClick={() => setEditForm({ ...editForm, gender: 'FEMALE' })}
                    >
                      Самка
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="ed-pweight">
                    Вес, кг
                  </label>
                  <input
                    id="ed-pweight"
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    value={editForm.weightKg}
                    onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="ed-pbirth">
                    Дата рождения
                  </label>
                  <input
                    id="ed-pbirth"
                    type="date"
                    className="input"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="ed-pnotes">
                    Заметки
                  </label>
                  <textarea
                    id="ed-pnotes"
                    className="textarea"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Vaccination */}
      {isAddVacOpen && selectedPet && (
        <div
          className="overlay"
          onClick={() => setIsAddVacOpen(false)}
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
            style={{ width: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Внести прививку</span>
              <span className="dialog-desc">Запись вакцинации для «{selectedPet.name}»</span>
            </div>

            <form onSubmit={handleAddVaccination} className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="vac-name">
                  Название вакцины <span className="req">*</span>
                </label>
                <input
                  id="vac-name"
                  className="input"
                  placeholder="Нобивак DHPPi…"
                  value={vacForm.name}
                  onChange={(e) => setVacForm({ ...vacForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="vac-adm">
                    Дата введения <span className="req">*</span>
                  </label>
                  <input
                    id="vac-adm"
                    type="date"
                    className="input"
                    value={vacForm.administeredOn}
                    onChange={(e) => setVacForm({ ...vacForm, administeredOn: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="vac-due">
                    Следующая дата
                  </label>
                  <input
                    id="vac-due"
                    type="date"
                    className="input"
                    value={vacForm.nextDueOn}
                    onChange={(e) => setVacForm({ ...vacForm, nextDueOn: e.target.value })}
                  />
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddVacOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingVac}
                >
                  {savingVac ? 'Сохранение…' : 'Внести'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedPet && (
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
              <span className="dialog-title">Удалить питомца?</span>
              <span className="dialog-desc">
                Питомец «{selectedPet.name}» будет безвозвратно удалён из базы клиники.
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
                onClick={handleDeletePet}
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
