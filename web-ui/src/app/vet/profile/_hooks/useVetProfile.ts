import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type React from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export interface VetPracticeForm {
  bio: string;
  experienceYears: number;
}

export function useVetProfile() {
  const { toast } = useToast();
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);
  const [specsMap, setSpecsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<VetPracticeForm>({
    bio: '',
    experienceYears: 0,
  });

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [data, specs] = await Promise.all([
        vetApi.getProfile(),
        clinicApi.getSpecializations().catch(() => []),
      ]);
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;
      setVetProfile(data);
      setSpecsMap(toIdNameMap(Array.isArray(specs) ? specs : []));
      setForm({
        bio: data.bio || '',
        experienceYears: data.experienceYears || 0,
      });
    } catch (err: unknown) {
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;
      setLoadError(formatApiError(err, 'Не удалось загрузить профиль врача'));
    } finally {
      if (isMountedRef.current && seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setSuccess(false);
      setError(null);

      const rawExp = Number(form.experienceYears);
      if (!Number.isFinite(rawExp) || rawExp < 0 || rawExp > 70) {
        setError('Стаж должен быть числом от 0 до 70 лет');
        return;
      }

      const trimmedBio = form.bio.trim();
      if (trimmedBio.length > 4000) {
        setError('Описание не должно превышать 4000 символов');
        return;
      }

      setSaving(true);
      try {
        const updated = await vetApi.updateProfile({
          bio: trimmedBio || null,
          experienceYears: Math.trunc(rawExp),
        });
        if (!isMountedRef.current) return;
        setVetProfile(updated);
        setForm({
          bio: updated.bio || '',
          experienceYears: updated.experienceYears || 0,
        });
        setSuccess(true);
        toast('Профиль врача сохранён', 'Карточка в каталоге клиники обновлена');
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        const message = formatApiError(err, 'Не удалось обновить данные практики');
        setError(message);
        toast('Не удалось сохранить профиль', message, 'err');
      } finally {
        if (isMountedRef.current) {
          setSaving(false);
        }
      }
    },
    [form, toast]
  );

  const uploadOwnPhoto = useCallback(
    async (file: File) => {
      const links = await vetApi.uploadOwnPhoto(file);
      if (!isMountedRef.current) return;
      setVetProfile((prev) =>
        prev
          ? {
              ...prev,
              photoUrl: links.photoUrl,
              photoThumbnailUrl: links.photoThumbnailUrl,
              photoUrlExpiresAt: links.photoUrlExpiresAt,
            }
          : prev
      );
      window.dispatchEvent(new CustomEvent('chiron:vet-profile-updated', { detail: links }));
      toast('Фотография обновлена', 'Изображение сохранено в профиле врача');
    },
    [toast]
  );

  const deleteOwnPhoto = useCallback(async () => {
    await vetApi.deleteOwnPhoto();
    if (!isMountedRef.current) return;
    const empty = { photoUrl: null, photoThumbnailUrl: null, photoUrlExpiresAt: null };
    setVetProfile((prev) => (prev ? { ...prev, ...empty } : prev));
    window.dispatchEvent(new CustomEvent('chiron:vet-profile-updated', { detail: empty }));
    toast('Фотография удалена', 'В карточке снова отображаются инициалы');
  }, [toast]);

  const memoSpecsMap = useMemo(() => specsMap, [specsMap]);

  return {
    vetProfile,
    specsMap: memoSpecsMap,
    form,
    setForm,
    loading,
    loadError,
    reload: loadProfile,
    saving,
    success,
    error,
    handleSubmit,
    uploadOwnPhoto,
    deleteOwnPhoto,
  };
}
