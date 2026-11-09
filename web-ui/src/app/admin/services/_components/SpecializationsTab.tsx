'use client';

import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi } from '../../../../api';
import { Specialization } from '../../../../types';

export interface SpecializationsTabProps {
  specializations: Specialization[];
  onRefresh: () => Promise<void>;
}

export const SpecializationsTab: React.FC<SpecializationsTabProps> = ({
  specializations,
  onRefresh,
}) => {
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [specForm, setSpecForm] = useState({ id: '', name: '', description: '' });
  const [savingSpec, setSavingSpec] = useState(false);

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specForm.name.trim()) return;
    setSavingSpec(true);
    try {
      if (specForm.id) {
        await adminApi.updateSpecialization(specForm.id, {
          name: specForm.name.trim(),
          description: specForm.description.trim(),
        });
      } else {
        await adminApi.createSpecialization({
          name: specForm.name.trim(),
          description: specForm.description.trim(),
        });
      }
      setIsSpecModalOpen(false);
      setSpecForm({ id: '', name: '', description: '' });
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка сохранения специализации');
    } finally {
      setSavingSpec(false);
    }
  };

  const handleDeleteSpec = async (id: string) => {
    if (!confirm('Удалить специализацию?')) return;
    try {
      await adminApi.deleteSpecialization(id);
      await onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка удаления специализации');
    }
  };

  return (
    <>
      <section className="island grow">
        <div className="island-head">
          <span className="island-title">
            <Tags size={18} />
            Специализации врачей <span className="count">{specializations.length}</span>
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSpecForm({ id: '', name: '', description: '' });
              setIsSpecModalOpen(true);
            }}
          >
            <Plus size={14} />
            Добавить специализацию
          </button>
        </div>

        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.2fr 2fr 100px', minWidth: '700px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Специализация</span>
              <span>Описание</span>
              <span className="right">Действия</span>
            </div>

            {specializations.map((sp) => (
              <div key={sp.id} className="trow static">
                <span className="cell-main">{sp.name}</span>
                <span className="muted">{sp.description || '—'}</span>
                <span className="row-actions right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => {
                      setSpecForm({
                        id: sp.id,
                        name: sp.name,
                        description: sp.description || '',
                      });
                      setIsSpecModalOpen(true);
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => handleDeleteSpec(sp.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal: Specialization Form */}
      {isSpecModalOpen && (
        <div
          className="overlay"
          onClick={() => setIsSpecModalOpen(false)}
        >
          <div
            className="dialog dialog-sm"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-title">
                {specForm.id ? 'Редактировать специализацию' : 'Новая специализация'}
              </span>
            </div>

            <form onSubmit={handleSaveSpec}>
              <div className="dialog-body">
                <div className="field">
                  <label className="field-label" htmlFor="spec-name">
                    Название <span className="req">*</span>
                  </label>
                  <input
                    id="spec-name"
                    className="input"
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
                    rows={2}
                    value={specForm.description}
                    onChange={(e) => setSpecForm({ ...specForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsSpecModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSpec}
                >
                  {savingSpec ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
