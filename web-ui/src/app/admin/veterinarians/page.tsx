'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, clinicApi } from '../../../api';
import {
  Veterinarian,
  User,
  Specialization,
  Species,
  WorkSchedule,
  ScheduleException,
  DayOfWeek,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Stethoscope,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

const DOW_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
};

const DOW_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function AdminVeterinariansPage() {
  const router = useRouter();
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetPermMap, setVetPermMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSpec, setFilterSpec] = useState<string>('ALL');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');

  // Selected Vet for Master-Detail right side panel
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'species' | 'schedule' | 'exceptions'>('profile');

  // Detail panel state for selected vet
  const [editForm, setEditForm] = useState({
    specializationId: '',
    experienceYears: 1,
    isActive: true,
    photoUrl: '',
    bio: '',
  });
  const [permittedSpeciesIds, setPermittedSpeciesIds] = useState<string[]>([]);
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);
  const [savingVet, setSavingVet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    specializationId: '',
    bio: '',
    photoUrl: '',
    experienceYears: 3,
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vetsData, usersData, specsData, speciesData] = await Promise.all([
        adminApi.getVeterinarians().catch(() => [] as Veterinarian[]),
        adminApi.getUsers(0, 100, 'VETERINARIAN').catch(() => ({ items: [] as User[], totalElements: 0, totalPages: 0, page: 0, size: 100 })),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      const vets = Array.isArray(vetsData) ? vetsData : [];
      setVeterinarians(vets);
      setUsers(usersData?.items || []);
      setSpecializations(Array.isArray(specsData) ? specsData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);

      // Load species permissions for all vets
      const permPromises = vets.map(async (v: Veterinarian) => {
        try {
          const perms = await clinicApi.getVetSpeciesPermissions(v.id);
          return { vetId: v.id, speciesIds: (perms || []).map((p) => p.speciesId) };
        } catch {
          return { vetId: v.id, speciesIds: [] };
        }
      });
      const permsResults = await Promise.all(permPromises);
      const permMap: Record<string, string[]> = {};
      permsResults.forEach((r) => {
        permMap[r.vetId] = r.speciesIds;
      });
      setVetPermMap(permMap);

      if (selectedVet) {
        const updated = vets.find((v: Veterinarian) => v.id === selectedVet.id);
        if (updated) {
          setSelectedVet(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load veterinarians data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a vet is selected, load their details, schedules, and exceptions
  useEffect(() => {
    if (!selectedVet) return;

    setEditForm({
      specializationId: selectedVet.specializationId || '',
      experienceYears: selectedVet.experienceYears || 0,
      isActive: selectedVet.isActive,
      photoUrl: selectedVet.photoUrl || '',
      bio: selectedVet.bio || '',
    });
    setPermittedSpeciesIds(vetPermMap[selectedVet.id] || []);
    setSaveSuccess(false);
    setErrorMessage(null);

    // Fetch schedules, exceptions, and permissions for selected vet
    Promise.all([
      clinicApi.getWorkSchedules(selectedVet.id).catch(() => [] as WorkSchedule[]),
      clinicApi.getScheduleExceptions(selectedVet.id).catch(() => [] as ScheduleException[]),
      clinicApi.getVetSpeciesPermissions(selectedVet.id).catch(() => []),
    ]).then(([schedRes, excRes, permsRes]) => {
      setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
      setVetExceptions(Array.isArray(excRes) ? excRes : []);
      const spIds = (permsRes || []).map((p: any) => p.speciesId);
      setPermittedSpeciesIds(spIds);
      setVetPermMap((prev) => ({ ...prev, [selectedVet.id]: spIds }));
    });
  }, [selectedVet]);

  const handleSelectVet = (vet: Veterinarian) => {
    if (selectedVet?.id === vet.id) {
      return;
    }
    setSelectedVet(vet);
  };

  const handleSaveProfile = async () => {
    if (!selectedVet) return;
    setSavingVet(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateVeterinarian(selectedVet.id, {
        bio: editForm.bio,
        photoUrl: editForm.photoUrl,
        experienceYears: Number(editForm.experienceYears),
        isActive: editForm.isActive,
        specializationId: editForm.specializationId || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Ошибка при сохранении профиля врача');
    } finally {
      setSavingVet(false);
    }
  };

  const handleToggleSpeciesPermission = async (speciesId: string) => {
    if (!selectedVet) return;
    const isGranted = permittedSpeciesIds.includes(speciesId);
    try {
      if (isGranted) {
        await adminApi.revokeVetSpeciesPermission(selectedVet.id, speciesId);
        const next = permittedSpeciesIds.filter((id) => id !== speciesId);
        setPermittedSpeciesIds(next);
        setVetPermMap((prev) => ({ ...prev, [selectedVet.id]: next }));
      } else {
        await adminApi.grantVetSpeciesPermission(selectedVet.id, speciesId);
        const next = [...permittedSpeciesIds, speciesId];
        setPermittedSpeciesIds(next);
        setVetPermMap((prev) => ({ ...prev, [selectedVet.id]: next }));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Не удалось изменить допуск к виду');
    }
  };

  const handleDeleteVet = async () => {
    if (!selectedVet) return;
    setDeleting(true);
    try {
      await adminApi.deleteVeterinarian(selectedVet.id);
      setIsDeleteConfirmOpen(false);
      setSelectedVet(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении профиля врача');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.userId || !createForm.specializationId) {
      setCreateError('Выберите пользователя и специализацию');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createVeterinarian({
        userId: createForm.userId,
        specializationId: createForm.specializationId,
        bio: createForm.bio,
        photoUrl: createForm.photoUrl,
        experienceYears: Number(createForm.experienceYears),
        isActive: createForm.isActive,
      });
      setIsCreateOpen(false);
      setCreateForm({
        userId: '',
        specializationId: '',
        bio: '',
        photoUrl: '',
        experienceYears: 3,
        isActive: true,
      });
      await loadData();
      if (created) {
        setSelectedVet(created);
      }
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Не удалось создать профиль врача');
    } finally {
      setCreating(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.fullName : `Врач (${userId.slice(0, 8)})`;
  };

  const getUserInitials = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return 'ВР';
    const parts = (user.fullName || '').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] ? parts[0].slice(0, 2) : 'ВР').toUpperCase();
  };

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || '—';
  };

  const getSpecName = (specId?: string) => {
    if (!specId) return 'Не указана';
    const s = specializations.find((sp) => sp.id === specId);
    return s ? s.name : 'Специализация';
  };

  // Filtered vets
  const filteredVets = veterinarians.filter((v) => {
    if (filterSpec !== 'ALL' && v.specializationId !== filterSpec) return false;
    if (filterSpecies !== 'ALL') {
      const perms = vetPermMap[v.id] || [];
      if (!perms.includes(filterSpecies)) return false;
    }
    return true;
  });

  // Users without vet profiles
  const usersWithoutProfile = users.filter((u) => !veterinarians.some((v) => v.userId === u.id));

  return (
    <AppShell crumbGroup="Персонал" crumb="Врачи">
      <div className="content-row">
        {/* Left Column: Filters + Table */}
        <div className="content-col grow">
          <section className="island filters" aria-label="Фильтры врачей">
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
              <span className="field-label">Допуск к виду</span>
              <div className="dd">
                <select
                  className="select dd-btn"
                  value={filterSpecies}
                  onChange={(e) => setFilterSpecies(e.target.value)}
                >
                  <option value="ALL">Любой допуск</option>
                  {speciesList.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="spacer" />

            <button
              className="btn btn-primary"
              onClick={() => {
                setCreateError(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              Создать профиль врача
            </button>
          </section>

          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <Stethoscope size={18} />
                Врачи <span className="count">{filteredVets.length} · включая неактивных</span>
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable"
                style={
                  {
                    '--cols': '1.4fr 1fr 0.6fr 1.6fr 0.8fr',
                    minWidth: '720px',
                  } as React.CSSProperties
                }
              >
                <div className="thead">
                  <span>Врач</span>
                  <span>Специализация</span>
                  <span className="right">Стаж</span>
                  <span>Допуски к видам</span>
                  <span>Статус</span>
                </div>

                {filteredVets.map((v) => {
                  const specName = getSpecName(v.specializationId);
                  const isSelected = selectedVet?.id === v.id;
                  const perms = vetPermMap[v.id] || [];
                  const permittedSpecies = speciesList.filter((sp) => perms.includes(sp.id));

                  return (
                    <button
                      key={v.id}
                      className={`trow ${isSelected ? 'sel' : ''}`}
                      onClick={() => handleSelectVet(v)}
                    >
                      <span className="row" style={{ gap: 8 }}>
                        <span className={`t-ava sm round tone-${v.specializationId}`}>
                          {getUserInitials(v.userId)}
                        </span>
                        <span className="cell-main">{getUserName(v.userId)}</span>
                      </span>
                      <span>
                        <span className={`t-badge tone-${v.specializationId}`}>{specName}</span>
                      </span>
                      <span className="right tnum">
                        {v.experienceYears != null ? `${v.experienceYears} г.` : '—'}
                      </span>
                      <span className="chips">
                        {permittedSpecies.length > 0 ? (
                          permittedSpecies.map((sp) => (
                            <span key={sp.id} className={`sp-chip tone-${sp.id}`}>
                              {sp.name}
                            </span>
                          ))
                        ) : (
                          <span className="small muted">Нет допусков</span>
                        )}
                      </span>
                      <span>
                        <span className={`badge ${v.isActive ? 'badge-accent' : 'badge-outline'}`}>
                          {v.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredVets.length === 0 && !loading && (
                <div className="empty">
                  <span className="empty-title">Нет врачей по фильтру</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Master-Detail Island (460px) */}
        {selectedVet && (
          <section className="island detail-island" style={{ width: 460 }} aria-label="Врач">
            <div className="island-head">
              <div className="row">
                <span className="avatar avatar-lg">{getUserInitials(selectedVet.userId)}</span>
                <div className="col" style={{ gap: 2 }}>
                  <span className="h2">{getUserName(selectedVet.userId)}</span>
                  <span className="cell-sub">
                    {getSpecName(selectedVet.specializationId)} · {getUserEmail(selectedVet.userId)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedVet(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="tabs-line">
              <button
                className={`tab-line ${activeTab === 'profile' ? 'on' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Профиль
              </button>
              <button
                className={`tab-line ${activeTab === 'species' ? 'on' : ''}`}
                onClick={() => setActiveTab('species')}
              >
                Допуски к видам
              </button>
              <button
                className={`tab-line ${activeTab === 'schedule' ? 'on' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Расписание
              </button>
              <button
                className={`tab-line ${activeTab === 'exceptions' ? 'on' : ''}`}
                onClick={() => setActiveTab('exceptions')}
              >
                Исключения
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: 14 }}>
              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div className="col" style={{ gap: 14 }}>
                  <div className="field">
                    <span className="field-label">Специализация</span>
                    <select
                      className="select"
                      value={editForm.specializationId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, specializationId: e.target.value })
                      }
                    >
                      <option value="">Выберите специализацию</option>
                      {specializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label" htmlFor="vd-exp">
                        Стаж, лет
                      </label>
                      <input
                        className="input"
                        id="vd-exp"
                        type="number"
                        min="0"
                        max="70"
                        value={editForm.experienceYears}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            experienceYears: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <span className="field-label">Активен</span>
                      <div className="row" style={{ height: 36, gap: 10 }}>
                        <button
                          type="button"
                          className={`switch ${editForm.isActive ? 'on' : ''}`}
                          role="switch"
                          aria-checked={editForm.isActive}
                          aria-label="Активен"
                          onClick={() =>
                            setEditForm({ ...editForm, isActive: !editForm.isActive })
                          }
                        />
                        <span className="small muted">
                          {editForm.isActive ? 'Принимает записи' : 'Приём закрыт'}
                        </span>
                      </div>
                    </div>

                    <div className="field span-2">
                      <label className="field-label" htmlFor="vd-photo">
                        Фото (URL)
                      </label>
                      <input
                        className="input"
                        id="vd-photo"
                        type="url"
                        maxLength={2048}
                        placeholder="https://…"
                        value={editForm.photoUrl}
                        onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                      />
                    </div>

                    <div className="field span-2">
                      <label className="field-label" htmlFor="vd-bio">
                        Био
                      </label>
                      <textarea
                        className="textarea"
                        id="vd-bio"
                        maxLength={4000}
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="alert" role="alert">
                      <AlertCircle size={16} />
                      <div>{errorMessage}</div>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="alert alert-info" style={{ borderColor: 'var(--primary)' }}>
                      <Check size={16} style={{ color: 'var(--primary)' }} />
                      <div>Изменения сохранены</div>
                    </div>
                  )}

                  <span className="dev-note">
                    ФИО берётся из пользователя {selectedVet.userId}; смена роли или данных
                    выполняется в разделе «Пользователи»
                  </span>
                </div>
              )}

              {/* Tab: Species Permissions */}
              {activeTab === 'species' && (
                <div className="col" style={{ gap: 12 }}>
                  <span className="small muted">
                    Включите вид, чтобы врач мог принимать таких пациентов. Без допуска запись
                    отклоняется с ошибкой VeterinarianNotPermittedForSpeciesException.
                  </span>

                  <div className="col" style={{ gap: 6 }}>
                    {speciesList.map((sp) => {
                      const isPermitted = permittedSpeciesIds.includes(sp.id);
                      return (
                        <div
                          key={sp.id}
                          className="row between"
                          style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                        >
                          <span className="cell-main">{sp.name}</span>
                          <div className="row" style={{ gap: 10 }}>
                            <span className="small muted">
                              {isPermitted ? 'Разрешён' : 'Запрещён'}
                            </span>
                            <button
                              type="button"
                              className={`switch ${isPermitted ? 'on' : ''}`}
                              role="switch"
                              aria-checked={isPermitted}
                              aria-label={`Допуск: ${sp.name}`}
                              onClick={() => handleToggleSpeciesPermission(sp.id)}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {speciesList.length === 0 && (
                      <span className="small muted">Виды животных пока не добавлены</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Schedule */}
              {activeTab === 'schedule' && (
                <div className="col" style={{ gap: 10 }}>
                  <div
                    className="dtable"
                    style={{ '--cols': '40px 1fr 1fr' } as React.CSSProperties}
                  >
                    {DOW_ORDER.map((dow) => {
                      const item = vetSchedules.find((s) => s.dayOfWeek === dow);
                      return (
                        <div key={dow} className="trow static compact">
                          <span className="cell-main">{DOW_LABELS[dow]}</span>
                          <span className="tnum">
                            {item
                              ? `${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}`
                              : 'Выходной'}
                          </span>
                          <span className="small muted">
                            {item && item.breakStart && item.breakEnd
                              ? `перерыв ${item.breakStart.slice(0, 5)}–${item.breakEnd.slice(0, 5)}`
                              : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/admin/schedules?vetId=${selectedVet.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Calendar size={14} />
                    Редактировать в «Расписаниях»
                  </Link>
                </div>
              )}

              {/* Tab: Exceptions */}
              {activeTab === 'exceptions' && (
                <div className="col" style={{ gap: 0 }}>
                  {vetExceptions.map((e) => (
                    <div
                      key={e.id}
                      className="row between"
                      style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                    >
                      <div className="col" style={{ gap: 0 }}>
                        <span className="cell-main tnum">
                          {e.startDate} {e.endDate && e.endDate !== e.startDate ? `— ${e.endDate}` : ''}
                        </span>
                        <span className="cell-sub">{e.reason || 'Без причины'}</span>
                      </div>
                      <span
                        className={`badge ${
                          e.type === 'ABSENCE' ? 'badge-destructive' : 'badge-accent'
                        }`}
                      >
                        {e.type === 'ABSENCE' ? 'Отсутствие' : 'Свой график'}
                      </span>
                    </div>
                  ))}

                  {vetExceptions.length === 0 && (
                    <span className="small muted" style={{ padding: '12px 0' }}>
                      Исключений нет
                    </span>
                  )}

                  <Link
                    href={`/admin/schedules?tab=exc&vetId=${selectedVet.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: 12 }}
                  >
                    <Calendar size={14} />
                    Все исключения врача
                  </Link>
                </div>
              )}
            </div>

            <div className="island-foot">
              <button
                className="btn btn-destructive-outline btn-sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                <Trash2 size={14} />
                Удалить профиль
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveProfile}
                disabled={savingVet}
              >
                {savingVet ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Modal: Create Veterinarian Profile */}
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
            className="dialog dialog-sm"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Создание профиля врача</span>
              <span className="dialog-desc">
                Привязка врача к учётной записи пользователя с ролью ВЕТЕРИНАР
              </span>
            </div>

            <form onSubmit={handleCreateVet} className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="field-label">
                  Пользователь <span className="req">*</span>
                </span>
                <select
                  className="select"
                  value={createForm.userId}
                  onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                  required
                >
                  <option value="">Выберите пользователя…</option>
                  {usersWithoutProfile.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
                {usersWithoutProfile.length === 0 && (
                  <span className="field-hint" style={{ color: 'var(--amber-fg, #b45309)' }}>
                    Нет свободных пользователей с ролью ВЕТЕРИНАР. Сначала создайте пользователя в
                    разделе «Пользователи».
                  </span>
                )}
              </div>

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
                  <option value="">Выберите специализацию…</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="cr-exp">
                    Стаж, лет
                  </label>
                  <input
                    className="input"
                    id="cr-exp"
                    type="number"
                    min="0"
                    max="70"
                    value={createForm.experienceYears}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        experienceYears: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <span className="field-label">Активен</span>
                  <div className="row" style={{ height: 36, gap: 8 }}>
                    <button
                      type="button"
                      className={`switch ${createForm.isActive ? 'on' : ''}`}
                      role="switch"
                      aria-checked={createForm.isActive}
                      onClick={() =>
                        setCreateForm({ ...createForm, isActive: !createForm.isActive })
                      }
                    />
                    <span className="small muted">
                      {createForm.isActive ? 'Активен' : 'Отключён'}
                    </span>
                  </div>
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cr-photo">
                    Фото (URL)
                  </label>
                  <input
                    className="input"
                    id="cr-photo"
                    type="url"
                    placeholder="https://…"
                    value={createForm.photoUrl}
                    onChange={(e) => setCreateForm({ ...createForm, photoUrl: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cr-bio">
                    Био
                  </label>
                  <textarea
                    className="textarea"
                    id="cr-bio"
                    rows={2}
                    value={createForm.bio}
                    onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
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
                  disabled={creating || usersWithoutProfile.length === 0}
                >
                  {creating ? 'Создание…' : 'Создать врача'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedVet && (
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
              <span className="dialog-title">Удалить профиль врача?</span>
              <span className="dialog-desc">
                Профиль врача «{getUserName(selectedVet.userId)}» будет удалён. Записи и расписание
                могут быть затронуты. Сама учётная запись пользователя сохранится.
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
                onClick={handleDeleteVet}
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
