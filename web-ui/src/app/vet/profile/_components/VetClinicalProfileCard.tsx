'use client';

import React from 'react';
import { Stethoscope, Check, AlertCircle } from 'lucide-react';
import type { Veterinarian } from '@/modules/clinic/types';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface VetPracticeFormData {
  bio: string;
  photoUrl: string;
  experienceYears: number;
}

export interface VetClinicalProfileCardProps {
  vetProfile: Veterinarian | null;
  specsMap: Record<string, string>;
  form: VetPracticeFormData;
  loading: boolean;
  saving: boolean;
  success: boolean;
  error: string | null;
  onChange: React.Dispatch<React.SetStateAction<VetPracticeFormData>>;
  onSubmit: (e?: React.FormEvent) => Promise<void> | void;
}

export function VetClinicalProfileCard({
  vetProfile,
  specsMap,
  form,
  loading,
  saving,
  success,
  error,
  onChange,
  onSubmit,
}: VetClinicalProfileCardProps) {
  if (loading) {
    return (
      <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
        Загрузка профиля специалиста...
      </div>
    );
  }

  const specializationName = vetProfile
    ? getDoctorDisplay(vetProfile, specsMap).specName
    : 'Общая терапия';

  return (
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
          <div className="alert alert-success" role="status" style={{ marginBottom: '14px' }}>
            <Check className="ic" />
            <span>Данные практики успешно обновлены</span>
          </div>
        )}

        {error && (
          <div className="alert alert-destructive" role="alert" style={{ marginBottom: '14px' }}>
            <AlertCircle className="ic" />
            <span>{error}</span>
          </div>
        )}

        <form id="vet-practice-form" onSubmit={onSubmit}>
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
                  onChange((prev) => ({
                    ...prev,
                    experienceYears: parseInt(e.target.value, 10) || 0,
                  }))
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
                onChange={(e) => onChange((prev) => ({ ...prev, photoUrl: e.target.value }))}
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
                onChange={(e) => onChange((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Расскажите об опыте, образовании и профильных направлениях лечения..."
              />
            </div>
          </div>
        </form>
      </div>

      <div className="island-foot">
        <span className="small muted">
          Специализация: <b>{specializationName}</b>
        </span>
        <button
          type="submit"
          form="vet-practice-form"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </section>
  );
}
