'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, AlertCircle, Check, Trash2 } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { VetDetailTabsSection } from './VetDetailTabsSection';

export interface AdminVetDetailIslandProps {
  selectedVet: Veterinarian;
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
  onSaveProfile: (id: string, data: Partial<Veterinarian>) => Promise<Veterinarian>;
  onToggleSpeciesPermission: (
    vetId: string,
    speciesId: string,
    isCurrentlyPermitted: boolean
  ) => Promise<void>;
}

export const AdminVetDetailIsland: React.FC<AdminVetDetailIslandProps> = ({
  selectedVet,
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
  onToggleSpeciesPermission,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'species' | 'schedule' | 'exceptions'>(
    'profile'
  );
  const [editForm, setEditForm] = useState({
    specializationId: selectedVet.specializationId || '',
    experienceYears: selectedVet.experienceYears || 0,
    isActive: selectedVet.isActive,
    photoUrl: selectedVet.photoUrl || '',
    bio: selectedVet.bio || '',
  });

  const [savingVet, setSavingVet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const user = selectedVet.user || users.find((u) => u.id === selectedVet.userId);
  const doc = getDoctorDisplay({ ...selectedVet, user }, specsMap);
  const permittedSpeciesIds = vetPermMap[selectedVet.id] || [];

  useEffect(() => {
    setEditForm({
      specializationId: selectedVet.specializationId || '',
      experienceYears: selectedVet.experienceYears || 0,
      isActive: selectedVet.isActive,
      photoUrl: selectedVet.photoUrl || '',
      bio: selectedVet.bio || '',
    });
    setSaveSuccess(false);
    setErrorMessage(null);
  }, [selectedVet]);

  const handleSaveProfile = async () => {
    setSavingVet(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await onSaveProfile(selectedVet.id, {
        bio: editForm.bio,
        photoUrl: editForm.photoUrl,
        experienceYears: Number(editForm.experienceYears),
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
    <section className="island detail-island" aria-label="Врач">
      <div className="island-head">
        <div className="row">
          <span className="avatar avatar-lg">{doc.initials}</span>
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
              <select
                id="vd-spec"
                className="select"
                value={editForm.specializationId}
                onChange={(e) => setEditForm({ ...editForm, specializationId: e.target.value })}
              >
                <option value="">Выберите специализацию</option>
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
                    {editForm.isActive ? 'Принимает записи' : 'Приём закрыт'}
                  </span>
                </div>
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="vd-photo">
                  Фото (URL)
                </label>
                <input
                  className="input"
                  id="vd-photo"
                  type="url"
                  maxLength={2048}
                  placeholder="https://…"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
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
                <div>Изменения сохранены</div>
              </div>
            )}

            <span className="dev-note">
              ФИО берётся из учётной записи пользователя; смена роли или контактных данных выполняется
              в разделе «Пользователи»
            </span>
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
