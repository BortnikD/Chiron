import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type React from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export interface VetPracticeForm {
  bio: string;
  photoUrl: string;
  experienceYears: number;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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
    photoUrl: '',
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
        photoUrl: data.photoUrl || '',
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

      const trimmedPhoto = form.photoUrl.trim();
      if (trimmedPhoto) {
        if (trimmedPhoto.length > 2048) {
          setError('Ссылка на фото не должна превышать 2048 символов');
          return;
        }
        if (!isValidHttpUrl(trimmedPhoto)) {
          setError('Укажите корректную ссылку на фото (начинается с https:// или http://)');
          return;
        }
      }

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
          photoUrl: trimmedPhoto || null,
          experienceYears: Math.trunc(rawExp),
        });
        if (!isMountedRef.current) return;
        setVetProfile(updated);
        setForm({
          bio: updated.bio || '',
          photoUrl: updated.photoUrl || '',
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
  };
}
