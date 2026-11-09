'use client';

import React from 'react';
import { DeletePetModalProps } from './types';

/**
 * Диалог подтверждения безвозвратного удаления питомца.
 */
export const DeletePetModal: React.FC<DeletePetModalProps> = ({
  isOpen,
  pet,
  deleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !pet) return null;

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
          <span className="dialog-title">Удалить питомца?</span>
          <span className="dialog-desc">
            Питомец «{pet.name}» будет безвозвратно удалён из базы клиники.
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
