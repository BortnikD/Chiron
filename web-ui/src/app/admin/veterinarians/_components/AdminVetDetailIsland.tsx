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
import { formatApiError, getSpecStyle, getSpecTone, toIdNameMap } from '@/shared/lib';
import { getDoctorDisplay } from '@/shared/lib';
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
    data: Partial<
      Pick<Veterinarian, 'specializationId' | 'specializationIds' | 'bio' | 'experienceYears' | 'isActive'>
    >
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
  const [editForm, setEditForm] = useState<{
    specializationIds: string[];
    experienceYears: number;
    isActive: boolean;
    bio: string;
  }>({
    specializationIds: [],
    experienceYears: 0,
    isActive: true,
    bio: '',
  });

  const [savingVet, setSavingVet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const docSpecIds = useMemo(() => {
    if (selectedVet.specializationIds && selectedVet.specializationIds.length > 0) {
      return selectedVet.specializationIds;
    }
    return selectedVet.specializationId ? [selectedVet.specializationId] : [];
  }, [selectedVet]);

  const availableSpecsToAdd = useMemo<SearchComboboxOption[]>(() => {
    return specializations
      .filter((s) => !editForm.specializationIds.includes(s.id))
      .map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.description || undefined,
      }));
  }, [specializations, editForm.specializationIds]);

  const user = selectedVet.user || users.find((u) => u.id === selectedVet.userId);
  const doc = getDoctorDisplay({ ...selectedVet, user }, specsMap);
  const permittedSpeciesIds = vetPermMap[selectedVet.id] || [];

  useEffect(() => {
    const specIds =
      selectedVet.specializationIds && selectedVet.specializationIds.length > 0
        ? selectedVet.specializationIds
        : selectedVet.specializationId
        ? [selectedVet.specializationId]
        : [];
    setEditForm({
      specializationIds: specIds,
      experienceYears: selectedVet.experienceYears || 0,
      isActive: selectedVet.isActive ?? true,
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
    if (editForm.specializationIds.length === 0) {
      setErrorMessage('У врача должна быть выбрана хотя бы одна специализация');
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
        specializationIds: editForm.specializationIds,
        specializationId: editForm.specializationIds[0],
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
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <VetAvatar
            vet={selectedVet}
            initials={doc.initials}
            tone={getSpecTone(selectedVet.specializationId)}
            style={getSpecStyle(selectedVet.specializationId, specializations)}
            className="avatar avatar-lg detail-head-ava"
            alt={doc.fullName}
          />
          <div className="col" style={{ gap: 4, minWidth: 0 }}>
            <span className="h2">{doc.fullName}</span>
            <div className="row" style={{ gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {docSpecIds.length > 0 ? (
                docSpecIds.map((sid) => (
                  <span
                    key={sid}
                    className={`t-badge tone-${getSpecTone(sid)}`}
                    style={{ ...getSpecStyle(sid, specializations), height: '20px', fontSize: '11px' }}
                  >
                    {specsMap[sid] || 'Специализация'}
                  </span>
                ))
              ) : (
                <span className="cell-sub">Специализация не указана</span>
              )}
              <span className="cell-sub">· {user?.email || '—'}</span>
            </div>
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
              <label className="field-label">Специализации врача</label>
              {editForm.specializationIds.length > 0 && (
                <div className="row wrap" style={{ gap: '6px', marginBottom: '8px' }}>
                  {editForm.specializationIds.map((sid) => {
                    const name = specsMap[sid] || 'Специализация';
                    const tone = getSpecTone(sid);
                    const specStyle = getSpecStyle(sid, specializations);
                    return (
                      <span
                        key={sid}
                        className={`t-badge tone-${tone} row items-center`}
                        style={{
                          ...specStyle,
                          gap: '6px',
                          paddingRight: '6px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{
                            width: '16px',
                            height: '16px',
                            color: 'inherit',
                            padding: 0,
                            borderRadius: '50%',
                            opacity: 0.8,
                          }}
                          onClick={() => {
                            if (editForm.specializationIds.length <= 1) {
                              setErrorMessage('У врача должна оставаться хотя бы одна специализация');
                              return;
                            }
                            setEditForm({
                              ...editForm,
                              specializationIds: editForm.specializationIds.filter((id) => id !== sid),
                            });
                          }}
                          title="Удалить специализацию"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {availableSpecsToAdd.length > 0 ? (
                <SearchCombobox
                  id="vd-spec-add"
                  value=""
                  options={availableSpecsToAdd}
                  onChange={(val) => {
                    if (val && !editForm.specializationIds.includes(val)) {
                      setEditForm({
                        ...editForm,
                        specializationIds: [...editForm.specializationIds, val],
                      });
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="+ Добавить специализацию..."
                  ariaLabel="Добавить специализацию"
                />
              ) : (
                <span className="small muted">Все специализации клиники уже добавлены</span>
              )}
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
