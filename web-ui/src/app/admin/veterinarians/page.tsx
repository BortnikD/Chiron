'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, clinicApi } from '../../../api';
import {
  Veterinarian,
  User,
  Specialization,
  Species,
  WorkSchedule,
  ScheduleException,
  DayOfWeek,
  ScheduleExceptionType,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  AlertCircle,
  Briefcase,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Понедельник', short: 'Пн' },
  { value: 'TUESDAY', label: 'Вторник', short: 'Вт' },
  { value: 'WEDNESDAY', label: 'Среда', short: 'Ср' },
  { value: 'THURSDAY', label: 'Четверг', short: 'Чт' },
  { value: 'FRIDAY', label: 'Пятница', short: 'Пт' },
  { value: 'SATURDAY', label: 'Суббота', short: 'Сб' },
  { value: 'SUNDAY', label: 'Воскресенье', short: 'Вс' },
];

export default function AdminVeterinariansPage() {
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Модальное окно создания профиля ветеринара
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

  // Модальное окно редактирования профиля ветеринара
  const [editingVet, setEditingVet] = useState<Veterinarian | null>(null);
  const [editForm, setEditForm] = useState({
    bio: '',
    photoUrl: '',
    experienceYears: 1,
    isActive: true,
    specializationId: '',
  });
  const [updating, setUpdating] = useState(false);

  // Модальное окно рабочих графиков
  const [selectedVetForSchedule, setSelectedVetForSchedule] = useState<Veterinarian | null>(null);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Форма добавления дня в график
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 'MONDAY' as DayOfWeek,
    startTime: '09:00:00',
    endTime: '18:00:00',
    breakStart: '13:00:00',
    breakEnd: '14:00:00',
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Форма добавления исключения из графика
  const [newException, setNewException] = useState({
    type: 'ABSENCE' as ScheduleExceptionType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [savingException, setSavingException] = useState(false);
  const [exceptionError, setExceptionError] = useState<string | null>(null);

  // Модальное окно разрешений на виды животных
  const [selectedVetForSpecies, setSelectedVetForSpecies] = useState<Veterinarian | null>(null);
  const [permittedSpeciesIds, setPermittedSpeciesIds] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vetsRes, usersRes, specsRes, specListRes] = await Promise.all([
        adminApi.getVeterinarians(),
        adminApi.getUsers(0, 100, 'VETERINARIAN'),
        clinicApi.getSpecializations(),
        clinicApi.getSpecies(),
      ]);

      const safeVets = Array.isArray(vetsRes) ? vetsRes : [];
      setVeterinarians(safeVets);
      setUsers(usersRes?.items ?? []);
      setSpecializations(Array.isArray(specsRes) ? specsRes : []);
      setSpeciesList(Array.isArray(specListRes) ? specListRes : []);

      if (usersRes?.items && usersRes.items.length > 0 && !createForm.userId) {
        setCreateForm((prev) => ({
          ...prev,
          userId: usersRes.items[0].id,
          specializationId: specsRes[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
      setVeterinarians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await adminApi.createVeterinarian({
        userId: createForm.userId,
        specializationId: createForm.specializationId,
        bio: createForm.bio.trim() || undefined,
        photoUrl: createForm.photoUrl.trim() || undefined,
        experienceYears: Number(createForm.experienceYears),
        isActive: createForm.isActive,
      });

      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setCreateError(err?.message || 'Не удалось создать профиль ветеринара');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (vet: Veterinarian) => {
    setEditingVet(vet);
    setEditForm({
      bio: vet.bio || '',
      photoUrl: vet.photoUrl || '',
      experienceYears: vet.experienceYears,
      isActive: vet.isActive,
      specializationId: vet.specializationId,
    });
  };

  const handleUpdateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVet) return;
    setUpdating(true);

    try {
      await adminApi.updateVeterinarian(editingVet.id, {
        bio: editForm.bio.trim() || null,
        photoUrl: editForm.photoUrl.trim() || null,
        experienceYears: Number(editForm.experienceYears),
        isActive: editForm.isActive,
        specializationId: editForm.specializationId,
      });

      setEditingVet(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Обработчики управления графиком врача
  const openScheduleModal = async (vet: Veterinarian) => {
    setSelectedVetForSchedule(vet);
    setLoadingSchedule(true);
    setScheduleError(null);
    setExceptionError(null);
    try {
      const [schedRes, excRes] = await Promise.all([
        clinicApi.getWorkSchedules(vet.id),
        clinicApi.getScheduleExceptions(vet.id),
      ]);
      setSchedules(Array.isArray(schedRes) ? schedRes : []);
      setExceptions(Array.isArray(excRes) ? excRes : []);
    } catch (err) {
      console.error(err);
      setSchedules([]);
      setExceptions([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleEditScheduleDay = (s: WorkSchedule) => {
    setScheduleError(null);
    setNewSchedule({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart || '',
      breakEnd: s.breakEnd || '',
    });
  };

  const handleAddScheduleDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVetForSchedule) return;
    setScheduleError(null);

    const bStart = newSchedule.breakStart?.trim() || null;
    const bEnd = newSchedule.breakEnd?.trim() || null;

    if (newSchedule.startTime >= newSchedule.endTime) {
      setScheduleError('Время начала смены должно быть раньше окончания смены');
      return;
    }

    if ((bStart && !bEnd) || (!bStart && bEnd)) {
      setScheduleError('Перерыв должен содержать как время начала, так и время окончания');
      return;
    }

    if (bStart && bEnd) {
      if (bStart >= bEnd) {
        setScheduleError('Время начала перерыва должно быть раньше окончания');
        return;
      }
      if (bStart < newSchedule.startTime || bEnd > newSchedule.endTime) {
        setScheduleError('Перерыв должен находиться в пределах рабочего времени смены');
        return;
      }
    }

    setSavingSchedule(true);

    try {
      const existing = schedules.find((s) => s.dayOfWeek === newSchedule.dayOfWeek);

      if (existing) {
        // День уже есть в расписании, обновляем часы через PATCH
        await adminApi.updateWorkSchedule(existing.id, {
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          breakStart: bStart,
          breakEnd: bEnd,
        });
      } else {
        // Создаём новую запись дня в расписании через POST
        await adminApi.createWorkSchedule({
          veterinarianId: selectedVetForSchedule.id,
          dayOfWeek: newSchedule.dayOfWeek,
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          breakStart: bStart,
          breakEnd: bEnd,
        });
      }

      const updated = await clinicApi.getWorkSchedules(selectedVetForSchedule.id);
      setSchedules(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      setScheduleError(err?.message || 'Не удалось сохранить часы работы');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteScheduleDay = async (id: string) => {
    if (!selectedVetForSchedule) return;
    setScheduleError(null);
    try {
      await adminApi.deleteWorkSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setScheduleError(err?.message || 'Не удалось удалить рабочий день');
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVetForSchedule) return;
    setExceptionError(null);

    if (newException.startDate > newException.endDate) {
      setExceptionError('Дата окончания не может быть раньше даты начала');
      return;
    }

    if (newException.type === 'CUSTOM_HOURS') {
      if (!newException.startTime || !newException.endTime) {
        setExceptionError('Для индивидуального графика укажите время начала и окончания');
        return;
      }
      if (newException.startTime >= newException.endTime) {
        setExceptionError('Время начала должно быть раньше времени окончания');
        return;
      }
    }

    setSavingException(true);

    try {
      await adminApi.createScheduleException({
        veterinarianId: selectedVetForSchedule.id,
        type: newException.type,
        startDate: newException.startDate,
        endDate: newException.endDate,
        startTime: newException.type === 'CUSTOM_HOURS' && newException.startTime ? newException.startTime : null,
        endTime: newException.type === 'CUSTOM_HOURS' && newException.endTime ? newException.endTime : null,
        reason: newException.reason.trim() || null,
      });

      const updated = await clinicApi.getScheduleExceptions(selectedVetForSchedule.id);
      setExceptions(Array.isArray(updated) ? updated : []);
      setNewException((prev) => ({ ...prev, reason: '' }));
    } catch (err: any) {
      setExceptionError(err?.message || 'Не удалось создать исключение расписания');
    } finally {
      setSavingException(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await adminApi.deleteScheduleException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Обработчики допусков врача к видам животных
  const openSpeciesModal = async (vet: Veterinarian) => {
    setSelectedVetForSpecies(vet);
    setLoadingPermissions(true);
    try {
      const perms = await clinicApi.getVetSpeciesPermissions(vet.id);
      const ids = Array.isArray(perms) ? perms.map((p) => p.speciesId) : [];
      setPermittedSpeciesIds(ids);
    } catch (err) {
      console.error(err);
      setPermittedSpeciesIds([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleToggleSpeciesPermission = async (speciesId: string) => {
    if (!selectedVetForSpecies) return;
    const isGranted = permittedSpeciesIds.includes(speciesId);

    try {
      if (isGranted) {
        await adminApi.revokeVetSpeciesPermission(selectedVetForSpecies.id, speciesId);
        setPermittedSpeciesIds((prev) => prev.filter((id) => id !== speciesId));
      } else {
        await adminApi.grantVetSpeciesPermission(selectedVetForSpecies.id, speciesId);
        setPermittedSpeciesIds((prev) => [...prev, speciesId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSpecName = (specId: string) => {
    const spec = specializations.find((s) => s.id === specId);
    return spec?.name || 'Общая практика';
  };

  const getUserName = (userId: string) => {
    const u = users.find((item) => item.id === userId);
    return u?.fullName || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Врач клиники';
  };

  const filteredVets = veterinarians.filter((v) => {
    const name = getUserName(v.userId).toLowerCase();
    const spec = getSpecName(v.specializationId).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || spec.includes(q);
  });

  return (
    <AppShell
      title="Врачи и графики"
      subtitle="Управление профилями докторов, еженедельным расписанием и допусками к животным"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="ic" />
          <span>Назначить врача</span>
        </button>
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Панель поиска и действий */}
        <section className="island filters" aria-label="Фильтры">
          <div className="field" style={{ minWidth: '280px', flex: 1 }}>
            <span className="field-label">Поиск</span>
            <div className="input-icon">
              <Search className="ic" />
              <input
                className="input input-sm"
                placeholder="Поиск по имени или специализации..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {search && (
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <span className="field-label">&nbsp;</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSearch('')}
              >
                <X className="ic" style={{ width: '13px', height: '13px' }} />
                <span>Очистить</span>
              </button>
            </div>
          )}
        </section>

        {/* Сетка карточек ветеринарных врачей */}
        <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="island-head">
            <span className="island-title">
              <Stethoscope className="ic" />
              <span>Штат ветеринарных врачей</span>
              <span className="count">Всего: {filteredVets.length}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px', padding: '16px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : filteredVets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
              {filteredVets.map((vet) => {
                const vetName = vet.user?.fullName || getUserName(vet.userId);
                const specName = vet.specialization?.name || getSpecName(vet.specializationId);
                const initials = vetName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ВР';

                return (
                  <div
                    key={vet.id}
                    className="island"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          className="avatar"
                          style={{
                            width: '44px',
                            height: '44px',
                            fontSize: '15px',
                            fontWeight: 700,
                            background: 'var(--primary)',
                            color: 'var(--primary-text)',
                            borderRadius: '10px',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm" style={{ margin: 0 }}>{vetName}</h3>
                          <span className="muted text-xs font-medium">{specName}</span>
                        </div>
                      </div>

                      <span className={`badge ${vet.isActive ? 'b-completed' : 'b-cancelled'}`}>
                        {vet.isActive ? 'Активен' : 'Отключён'}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="muted">Стаж:</span>
                        <span className="tnum font-semibold">{vet.experienceYears} лет</span>
                      </div>
                      {vet.bio && (
                        <p className="muted italic text-xs line-clamp-2" style={{ margin: 0, borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                          «{vet.bio}»
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openScheduleModal(vet)}
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <Clock className="ic" style={{ width: '13px', height: '13px' }} />
                        <span>График</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openSpeciesModal(vet)}
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <ShieldCheck className="ic" style={{ width: '13px', height: '13px' }} />
                        <span>Животные</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm w-full"
                      onClick={() => openEditModal(vet)}
                    >
                      <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                      <span>Редактировать профиль</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ padding: '48px 16px' }}>
              <div className="empty-art">
                <Stethoscope className="ic" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
              </div>
              <span className="empty-title">Врачи не найдены</span>
              <p className="muted text-xs text-center max-w-sm mt-1">
                В клинике пока нет врачей по заданному поисковому запросу.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-3"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="ic" />
                <span>Назначить врача</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно создания профиля врача */}
      {isCreateOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="create-vet-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="create-vet-title">Назначить ветеринарного врача</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateVet} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {createError && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="ic shrink-0" />
                  <span className="text-xs">{createError}</span>
                </div>
              )}

              <div className="field">
                <label className="field-label">Сотрудник (роль: VETERINARIAN)</label>
                <select
                  className="select"
                  required
                  value={createForm.userId}
                  onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                >
                  <option value="" disabled>Выберите пользователя...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || `${u.firstName} ${u.lastName}`} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Специализация</label>
                <select
                  className="select"
                  required
                  value={createForm.specializationId}
                  onChange={(e) => setCreateForm({ ...createForm, specializationId: e.target.value })}
                >
                  <option value="" disabled>Выберите специализацию...</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Опыт работы (лет)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  className="input font-mono"
                  required
                  value={createForm.experienceYears}
                  onChange={(e) => setCreateForm({ ...createForm, experienceYears: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="field">
                <label className="field-label">О враче (биография)</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Образование, курсы повышения квалификации..."
                  value={createForm.bio}
                  onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                />
                <span>Врач активен и доступен для записи пациентов</span>
              </label>

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
                  {creating ? 'Создание...' : 'Назначить врача'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования профиля врача */}
      {editingVet && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="edit-vet-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="edit-vet-title">
                Редактирование: {editingVet.user?.fullName || 'Врач'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditingVet(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleUpdateVet} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Специализация</label>
                <select
                  className="select"
                  required
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
                <label className="field-label">Опыт работы (лет)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  className="input font-mono"
                  required
                  value={editForm.experienceYears}
                  onChange={(e) => setEditForm({ ...editForm, experienceYears: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="field">
                <label className="field-label">О враче</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                <span>Врач активен в расписании клиники</span>
              </label>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingVet(null)}
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

      {/* Модальное окно графика работы и исключений */}
      {selectedVetForSchedule && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="schedule-title" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="schedule-title">
                График: {selectedVetForSchedule.user?.fullName || 'Врач'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setSelectedVetForSchedule(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Раздел недельного графика работы */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar className="ic" style={{ width: '15px', height: '15px' }} />
                    <span>Еженедельное расписание (по дням)</span>
                  </span>
                </div>

                {loadingSchedule ? (
                  <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
                ) : schedules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {schedules.map((s) => {
                      const dayMeta = DAYS_OF_WEEK.find((d) => d.value === s.dayOfWeek);
                      return (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'var(--island-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge font-bold" style={{ width: '30px', textAlign: 'center' }}>
                              {dayMeta?.short || s.dayOfWeek.slice(0, 2)}
                            </span>
                            <span className="font-medium">{dayMeta?.label || s.dayOfWeek}:</span>
                            <span className="tnum font-mono text-xs">
                              {s.startTime.substring(0, 5)} – {s.endTime.substring(0, 5)}
                            </span>
                            {s.breakStart && s.breakEnd && (
                              <span className="tnum muted text-xs font-mono">
                                (обед: {s.breakStart.substring(0, 5)}–{s.breakEnd.substring(0, 5)})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleEditScheduleDay(s)}
                              title="Редактировать часы"
                            >
                              <Edit2 className="ic" style={{ width: '13px', height: '13px' }} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                              onClick={() => handleDeleteScheduleDay(s.id)}
                              title="Удалить день"
                            >
                              <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted text-xs italic">Расписание ещё не задано (все дни недели — выходные).</p>
                )}

                {scheduleError && (
                  <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle className="ic shrink-0" />
                    <span className="text-xs">{scheduleError}</span>
                  </div>
                )}

                {/* Форма добавления / редактирования дня */}
                <form
                  onSubmit={handleAddScheduleDay}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-semibold text-xs">
                      {schedules.some((s) => s.dayOfWeek === newSchedule.dayOfWeek)
                        ? 'Изменить часы для выбранного дня'
                        : 'Добавить рабочий день'}
                    </span>
                    {schedules.some((s) => s.dayOfWeek === newSchedule.dayOfWeek) && (
                      <span className="badge b-pending text-[10px]">День уже задан — обновится</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                    <div className="field">
                      <label className="field-label">День недели</label>
                      <select
                        className="select input-sm"
                        value={newSchedule.dayOfWeek}
                        onChange={(e) => {
                          const day = e.target.value as DayOfWeek;
                          const existing = schedules.find((s) => s.dayOfWeek === day);
                          if (existing) {
                            handleEditScheduleDay(existing);
                          } else {
                            setNewSchedule({
                              ...newSchedule,
                              dayOfWeek: day,
                              startTime: '09:00:00',
                              endTime: '18:00:00',
                              breakStart: '13:00:00',
                              breakEnd: '14:00:00',
                            });
                          }
                        }}
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Начало</label>
                      <input
                        type="time"
                        className="input input-sm font-mono"
                        required
                        value={newSchedule.startTime.substring(0, 5)}
                        onChange={(e) => setNewSchedule({ ...newSchedule, startTime: `${e.target.value}:00` })}
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Окончание</label>
                      <input
                        type="time"
                        className="input input-sm font-mono"
                        required
                        value={newSchedule.endTime.substring(0, 5)}
                        onChange={(e) => setNewSchedule({ ...newSchedule, endTime: `${e.target.value}:00` })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div className="field">
                      <label className="field-label">Обед с</label>
                      <input
                        type="time"
                        className="input input-sm font-mono"
                        value={newSchedule.breakStart ? newSchedule.breakStart.substring(0, 5) : ''}
                        onChange={(e) => setNewSchedule({ ...newSchedule, breakStart: e.target.value ? `${e.target.value}:00` : '' })}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Обед по</label>
                      <input
                        type="time"
                        className="input input-sm font-mono"
                        value={newSchedule.breakEnd ? newSchedule.breakEnd.substring(0, 5) : ''}
                        onChange={(e) => setNewSchedule({ ...newSchedule, breakEnd: e.target.value ? `${e.target.value}:00` : '' })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm self-start"
                    disabled={savingSchedule}
                  >
                    {savingSchedule ? 'Сохранение...' : schedules.some((s) => s.dayOfWeek === newSchedule.dayOfWeek) ? 'Обновить день' : 'Сохранить день'}
                  </button>
                </form>
              </div>

              {/* Раздел исключений из графика (отпуска, больничные) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span className="font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle className="ic" style={{ width: '15px', height: '15px' }} />
                  <span>Исключения (отпуска, больничные, особые смены)</span>
                </span>

                {exceptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {exceptions.map((exc) => (
                      <div
                        key={exc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--island-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge b-pending text-[10px]">
                              {exc.type === 'ABSENCE' ? 'Отсутствие' : 'Особые часы'}
                            </span>
                            <span className="tnum font-mono text-xs font-semibold">
                              {exc.startDate} — {exc.endDate}
                            </span>
                          </div>
                          {exc.reason && <span className="muted text-xs italic">Причина: {exc.reason}</span>}
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                          onClick={() => handleDeleteException(exc.id)}
                          title="Удалить исключение"
                        >
                          <Trash2 className="ic" style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted text-xs italic">Исключений нет.</p>
                )}

                {exceptionError && (
                  <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle className="ic shrink-0" />
                    <span className="text-xs">{exceptionError}</span>
                  </div>
                )}

                <form
                  onSubmit={handleAddException}
                  style={{
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <span className="font-semibold text-xs">Добавить исключение</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div className="field">
                      <label className="field-label">Тип</label>
                      <select
                        className="select input-sm"
                        value={newException.type}
                        onChange={(e) => setNewException({ ...newException, type: e.target.value as ScheduleExceptionType })}
                      >
                        <option value="ABSENCE">Отсутствие / Отпуск</option>
                        <option value="CUSTOM_HOURS">Особые часы</option>
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Причина</label>
                      <input
                        className="input input-sm"
                        placeholder="Отпуск / Конференция..."
                        value={newException.reason}
                        onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div className="field">
                      <label className="field-label">С даты</label>
                      <input
                        type="date"
                        className="input input-sm"
                        required
                        value={newException.startDate}
                        onChange={(e) => setNewException({ ...newException, startDate: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">По дату</label>
                      <input
                        type="date"
                        className="input input-sm"
                        required
                        value={newException.endDate}
                        onChange={(e) => setNewException({ ...newException, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm self-start"
                    style={{ border: '1px solid var(--border)' }}
                    disabled={savingException}
                  >
                    {savingException ? 'Сохранение...' : 'Внести исключение'}
                  </button>
                </form>
              </div>
            </div>

            <div className="dialog-foot">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedVetForSchedule(null)}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно разрешений на приём видов животных */}
      {selectedVetForSpecies && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="species-title" style={{ maxWidth: '440px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="species-title">
                Допуск к животным: {selectedVetForSpecies.user?.fullName || 'Врач'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setSelectedVetForSpecies(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="text-xs muted">
                Отметьте виды питомцев, которых имеет право осматривать и оперировать данный доктор:
              </p>

              {loadingPermissions ? (
                <div className="skeleton" style={{ height: '120px', borderRadius: '8px' }} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {speciesList.map((spec) => {
                    const isPermitted = permittedSpeciesIds.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => handleToggleSpeciesPermission(spec.id)}
                        className={`chip ${isPermitted ? 'on' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="text-xs font-medium">{spec.name}</span>
                        {isPermitted ? (
                          <Check className="ic" style={{ width: '13px', height: '13px' }} />
                        ) : (
                          <span style={{ width: '13px', height: '13px' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedVetForSpecies(null)}
                >
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
