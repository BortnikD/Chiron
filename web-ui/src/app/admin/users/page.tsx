'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../api';
import { User, UserRole } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Stethoscope,
  AlertCircle,
  RefreshCw,
  X,
  User as UserIcon,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Модальное окно создания пользователя
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    role: 'VETERINARIAN' as UserRole,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Модальное окно редактирования пользователя
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
  });
  const [updating, setUpdating] = useState(false);

  // Модальное окно удаления пользователя
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminApi
      .getUsers(0, 50, roleFilter || undefined)
      .then((res) => {
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        setUsers(items);
      })
      .catch((err) => {
        console.error(err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await adminApi.createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });

      setIsModalOpen(false);
      setForm({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        password: '',
        role: 'VETERINARIAN',
      });
      loadUsers();
    } catch (err: any) {
      setCreateError(err?.message || 'Не удалось создать пользователя');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      middleName: u.middleName || '',
      email: u.email,
      phone: u.phone,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      await adminApi.updateUser(editingUser.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        middleName: editForm.middleName.trim() || null,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });

      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deletingUserId);
      setDeletingUserId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge b-pending font-semibold text-[10px]">Администратор</span>;
      case 'VETERINARIAN':
        return <span className="badge b-completed font-semibold text-[10px]">Врач</span>;
      default:
        return <span className="badge font-semibold text-[10px]">Клиент</span>;
    }
  };

  return (
    <AppShell
      title="Пользователи"
      subtitle="Реестр сотрудников клиники, ветеринарных врачей и зарегистрированных клиентов"
      actions={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <UserPlus className="ic" />
          <span>Добавить пользователя</span>
        </button>
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Панель поиска и фильтров */}
        <section className="island filters" aria-label="Фильтры пользователей">
          <div className="field" style={{ minWidth: '240px', flex: 1 }}>
            <span className="field-label">Поиск</span>
            <div className="input-icon">
              <Search className="ic" />
              <input
                className="input input-sm"
                placeholder="Имя, email или телефон..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Роль</span>
            <div className="chips">
              {[
                { val: '', label: 'Все' },
                { val: 'VETERINARIAN', label: 'Врачи' },
                { val: 'CLIENT', label: 'Клиенты' },
                { val: 'ADMIN', label: 'Администраторы' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  className={`chip ${roleFilter === chip.val ? 'on' : ''}`}
                  onClick={() => setRoleFilter(chip.val)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {(search || roleFilter) && (
            <div className="field" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
              <span className="field-label">&nbsp;</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                }}
              >
                <X className="ic" style={{ width: '13px', height: '13px' }} />
                <span>Сбросить</span>
              </button>
            </div>
          )}
        </section>

        {/* Таблица пользователей клиники */}
        <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="island-head">
            <span className="island-title">
              <Users className="ic" />
              <span>Список учётных записей</span>
              <span className="count">Найдено: {filtered.length}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={loadUsers}
              title="Обновить"
            >
              <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="table-wrap">
              <table className="table" aria-label="Список пользователей">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th style={{ width: '140px' }}>Роль</th>
                    <th>Контакты</th>
                    <th style={{ width: '130px' }}>Регистрация</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const initials = u.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'US';

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              className="avatar"
                              style={{
                                width: '34px',
                                height: '34px',
                                fontSize: '13px',
                                fontWeight: 600,
                                background: 'var(--island-subtle)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold text-sm block">{u.fullName}</span>
                              <span className="muted text-xs tnum font-mono">ID: {u.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {getRoleBadge(u.role)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            <span className="flex items-center gap-1.5">
                              <Mail className="ic muted" style={{ width: '12px', height: '12px' }} />
                              <span>{u.email}</span>
                            </span>
                            <span className="flex items-center gap-1.5 muted tnum font-mono">
                              <Phone className="ic muted" style={{ width: '12px', height: '12px' }} />
                              <span>{u.phone}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="tnum text-xs muted font-mono">
                            {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {u.role === 'VETERINARIAN' && (
                              <Link href="/admin/veterinarians">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm text-[var(--primary-text)]"
                                  title="Профиль и график врача"
                                >
                                  <Stethoscope className="ic" style={{ width: '14px', height: '14px' }} />
                                </button>
                              </Link>
                            )}
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => openEditModal(u)}
                              title="Редактировать"
                            >
                              <Edit2 className="ic" style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm text-[var(--accent-red)]"
                              onClick={() => setDeletingUserId(u.id)}
                              title="Удалить"
                            >
                              <Trash2 className="ic" style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty" style={{ padding: '48px 16px' }}>
              <div className="empty-art">
                <Users className="ic" style={{ width: '40px', height: '40px', opacity: 0.4 }} />
              </div>
              <span className="empty-title">Пользователи не найдены</span>
              <p className="muted text-xs text-center max-w-sm mt-1">
                По заданным критериям фильтрации пользователи не найдены.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно добавления пользователя */}
      {isModalOpen && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="create-user-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="create-user-title">Создание учётной записи</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setIsModalOpen(false)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {createError && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="ic shrink-0" />
                  <span className="text-xs">{createError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Имя</label>
                  <input
                    className="input"
                    placeholder="Иван"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Фамилия</label>
                  <input
                    className="input"
                    placeholder="Иванов"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Отчество (необязательно)</label>
                <input
                  className="input"
                  placeholder="Иванович"
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="doctor@chiron.ru"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Телефон</label>
                  <input
                    className="input font-mono"
                    placeholder="+79991234567"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Пароль</label>
                  <input
                    type="password"
                    className="input font-mono"
                    placeholder="Минимум 8 знаков"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Роль</label>
                  <select
                    className="select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  >
                    <option value="VETERINARIAN">Ветеринарный врач</option>
                    <option value="CLIENT">Клиент</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>
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
                  {creating ? 'Создание...' : 'Создать пользователя'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования профиля */}
      {editingUser && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="edit-user-title" style={{ maxWidth: '480px' }}>
            <div className="dialog-head">
              <span className="dialog-title" id="edit-user-title">
                Редактирование: {editingUser.fullName}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setEditingUser(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Имя</label>
                  <input
                    className="input"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Фамилия</label>
                  <input
                    className="input"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Отчество</label>
                <input
                  className="input"
                  value={editForm.middleName}
                  onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Телефон</label>
                  <input
                    className="input font-mono"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingUser(null)}
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

      {/* Модальное окно подтверждения удаления */}
      {deletingUserId && (
        <div className="dialog-backdrop">
          <div className="dialog island" role="dialog" aria-labelledby="del-user-title" style={{ maxWidth: '420px' }}>
            <div className="dialog-head">
              <span className="dialog-title text-[var(--accent-red)]" id="del-user-title">
                Удаление пользователя
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setDeletingUserId(null)}
                aria-label="Закрыть"
              >
                <X className="ic" />
              </button>
            </div>

            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="text-sm">
                Вы действительно хотите удалить данного пользователя?
              </p>
              <p className="text-xs muted">
                Учётная запись будет деактивирована или удалена из базы данных.
              </p>

              <div className="dialog-foot" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeletingUserId(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
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
