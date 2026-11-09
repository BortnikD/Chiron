'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../../../api';
import { Service, Specialization } from '../../../../types';

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  specializations: Specialization[];
  service?: Service | null;
  onSuccess: (savedService?: Service) => Promise<void> | void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  specializations,
  service,
  onSuccess,
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specializationId) {
      setError('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        specializationId: form.specializationId,
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
        baseDurationMin: Number(form.baseDurationMin),
        bufferAfterMin: Number(form.bufferAfterMin),
        isActive: form.isActive,
      };

      let result: Service | undefined;
      if (service) {
        result = await adminApi.updateService(service.id, payload);
      } else {
        result = await adminApi.createService(payload);
      }

      await onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (service ? 'Ошибка сохранения услуги' : 'Ошибка создания услуги')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-md"
        style={{ width: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">
            {service ? 'Редактировать услугу' : 'Новая услуга'}
          </span>
          <span className="dialog-desc">
            {service
              ? 'Изменение параметров ветеринарной услуги'
              : 'Создание ветеринарной услуги клиники'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="field">
              <span className="field-label">
                Специализация <span className="req">*</span>
              </span>
              <select
                className="select"
                value={form.specializationId}
                onChange={(e) =>
                  setForm({ ...form, specializationId: e.target.value })
                }
                required
              >
                {specializations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cr-sname">
                Название <span className="req">*</span>
              </label>
              <input
                id="cr-sname"
                className="input"
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
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div
              className="form-grid"
              style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
            >
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      basePrice: parseInt(e.target.value) || 0,
                    })
                  }
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      baseDurationMin: parseInt(e.target.value) || 30,
                    })
                  }
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bufferAfterMin: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="row" style={{ height: 36, gap: 10 }}>
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
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{error}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? service
                  ? 'Сохранение…'
                  : 'Создание…'
                : service
                ? 'Сохранить'
                : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
