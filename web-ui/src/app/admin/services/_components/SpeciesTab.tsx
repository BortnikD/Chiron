'use client';

import React, { useState } from 'react';
import { PawPrint, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../../../api';
import { Species } from '../../../../types';

export interface SpeciesTabProps {
  speciesList: Species[];
  onRefresh: () => Promise<void>;
}

export const SpeciesTab: React.FC<SpeciesTabProps> = ({ speciesList, onRefresh }) => {
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);

  const handleAddSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeciesName.trim()) return;
    setSavingSpecies(true);
    try {
      await adminApi.createSpecies(newSpeciesName.trim());
      setIsSpeciesModalOpen(false);
      setNewSpeciesName('');
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка добавления вида');
    } finally {
      setSavingSpecies(false);
    }
  };

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm('Удалить вид животных?')) return;
    try {
      await adminApi.deleteSpecies(id);
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления вида');
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
            onClick={() => setIsSpeciesModalOpen(true)}
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
                    onClick={() => handleDeleteSpecies(sp.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal: Add Species */}
      {isSpeciesModalOpen && (
        <div
          className="overlay"
          onClick={() => setIsSpeciesModalOpen(false)}
        >
          <div
            className="dialog dialog-sm"
            style={{ width: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">Добавить вид животных</span>
            </div>

            <form onSubmit={handleAddSpecies}>
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
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsSpeciesModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpecies}
                >
                  {savingSpecies ? 'Сохранение…' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
