'use client';

import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'destructive' | 'primary';
  size?: 'sm' | 'md';
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  tone = 'destructive',
  size = 'sm',
  loading = false,
  error = null,
  onConfirm,
  onClose,
  children,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => !loading && onClose()}
    >
      <div
        className={`dialog ${size === 'sm' ? 'dialog-sm' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start', gap: '12px' }}>
            <div className="col" style={{ gap: '4px' }}>
              <span className="dialog-title">{title}</span>
              {description && <span className="dialog-desc">{description}</span>}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              disabled={loading}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {(children || error) && (
          <div className="dialog-body">
            {children}
            {error && (
              <div className="alert alert-destructive" role="alert">
                <AlertCircle className="ic" />
                <div>{error}</div>
              </div>
            )}
          </div>
        )}

        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'destructive' ? 'btn-destructive' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Выполнение…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
