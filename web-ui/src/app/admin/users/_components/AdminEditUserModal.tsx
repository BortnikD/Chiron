'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../../../api';
import { User } from '../../../../types';

export interface AdminEditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (updated?: User) => void;
}

/**
 * Модальное окно изменения данных пользователя.
 */
export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
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
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      setError('Заполните обязательные поля');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateUser(user.id, {
        firstName: editForm.firstName.trim(),
        middleName: editForm.middleName.trim() || null,
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
      onSuccess(updated as unknown as User);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Ошибка обновления пользователя'
      );
    } finally {
      setSaving(false);
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
          <span className="dialog-title">Редактировать пользователя</span>
          <span className="dialog-desc">
            Изменение данных пользователя «{user.fullName || `${user.firstName} ${user.lastName}`}»
          </span>
        </div>

        <form onSubmit={handleSubmit} className="col" style={{ gap: 14 }}>
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
            <div className="alert" role="alert">
              <AlertCircle size={16} />
              <div>{error}</div>
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
              disabled={saving}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
