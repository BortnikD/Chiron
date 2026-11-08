'use client';

import React, { useEffect, useState } from 'react';
import { vetApi } from '../../../api';
import { Veterinarian } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { UserProfileCard } from '../../../components/profile/UserProfileCard';
import { Stethoscope, Check, AlertCircle, User as UserIcon } from 'lucide-react';

export default function VetProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'practice'>('profile');
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);
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
        setVetProfile(data);
        setForm({
          bio: data.bio || '',
          photoUrl: data.photoUrl || '',
          experienceYears: data.experienceYears || 0,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePracticeSubmit = async (e: React.FormEvent) => {
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
      setVetProfile(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Не удалось обновить данные практики');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Профиль">
      <div className="scroll-col grow">
        <div className="flex flex-col gap-2 max-w-[1120px] w-full">
          {/* Переключатель вкладок в стиле .seg */}
          <div className="seg self-start" role="tablist">
            <button
              type="button"
              className={`seg-item ${activeTab === 'profile' ? 'on font-semibold' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Личный профиль</span>
            </button>
            <button
              type="button"
              className={`seg-item ${activeTab === 'practice' ? 'on font-semibold' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <Stethoscope className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Врачебная практика</span>
            </button>
          </div>

          {activeTab === 'profile' ? (
            <UserProfileCard />
          ) : loading ? (
            <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка профиля специалиста...
            </div>
          ) : (
            <section className="island">
              <div className="island-head">
                <span className="island-title">
                  <Stethoscope className="ic" />
                  Врачебная практика
                </span>
                <span className="small muted">Публичная информация в каталоге клиники</span>
              </div>

              <div className="island-body">
                {success && (
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
                    <span>Данные практики успешно обновлены</span>
                  </div>
                )}

                {error && (
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
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handlePracticeSubmit}>
                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label" htmlFor="vt-exp">
                        Стаж практической работы (лет)
                      </label>
                      <input
                        id="vt-exp"
                        type="number"
                        min="0"
                        max="60"
                        className="input"
                        value={form.experienceYears}
                        onChange={(e) =>
                          setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="vt-photo">
                        Ссылка на фотографию
                      </label>
                      <input
                        id="vt-photo"
                        type="url"
                        className="input"
                        value={form.photoUrl}
                        onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="field span-2">
                      <label className="field-label" htmlFor="vt-bio">
                        Биография и направления работы
                      </label>
                      <textarea
                        id="vt-bio"
                        className="textarea"
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        placeholder="Расскажите об опыте, образовании и профильных направлениях лечения..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="island-foot">
                <span className="small muted">
                  Специализация:{' '}
                  <b>{vetProfile?.specialization?.name || 'Общая терапия'}</b>
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePracticeSubmit}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
