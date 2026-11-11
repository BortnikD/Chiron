'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Stethoscope, Eye, Check, AlertCircle } from 'lucide-react';
import { clinicApi } from '@/modules/clinic/api';
import type { Species, Veterinarian } from '@/modules/clinic/types';
import { useAuth } from '@/context/AuthContext';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getSpecTone, getSpeciesTone, pluralRu, toIdNameMap } from '@/shared/lib';

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

function isPreviewImageUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^https?:\/\/.+/i.test(trimmed);
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
  const { user } = useAuth();
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [permIds, setPermIds] = useState<string[]>([]);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [form.photoUrl]);

  useEffect(() => {
    let cancelled = false;
    clinicApi
      .getSpecies()
      .then((res) => {
        if (!cancelled) setSpeciesList(Array.isArray(res) ? res : []);
      })
      .catch(() => {});

    if (vetProfile?.id && (!vetProfile.speciesIds || vetProfile.speciesIds.length === 0)) {
      clinicApi
        .getVetSpeciesPermissions(vetProfile.id)
        .then((perms) => {
          if (!cancelled && Array.isArray(perms)) {
            setPermIds(perms.map((p) => p.speciesId));
          }
        })
        .catch(() => {});
    } else if (vetProfile?.speciesIds) {
      setPermIds(vetProfile.speciesIds);
    }

    return () => {
      cancelled = true;
    };
  }, [vetProfile?.id, vetProfile?.speciesIds]);

  const resolvedVet = useMemo(
    () =>
      vetProfile
        ? { ...vetProfile, user: vetProfile.user ?? user ?? undefined }
        : user
          ? { user }
          : null,
    [vetProfile, user]
  );

  const doc = useMemo(() => getDoctorDisplay(resolvedVet, specsMap), [resolvedVet, specsMap]);
  const specTone = getSpecTone(vetProfile?.specializationId);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const permittedSpecies = useMemo(() => {
    const activeIds =
      vetProfile?.speciesIds && vetProfile.speciesIds.length > 0 ? vetProfile.speciesIds : permIds;
    return activeIds
      .map((id) => speciesList.find((s) => s.id === id) || { id, name: speciesMap[id] || 'Вид' })
      .filter(Boolean);
  }, [vetProfile?.speciesIds, permIds, speciesList, speciesMap]);

  if (loading) {
    return (
      <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
        Загрузка профиля специалиста...
      </div>
    );
  }

  const trimmedPhoto = form.photoUrl.trim();
  const hasPhoto = isPreviewImageUrl(trimmedPhoto) && !imgFailed;
  const safeExp = Math.max(0, Math.min(70, Number(form.experienceYears) || 0));
  const expLabel = `${safeExp} ${pluralRu(safeExp, 'год', 'года', 'лет')}`;
  const isActive = vetProfile?.isActive !== false;

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-start w-full">
      <section className="island grow w-full lg:max-w-[760px]">
        <div className="island-head">
          <span className="island-title">
            <Stethoscope className="ic" />
            Профиль врача
          </span>
          <span className="small muted">Виден клиентам в каталоге</span>
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
            <div className="col" style={{ gap: '18px' }}>
              <div className="row">
                <span className={`t-ava xl round tone-${specTone}`} style={{ overflow: 'hidden' }}>
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trimmedPhoto}
                      alt={doc.fullName}
                      className="w-full h-full object-cover"
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    doc.initials
                  )}
                </span>
                <div className="col" style={{ gap: '2px' }}>
                  <span className="h2">{doc.fullName}</span>
                  <span className="cell-sub">Без фото показываются инициалы</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <span className="field-label">Специализация</span>
                  <input
                    className="input"
                    value={doc.specName}
                    readOnly
                    aria-label="Специализация"
                  />
                  <span className="field-hint">Меняет администратор</span>
                </div>

                <div className="field">
                  <span className="field-label">Статус</span>
                  <div className="row" style={{ height: '36px' }}>
                    <span className={`badge st ${isActive ? 'badge-COMPLETED' : 'badge-CANCELLED'}`}>
                      {isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <span className="field-hint">Меняет администратор</span>
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="vp-photo">
                    Фото (URL)
                  </label>
                  <input
                    id="vp-photo"
                    type="url"
                    maxLength={2048}
                    className="input"
                    value={form.photoUrl}
                    onChange={(e) => onChange((prev) => ({ ...prev, photoUrl: e.target.value }))}
                    placeholder="https://…"
                  />
                  <span className="field-hint">
                    Загрузки файлов нет — только ссылка, до 2048 символов
                  </span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="vp-exp">
                    Стаж, лет
                  </label>
                  <input
                    id="vp-exp"
                    type="number"
                    min={0}
                    max={70}
                    className="input"
                    value={form.experienceYears}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChange((prev) => ({
                        ...prev,
                        experienceYears: Number.isNaN(val) ? 0 : val,
                      }));
                    }}
                    required
                  />
                </div>

                <div className="field span-2">
                  <label className="field-label" htmlFor="vp-bio">
                    О себе
                  </label>
                  <textarea
                    id="vp-bio"
                    className="textarea"
                    style={{ minHeight: '140px' }}
                    maxLength={4000}
                    value={form.bio}
                    onChange={(e) => onChange((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Расскажите об опыте, образовании и профильных направлениях лечения…"
                  />
                  <span className="field-hint tnum">{form.bio.length} / 4000</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="island-foot">
          <span className="small muted">Специализация: {doc.specName}</span>
          <button
            type="submit"
            form="vet-practice-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </section>

      <section className="island w-full lg:w-[340px] flex-none" aria-label="Предпросмотр карточки врача">
        <div className="island-head">
          <span className="island-title">
            <Eye className="ic" />
            Так видят клиенты
          </span>
        </div>
        <div className="island-body">
          <div className={`tcard tone-${specTone}`} style={{ cursor: 'default' }}>
            <div className="tcard-head">
              <span className="t-ava lg round" style={{ overflow: 'hidden' }}>
                {hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trimmedPhoto}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  doc.initials
                )}
              </span>
              <span className="col" style={{ gap: '4px', minWidth: 0 }}>
                <span className="tcard-title">{doc.name}</span>
                <span className="cell-sub tnum">стаж {expLabel}</span>
              </span>
            </div>

            <div className="row" style={{ gap: '6px' }}>
              <span className="t-badge">{doc.specName}</span>
            </div>

            <span className="tcard-desc">
              {form.bio.trim() || 'Описание врачебной практики появится здесь'}
            </span>

            <div className="tcard-foot" style={{ justifyContent: 'flex-start' }}>
              {permittedSpecies.length > 0 ? (
                <div className="chips">
                  {permittedSpecies.map((sp) => {
                    const spTone = getSpeciesTone(sp.name || sp.id, speciesMap);
                    return (
                      <span key={sp.id} className={`sp-chip tone-${spTone}`}>
                        <SpeciesIcon species={spTone} size={14} />
                        {sp.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="small muted">Допуски к видам не назначены</span>
              )}
            </div>
          </div>

          <p className="small muted" style={{ marginTop: '12px' }}>
            Карточка в каталоге обновляется после сохранения. Специализацию и допуски к видам
            меняет администратор.
          </p>
        </div>
      </section>
    </div>
  );
}
