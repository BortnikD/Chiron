'use client';

import { useState, useEffect, useRef } from 'react';
import { userApi } from '@/shared/api';
import { adminApi } from '@/modules/admin/api';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import { vetApi } from '@/modules/vet/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/shared/components';
import {
  formatApiError,
  formatDateShort,
  getMoscowDateKey,
  getMoscowTodayIso,
  getSpecTone,
  getUserInitials,
  MOSCOW_TIMEZONE,
  toIdNameMap,
  type PhotoEntity,
} from '@/shared/lib';
import { SPECIALIZATION_NAMES_RU } from '@/utils/doctorHelpers';
import type { Appointment } from '@/modules/client/types';
import type { User } from '@/shared/types';
import type { ProfileStats, SecondaryBadge } from './ProfileIdentityCard';

const INITIAL_STATS: ProfileStats = {
  s1: { val: '—', label: '—' },
  s2: { val: '—', label: '—' },
  s3: { val: '—', label: '—' },
};

export function useUserProfile(onProfileUpdated?: (user: User) => void) {
  const { user: authUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>(INITIAL_STATS);
  const [vetSpecBadge, setVetSpecBadge] = useState<SecondaryBadge | null>(null);
  const [vetPhoto, setVetPhoto] = useState<PhotoEntity | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const onVetProfileUpdated = (event: Event) => {
      const custom = event as CustomEvent<PhotoEntity | undefined>;
      if (custom.detail) {
        setVetPhoto({
          photoUrl: custom.detail.photoUrl ?? null,
          photoThumbnailUrl: custom.detail.photoThumbnailUrl ?? null,
          photoUrlExpiresAt: custom.detail.photoUrlExpiresAt ?? null,
        });
      }
    };
    window.addEventListener('chiron:vet-profile-updated', onVetProfileUpdated);
    return () => window.removeEventListener('chiron:vet-profile-updated', onVetProfileUpdated);
  }, []);

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
          setVetSpecBadge(null);
          setVetPhoto(null);
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
          setVetSpecBadge(null);
          setVetPhoto(null);
          const summary = await clientApi.getSummary().catch(() => null);
          if (cancelled) return;
          setStats({
            s1: { val: summary ? summary.activePets : '—', label: 'питомцы' },
            s2: { val: summary ? summary.upcomingAppointments : '—', label: 'впереди' },
            s3: { val: summary ? summary.completedAppointments : '—', label: 'приёмов' },
          });
        } else if (data.role === 'VETERINARIAN') {
          const todayIso = getMoscowTodayIso();
          const tomorrowIso = getMoscowTodayIso(1);
          const todayFrom = new Date(`${todayIso}T00:00:00+03:00`).toISOString();
          const todayTo = new Date(`${tomorrowIso}T00:00:00+03:00`).toISOString();
          const [appts, prof, specs] = await Promise.all([
            vetApi.getAppointments({ page: 0, size: 100, from: todayFrom, to: todayTo }).catch(() => null),
            vetApi.getProfile().catch(() => null),
            clinicApi.getSpecializations().catch(() => []),
          ]);
          if (cancelled) return;
          setVetPhoto(
            prof
              ? {
                  photoUrl: prof.photoUrl,
                  photoThumbnailUrl: prof.photoThumbnailUrl,
                  photoUrlExpiresAt: prof.photoUrlExpiresAt,
                }
              : null
          );
          const apptList: Appointment[] = appts?.items || [];
          const specsMap = toIdNameMap(Array.isArray(specs) ? specs : []);
          const rawSpecName =
            prof?.specialization?.name ||
            (prof?.specializationId ? specsMap[prof.specializationId] : undefined) ||
            (prof?.specializationId ? SPECIALIZATION_NAMES_RU[prof.specializationId] : undefined);
          if (rawSpecName) {
            setVetSpecBadge({
              label: SPECIALIZATION_NAMES_RU[rawSpecName] || rawSpecName,
              tone: getSpecTone(prof?.specializationId),
            });
          } else {
            setVetSpecBadge(null);
          }

          setStats({
            s1: {
              val: appts
                ? apptList.filter(
                    (a) => getMoscowDateKey(a.startAt) === todayIso && a.status !== 'CANCELLED'
                  ).length
                : '—',
              label: 'приёмов сегодня',
            },
            s2: { val: '…', label: 'пациентов' },
            s3: { val: prof?.experienceYears ?? '—', label: 'лет стажа' },
          });

          void vetApi
            .getPatientsPage({ page: 0, size: 1 })
            .then((res) => {
              if (!cancelled) {
                setStats((prev) => ({
                  ...prev,
                  s2: { val: res?.totalElements ?? 0, label: 'пациентов' },
                }));
              }
            })
            .catch(() => {
              if (!cancelled) {
                setStats((prev) => ({
                  ...prev,
                  s2: { val: '—', label: 'пациентов' },
                }));
              }
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
    const normalizedPhone = formData.phone.replace(/[\s()-]/g, '').trim();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setSaveError('Заполните обязательные поля: имя, фамилия и email');
      return;
    }
    if (normalizedPhone && !/^\+?\d{10,15}$/.test(normalizedPhone)) {
      setSaveError('Телефон должен содержать от 10 до 15 цифр (например, +79001234567)');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const updated = await userApi.updateMe({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: normalizedPhone || undefined,
      });
      setUser(updated);
      await refreshUser();
      setSaveSuccess(true);
      toast('Профиль сохранён');
      onProfileUpdated?.(updated);
    } catch (err) {
      const msg = formatApiError(err, 'Не удалось сохранить изменения');
      setSaveError(msg);
      toast('Ошибка сохранения профиля', msg, 'err');
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
  };
}
