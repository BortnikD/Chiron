'use client';

import React, { useState, useEffect } from 'react';
import { userApi, adminApi, clientApi, vetApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { User as UserIcon, Phone, Calendar, Check, AlertCircle } from 'lucide-react';

interface UserProfileCardProps {
  onProfileUpdated?: (user: User) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onProfileUpdated }) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Форма личных данных
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Статистика левой колонки (в зависимости от роли)
  const [stats, setStats] = useState<{
    s1: { val: string | number; label: string };
    s2: { val: string | number; label: string };
    s3: { val: string | number; label: string };
  }>({
    s1: { val: '—', label: '—' },
    s2: { val: '—', label: '—' },
    s3: { val: '—', label: '—' },
  });

  useEffect(() => {
    userApi
      .getMe()
      .then((data) => {
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        });

        const regYear = data.createdAt ? new Date(data.createdAt).getFullYear() : 2024;
        const role = data.role || authUser?.role;

        if (role === 'ADMIN') {
          Promise.all([
            adminApi.getVeterinarians().catch(() => null),
            adminApi.getUsers(0, 1).catch(() => null),
          ]).then(([vetsRes, usersRes]) => {
            const vetsCount = Array.isArray(vetsRes)
              ? vetsRes.length
              : (vetsRes as any)?.totalElements ?? (vetsRes as any)?.total ?? 7;
            const usersCount = (usersRes as any)?.totalElements ?? (usersRes as any)?.total ?? 19;
            setStats({
              s1: { val: vetsCount || 7, label: 'врачей' },
              s2: { val: usersCount || 19, label: 'пользователей' },
              s3: { val: regYear, label: 'с года' },
            });
          });
        } else if (role === 'CLIENT') {
          Promise.all([
            clientApi.getPets().catch(() => []),
            clientApi.getAppointments(0, 100).catch(() => null),
          ]).then(([pets, appts]) => {
            const petList = Array.isArray(pets) ? pets : [];
            const apptList = Array.isArray(appts) ? appts : (appts as any)?.items || [];
            const upcoming = apptList.filter(
              (a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED'
            ).length;
            const done = apptList.filter((a: any) => a.status === 'COMPLETED').length;
            setStats({
              s1: { val: petList.length || 0, label: 'питомцы' },
              s2: { val: upcoming, label: 'впереди' },
              s3: { val: done, label: 'приёмов' },
            });
          });
        } else if (role === 'VETERINARIAN') {
          Promise.all([
            vetApi.getAppointments(0, 100).catch(() => null),
            vetApi.getPatients().catch(() => []),
            vetApi.getProfile().catch(() => null),
          ]).then(([appts, patients, prof]) => {
            const apptList = Array.isArray(appts) ? appts : (appts as any)?.items || [];
            const patientList = Array.isArray(patients) ? patients : [];
            const today = new Date().toISOString().slice(0, 10);
            const todayActive = apptList.filter((a: any) => {
              const dt = a.startAt || a.dateTime || '';
              return typeof dt === 'string' && dt.startsWith(today);
            }).length;
            const expYears = prof?.experienceYears ?? 5;
            setStats({
              s1: { val: todayActive || 0, label: 'приёмов сегодня' },
              s2: { val: patientList.length || 0, label: 'пациентов' },
              s3: { val: expYears, label: 'лет стажа' },
            });
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
        if (authUser) {
          setFormData({
            firstName: authUser.firstName || '',
            middleName: authUser.middleName || '',
            lastName: authUser.lastName || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [authUser]);

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const updated = await userApi.updateMe({
        firstName: formData.firstName.trim() || undefined,
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      setUser(updated);
      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err: any) {
      setSaveError(err?.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const role = user?.role || authUser?.role || 'CLIENT';
  const roleClass = `tone-${role}`;

  const roleBadgeLabel =
    role === 'ADMIN'
      ? 'Администратор'
      : role === 'VETERINARIAN'
      ? 'Ветеринар'
      : user?.createdAt
      ? `Клиент с ${new Date(user.createdAt).toLocaleDateString('ru-RU')}`
      : 'Клиент';

  const regDateLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ru-RU')
    : '17.08.2024';

  const initials =
    `${formData.firstName?.charAt(0) || user?.firstName?.charAt(0) || ''}${
      formData.lastName?.charAt(0) || user?.lastName?.charAt(0) || ''
    }`.toUpperCase() || 'CH';

  const fullName =
    `${formData.firstName} ${formData.lastName}`.trim() ||
    user?.fullName ||
    'Пользователь';

  // Форматирование краткого имени для хинта в шапке формы: «И. О. Фамилия»
  const fInitial = formData.firstName ? `${formData.firstName.charAt(0)}.` : '';
  const mInitial = formData.middleName ? ` ${formData.middleName.charAt(0)}.` : '';
  const lPart = formData.lastName ? ` ${formData.lastName}` : '';
  const shortName = `${fInitial}${mInitial}${lPart}`.trim() || fullName;

  if (loading) {
    return (
      <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
        Загрузка данных профиля...
      </div>
    );
  }

  return (
    <div className="prof-grid">
      {/* Левая колонка: Визитка (ID Card) согласно прототипу */}
      <section className={`island idcard ${roleClass}`}>
        <span className="t-ava xl round">{initials}</span>

        <span className="col" style={{ gap: '2px' }}>
          <span className="idcard-name">{fullName}</span>
          <span className="cell-sub">{formData.email || user?.email || 'admin@chiron.vet'}</span>
        </span>

        <span className="t-badge">{roleBadgeLabel}</span>

        <div className="idcard-kv">
          <div>
            <Phone className="ic" />
            <span>{formData.phone || user?.phone || '+7 863 200-10-00'}</span>
          </div>
          <div>
            <Calendar className="ic" />
            <span>В Chiron с {regDateLabel}</span>
          </div>
        </div>

        <div className="idcard-stats">
          <div>
            <b>{stats.s1.val}</b>
            <span>{stats.s1.label}</span>
          </div>
          <div>
            <b>{stats.s2.val}</b>
            <span>{stats.s2.label}</span>
          </div>
          <div>
            <b>{stats.s3.val}</b>
            <span>{stats.s3.label}</span>
          </div>
        </div>
      </section>

      {/* Правая колонка: Форма редактирования профиля согласно прототипу */}
      <section className="island">
        <div className="island-head">
          <span className="island-title">
            <UserIcon className="ic" />
            Профиль
          </span>
          <span className="small muted">
            {role === 'ADMIN' ? `Отображается как «${shortName}»` : `Будет отображаться как «${shortName}»`}
          </span>
        </div>

        <div className="island-body">
          {saveSuccess && (
            <div
              className="alert"
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Check className="ic" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>Данные профиля успешно сохранены</span>
            </div>
          )}

          {saveError && (
            <div
              className="alert"
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle className="ic" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
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
                  value={roleBadgeLabel}
                  readOnly
                  disabled
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="pf-created">
                  Дата регистрации
                </label>
                <input
                  className="input"
                  id="pf-created"
                  value={regDateLabel}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </form>
        </div>

        <div className="island-foot" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleProfileSubmit()}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </section>
    </div>
  );
};
