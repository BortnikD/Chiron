'use client';

import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { clientApi } from '@/modules/client/api';
import type { Pet } from '@/modules/client/types';
import type { Species } from '@/modules/clinic/types';
import { DatePicker } from '@/shared/components';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';

export interface QuickAddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetCreated: (pet: Pet) => void;
  speciesList: Species[];
  allowedSpeciesIds?: string[];
}

export const QuickAddPetModal: React.FC<QuickAddPetModalProps> = ({
  isOpen,
  onClose,
  onPetCreated,
  speciesList,
  allowedSpeciesIds,
}) => {
  const todayIso = React.useMemo(() => getMoscowTodayIso(), []);
  const defaultSpeciesId = React.useMemo(() => {
    if (allowedSpeciesIds && allowedSpeciesIds.length > 0) {
      return allowedSpeciesIds[0];
    }
    return speciesList[0]?.id || '';
  }, [allowedSpeciesIds, speciesList]);

  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState(defaultSpeciesId);
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setSpeciesId(defaultSpeciesId);
      setBreed('');
      setGender('');
      setBirthDate('');
      setError(null);
    }
  }, [isOpen, defaultSpeciesId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Укажите кличку питомца');
      return;
    }
    if (!speciesId) {
      setError('Выберите вид животного');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await clientApi.createPet({
        name: name.trim(),
        speciesId,
        breed: breed.trim() || undefined,
        gender: (gender === 'MALE' || gender === 'FEMALE') ? gender : undefined,
        birthDate: birthDate || undefined,
      });

      if (created) {
        onPetCreated(created);
        onClose();
      }
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось добавить питомца'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSpecies = allowedSpeciesIds && allowedSpeciesIds.length > 0
    ? speciesList.filter((s) => allowedSpeciesIds.includes(s.id))
    : speciesList;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="island"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          animation: 'wz-step-fade-in 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-pet-title"
      >
        <div className="island-head row between items-center">
          <span id="quick-pet-title" className="island-title">
            <Plus className="ic" />
            Добавить питомца
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            disabled={submitting}
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="col"
          style={{ gap: '14px', padding: '16px', overflowY: 'auto', minHeight: 0 }}
        >
          {error && (
            <div className="alert alert-destructive" role="alert">
              <AlertCircle size={16} className="ic" />
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="quick-pet-name">
              Кличка <span className="accent">*</span>
            </label>
            <input
              id="quick-pet-name"
              className="input"
              type="text"
              placeholder="Например, Рекс или Луна"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="quick-pet-species">
              Вид животного <span className="accent">*</span>
            </label>
            <select
              id="quick-pet-species"
              className="input"
              value={speciesId}
              onChange={(e) => setSpeciesId(e.target.value)}
              disabled={submitting}
              required
            >
              {filteredSpecies.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="quick-pet-breed">
              Порода
            </label>
            <input
              id="quick-pet-breed"
              className="input"
              type="text"
              placeholder="Например, Хаски или Мейн-кун"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="row wrap" style={{ gap: '12px' }}>
            <div className="field grow" style={{ minWidth: '160px' }}>
              <span className="field-label">Пол</span>
              <div className="seg" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`seg-item grow ${gender === 'MALE' ? 'on' : ''}`}
                  onClick={() => setGender('MALE')}
                  disabled={submitting}
                >
                  Самец
                </button>
                <button
                  type="button"
                  className={`seg-item grow ${gender === 'FEMALE' ? 'on' : ''}`}
                  onClick={() => setGender('FEMALE')}
                  disabled={submitting}
                >
                  Самка
                </button>
                <button
                  type="button"
                  className={`seg-item grow ${!gender ? 'on' : ''}`}
                  onClick={() => setGender('')}
                  disabled={submitting}
                >
                  Не указан
                </button>
              </div>
            </div>

            <div className="field" style={{ minWidth: '165px' }}>
              <label className="field-label" htmlFor="quick-pet-bday">
                Дата рождения
              </label>
              <DatePicker
                id="quick-pet-bday"
                value={birthDate}
                onChange={setBirthDate}
                max={todayIso}
                disabled={submitting}
                ariaLabel="Дата рождения"
              />
            </div>
          </div>

          <div className="row end wrap" style={{ gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="ic spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="ic" />
                  <span>Сохранить и выбрать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
