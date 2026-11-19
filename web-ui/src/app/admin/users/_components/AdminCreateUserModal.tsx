'use client';

import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '@/shared/types';
import { formatApiError, getUtf8ByteLength } from '@/shared/lib';
import { PhoneInput, ModalShell } from '@/shared/components';
import type { CreateUserInput } from '../_hooks/useAdminUsers';

export interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (data: CreateUserInput) => Promise<User>;
}

/**
 * Модальное окно создания пользователя (клиент, врач, администратор).
 */
export const AdminCreateUserModal: React.FC<AdminCreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreateUser,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = createForm.phone.replace(/[\s()-]/g, '').trim();
    const phoneDigits = createForm.phone.replace(/\D/g, '');
    if (
      !createForm.firstName.trim() ||
      !createForm.lastName.trim() ||
      !createForm.email.trim() ||
      !createForm.phone.trim() ||
      !createForm.password
    ) {
      setCreateError('Заполните обязательные поля');
      return;
    }
    if (phoneDigits.length !== 11) {
      setCreateError('Номер телефона должен содержать 11 цифр (например, +7 (900) 123-45-67)');
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (getUtf8ByteLength(createForm.password) > 72) {
      setCreateError('Пароль не должен превышать 72 байта (около 36 кириллических или 72 латинских символа)');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await onCreateUser({
        firstName: createForm.firstName.trim(),
        middleName: createForm.middleName.trim() || undefined,
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: normalizedPhone,
        password: createForm.password,
        role: createForm.role,
      });
      onClose();
    } catch (err: unknown) {
      setCreateError(formatApiError(err, 'Ошибка создания пользователя'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Создать пользователя"
      description="Регистрация нового пользователя в системе Chiron"
      loading={creating}
      error={createError}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={creating}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Создание…' : 'Создать'}
          </button>
        </>
      }
    >
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
                <PhoneInput
                  id="cu-phone"
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
    </ModalShell>
  );
};
