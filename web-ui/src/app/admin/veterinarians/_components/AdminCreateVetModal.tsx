'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Veterinarian, Specialization } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { formatApiError } from '@/shared/lib';
import type { CreateVetInput } from '../_hooks/useAdminVeterinarians';

export interface AdminCreateVetModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersWithoutProfile: User[];
  specializations: Specialization[];
  onCreateVet: (data: CreateVetInput) => Promise<Veterinarian>;
}

const INITIAL_FORM = {
  userId: '',
  specializationId: '',
  bio: '',
  photoUrl: '',
  experienceYears: 3,
  isActive: true,
};

export const AdminCreateVetModal: React.FC<AdminCreateVetModalProps> = ({
  isOpen,
  onClose,
  usersWithoutProfile,
  specializations,
  onCreateVet,
}) => {
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCreateForm(INITIAL_FORM);
      setCreateError(null);
      setCreating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, creating, onClose]);

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
      await onCreateVet({
        userId: createForm.userId,
        specializationId: createForm.specializationId,
        bio: createForm.bio,
        photoUrl: createForm.photoUrl,
        experienceYears: Number(createForm.experienceYears),
        isActive: createForm.isActive,
      });
      setCreateForm(INITIAL_FORM);
      onClose();
    } catch (err: unknown) {
      setCreateError(formatApiError(err, 'Не удалось создать профиль врача'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-vet-title"
      onClick={() => !creating && onClose()}
    >
      <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
            <span id="create-vet-title" className="dialog-title">
              Создание профиля врача
            </span>
            <span className="dialog-desc">
              Привязка врача к учётной записи пользователя с ролью ВЕТЕРИНАР
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Закрыть"
            onClick={() => !creating && onClose()}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleCreateVet}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="cr-vet-user">
                Пользователь <span className="req">*</span>
              </label>
              <select
                id="cr-vet-user"
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
              <label className="field-label" htmlFor="cr-vet-spec">
                Специализация <span className="req">*</span>
              </label>
              <select
                id="cr-vet-spec"
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
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setCreateForm({
                      ...createForm,
                      experienceYears: Number.isNaN(parsed) ? 0 : parsed,
                    });
                  }}
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
                    aria-label="Активен"
                    onClick={() => setCreateForm({ ...createForm, isActive: !createForm.isActive })}
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
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{createError}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={creating}>
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
