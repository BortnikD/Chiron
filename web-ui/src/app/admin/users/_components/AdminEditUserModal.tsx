'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { User } from '@/shared/types';
import { formatApiError } from '@/shared/lib';

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = editForm.phone.replace(/[\s()-]/g, '').trim();
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      setError('Заполните обязательные поля');
      return;
    }
    if (normalizedPhone && !/^\+?\d{10,15}$/.test(normalizedPhone)) {
      setError('Телефон должен содержать от 10 до 15 цифр (например, +79001234567)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onUpdateUser(user.id, {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: normalizedPhone,
      });
      onClose();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Ошибка обновления пользователя'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      onClick={() => !saving && onClose()}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
            <span id="edit-user-title" className="dialog-title">
              Редактировать пользователя
            </span>
            <span className="dialog-desc">
              Изменение данных пользователя «{user.fullName || `${user.firstName} ${user.lastName}`}»
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
                <input
                  id="me-phone"
                  type="tel"
                  className="input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
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
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
