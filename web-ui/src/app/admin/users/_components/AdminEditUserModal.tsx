'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { User } from '@/shared/types';
import { buildPatchPayload, formatApiError, formatUserFullName, normalizePhone } from '@/shared/lib';
import { PhoneInput, ModalShell } from '@/shared/components';

export interface AdminEditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUpdateUser: (id: string, data: Partial<User>) => Promise<User>;
}

/**
 * Модальное окно изменения данных пользователя.
 */
export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
}) => {
  const [editForm, setEditForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setEditForm({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setError(null);
      setSaving(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = editForm.phone.replace(/\D/g, '');
    const normalizedPhone = phoneDigits ? normalizePhone(editForm.phone) : '';
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      setError('Заполните обязательные поля');
      return;
    }
    if (phoneDigits && phoneDigits.length !== 11) {
      setError('Номер телефона должен содержать 11 цифр (например, +7 (900) 123-45-67)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const initial = {
        firstName: user.firstName,
        middleName: user.middleName || null,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      };
      const current = {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: normalizedPhone,
      };
      const patch = buildPatchPayload(initial, current);
      await onUpdateUser(user.id, patch);
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка обновления пользователя'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Редактировать пользователя"
      description={`Изменение данных пользователя «${formatUserFullName(user)}»`}
      loading={saving}
      footer={
        <div className="row end" style={{ gap: '8px', width: '100%' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      }
    >
      <form
        id="edit-user-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
      >
        <div className="dialog-body">
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="me-first">
                Имя <span className="req">*</span>
              </label>
              <input
                id="me-first"
                className="input"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="me-middle">
                Отчество
              </label>
              <input
                id="me-middle"
                className="input"
                value={editForm.middleName}
                onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="me-last">
                Фамилия <span className="req">*</span>
              </label>
              <input
                id="me-last"
                className="input"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                required
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="me-email">
                Email <span className="req">*</span>
              </label>
              <input
                id="me-email"
                type="email"
                className="input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="field span-2">
              <label className="field-label" htmlFor="me-phone">
                Телефон
              </label>
              <PhoneInput
                id="me-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-destructive" role="alert" style={{ marginTop: '12px' }}>
              <AlertCircle size={16} className="ic" />
              <div>{error}</div>
            </div>
          )}
        </div>
      </form>
    </ModalShell>
  );
};
