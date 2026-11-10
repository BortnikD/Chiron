'use client';

import React, { useState, useEffect } from 'react';
import { PawPrint, Plus, Trash2, AlertCircle, X } from 'lucide-react';
import type { Species } from '@/modules/clinic/types';
import { formatApiError } from '@/shared/lib';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

export interface SpeciesTabProps {
  speciesList: Species[];
  onCreateSpecies: (name: string) => Promise<void>;
  onDeleteSpecies: (id: string) => Promise<void>;
}

export const SpeciesTab: React.FC<SpeciesTabProps> = ({
  speciesList,
  onCreateSpecies,
  onDeleteSpecies,
}) => {
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Species | null>(null);
  const [deletingSpecies, setDeletingSpecies] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSpeciesModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingSpecies) setIsSpeciesModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeciesModalOpen, savingSpecies]);

  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSpeciesName.trim();
    if (!trimmed) {
      setSaveError('Введите название вида');
      return;
    }
    setSavingSpecies(true);
    setSaveError(null);
    try {
      await onCreateSpecies(trimmed);
      setIsSpeciesModalOpen(false);
      setNewSpeciesName('');
    } catch (err: unknown) {
      setSaveError(formatApiError(err, 'Ошибка добавления вида'));
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
            <PawPrint size={18} />
            Виды животных <span className="count">{speciesList.length}</span>
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setNewSpeciesName('');
              setSaveError(null);
              setIsSpeciesModalOpen(true);
            }}
          >
            <Plus size={14} />
            Добавить вид
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.5fr 1fr 100px', minWidth: '600px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Название</span>
              <span>Идентификатор</span>
              <span className="right">Действия</span>
            </div>

            {speciesList.map((sp) => (
              <div key={sp.id} className="trow static">
                <span className="cell-main">{sp.name}</span>
                <span className="tnum muted">{sp.id}</span>
                <span className="row-actions right">
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
            ))}
          </div>
        </div>
      </section>

      {isSpeciesModalOpen && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-species-title"
          onClick={() => !savingSpecies && setIsSpeciesModalOpen(false)}
        >
          <div className="dialog dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <span id="add-species-title" className="dialog-title">
                Добавить вид животных
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Закрыть"
                onClick={() => !savingSpecies && setIsSpeciesModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSpecies} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div className="dialog-body">
                <div className="field">
                  <label className="field-label" htmlFor="new-sp-name">
                    Название <span className="req">*</span>
                  </label>
                  <input
                    id="new-sp-name"
                    className="input"
                    placeholder="Кошка, Собака…"
                    value={newSpeciesName}
                    onChange={(e) => setNewSpeciesName(e.target.value)}
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
                  onClick={() => setIsSpeciesModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSpecies}>
                  {savingSpecies ? 'Сохранение…' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Удалить вид животных?"
        description={deleteTarget ? `Вид «${deleteTarget.name}» будет удалён.` : ''}
        confirmLabel="Удалить"
        loading={deletingSpecies}
        error={deleteError}
        onClose={() => !deletingSpecies && setDeleteTarget(null)}
        onConfirm={handleDeleteSpecies}
      />
    </>
  );
};
