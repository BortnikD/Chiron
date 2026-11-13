'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { X, AlertCircle, Check, Trash2, User as UserIcon } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { VetAvatar } from '@/components/ui/EntityAvatar';
import { EntityPhotoControl } from '@/components/ui/EntityPhotoControl';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { VetDetailTabsSection } from './VetDetailTabsSection';

export interface AdminVetDetailIslandProps {
  selectedVet: Veterinarian;
  defaultTab?: 'profile' | 'species';
  users: User[];
  specializations: Specialization[];
  speciesList: Species[];
  vetPermMap: Record<string, string[]>;
  vetSchedules: WorkSchedule[];
  vetExceptions: ScheduleException[];
  loadingDetails: boolean;
  detailsError: string | null;
  onClose: () => void;
  onDeleteClick: () => void;
  onSaveProfile: (
    id: string,
    data: Partial<Pick<Veterinarian, 'specializationId' | 'bio' | 'experienceYears' | 'isActive'>>
  ) => Promise<Veterinarian>;
  onUploadPhoto: (vetId: string, file: File) => Promise<void>;
  onDeletePhoto: (vetId: string) => Promise<void>;
  onToggleSpeciesPermission: (
    vetId: string,
    speciesId: string,
    isCurrentlyPermitted: boolean
  ) => Promise<void>;
}

export const AdminVetDetailIsland: React.FC<AdminVetDetailIslandProps> = ({
  selectedVet,
  defaultTab = 'profile',
  users,
  specializations,
  speciesList,
  vetPermMap,
  vetSchedules,
  vetExceptions,
  loadingDetails,
  detailsError,
  onClose,
  onDeleteClick,
  onSaveProfile,
  onUploadPhoto,
  onDeletePhoto,
  onToggleSpeciesPermission,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'species' | 'schedule' | 'exceptions'>(
    defaultTab
  );
  const [editForm, setEditForm] = useState({
    specializationId: selectedVet.specializationId || '',
    experienceYears: selectedVet.experienceYears || 0,
    isActive: selectedVet.isActive,
    bio: selectedVet.bio || '',
  });

  const [savingVet, setSavingVet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const specOptions = useMemo<SearchComboboxOption[]>(
    () =>
      specializations.map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.description || undefined,
      })),
    [specializations]
  );

  const user = selectedVet.user || users.find((u) => u.id === selectedVet.userId);
  const doc = getDoctorDisplay({ ...selectedVet, user }, specsMap);
  const permittedSpeciesIds = vetPermMap[selectedVet.id] || [];

  useEffect(() => {
    setEditForm({
      specializationId: selectedVet.specializationId || '',
      experienceYears: selectedVet.experienceYears || 0,
      isActive: selectedVet.isActive,
      bio: selectedVet.bio || '',
    });
    setActiveTab(defaultTab);
    setSaveSuccess(false);
    setErrorMessage(null);
  }, [selectedVet, defaultTab]);

  const handleSaveProfile = async () => {
    const exp = Number(editForm.experienceYears);
    if (Number.isNaN(exp) || exp < 0 || exp > 70) {
      setErrorMessage('Стаж должен быть от 0 до 70 лет');
      setActiveTab('profile');
      return;
    }

    setSavingVet(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await onSaveProfile(selectedVet.id, {
        bio: editForm.bio,
        experienceYears: exp,
        isActive: editForm.isActive,
        specializationId: editForm.specializationId || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Ошибка при сохранении профиля врача'));
      setActiveTab('profile');
    } finally {
      setSavingVet(false);
    }
  };

  return (
    <section className="island detail-island" style={{ width: 460 }} aria-label="Врач">
      <div className="island-head">
        <div className="row">
          <VetAvatar
            vet={selectedVet}
            initials={doc.initials}
            className="avatar avatar-lg detail-head-ava"
            alt={doc.fullName}
          />
          <div className="col" style={{ gap: 2 }}>
            <span className="h2">{doc.fullName}</span>
            <span className="cell-sub">
              {selectedVet.specializationId ? doc.specName : 'Не указана'} · {user?.email || '—'}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line">
        {(
          [
            { id: 'profile', label: 'Профиль' },
            { id: 'species', label: 'Допуски к видам' },
            { id: 'schedule', label: 'Расписание' },
            { id: 'exceptions', label: 'Исключения' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-line ${activeTab === tab.id ? 'on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {activeTab === 'profile' ? (
          <div className="col" style={{ gap: 14 }}>
            <div className="field">
              <label className="field-label" htmlFor="vd-spec">
                Специализация
              </label>
              <SearchCombobox
                id="vd-spec"
                value={editForm.specializationId}
                options={specOptions}
                onChange={(val) => setEditForm({ ...editForm, specializationId: val })}
                placeholder="Выберите специализацию"
                ariaLabel="Выберите специализацию"
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="vd-exp">
                  Стаж, лет
                </label>
                <input
                  className="input"
                  id="vd-exp"
                  type="number"
                  min="0"
                  max="70"
                  value={editForm.experienceYears}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setEditForm({
                      ...editForm,
                      experienceYears: Number.isNaN(parsed) ? 0 : parsed,
                    });
                  }}
                />
              </div>

              <div className="field">
                <span className="field-label">Активен</span>
                <div className="row" style={{ height: 36, gap: 10 }}>
                  <button
                    type="button"
                    className={`switch ${editForm.isActive ? 'on' : ''}`}
                    role="switch"
                    aria-checked={editForm.isActive}
                    aria-label="Активен"
                    onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  />
                  <span className="small muted">
                    {editForm.isActive
                      ? 'Виден в каталоге, принимает записи'
                      : 'Скрыт из каталога, запись закрыта'}
                  </span>
                </div>
              </div>

              <div className="field span-2">
                <EntityPhotoControl
                  photo={selectedVet}
                  previewFallback={doc.initials}
                  previewClassName="t-ava lg round"
                  previewAlt={doc.fullName}
                  title="Фотография врача"
                  hint="JPEG или PNG до 5 МБ · обрежется в квадрат 512×512"
                  disabled={savingVet}
                  hidePreview
                  onUpload={(file) => onUploadPhoto(selectedVet.id, file)}
                  onDelete={() => onDeletePhoto(selectedVet.id)}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="vd-bio">
                  Био
                </label>
                <textarea
                  className="textarea"
                  id="vd-bio"
                  maxLength={4000}
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{errorMessage}</div>
              </div>
            )}

            {saveSuccess && (
              <div className="alert alert-success" role="status">
                <Check size={16} className="ic" />
                <div>Профиль врача сохранён</div>
              </div>
            )}

            <div className="row between" style={{ alignItems: 'center' }}>
              <span className="field-hint">
                ФИО и контакты редактируются в учётной записи пользователя
              </span>
              <Link
                href={`/admin/users?sel=${selectedVet.userId}`}
                className="btn btn-ghost btn-sm"
              >
                <UserIcon size={14} />
                Профиль
              </Link>
            </div>
          </div>
        ) : (
          <VetDetailTabsSection
            vetId={selectedVet.id}
            activeTab={activeTab}
            speciesList={speciesList}
            permittedSpeciesIds={permittedSpeciesIds}
            vetSchedules={vetSchedules}
            vetExceptions={vetExceptions}
            loadingDetails={loadingDetails}
            detailsError={detailsError}
            onToggleSpeciesPermission={onToggleSpeciesPermission}
          />
        )}
      </div>

      <div className="island-foot">
        <button type="button" className="btn btn-destructive-outline btn-sm" onClick={onDeleteClick}>
          <Trash2 size={14} />
          Удалить профиль
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSaveProfile}
          disabled={savingVet}
        >
          {savingVet ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </section>
  );
};
