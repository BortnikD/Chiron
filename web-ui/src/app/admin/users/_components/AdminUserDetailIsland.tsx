'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../../api';
import { User, Pet, Appointment } from '../../../../types';
import { ROLE_META, getUserInitials } from './utils';
import {
  X,
  Trash2,
  Stethoscope,
  PawPrint,
  AlertCircle,
  Check,
  Edit2,
} from 'lucide-react';

export interface AdminUserDetailIslandProps {
  user: User;
  onClose: () => void;
  onDeleteClick: () => void;
  onUserUpdated?: () => Promise<void> | void;
  onEditClick?: (user: User) => void;
}

/**
 * Правый master-detail остров с карточкой пользователя, редактированием профиля, питомцами и историей приемов.
 */
export const AdminUserDetailIsland: React.FC<AdminUserDetailIslandProps> = ({
  user,
  onClose,
  onDeleteClick,
  onUserUpdated,
  onEditClick,
}) => {
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

  // When user changes, populate edit form and load pets & appointments
  useEffect(() => {
    setEditForm({
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setSaveSuccess(false);
    setErrorMessage(null);

    Promise.all([
      adminApi.getPets(0, 50).catch(() => ({ items: [] })),
      adminApi.getAppointments(0, 50).catch(() => ({ items: [] })),
    ]).then(([petsRes, apptsRes]) => {
      const allPets: Pet[] = petsRes?.items || [];
      const userPetList = allPets.filter((p) => p.ownerId === user.id);
      setUserPets(userPetList);

      const userPetIds = new Set(userPetList.map((p) => p.id));
      const allAppts: Appointment[] = apptsRes?.items || [];
      const userApptList = allAppts.filter((a) => userPetIds.has(a.petId));
      setUserAppointments(userApptList);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingUser(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateUser(user.id, {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await onUserUpdated?.();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Ошибка обновления пользователя'
      );
    } finally {
      setSavingUser(false);
    }
  };

  const rInfo = ROLE_META[user.role] || { label: user.role, cls: 'badge-outline' };

  return (
    <section className="island detail-island" style={{ width: 460 }} aria-label="Пользователь">
      <div className="island-head">
        <div className="row">
          <span className="avatar avatar-lg">{getUserInitials(user)}</span>
          <div className="col" style={{ gap: 2 }}>
            <span className="h2">
              {user.fullName || `${user.firstName} ${user.lastName}`}
            </span>
            <span
              className={`badge ${rInfo.cls}`}
              style={{ alignSelf: 'flex-start' }}
            >
              {rInfo.label}
            </span>
          </div>
        </div>
        <div className="row" style={{ gap: 4 }}>
          {onEditClick && (
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Редактировать в модальном окне"
              title="Редактировать"
              onClick={() => onEditClick(user)}
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="tabs-line">
        <button
          type="button"
          className={`tab-line ${activeTab === 'profile' ? 'on' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button
          type="button"
          className={`tab-line ${activeTab === 'pets' ? 'on' : ''}`}
          onClick={() => setActiveTab('pets')}
        >
          Питомцы <span className="small muted">{userPets.length}</span>
        </button>
        <button
          type="button"
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
              fullName собирает сервер · зарегистрирован {user.createdAt ? user.createdAt.slice(0, 10) : '—'}
            </span>

            {user.role === 'VETERINARIAN' && (
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
          onClick={handleSaveProfile}
          disabled={savingUser}
        >
          {savingUser ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </section>
  );
};
