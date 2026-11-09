'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../../../api';
import { Veterinarian, User, Specialization } from '../../../../types';

export interface AdminCreateVetModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersWithoutProfile: User[];
  specializations: Specialization[];
  onCreated: (createdVet: Veterinarian) => void;
}

export const AdminCreateVetModal: React.FC<AdminCreateVetModalProps> = ({
  isOpen,
  onClose,
  usersWithoutProfile,
  specializations,
  onCreated,
}) => {
  const [createForm, setCreateForm] = useState({
    userId: '',
    specializationId: '',
    bio: '',
    photoUrl: '',
    experienceYears: 3,
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.userId || !createForm.specializationId) {
      setCreateError('Выберите пользователя и специализацию');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createVeterinarian({
        userId: createForm.userId,
        specializationId: createForm.specializationId,
        bio: createForm.bio,
        photoUrl: createForm.photoUrl,
        experienceYears: Number(createForm.experienceYears),
        isActive: createForm.isActive,
      });
      setCreateForm({
        userId: '',
        specializationId: '',
        bio: '',
        photoUrl: '',
        experienceYears: 3,
        isActive: true,
      });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Не удалось создать профиль врача');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="dialog dialog-sm"
        style={{ width: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Создание профиля врача</span>
          <span className="dialog-desc">
            Привязка врача к учётной записи пользователя с ролью ВЕТЕРИНАР
          </span>
        </div>

        <form onSubmit={handleCreateVet} className="col" style={{ gap: 14 }}>
          <div className="field">
            <span className="field-label">
              Пользователь <span className="req">*</span>
            </span>
            <select
              className="select"
              value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              required
            >
              <option value="">Выберите пользователя…</option>
              {usersWithoutProfile.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
            {usersWithoutProfile.length === 0 && (
              <span className="field-hint" style={{ color: 'var(--amber-fg, #b45309)' }}>
                Нет свободных пользователей с ролью ВЕТЕРИНАР. Сначала создайте пользователя в
                разделе «Пользователи».
              </span>
            )}
          </div>

          <div className="field">
            <span className="field-label">
              Специализация <span className="req">*</span>
            </span>
            <select
              className="select"
              value={createForm.specializationId}
              onChange={(e) =>
                setCreateForm({ ...createForm, specializationId: e.target.value })
              }
              required
            >
              <option value="">Выберите специализацию…</option>
              {specializations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="cr-exp">
                Стаж, лет
              </label>
              <input
                className="input"
                id="cr-exp"
                type="number"
                min="0"
                max="70"
                value={createForm.experienceYears}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    experienceYears: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="field">
              <span className="field-label">Активен</span>
              <div className="row" style={{ height: 36, gap: 8 }}>
                <button
                  type="button"
                  className={`switch ${createForm.isActive ? 'on' : ''}`}
                  role="switch"
                  aria-checked={createForm.isActive}
                  onClick={() =>
                    setCreateForm({ ...createForm, isActive: !createForm.isActive })
                  }
                />
                <span className="small muted">
                  {createForm.isActive ? 'Активен' : 'Отключён'}
                </span>
              </div>
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cr-photo">
                Фото (URL)
              </label>
              <input
                className="input"
                id="cr-photo"
                type="url"
                placeholder="https://…"
                value={createForm.photoUrl}
                onChange={(e) => setCreateForm({ ...createForm, photoUrl: e.target.value })}
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cr-bio">
                Био
              </label>
              <textarea
                className="textarea"
                id="cr-bio"
                rows={2}
                value={createForm.bio}
                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
              />
            </div>
          </div>

          {createError && (
            <div className="alert" role="alert">
              <AlertCircle size={16} />
              <div>{createError}</div>
            </div>
          )}

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || usersWithoutProfile.length === 0}
            >
              {creating ? 'Создание…' : 'Создать врача'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
