'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Veterinarian, Specialization } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import { SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { EntityPhotoControl } from '@/components/ui/EntityPhotoControl';
import { formatApiError, getSpecStyle, getSpecTone, toIdNameMap } from '@/shared/lib';
import type { CreateVetInput } from '../_hooks/useAdminVeterinarians';

export interface AdminCreateVetModalProps {
  isOpen: boolean;
  defaultUserId?: string;
  onClose: () => void;
  usersWithoutProfile: User[];
  specializations: Specialization[];
  onCreateVet: (data: CreateVetInput) => Promise<Veterinarian>;
}

const INITIAL_FORM = {
  userId: '',
  specializationIds: [] as string[],
  bio: '',
  experienceYears: 0,
  isActive: true,
};

export const AdminCreateVetModal: React.FC<AdminCreateVetModalProps> = ({
  isOpen,
  defaultUserId = '',
  onClose,
  usersWithoutProfile,
  specializations,
  onCreateVet,
}) => {
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const userOptions = useMemo<SearchComboboxOption[]>(
    () =>
      usersWithoutProfile.map((u) => ({
        value: u.id,
        label: u.fullName || `${u.firstName} ${u.lastName}`.trim() || u.email,
        hint: u.email,
      })),
    [usersWithoutProfile]
  );

  const availableSpecsToAdd = useMemo<SearchComboboxOption[]>(
    () =>
      specializations
        .filter((s) => !createForm.specializationIds.includes(s.id))
        .map((s) => ({
          value: s.id,
          label: s.name,
          hint: s.description || undefined,
        })),
    [specializations, createForm.specializationIds]
  );

  useEffect(() => {
    if (isOpen) {
      const matchedUser =
        defaultUserId && usersWithoutProfile.some((u) => u.id === defaultUserId)
          ? defaultUserId
          : '';
      setCreateForm({
        ...INITIAL_FORM,
        userId: matchedUser,
      });
      setPhotoFile(null);
      setCreateError(null);
      setCreating(false);
    }
  }, [isOpen, defaultUserId, usersWithoutProfile]);

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
    if (!createForm.userId || createForm.specializationIds.length === 0) {
      setCreateError('Выберите пользователя и хотя бы одну специализацию');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await onCreateVet({
        userId: createForm.userId,
        specializationId: createForm.specializationIds[0],
        specializationIds: createForm.specializationIds,
        bio: createForm.bio,
        experienceYears: Number(createForm.experienceYears) || 0,
        isActive: createForm.isActive,
        photoFile,
      });
      setCreateForm(INITIAL_FORM);
      setPhotoFile(null);
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
              Новый профиль врача
            </span>
            <span className="dialog-desc">
              Пользователь с ролью ветеринара, у которого ещё нет профиля
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
              <SearchCombobox
                id="cr-vet-user"
                value={createForm.userId}
                options={userOptions}
                onChange={(val) => {
                  setCreateForm({ ...createForm, userId: val });
                  setCreateError(null);
                }}
                placeholder="Найдите пользователя…"
                ariaLabel="Найдите пользователя"
              />
              {usersWithoutProfile.length === 0 && (
                <span className="field-hint">
                  Нет ветеринаров без профиля — сначала создайте пользователя с ролью «Ветеринар»
                </span>
              )}
            </div>

            <div className="field">
              <label className="field-label">
                Специализации <span className="req">*</span>
              </label>
              {createForm.specializationIds.length > 0 && (
                <div className="row wrap" style={{ gap: '6px', marginBottom: '8px' }}>
                  {createForm.specializationIds.map((sid) => {
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
                            setCreateForm({
                              ...createForm,
                              specializationIds: createForm.specializationIds.filter((id) => id !== sid),
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
                  id="cr-vet-spec"
                  value=""
                  options={availableSpecsToAdd}
                  onChange={(val) => {
                    if (val && !createForm.specializationIds.includes(val)) {
                      setCreateForm({
                        ...createForm,
                        specializationIds: [...createForm.specializationIds, val],
                      });
                      setCreateError(null);
                    }
                  }}
                  placeholder="+ Добавить специализацию..."
                  ariaLabel="Добавить специализацию"
                />
              ) : (
                <span className="small muted">Все доступные специализации выбраны</span>
              )}
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
                <EntityPhotoControl
                  previewFallback="ВР"
                  previewClassName="t-ava lg round"
                  previewAlt="Фото нового врача"
                  title="Фотография (необязательно)"
                  hint="JPEG или PNG до 5 МБ · загрузится сразу после создания профиля"
                  disabled={creating}
                  pendingFile={photoFile}
                  onSelectPendingFile={setPhotoFile}
                />
              </div>

              <div className="field span-2">
                <label className="field-label" htmlFor="cr-bio">
                  Био
                </label>
                <textarea
                  className="textarea"
                  id="cr-bio"
                  maxLength={4000}
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
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
