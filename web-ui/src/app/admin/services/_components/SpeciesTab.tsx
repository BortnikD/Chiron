'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shapes, Plus, Edit2, Trash2, AlertCircle, X, ChevronDown, Check } from 'lucide-react';
import type { Service, ServiceSpecies, Species } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { ConfirmModal } from '@/shared/components';
import { ThemeSafeColorPicker } from '@/components/ui/ThemeSafeColorPicker';
import { formatApiError, getSpeciesTone, getSpeciesStyle, DEFAULT_SPECIES_COLORS } from '@/shared/lib';

export interface SpeciesTabProps {
  speciesList: Species[];
  services: Service[];
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  onCreateSpecies: (data: { name: string; color?: string | null; iconKey?: string | null } | string) => Promise<void>;
  onUpdateSpecies: (id: string, data: { name?: string; color?: string | null; iconKey?: string | null } | string) => Promise<void>;
  onDeleteSpecies: (id: string) => Promise<void>;
}

const SPECIES_ICON_OPTIONS = [
  { key: '', label: 'По умолчанию', icon: null },
  { key: 'cat', label: 'Кошка (cat)', icon: 'cat' },
  { key: 'dog', label: 'Собака (dog)', icon: 'dog' },
  { key: 'pig', label: 'Морская свинка (pig)', icon: 'pig' },
  { key: 'fer', label: 'Хорёк (fer)', icon: 'fer' },
  { key: 'rab', label: 'Кролик (rab)', icon: 'rab' },
  { key: 'par', label: 'Попугай (par)', icon: 'par' },
];

interface SpeciesIconSelectProps {
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}

const SpeciesIconSelect: React.FC<SpeciesIconSelectProps> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selectedOpt = SPECIES_ICON_OPTIONS.find((o) => o.key === value) || SPECIES_ICON_OPTIONS[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        id="species-icon-input"
        className="input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 12px',
          height: '36px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
        }}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {selectedOpt.icon ? (
            <SpeciesIcon species={selectedOpt.icon} size={18} className="text-primary" />
          ) : (
            <span className="small muted">—</span>
          )}
          <span style={{ fontSize: '13px' }}>{selectedOpt.label}</span>
        </span>
        <ChevronDown
          size={15}
          className="muted"
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            padding: '4px',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {SPECIES_ICON_OPTIONS.map((opt) => {
            const isSelected = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: isSelected ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                  color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--muted)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: opt.key ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  {opt.icon ? <SpeciesIcon species={opt.icon} size={18} /> : <span>—</span>}
                </div>
                <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const SpeciesTab: React.FC<SpeciesTabProps> = ({
  speciesList,
  services,
  serviceSpeciesMap,
  onCreateSpecies,
  onUpdateSpecies,
  onDeleteSpecies,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speciesForm, setSpeciesForm] = useState<{
    id: string;
    name: string;
    color: string;
    iconKey: string;
  }>({ id: '', name: '', color: '', iconKey: '' });
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
    const trimmedColor = speciesForm.color.trim();
    if (trimmedColor && !/^#[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
      setSaveError('Цвет должен быть в формате HEX (#RRGGBB)');
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
      const payload = {
        name: trimmed,
        color: trimmedColor || null,
        iconKey: speciesForm.iconKey.trim() || null,
      };
      if (speciesForm.id) {
        await onUpdateSpecies(speciesForm.id, payload);
      } else {
        await onCreateSpecies(payload);
      }
      setIsModalOpen(false);
      setSpeciesForm({ id: '', name: '', color: '', iconKey: '' });
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
              setSpeciesForm({ id: '', name: '', color: '', iconKey: '' });
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
              const tone = getSpeciesTone(sp.name || sp.iconKey, speciesList);
              const chipStyle = getSpeciesStyle(sp.id, speciesList);
              return (
                <div key={sp.id} className="trow static">
                  <span className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <span
                      className={`sp-chip tone-${tone}`}
                      style={chipStyle}
                    >
                      <SpeciesIcon
                        species={sp.iconKey || tone}
                        size={14}
                        className="ic"
                      />
                      <span>{sp.name}</span>
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
                        setSpeciesForm({
                          id: sp.id,
                          name: sp.name,
                          color: sp.color || '',
                          iconKey: sp.iconKey || '',
                        });
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
          <div className="dialog dialog-sm" style={{ overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
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
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'visible' }}
            >
              <div className="dialog-body" style={{ overflow: 'visible' }}>
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

                <div className="field">
                  <label className="field-label" htmlFor="species-icon-input">
                    Иконка <span className="small muted">(необязательно)</span>
                  </label>
                  <SpeciesIconSelect
                    value={speciesForm.iconKey}
                    onChange={(iconKey) => setSpeciesForm({ ...speciesForm, iconKey })}
                    disabled={savingSpecies}
                  />
                </div>

                <div className="field">
                  {(() => {
                    const formDefaultTone = getSpeciesTone(speciesForm.name || speciesForm.iconKey);
                    const formDefaultColor = DEFAULT_SPECIES_COLORS[formDefaultTone] || '#EDB345';
                    return (
                      <ThemeSafeColorPicker
                        id="species-color-input"
                        label="Цвет вида (HEX)"
                        value={speciesForm.color}
                        defaultColor={formDefaultColor}
                        onChange={(hex) => setSpeciesForm({ ...speciesForm, color: hex })}
                        onReset={() => setSpeciesForm({ ...speciesForm, color: '' })}
                        previewLabel={speciesForm.name || 'Вид животного'}
                      />
                    );
                  })()}
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
