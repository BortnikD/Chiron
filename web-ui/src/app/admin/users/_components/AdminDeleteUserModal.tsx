'use client';

import React from 'react';
import { User } from '../../../../types';

export interface AdminDeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  deleting?: boolean;
}

/**
 * Диалог подтверждения удаления пользователя.
 */
export const AdminDeleteUserModal: React.FC<AdminDeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
  deleting = false,
}) => {
  if (!isOpen || !user) return null;

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
        className="dialog dialog-sm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Удалить пользователя?</span>
          <span className="dialog-desc">
            Пользователь «{user.fullName || user.email}» будет безвозвратно удалён.
            Связанные данные могут стать недоступны.
          </span>
        </div>
        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};
