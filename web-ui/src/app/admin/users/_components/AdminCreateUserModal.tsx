'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../../../api';
import { User, UserRole } from '../../../../types';

export interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: User) => void;
}

/**
 * Модальное окно создания пользователя (клиент, врач, администратор).
 */
export const AdminCreateUserModal: React.FC<AdminCreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [createForm, setCreateForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CLIENT' as UserRole,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCreateForm({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'CLIENT',
      });
      setCreateError(null);
      setCreating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.firstName ||
      !createForm.lastName ||
      !createForm.email ||
      !createForm.password
    ) {
      setCreateError('Заполните обязательные поля');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await adminApi.createUser({
        firstName: createForm.firstName.trim(),
        middleName: createForm.middleName.trim() || undefined,
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.message || err?.message || 'Ошибка создания пользователя'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="dialog dialog-md"
        style={{ width: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Создать пользователя</span>
          <span className="dialog-desc">Регистрация нового пользователя в системе Chiron</span>
        </div>

        <form onSubmit={handleSubmit} className="col" style={{ gap: 14 }}>
          <div className="field">
            <span className="field-label">Роль</span>
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${createForm.role === 'CLIENT' ? 'on' : ''}`}
                onClick={() => setCreateForm({ ...createForm, role: 'CLIENT' })}
              >
                Клиент
              </button>
              <button
                type="button"
                className={`seg-item ${createForm.role === 'VETERINARIAN' ? 'on' : ''}`}
                onClick={() => setCreateForm({ ...createForm, role: 'VETERINARIAN' })}
              >
                Ветеринар
              </button>
              <button
                type="button"
                className={`seg-item ${createForm.role === 'ADMIN' ? 'on' : ''}`}
                onClick={() => setCreateForm({ ...createForm, role: 'ADMIN' })}
              >
                Админ
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="cu-first">
                Имя <span className="req">*</span>
              </label>
              <input
                id="cu-first"
                className="input"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cu-middle">
                Отчество
              </label>
              <input
                id="cu-middle"
                className="input"
                value={createForm.middleName}
                onChange={(e) => setCreateForm({ ...createForm, middleName: e.target.value })}
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cu-last">
                Фамилия <span className="req">*</span>
              </label>
              <input
                id="cu-last"
                className="input"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                required
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cu-email">
                Email <span className="req">*</span>
              </label>
              <input
                id="cu-email"
                type="email"
                className="input"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cu-phone">
                Телефон <span className="req">*</span>
              </label>
              <input
                id="cu-phone"
                type="tel"
                className="input"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                required
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="cu-pass">
                Пароль <span className="req">*</span>
              </label>
              <input
                id="cu-pass"
                type="password"
                className="input"
                placeholder="Минимум 8 символов"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
            </div>
          </div>

          {createError && (
            <div className="alert" role="alert">
              <AlertCircle size={16} />
              <div>{createError}</div>
            </div>
          )}

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
