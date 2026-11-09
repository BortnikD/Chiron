'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  AlertCircle,
  Check,
  Calendar,
  Trash2,
} from 'lucide-react';
import { adminApi, clinicApi } from '../../../../api';
import {
  Veterinarian,
  User,
  Specialization,
  Species,
  WorkSchedule,
  ScheduleException,
} from '../../../../types';
import {
  DOW_LABELS,
  DOW_ORDER,
  getUserName,
  getUserInitials,
  getUserEmail,
  getSpecName,
} from './utils';

export interface AdminVetDetailIslandProps {
  selectedVet: Veterinarian;
  users: User[];
  specializations: Specialization[];
  speciesList: Species[];
  vetPermMap: Record<string, string[]>;
  onClose: () => void;
  onDeleteClick: () => void;
  onSaved: () => Promise<void> | void;
  onPermissionsChange: (vetId: string, speciesIds: string[]) => void;
}

export const AdminVetDetailIsland: React.FC<AdminVetDetailIslandProps> = ({
  selectedVet,
  users,
  specializations,
  speciesList,
  vetPermMap,
  onClose,
  onDeleteClick,
  onSaved,
  onPermissionsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'species' | 'schedule' | 'exceptions'>('profile');

  const [editForm, setEditForm] = useState({
    specializationId: selectedVet.specializationId || '',
    experienceYears: selectedVet.experienceYears || 0,
    isActive: selectedVet.isActive,
    photoUrl: selectedVet.photoUrl || '',
    bio: selectedVet.bio || '',
  });

  const [permittedSpeciesIds, setPermittedSpeciesIds] = useState<string[]>([]);
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);
  const [savingVet, setSavingVet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditForm({
      specializationId: selectedVet.specializationId || '',
      experienceYears: selectedVet.experienceYears || 0,
      isActive: selectedVet.isActive,
      photoUrl: selectedVet.photoUrl || '',
      bio: selectedVet.bio || '',
    });
  }, [selectedVet]);

  useEffect(() => {
    setPermittedSpeciesIds(vetPermMap[selectedVet.id] || []);
    setSaveSuccess(false);
    setErrorMessage(null);

    Promise.all([
      clinicApi.getWorkSchedules(selectedVet.id).catch(() => [] as WorkSchedule[]),
      clinicApi.getScheduleExceptions(selectedVet.id).catch(() => [] as ScheduleException[]),
      clinicApi.getVetSpeciesPermissions(selectedVet.id).catch(() => []),
    ]).then(([schedRes, excRes, permsRes]) => {
      setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
      setVetExceptions(Array.isArray(excRes) ? excRes : []);
      const spIds = (permsRes || []).map((p: any) => p.speciesId);
      setPermittedSpeciesIds(spIds);
      onPermissionsChange(selectedVet.id, spIds);
    });
  }, [selectedVet.id]);

  const handleSaveProfile = async () => {
    setSavingVet(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await adminApi.updateVeterinarian(selectedVet.id, {
        bio: editForm.bio,
        photoUrl: editForm.photoUrl,
        experienceYears: Number(editForm.experienceYears),
        isActive: editForm.isActive,
        specializationId: editForm.specializationId || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await onSaved();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Ошибка при сохранении профиля врача');
    } finally {
      setSavingVet(false);
    }
  };

  const handleToggleSpeciesPermission = async (speciesId: string) => {
    const isGranted = permittedSpeciesIds.includes(speciesId);
    try {
      if (isGranted) {
        await adminApi.revokeVetSpeciesPermission(selectedVet.id, speciesId);
        const next = permittedSpeciesIds.filter((id) => id !== speciesId);
        setPermittedSpeciesIds(next);
        onPermissionsChange(selectedVet.id, next);
      } else {
        await adminApi.grantVetSpeciesPermission(selectedVet.id, speciesId);
        const next = [...permittedSpeciesIds, speciesId];
        setPermittedSpeciesIds(next);
        onPermissionsChange(selectedVet.id, next);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Не удалось изменить допуск к виду');
    }
  };

  return (
    <section className="island detail-island" style={{ width: 460 }} aria-label="Врач">
      <div className="island-head">
        <div className="row">
          <span className="avatar avatar-lg">{getUserInitials(selectedVet.userId, users)}</span>
          <div className="col" style={{ gap: 2 }}>
            <span className="h2">{getUserName(selectedVet.userId, users)}</span>
            <span className="cell-sub">
              {getSpecName(selectedVet.specializationId, specializations)} · {getUserEmail(selectedVet.userId, users)}
            </span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="tabs-line">
        <button
          className={`tab-line ${activeTab === 'profile' ? 'on' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button
          className={`tab-line ${activeTab === 'species' ? 'on' : ''}`}
          onClick={() => setActiveTab('species')}
        >
          Допуски к видам
        </button>
        <button
          className={`tab-line ${activeTab === 'schedule' ? 'on' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Расписание
        </button>
        <button
          className={`tab-line ${activeTab === 'exceptions' ? 'on' : ''}`}
          onClick={() => setActiveTab('exceptions')}
        >
          Исключения
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="col" style={{ gap: 14 }}>
            <div className="field">
              <span className="field-label">Специализация</span>
              <select
                className="select"
                value={editForm.specializationId}
                onChange={(e) =>
                  setEditForm({ ...editForm, specializationId: e.target.value })
                }
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
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      experienceYears: parseInt(e.target.value) || 0,
                    })
                  }
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
                    onClick={() =>
                      setEditForm({ ...editForm, isActive: !editForm.isActive })
                    }
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
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{errorMessage}</div>
              </div>
            )}

            {saveSuccess && (
              <div className="alert alert-info" style={{ borderColor: 'var(--primary)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} />
                <div>Изменения сохранены</div>
              </div>
            )}

            <span className="dev-note">
              ФИО берётся из пользователя {selectedVet.userId}; смена роли или данных
              выполняется в разделе «Пользователи»
            </span>
          </div>
        )}

        {/* Tab: Species Permissions */}
        {activeTab === 'species' && (
          <div className="col" style={{ gap: 12 }}>
            <span className="small muted">
              Включите вид, чтобы врач мог принимать таких пациентов. Без допуска запись
              отклоняется с ошибкой VeterinarianNotPermittedForSpeciesException.
            </span>

            <div className="col" style={{ gap: 6 }}>
              {speciesList.map((sp) => {
                const isPermitted = permittedSpeciesIds.includes(sp.id);
                return (
                  <div
                    key={sp.id}
                    className="row between"
                    style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="cell-main">{sp.name}</span>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="small muted">
                        {isPermitted ? 'Разрешён' : 'Запрещён'}
                      </span>
                      <button
                        type="button"
                        className={`switch ${isPermitted ? 'on' : ''}`}
                        role="switch"
                        aria-checked={isPermitted}
                        aria-label={`Допуск: ${sp.name}`}
                        onClick={() => handleToggleSpeciesPermission(sp.id)}
                      />
                    </div>
                  </div>
                );
              })}

              {speciesList.length === 0 && (
                <span className="small muted">Виды животных пока не добавлены</span>
              )}
            </div>
          </div>
        )}

        {/* Tab: Schedule */}
        {activeTab === 'schedule' && (
          <div className="col" style={{ gap: 10 }}>
            <div
              className="dtable"
              style={{ '--cols': '40px 1fr 1fr' } as React.CSSProperties}
            >
              {DOW_ORDER.map((dow) => {
                const item = vetSchedules.find((s) => s.dayOfWeek === dow);
                return (
                  <div key={dow} className="trow static compact">
                    <span className="cell-main">{DOW_LABELS[dow]}</span>
                    <span className="tnum">
                      {item
                        ? `${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}`
                        : 'Выходной'}
                    </span>
                    <span className="small muted">
                      {item && item.breakStart && item.breakEnd
                        ? `перерыв ${item.breakStart.slice(0, 5)}–${item.breakEnd.slice(0, 5)}`
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              href={`/admin/schedules?vetId=${selectedVet.id}`}
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              <Calendar size={14} />
              Редактировать в «Расписаниях»
            </Link>
          </div>
        )}

        {/* Tab: Exceptions */}
        {activeTab === 'exceptions' && (
          <div className="col" style={{ gap: 0 }}>
            {vetExceptions.map((e) => (
              <div
                key={e.id}
                className="row between"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div className="col" style={{ gap: 0 }}>
                  <span className="cell-main tnum">
                    {e.startDate} {e.endDate && e.endDate !== e.startDate ? `— ${e.endDate}` : ''}
                  </span>
                  <span className="cell-sub">{e.reason || 'Без причины'}</span>
                </div>
                <span
                  className={`badge ${
                    e.type === 'ABSENCE' ? 'badge-destructive' : 'badge-accent'
                  }`}
                >
                  {e.type === 'ABSENCE' ? 'Отсутствие' : 'Свой график'}
                </span>
              </div>
            ))}

            {vetExceptions.length === 0 && (
              <span className="small muted" style={{ padding: '12px 0' }}>
                Исключений нет
              </span>
            )}

            <Link
              href={`/admin/schedules?tab=exc&vetId=${selectedVet.id}`}
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 12 }}
            >
              <Calendar size={14} />
              Все исключения врача
            </Link>
          </div>
        )}
      </div>

      <div className="island-foot">
        <button
          className="btn btn-destructive-outline btn-sm"
          onClick={onDeleteClick}
        >
          <Trash2 size={14} />
          Удалить профиль
        </button>
        <button
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
