'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@/shared/types';
import { User as UserIcon, Check, AlertCircle } from 'lucide-react';
import { ProfileIdentityCard } from './ProfileIdentityCard';
import { useUserProfile } from './useUserProfile';

interface UserProfileCardProps {
  onProfileUpdated?: (user: User) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onProfileUpdated }) => {
  const {
    role,
    regDateLabel,
    roleBadgeLabel,
    vetSpecBadge,
    vetPhoto,
    initials,
    fullName,
    shortName,
    loading,
    loadError,
    saving,
    saveSuccess,
    saveError,
    stats,
    formData,
    setFormData,
    user,
    handleProfileSubmit,
  } = useUserProfile(onProfileUpdated);

  if (loading) {
    return (
      <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
        Загрузка данных профиля...
      </div>
    );
  }

  const settingsHref =
    role === 'ADMIN' ? '/admin/settings' : role === 'VETERINARIAN' ? '/vet/settings' : '/client/settings';

  return (
    <div className="prof-grid">
      <ProfileIdentityCard
        roleClass={`tone-${role}`}
        initials={initials}
        photo={vetPhoto}
        fullName={fullName}
        email={formData.email || user?.email || '—'}
        phone={formData.phone || user?.phone || '—'}
        roleBadgeLabel={roleBadgeLabel}
        secondaryBadge={vetSpecBadge}
        regDateLabel={regDateLabel}
        stats={stats}
      />

      <section className="island">
        <div className="island-head">
          <span className="island-title">
            <UserIcon className="ic" />
            Профиль
          </span>
          <span className="small muted">
            {role === 'CLIENT'
              ? `Будет отображаться как «${shortName}»`
              : `Отображается как «${shortName}»`}
          </span>
        </div>

        <div className="island-body">
          {loadError && (
            <div className="alert alert-destructive" role="alert" style={{ marginBottom: '14px' }}>
              <AlertCircle className="ic" />
              <span>{loadError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="alert alert-success" role="status" style={{ marginBottom: '14px' }}>
              <Check className="ic" />
              <span>Данные профиля успешно сохранены</span>
            </div>
          )}

          {saveError && (
            <div className="alert alert-destructive" role="alert" style={{ marginBottom: '14px' }}>
              <AlertCircle className="ic" />
              <span>{saveError}</span>
            </div>
          )}

          <form id="user-profile-form" onSubmit={handleProfileSubmit}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="pf-first">
                  Имя
                </label>
                <input
                  className="input"
                  id="pf-first"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-middle">
                  Отчество
                </label>
                <input
                  className="input"
                  id="pf-middle"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="pf-last">
                  Фамилия
                </label>
                <input
                  className="input"
                  id="pf-last"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-email">
                  Email
                </label>
                <input
                  className="input"
                  id="pf-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-phone">
                  Телефон
                </label>
                <input
                  className="input"
                  id="pf-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-role">
                  Роль
                </label>
                <input
                  className="input"
                  id="pf-role"
                  value={
                    role === 'ADMIN'
                      ? 'Администратор'
                      : role === 'VETERINARIAN'
                      ? 'Ветеринар'
                      : 'Клиент'
                  }
                  readOnly
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-created">
                  Дата регистрации
                </label>
                <input className="input" id="pf-created" value={regDateLabel} readOnly />
              </div>
            </div>
          </form>
        </div>

        <div className="island-foot">
          <Link href={settingsHref} className="small muted" style={{ textDecoration: 'none' }}>
            Смена пароля в настройках
          </Link>
          <button
            type="submit"
            form="user-profile-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </section>
    </div>
  );
};
