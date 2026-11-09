'use client';

import React from 'react';
import { AlertCircle, Archive } from 'lucide-react';
import { Pet } from '../../../../types';

export interface ArchivePetModalProps {
  /** Флаг открытия модального окна */
  isOpen: boolean;
  /** Питомец, для которого меняется статус архива */
  pet: Pet | null;
  /** Функция подтверждения изменения статуса */
  onConfirm: () => void | Promise<void>;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Флаг процесса выполнения запроса */
  loading?: boolean;
  /** Ошибка выполнения запроса */
  error?: string | null;
}

/**
 * Диалог подтверждения архивации / восстановления питомца из архива.
 */
export function ArchivePetModal({
  isOpen,
  pet,
  onConfirm,
  onClose,
  loading = false,
  error = null,
}: ArchivePetModalProps) {
  if (!isOpen || !pet) return null;

  const isArchiving = !pet.isArchived;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog" style={{ width: '440px', maxWidth: 'calc(100vw - 32px)' }}>
        <div className="dialog-head">
          <span className="dialog-title">
            {isArchiving ? 'Архивация питомца' : 'Восстановление из архива'}
          </span>
          <span className="dialog-desc">
            {isArchiving
              ? `Вы уверены, что хотите переместить профиль «${pet.name}» в архив?`
              : `Вы уверены, что хотите восстановить профиль «${pet.name}» из архива?`}
          </span>
        </div>

        <div className="dialog-body">
          {error && (
            <div className="alert alert-destructive">
              <AlertCircle className="ic" />
              <div>{error}</div>
            </div>
          )}

          <div className="alert alert-info">
            <Archive className="ic" />
            <div>
              {isArchiving
                ? 'Питомец будет перемещён во вкладку «В архиве». История визитов и вакцинаций сохранится, но создание новых записей будет заблокировано.'
                : 'Питомец вернётся в список активных, и для него снова станет доступна онлайн-запись на приём.'}
            </div>
          </div>
        </div>

        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            className={`btn ${isArchiving ? 'btn-destructive' : 'btn-primary'}`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading
              ? 'Сохранение...'
              : isArchiving
              ? 'В архив'
              : 'Восстановить'}
          </button>
        </div>
      </div>
    </div>
  );
}
