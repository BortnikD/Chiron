'use client';

import React, { useEffect, useState } from 'react';
import { vetApi } from '../../../api';
import { Veterinarian } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { Stethoscope, Check, AlertCircle, Award, User } from 'lucide-react';

export default function VetProfilePage() {
  const [profile, setProfile] = useState<Veterinarian | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    bio: '',
    photoUrl: '',
    experienceYears: 0,
  });

  useEffect(() => {
    vetApi
      .getProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          bio: data.bio || '',
          photoUrl: data.photoUrl || '',
          experienceYears: data.experienceYears || 0,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const updated = await vetApi.updateProfile({
        bio: form.bio.trim() || null,
        photoUrl: form.photoUrl.trim() || null,
        experienceYears: Number(form.experienceYears),
      });
      setProfile(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.user?.fullName || `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim() || 'Ветеринарный врач';
  const initials = `${profile?.user?.firstName?.charAt(0) || ''}${profile?.user?.lastName?.charAt(0) || ''}` || 'ВР';

  return (
    <AppShell
      title="Профиль врача"
      subtitle="Публичная информация, квалификация и биография"
    >
      <div className="flex flex-col gap-2 p-1 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка профиля специалиста...
          </div>
        ) : (
          <section className="island p-6 flex flex-col gap-6">
            {/* Карточка профиля врача */}
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
              <span className="avatar w-14 h-14 text-base font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0 shadow-sm">
                {initials}
              </span>
              <div className="flex flex-col min-w-0">
                <h2 className="text-base font-bold truncate text-[var(--foreground)]">{name}</h2>
                <span className="text-xs text-[var(--muted-foreground)] truncate">
                  {profile?.specialization?.name || 'Терапевт'} · Ветеринарная клиника Chiron
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)] font-mono mt-0.5">
                  {profile?.user?.email}
                </span>
              </div>
            </div>

            {success && (
              <div className="alert p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Профиль успешно сохранён и обновлён в публичном каталоге</span>
              </div>
            )}

            {error && (
              <div className="alert p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="field">
                <label className="field-label text-xs">Стаж практической работы (лет)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                  className="input text-xs font-mono max-w-xs"
                />
              </div>

              <div className="field">
                <label className="field-label text-xs">Биография и область профессиональных интересов</label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Опишите опыт, специализацию, курсы повышения квалификации..."
                  className="textarea text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary h-9 px-5 text-xs flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Сохранение...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Сохранить изменения</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </AppShell>
  );
}
