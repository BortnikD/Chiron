'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../api';
import { User, UserRole, Pet, Appointment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Stethoscope,
  PawPrint,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

const ROLE_META: Record<UserRole, { label: string; cls: string }> = {
  CLIENT: { label: 'Клиент', cls: 'badge-outline' },
  VETERINARIAN: { label: 'Ветеринар', cls: 'badge-accent' },
  ADMIN: { label: 'Администратор', cls: 'badge-CONFIRMED' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Selected User for Master-Detail panel
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'pets' | 'appointments'>('profile');
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);

  // Profile Edit State
  const [editForm, setEditForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [savingUser, setSavingUser] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CLIENT' as UserRole,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete User Dialog
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(
        0,
        100,
        roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined
      );
      const items = res?.items || [];
      setUsers(items);

      if (selectedUser) {
        const updated = items.find((u: User) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // When selected user changes, load their profile form, pets, and appointments
  useEffect(() => {
    if (!selectedUser) return;

    setEditForm({
      firstName: selectedUser.firstName || '',
      middleName: selectedUser.middleName || '',
      lastName: selectedUser.lastName || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
    });
    setSaveSuccess(false);
    setErrorMessage(null);

    // Fetch user pets and appointments
    Promise.all([
      adminApi.getPets(0, 50).catch(() => ({ items: [] })),
      adminApi.getAppointments(0, 50).catch(() => ({ items: [] })),
    ]).then(([petsRes, apptsRes]) => {
      const allPets: Pet[] = petsRes?.items || [];
      const userPetList = allPets.filter((p) => p.ownerId === selectedUser.id);
      setUserPets(userPetList);

      const userPetIds = new Set(userPetList.map((p) => p.id));
      const allAppts: Appointment[] = apptsRes?.items || [];
      const userApptList = allAppts.filter((a) => userPetIds.has(a.petId));
      setUserAppointments(userApptList);
    });
  }, [selectedUser]);

  const getUserInitials = (u: User) => {
    const f = (u.firstName || '').trim();
    const l = (u.lastName || '').trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    return 'ПЛ';
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateUser(selectedUser.id, {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Ошибка обновления пользователя');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(selectedUser.id);
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении пользователя');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      setCreateError('Заполните обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createUser({
        firstName: createForm.firstName.trim(),
        middleName: createForm.middleName.trim() || undefined,
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setIsCreateOpen(false);
      setCreateForm({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'CLIENT',
      });
      await loadUsers();
      if (created) setSelectedUser(created);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Ошибка создания пользователя');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <AppShell crumbGroup="Клиника" crumb="Пользователи">
      <div className="content-row">
        {/* Left Column: Filters + Table */}
        <div className="content-col grow">
          <section className="island filters" aria-label="Фильтры пользователей">
            <div className="field" style={{ width: 'auto' }}>
              <span className="field-label">Роль</span>
              <div className="seg">
                <button
                  type="button"
                  className={`seg-item ${roleFilter === 'ALL' ? 'on' : ''}`}
                  onClick={() => setRoleFilter('ALL')}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={`seg-item ${roleFilter === 'CLIENT' ? 'on' : ''}`}
                  onClick={() => setRoleFilter('CLIENT')}
                >
                  Клиенты
                </button>
                <button
                  type="button"
                  className={`seg-item ${roleFilter === 'VETERINARIAN' ? 'on' : ''}`}
                  onClick={() => setRoleFilter('VETERINARIAN')}
                >
                  Врачи
                </button>
                <button
                  type="button"
                  className={`seg-item ${roleFilter === 'ADMIN' ? 'on' : ''}`}
                  onClick={() => setRoleFilter('ADMIN')}
                >
                  Админы
                </button>
              </div>
            </div>

            <div className="field" style={{ width: 260 }}>
              <span className="field-label">Поиск</span>
              <div className="input-icon">
                <Search size={14} className="ic" />
                <input
                  type="text"
                  className="input"
                  placeholder="ФИО, email или телефон…"
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
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              Создать пользователя
            </button>
          </section>

          <section className="island grow">
            <div className="island-head">
              <span className="island-title">
                <Users size={18} />
                Пользователи <span className="count">Найдено: {filteredUsers.length}</span>
              </span>
            </div>

            <div className="table-wrap">
              <div
                className="dtable"
                style={
                  {
                    '--cols': '1.4fr 1.4fr 1fr 0.9fr 0.8fr',
                    minWidth: '760px',
                  } as React.CSSProperties
                }
              >
                <div className="thead">
                  <span>ФИО</span>
                  <span>Email</span>
                  <span>Телефон</span>
                  <span>Роль</span>
                  <span>Регистрация ↑</span>
                </div>

                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const rInfo = ROLE_META[u.role] || { label: u.role, cls: 'badge-outline' };
                  const created = u.createdAt ? u.createdAt.slice(0, 10) : '—';

                  return (
                    <button
                      key={u.id}
                      className={`trow ${isSelected ? 'sel' : ''}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <span className="row" style={{ gap: 8 }}>
                        <span className={`t-ava sm round tone-${u.role}`}>
                          {getUserInitials(u)}
                        </span>
                        <span className="cell-main">{u.fullName || `${u.firstName} ${u.lastName}`}</span>
                      </span>
                      <span className="muted">{u.email}</span>
                      <span className="tnum">{u.phone || '—'}</span>
                      <span>
                        <span className={`t-badge tone-${u.role}`}>{rInfo.label}</span>
                      </span>
                      <span className="tnum">{created}</span>
                    </button>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && !loading && (
                <div className="empty">
                  <span className="empty-title">Пользователи не найдены</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Master-Detail Island (460px) */}
        {selectedUser && (
          <section className="island detail-island" style={{ width: 460 }} aria-label="Пользователь">
            <div className="island-head">
              <div className="row">
                <span className="avatar avatar-lg">{getUserInitials(selectedUser)}</span>
                <div className="col" style={{ gap: 2 }}>
                  <span className="h2">
                    {selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                  </span>
                  <span
                    className={`badge ${ROLE_META[selectedUser.role]?.cls}`}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {ROLE_META[selectedUser.role]?.label || selectedUser.role}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedUser(null)}
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
                className={`tab-line ${activeTab === 'pets' ? 'on' : ''}`}
                onClick={() => setActiveTab('pets')}
              >
                Питомцы <span className="small muted">{userPets.length}</span>
              </button>
              <button
                className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                Записи <span className="small muted">{userAppointments.length}</span>
              </button>
            </div>

            <div className="island-body" style={{ paddingTop: 14 }}>
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="col" style={{ gap: 14 }}>
                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label" htmlFor="ud-first">
                        Имя
                      </label>
                      <input
                        id="ud-first"
                        className="input"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="ud-middle">
                        Отчество
                      </label>
                      <input
                        id="ud-middle"
                        className="input"
                        value={editForm.middleName}
                        onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                      />
                    </div>
                    <div className="field span-2">
                      <label className="field-label" htmlFor="ud-last">
                        Фамилия
                      </label>
                      <input
                        id="ud-last"
                        className="input"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className="field span-2">
                      <label className="field-label" htmlFor="ud-email">
                        Email
                      </label>
                      <input
                        id="ud-email"
                        type="email"
                        className="input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="field span-2">
                      <label className="field-label" htmlFor="ud-phone">
                        Телефон
                      </label>
                      <input
                        id="ud-phone"
                        type="tel"
                        className="input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <span className="small muted">
                    fullName собирает сервер · зарегистрирован {selectedUser.createdAt ? selectedUser.createdAt.slice(0, 10) : '—'}
                  </span>

                  {selectedUser.role === 'VETERINARIAN' && (
                    <div className="alert alert-info">
                      <Stethoscope size={16} />
                      <div className="col" style={{ gap: 6 }}>
                        <span>
                          Пользователь имеет роль ВЕТЕРИНАР. График работы, специализация и допуски к видам
                          настраиваются в разделе «Врачи».
                        </span>
                        <Link
                          href="/admin/veterinarians"
                          className="btn btn-outline btn-sm"
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Перейти к профилю врача
                        </Link>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="alert" role="alert">
                      <AlertCircle size={16} />
                      <div>{errorMessage}</div>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="alert alert-info" style={{ borderColor: 'var(--primary)' }}>
                      <Check size={16} style={{ color: 'var(--primary)' }} />
                      <div>Данные пользователя сохранены</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Pets */}
              {activeTab === 'pets' && (
                <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                  {userPets.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/pets`}
                      className="lrow"
                    >
                      <span
                        className="pet-ava"
                        style={{ width: 36, height: 36, borderRadius: 10 }}
                      >
                        <PawPrint size={16} />
                      </span>
                      <span className="col" style={{ gap: 1 }}>
                        <span className="cell-main">{p.name}</span>
                        <span className="cell-sub">{p.gender === 'MALE' ? 'Самец' : 'Самка'}</span>
                      </span>
                      {p.isArchived && <span className="badge">Архив</span>}
                    </Link>
                  ))}

                  {userPets.length === 0 && (
                    <div className="empty" style={{ padding: 24 }}>
                      Питомцев нет
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Appointments */}
              {activeTab === 'appointments' && (
                <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
                  {userAppointments.map((a) => {
                    const d = new Date(a.startAt);
                    const dd = d.getDate();
                    const mon = d.toLocaleDateString('ru-RU', { month: 'short' });
                    const time = d.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <Link
                        key={a.id}
                        href="/admin/appointments"
                        className="lrow"
                      >
                        <span className="datebox">
                          <b>{dd}</b>
                          <span>{mon}</span>
                        </span>
                        <span className="col" style={{ gap: 1 }}>
                          <span className="cell-main">{a.service?.name || 'Услуга'}</span>
                          <span className="cell-sub">{time}</span>
                        </span>
                        <span className={`badge st badge-${a.status}`}>{a.status}</span>
                      </Link>
                    );
                  })}

                  {userAppointments.length === 0 && (
                    <div className="empty" style={{ padding: 24 }}>
                      Записей нет
                    </div>
                  )}
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
                onClick={handleSaveProfile}
                disabled={savingUser}
              >
                {savingUser ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Modal: Create User */}
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
              <span className="dialog-title">Создать пользователя</span>
              <span className="dialog-desc">Регистрация нового пользователя в системе Chiron</span>
            </div>

            <form onSubmit={handleCreateSubmit} className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="field-label">Роль</span>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${createForm.role === 'CLIENT' ? 'on' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, role: 'CLIENT' })}
                  >
                    Клиент
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${createForm.role === 'VETERINARIAN' ? 'on' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, role: 'VETERINARIAN' })}
                  >
                    Ветеринар
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${createForm.role === 'ADMIN' ? 'on' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, role: 'ADMIN' })}
                  >
                    Админ
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="cu-first">
                    Имя <span className="req">*</span>
                  </label>
                  <input
                    id="cu-first"
                    className="input"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="cu-middle">
                    Отчество
                  </label>
                  <input
                    id="cu-middle"
                    className="input"
                    value={createForm.middleName}
                    onChange={(e) => setCreateForm({ ...createForm, middleName: e.target.value })}
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cu-last">
                    Фамилия <span className="req">*</span>
                  </label>
                  <input
                    id="cu-last"
                    className="input"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cu-email">
                    Email <span className="req">*</span>
                  </label>
                  <input
                    id="cu-email"
                    type="email"
                    className="input"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cu-phone">
                    Телефон <span className="req">*</span>
                  </label>
                  <input
                    id="cu-phone"
                    type="tel"
                    className="input"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="cu-pass">
                    Пароль <span className="req">*</span>
                  </label>
                  <input
                    id="cu-pass"
                    type="password"
                    className="input"
                    placeholder="Минимум 8 символов"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
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

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && selectedUser && (
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
              <span className="dialog-title">Удалить пользователя?</span>
              <span className="dialog-desc">
                Пользователь «{selectedUser.fullName || selectedUser.email}» будет безвозвратно удалён.
                Связанные данные могут стать недоступны.
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
                onClick={handleDeleteUser}
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
