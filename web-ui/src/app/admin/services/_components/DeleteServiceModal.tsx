'use client';

import React from 'react';
import { Service } from '../../../../types';

export interface DeleteServiceModalProps {
  isOpen: boolean;
  service: Service | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting?: boolean;
}

export const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
  isOpen,
  service,
  onClose,
  onConfirm,
  deleting = false,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-sm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Удалить услугу?</span>
          <span className="dialog-desc">
            Услуга «{service.name}» будет удалена. Записи с этой услугой могут быть затронуты.
          </span>
        </div>
        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={deleting}
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
