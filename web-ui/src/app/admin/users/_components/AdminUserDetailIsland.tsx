'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Trash2,
  Stethoscope,
  AlertCircle,
  Check,
  Edit2,
} from 'lucide-react';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { USER_ROLE_META, formatApiError, formatDateShort, getUserInitials } from '@/shared/lib';
import { UserRelationsTabs } from './UserRelationsTabs';

export interface AdminUserDetailIslandProps {
  user: User;
  pets: Pet[];
  appointments: Appointment[];
  veterinarians: Veterinarian[];
  speciesList: Species[];
  services: Service[];
  loadingDetails: boolean;
  detailsError: string | null;
  onClose: () => void;
  onDeleteClick: () => void;
  onSaveProfile: (id: string, data: Partial<User>) => Promise<User>;
  onEditClick?: (user: User) => void;
}

/**
 * Правый master-detail остров с карточкой пользователя, редактированием профиля, питомцами и историей приемов.
 */
export const AdminUserDetailIsland: React.FC<AdminUserDetailIslandProps> = ({
  user,
  pets,
  appointments,
  veterinarians,
  speciesList,
  services,
  loadingDetails,
  detailsError,
  onClose,
  onDeleteClick,
  onSaveProfile,
  onEditClick,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'pets' | 'appointments'>('profile');

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
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

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
  }, [user]);

  const handleSaveProfile = async () => {
    const normalizedPhone = editForm.phone.replace(/[\s()-]/g, '').trim();
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      setErrorMessage('Заполните обязательные поля: имя, фамилия и email');
      setActiveTab('profile');
      return;
    }
    if (normalizedPhone && !/^\+?\d{10,15}$/.test(normalizedPhone)) {
      setErrorMessage('Телефон должен содержать от 10 до 15 цифр (например, +79001234567)');
      setActiveTab('profile');
      return;
    }

    setSavingUser(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await onSaveProfile(user.id, {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: normalizedPhone,
      });
      setSaveSuccess(true);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Ошибка обновления пользователя'));
      setActiveTab('profile');
    } finally {
      setSavingUser(false);
    }
  };

  const rInfo = USER_ROLE_META[user.role] || { label: user.role, cls: 'badge-outline' };
  const vetProfile = veterinarians.find((v) => v.userId === user.id);
  const fullPreview =
    [editForm.lastName, editForm.firstName, editForm.middleName].filter(Boolean).join(' ') || '—';

  return (
    <section className="island detail-island" aria-label="Пользователь">
      <div className="island-head">
        <div className="row">
          <span className="avatar avatar-lg">{getUserInitials(user, 'ПЛ')}</span>
          <div className="col" style={{ gap: 2 }}>
            <span className="h2">
              {user.fullName || `${user.firstName} ${user.lastName}`}
            </span>
            <span className={`badge ${rInfo.cls}`} style={{ alignSelf: 'flex-start' }}>
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
          Питомцы <span className="small muted">{pets.length}</span>
        </button>
        <button
          type="button"
          className={`tab-line ${activeTab === 'appointments' ? 'on' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Записи <span className="small muted">{appointments.length}</span>
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {activeTab === 'profile' && (
          <div className="col" style={{ gap: 14 }}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="ud-first">
                  Имя <span className="req">*</span>
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
                  Фамилия <span className="req">*</span>
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
                  Email <span className="req">*</span>
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
              fullName собирает сервер: «{fullPreview}» · зарегистрирован{' '}
              {user.createdAt ? formatDateShort(user.createdAt) : '—'}
            </span>

            {user.role === 'VETERINARIAN' && (
              <div className="alert alert-info">
                <Stethoscope size={16} className="ic" />
                <div className="col" style={{ gap: 6 }}>
                  <span>
                    {vetProfile
                      ? 'Профиль врача привязан к этой учётной записи. График, специализация и допуски настраиваются в разделе «Врачи».'
                      : 'Пользователь имеет роль ветеринара, но профиль врача ещё не создан.'}
                  </span>
                  <Link
                    href={
                      vetProfile
                        ? `/admin/veterinarians?sel=${vetProfile.id}`
                        : `/admin/veterinarians?userId=${user.id}`
                    }
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {vetProfile ? 'Открыть профиль врача' : 'Создать профиль врача'}
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{errorMessage}</div>
              </div>
            )}

            {saveSuccess && (
              <div className="alert alert-success" role="status">
                <Check size={16} className="ic" />
                <div>Данные пользователя сохранены</div>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'pets' || activeTab === 'appointments') && (
          <UserRelationsTabs
            activeTab={activeTab}
            pets={pets}
            appointments={appointments}
            speciesList={speciesList}
            services={services}
            veterinarians={veterinarians}
            loading={loadingDetails}
            error={detailsError}
          />
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
