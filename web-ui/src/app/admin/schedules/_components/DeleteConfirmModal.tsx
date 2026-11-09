'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Модальное окно подтверждения удаления рабочего дня или исключения из расписания.
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="dialog dialog-sm" role="dialog" aria-modal="true">
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'center' }}>
            <span className="dialog-title">{title}</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Закрыть"
            >
              <X className="ic" />
            </button>
          </div>
          {description && <span className="dialog-desc">{description}</span>}
        </div>

        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Удаление...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
