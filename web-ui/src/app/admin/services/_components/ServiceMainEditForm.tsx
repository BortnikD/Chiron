'use client';

import React, { useMemo } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import type { Specialization } from '@/modules/clinic/types';
import { SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import type { ServiceEditFormState } from './constants';

export interface ServiceMainEditFormProps {
  form: ServiceEditFormState;
  specializations: Specialization[];
  onChange: React.Dispatch<React.SetStateAction<ServiceEditFormState>>;
  saveError: string | null;
  saveSuccess: boolean;
}

export const ServiceMainEditForm: React.FC<ServiceMainEditFormProps> = ({
  form,
  specializations,
  onChange,
  saveError,
  saveSuccess,
}) => {
  const specOptions = useMemo<SearchComboboxOption[]>(
    () =>
      specializations.map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.description || undefined,
      })),
    [specializations]
  );

  const durValid = form.baseDurationMin >= 1 && form.baseDurationMin <= 1440;
  const bufValid = form.bufferAfterMin >= 0 && form.bufferAfterMin <= 240;

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="field">
        <label className="field-label" htmlFor="sd-spec">
          Специализация <span className="req">*</span>
        </label>
        <SearchCombobox
          id="sd-spec"
          value={form.specializationId}
          options={specOptions}
          onChange={(specializationId) => onChange((prev) => ({ ...prev, specializationId }))}
          placeholder="Выберите специализацию"
          ariaLabel="Выберите специализацию"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sd-name">
          Название <span className="req">*</span>
        </label>
        <input
          id="sd-name"
          className="input"
          maxLength={150}
          value={form.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="sd-desc">
          Описание
        </label>
        <textarea
          id="sd-desc"
          className="textarea"
          rows={2}
          value={form.description}
          onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="field">
          <label className="field-label" htmlFor="sd-price">
            Цена, ₽
          </label>
          <input
            id="sd-price"
            type="number"
            min="0"
            className="input"
            value={form.basePrice}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              onChange((prev) => ({ ...prev, basePrice: Number.isNaN(parsed) ? 0 : parsed }));
            }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="sd-dur">
            Длит., мин
          </label>
          <input
            id="sd-dur"
            type="number"
            min="1"
            max="1440"
            className={`input ${durValid ? '' : 'invalid'}`}
            value={form.baseDurationMin}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              onChange((prev) => ({
                ...prev,
                baseDurationMin: Number.isNaN(parsed) ? 0 : parsed,
              }));
            }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="sd-buf">
            Буфер, мин
          </label>
          <input
            id="sd-buf"
            type="number"
            min="0"
            max="240"
            className={`input ${bufValid ? '' : 'invalid'}`}
            value={form.bufferAfterMin}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              onChange((prev) => ({
                ...prev,
                bufferAfterMin: Number.isNaN(parsed) ? -1 : parsed,
              }));
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
          onClick={() => onChange((prev) => ({ ...prev, isActive: !prev.isActive }))}
        />
        <span>Активна — видна в каталоге и доступна для записи</span>
      </div>

      {saveError && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle size={16} className="ic" />
          <div>{saveError}</div>
        </div>
      )}

      {saveSuccess && (
        <div className="alert alert-success" role="status">
          <Check size={16} className="ic" />
          <div>Услуга обновлена</div>
        </div>
      )}
    </div>
  );
};
