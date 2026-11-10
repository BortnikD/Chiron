import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type React from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Veterinarian } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export interface VetPracticeForm {
  bio: string;
  photoUrl: string;
  experienceYears: number;
}

export function useVetProfile() {
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
      setSaving(true);
      setSuccess(false);
      setError(null);
      try {
        const exp = Number(form.experienceYears);
        const updated = await vetApi.updateProfile({
          bio: form.bio.trim() || null,
          photoUrl: form.photoUrl.trim() || null,
          experienceYears: Number.isFinite(exp) ? Math.max(0, Math.min(60, Math.trunc(exp))) : 0,
        });
        if (!isMountedRef.current) return;
        setVetProfile(updated);
        setForm({
          bio: updated.bio || '',
          photoUrl: updated.photoUrl || '',
          experienceYears: updated.experienceYears || 0,
        });
        setSuccess(true);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setError(formatApiError(err, 'Не удалось обновить данные практики'));
      } finally {
        if (isMountedRef.current) {
          setSaving(false);
        }
      }
    },
    [form]
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
