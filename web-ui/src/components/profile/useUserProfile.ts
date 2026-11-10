'use client';

import { useState, useEffect, useRef } from 'react';
import { userApi } from '@/shared/api';
import { adminApi } from '@/modules/admin/api';
import { clientApi } from '@/modules/client/api';
import { vetApi } from '@/modules/vet/api';
import { useAuth } from '@/context/AuthContext';
import {
  formatApiError,
  formatDateShort,
  getMoscowDateKey,
  getMoscowTodayIso,
  getUserInitials,
  MOSCOW_TIMEZONE,
} from '@/shared/lib';
import type { Appointment } from '@/modules/client/types';
import type { User } from '@/shared/types';
import type { ProfileStats } from './ProfileIdentityCard';

const INITIAL_STATS: ProfileStats = {
  s1: { val: '—', label: '—' },
  s2: { val: '—', label: '—' },
  s3: { val: '—', label: '—' },
};

export function useUserProfile(onProfileUpdated?: (user: User) => void) {
  const { user: authUser, refreshUser } = useAuth();
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>(INITIAL_STATS);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    userApi
      .getMe()
      .then(async (data) => {
        if (cancelled) return;
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        });

        const regYear = data.createdAt
          ? Number(
              new Date(data.createdAt).toLocaleDateString('en-CA', {
                year: 'numeric',
                timeZone: MOSCOW_TIMEZONE,
              })
            ) || '—'
          : '—';

        if (data.role === 'ADMIN') {
          const [vetsRes, usersRes] = await Promise.all([
            adminApi.getVeterinarians().catch(() => null),
            adminApi.getUsers(0, 1).catch(() => null),
          ]);
          if (cancelled) return;
          setStats({
            s1: { val: Array.isArray(vetsRes) ? vetsRes.length : '—', label: 'врачей' },
            s2: { val: usersRes ? usersRes.totalElements : '—', label: 'пользователей' },
            s3: { val: regYear, label: 'с года' },
          });
        } else if (data.role === 'CLIENT') {
          const summary = await clientApi.getSummary().catch(() => null);
          if (cancelled) return;
          setStats({
            s1: { val: summary ? summary.activePets : '—', label: 'питомцы' },
            s2: { val: summary ? summary.upcomingAppointments : '—', label: 'впереди' },
            s3: { val: summary ? summary.completedAppointments : '—', label: 'приёмов' },
          });
        } else if (data.role === 'VETERINARIAN') {
          const [appts, patients, prof] = await Promise.all([
            vetApi.getAppointments(0, 100).catch(() => null),
            vetApi.getPatients().catch(() => null),
            vetApi.getProfile().catch(() => null),
          ]);
          if (cancelled) return;
          const apptList: Appointment[] = appts?.items || [];
          const todayIso = getMoscowTodayIso();
          setStats({
            s1: {
              val: appts ? apptList.filter((a) => getMoscowDateKey(a.startAt) === todayIso).length : '—',
              label: 'приёмов сегодня',
            },
            s2: { val: Array.isArray(patients) ? patients.length : '—', label: 'пациентов' },
            s3: { val: prof?.experienceYears ?? '—', label: 'лет стажа' },
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(formatApiError(err, 'Не удалось загрузить профиль'));
        const fallback = authUserRef.current;
        if (fallback) {
          setFormData({
            firstName: fallback.firstName || '',
            middleName: fallback.middleName || '',
            lastName: fallback.lastName || '',
            email: fallback.email || '',
            phone: fallback.phone || '',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

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
      await refreshUser();
      setSaveSuccess(true);
      onProfileUpdated?.(updated);
    } catch (err) {
      setSaveError(formatApiError(err, 'Не удалось сохранить изменения'));
    } finally {
      setSaving(false);
    }
  };

  const role = user?.role || authUser?.role || 'CLIENT';
  const regDateLabel = user?.createdAt ? formatDateShort(user.createdAt) : '—';
  const roleBadgeLabel =
    role === 'ADMIN'
      ? 'Администратор'
      : role === 'VETERINARIAN'
      ? 'Ветеринар'
      : user?.createdAt
      ? `Клиент с ${regDateLabel}`
      : 'Клиент';

  const initials = getUserInitials({
    firstName: formData.firstName || user?.firstName,
    lastName: formData.lastName || user?.lastName,
    fullName: user?.fullName,
  });

  const fullName =
    `${formData.firstName} ${formData.lastName}`.trim() || user?.fullName || 'Пользователь';
  const fInitial = formData.firstName ? `${formData.firstName.charAt(0)}.` : '';
  const mInitial = formData.middleName ? ` ${formData.middleName.charAt(0)}.` : '';
  const lPart = formData.lastName ? ` ${formData.lastName}` : '';
  const shortName = `${fInitial}${mInitial}${lPart}`.trim() || fullName;

  return {
    role,
    regDateLabel,
    roleBadgeLabel,
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
  };
}
