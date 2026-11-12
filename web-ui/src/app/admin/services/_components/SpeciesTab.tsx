'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Shapes, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import type { Service, ServiceSpecies, Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { ConfirmModal } from '@/shared/components';
import { formatApiError, getSpeciesTone } from '@/shared/lib';

export interface SpeciesTabProps {
  speciesList: Species[];
  services: Service[];
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  onCreateSpecies: (name: string) => Promise<void>;
  onUpdateSpecies: (id: string, name: string) => Promise<void>;
  onDeleteSpecies: (id: string) => Promise<void>;
}

export const SpeciesTab: React.FC<SpeciesTabProps> = ({
  speciesList,
  services,
  serviceSpeciesMap,
  onCreateSpecies,
  onUpdateSpecies,
  onDeleteSpecies,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speciesForm, setSpeciesForm] = useState<{ id: string; name: string }>({ id: '', name: '' });
  const [savingSpecies, setSavingSpecies] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Species | null>(null);
  const [deletingSpecies, setDeletingSpecies] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const serviceCountsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of services) {
      for (const link of serviceSpeciesMap[s.id] || []) {
        counts[link.speciesId] = (counts[link.speciesId] || 0) + 1;
      }
    }
    return counts;
  }, [services, serviceSpeciesMap]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingSpecies) setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, savingSpecies]);

  const handleSaveSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = speciesForm.name.trim();
    if (!trimmed) {
      setSaveError('Введите название вида');
      return;
    }
    if (
      speciesList.some(
        (sp) => sp.id !== speciesForm.id && sp.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setSaveError('Вид с таким названием уже существует');
      return;
    }

    setSavingSpecies(true);
    setSaveError(null);
    try {
      if (speciesForm.id) {
        await onUpdateSpecies(speciesForm.id, trimmed);
      } else {
        await onCreateSpecies(trimmed);
      }
      setIsModalOpen(false);
      setSpeciesForm({ id: '', name: '' });
    } catch (err: unknown) {
      setSaveError(formatApiError(err, 'Ошибка сохранения вида животных'));
    } finally {
      setSavingSpecies(false);
    }
  };

  const handleDeleteSpecies = async () => {
    if (!deleteTarget) return;
    setDeletingSpecies(true);
    setDeleteError(null);
    try {
      await onDeleteSpecies(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка удаления вида'));
    } finally {
      setDeletingSpecies(false);
    }
  };

  return (
    <>
      <section className="island grow">
        <div className="island-head">
          <span className="island-title">
            <Shapes size={18} />
            Виды животных <span className="count">{speciesList.length}</span>
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSpeciesForm({ id: '', name: '' });
              setSaveError(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={14} />
            Добавить вид
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.6fr 0.7fr 1.2fr 96px', minWidth: '580px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Название</span>
              <span className="right">Услуг</span>
              <span>Идентификатор</span>
              <span />
            </div>

            {speciesList.map((sp) => {
              const tone = getSpeciesTone(sp.name);
              return (
                <div key={sp.id} className="trow static">
                  <span className="row" style={{ gap: 8 }}>
                    <span className={`sp-chip tone-${tone}`}>
                      <SpeciesIcon species={tone} size={14} className="ic" />
                      {sp.name}
                    </span>
                  </span>
                  <span className="right tnum">{serviceCountsBySpecies[sp.id] || 0}</span>
                  <span className="tnum muted small" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sp.id}
                  </span>
                  <span className="row-actions right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      aria-label={`Изменить вид «${sp.name}»`}
                      title="Изменить"
                      onClick={() => {
                        setSpeciesForm({ id: sp.id, name: sp.name });
                        setSaveError(null);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      aria-label={`Удалить вид «${sp.name}»`}
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
              );
            })}

            {speciesList.length === 0 && (
              <div className="empty">
                <span className="empty-title">Виды животных не добавлены</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="species-modal-title"
          onClick={() => !savingSpecies && setIsModalOpen(false)}
        >
          <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div
              className="dialog-head"
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span id="species-modal-title" className="dialog-title">
                {speciesForm.id ? 'Изменить вид животных' : 'Новый вид животных'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => !savingSpecies && setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveSpecies}
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
            >
              <div className="dialog-body">
                <div className="field">
                  <label className="field-label" htmlFor="species-name-input">
                    Название <span className="req">*</span>
                  </label>
                  <input
                    id="species-name-input"
                    className="input"
                    maxLength={100}
                    placeholder="Например, Хорёк"
                    value={speciesForm.name}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, name: e.target.value })}
                    required
                  />
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
                  disabled={savingSpecies}
                  onClick={() => setIsModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSpecies}>
                  {savingSpecies ? 'Сохранение…' : speciesForm.id ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget ? `Удалить вид «${deleteTarget.name}»?` : 'Удалить вид животных?'}
        description="Вид нельзя удалить, если к нему привязаны питомцы, услуги или допуски врачей."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={deletingSpecies}
        error={deleteError}
        onClose={() => !deletingSpecies && setDeleteTarget(null)}
        onConfirm={handleDeleteSpecies}
      />
    </>
  );
};
