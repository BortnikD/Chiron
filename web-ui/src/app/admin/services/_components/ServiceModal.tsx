'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Service, Specialization } from '@/modules/clinic/types';
import { SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import { formatApiError } from '@/shared/lib';
import type { SaveServiceInput } from './constants';

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  specializations: Specialization[];
  service?: Service | null;
  onSave: (data: SaveServiceInput, id?: string) => Promise<Service>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  specializations,
  service,
  onSave,
}) => {
  const [form, setForm] = useState({
    name: '',
    specializationId: '',
    description: '',
    basePrice: 1500,
    baseDurationMin: 30,
    bufferAfterMin: 10,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specOptions = useMemo<SearchComboboxOption[]>(
    () =>
      specializations.map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.description || undefined,
      })),
    [specializations]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (service) {
      setForm({
        name: service.name,
        specializationId: service.specializationId,
        description: service.description || '',
        basePrice: service.basePrice,
        baseDurationMin: service.baseDurationMin,
        bufferAfterMin: service.bufferAfterMin,
        isActive: service.isActive,
      });
    } else {
      setForm({
        name: '',
        specializationId: specializations[0]?.id || '',
        description: '',
        basePrice: 1500,
        baseDurationMin: 30,
        bufferAfterMin: 10,
        isActive: true,
      });
    }
    setError(null);
  }, [isOpen, service, specializations]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specializationId) {
      setError('Заполните обязательные поля');
      return;
    }
    const dur = Number(form.baseDurationMin);
    const buf = Number(form.bufferAfterMin);
    if (Number.isNaN(dur) || dur < 1 || dur > 1440) {
      setError('Длительность должна быть от 1 до 1440 мин');
      return;
    }
    if (Number.isNaN(buf) || buf < 0 || buf > 240) {
      setError('Буфер должен быть от 0 до 240 мин');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          name: form.name.trim(),
          specializationId: form.specializationId,
          description: form.description.trim(),
          basePrice: Number(form.basePrice) || 0,
          baseDurationMin: dur,
          bufferAfterMin: buf,
          isActive: form.isActive,
        },
        service?.id
      );
      onClose();
    } catch (err: unknown) {
      setError(
        formatApiError(err, service ? 'Ошибка сохранения услуги' : 'Ошибка создания услуги')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
      onClick={() => !saving && onClose()}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
            <span id="service-modal-title" className="dialog-title">
              {service ? 'Редактировать услугу' : 'Новая услуга'}
            </span>
            <span className="dialog-desc">
              {service
                ? 'Изменение параметров ветеринарной услуги'
                : 'Создание ветеринарной услуги клиники'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Закрыть"
            onClick={() => !saving && onClose()}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        >
          <div className="dialog-body">
            <div className="field">
              <label className="field-label" htmlFor="cr-sspec">
                Специализация <span className="req">*</span>
              </label>
              <SearchCombobox
                id="cr-sspec"
                value={form.specializationId}
                options={specOptions}
                onChange={(specializationId) => setForm({ ...form, specializationId })}
                placeholder="Выберите специализацию"
                ariaLabel="Выберите специализацию"
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cr-sname">
                Название <span className="req">*</span>
              </label>
              <input
                id="cr-sname"
                className="input"
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cr-sdesc">
                Описание
              </label>
              <textarea
                id="cr-sdesc"
                className="textarea"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <div className="field">
                <label className="field-label" htmlFor="cr-sprice">
                  Цена, ₽
                </label>
                <input
                  id="cr-sprice"
                  type="number"
                  min="0"
                  className="input"
                  value={form.basePrice}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setForm({ ...form, basePrice: Number.isNaN(parsed) ? 0 : parsed });
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cr-sdur">
                  Длит., мин
                </label>
                <input
                  id="cr-sdur"
                  type="number"
                  min="1"
                  max="1440"
                  className="input"
                  value={form.baseDurationMin}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setForm({ ...form, baseDurationMin: Number.isNaN(parsed) ? 30 : parsed });
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cr-sbuf">
                  Буфер, мин
                </label>
                <input
                  id="cr-sbuf"
                  type="number"
                  min="0"
                  max="240"
                  className="input"
                  value={form.bufferAfterMin}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setForm({ ...form, bufferAfterMin: Number.isNaN(parsed) ? 0 : parsed });
                  }}
                />
              </div>
            </div>

            <div className="row" style={{ minHeight: 36, gap: 10 }}>
              <button
                type="button"
                className={`switch ${form.isActive ? 'on' : ''}`}
                role="switch"
                aria-checked={form.isActive}
                aria-label="Активна"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
              />
              <span>Активна — видна в каталоге и доступна для записи</span>
            </div>

            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle size={16} className="ic" />
                <div>{error}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (service ? 'Сохранение…' : 'Создание…') : service ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
