'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tags, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import type { Service, Specialization, Veterinarian } from '@/modules/clinic/types';
import { ConfirmModal } from '@/shared/components';
import { formatApiError } from '@/shared/lib';

export interface SpecializationsTabProps {
  specializations: Specialization[];
  services: Service[];
  veterinarians: Veterinarian[];
  onSaveSpecialization: (data: { name: string; description: string }, id?: string) => Promise<void>;
  onDeleteSpecialization: (id: string) => Promise<void>;
}

export const SpecializationsTab: React.FC<SpecializationsTabProps> = ({
  specializations,
  services,
  veterinarians,
  onSaveSpecialization,
  onDeleteSpecialization,
}) => {
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [specForm, setSpecForm] = useState({ id: '', name: '', description: '' });
  const [savingSpec, setSavingSpec] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Specialization | null>(null);
  const [deletingSpec, setDeletingSpec] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const vetCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of veterinarians) {
      if (v.specializationId) map[v.specializationId] = (map[v.specializationId] || 0) + 1;
    }
    return map;
  }, [veterinarians]);

  const serviceCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of services) {
      if (s.specializationId) map[s.specializationId] = (map[s.specializationId] || 0) + 1;
    }
    return map;
  }, [services]);

  useEffect(() => {
    if (!isSpecModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingSpec) setIsSpecModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpecModalOpen, savingSpec]);

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = specForm.name.trim();
    if (!trimmedName) {
      setSaveError('Введите название специализации');
      return;
    }
    if (
      specializations.some(
        (z) => z.id !== specForm.id && z.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setSaveError('Специализация с таким названием уже есть');
      return;
    }
    setSavingSpec(true);
    setSaveError(null);
    try {
      await onSaveSpecialization(
        {
          name: trimmedName,
          description: specForm.description.trim(),
        },
        specForm.id || undefined
      );
      setIsSpecModalOpen(false);
      setSpecForm({ id: '', name: '', description: '' });
    } catch (err: unknown) {
      setSaveError(formatApiError(err, 'Ошибка сохранения специализации'));
    } finally {
      setSavingSpec(false);
    }
  };

  const handleDeleteSpec = async () => {
    if (!deleteTarget) return;
    setDeletingSpec(true);
    setDeleteError(null);
    try {
      await onDeleteSpecialization(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка удаления специализации'));
    } finally {
      setDeletingSpec(false);
    }
  };

  return (
    <>
      <section className="island grow">
        <div className="island-head">
          <span className="island-title">
            <Tags size={18} />
            Специализации <span className="count">{specializations.length}</span>
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSpecForm({ id: '', name: '', description: '' });
              setSaveError(null);
              setIsSpecModalOpen(true);
            }}
          >
            <Plus size={14} />
            Новая специализация
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1fr 2.4fr 0.6fr 0.6fr 88px', minWidth: '700px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Название</span>
              <span>Описание</span>
              <span className="right">Врачей</span>
              <span className="right">Услуг</span>
              <span />
            </div>

            {specializations.map((sp) => (
              <div key={sp.id} className="trow static">
                <span className="cell-main">{sp.name}</span>
                <span className="muted small">{sp.description || '—'}</span>
                <span className="right tnum">{vetCounts[sp.id] || 0}</span>
                <span className="right tnum">{serviceCounts[sp.id] || 0}</span>
                <span className="row-actions right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Изменить специализацию «${sp.name}»`}
                    title="Изменить"
                    onClick={() => {
                      setSpecForm({ id: sp.id, name: sp.name, description: sp.description || '' });
                      setSaveError(null);
                      setIsSpecModalOpen(true);
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Удалить специализацию «${sp.name}»`}
                    title="Удалить"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(sp);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isSpecModalOpen && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="spec-modal-title"
          onClick={() => !savingSpec && setIsSpecModalOpen(false)}
        >
          <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div
              className="dialog-head"
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span id="spec-modal-title" className="dialog-title">
                {specForm.id ? 'Изменить специализацию' : 'Новая специализация'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => !savingSpec && setIsSpecModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveSpec}
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
            >
              <div className="dialog-body">
                <div className="field">
                  <label className="field-label" htmlFor="spec-name">
                    Название <span className="req">*</span>
                  </label>
                  <input
                    id="spec-name"
                    className="input"
                    maxLength={150}
                    placeholder="Терапия, Хирургия…"
                    value={specForm.name}
                    onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="spec-desc">
                    Описание
                  </label>
                  <textarea
                    id="spec-desc"
                    className="textarea"
                    maxLength={2000}
                    rows={3}
                    value={specForm.description}
                    onChange={(e) =>
                      setSpecForm({ ...specForm, description: e.target.value.slice(0, 2000) })
                    }
                  />
                  <span className="field-hint">{specForm.description.length} / 2000</span>
                </div>

                {saveError && (
                  <div className="alert alert-destructive" role="alert">
                    <AlertCircle size={16} className="ic" />
                    <div>{saveError}</div>
                  </div>
                )}
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={savingSpec}
                  onClick={() => setIsSpecModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSpec}>
                  {savingSpec ? 'Сохранение…' : specForm.id ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget
            ? `Удалить специализацию «${deleteTarget.name}»?`
            : 'Удалить специализацию?'
        }
        description="Нельзя удалить специализацию, если она указана у врачей или услуг."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={deletingSpec}
        error={deleteError}
        onClose={() => !deletingSpec && setDeleteTarget(null)}
        onConfirm={handleDeleteSpec}
      />
    </>
  );
};
