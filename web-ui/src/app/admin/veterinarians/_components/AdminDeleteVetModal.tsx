'use client';

import React, { useState } from 'react';
import { adminApi } from '../../../../api';
import { Veterinarian } from '../../../../types';

export interface AdminDeleteVetModalProps {
  isOpen: boolean;
  onClose: () => void;
  vet: Veterinarian | null;
  vetName: string;
  onDeleted: () => void;
}

export const AdminDeleteVetModal: React.FC<AdminDeleteVetModalProps> = ({
  isOpen,
  onClose,
  vet,
  vetName,
  onDeleted,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !vet) return null;

  const handleDeleteVet = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteVeterinarian(vet.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении профиля врача');
    } finally {
      setDeleting(false);
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
        className="dialog dialog-sm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Удалить профиль врача?</span>
          <span className="dialog-desc">
            Профиль врача «{vetName}» будет удалён. Записи и расписание
            могут быть затронуты. Сама учётная запись пользователя сохранится.
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
            type="submit"
            className="btn btn-destructive"
            onClick={handleDeleteVet}
            disabled={deleting}
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};
