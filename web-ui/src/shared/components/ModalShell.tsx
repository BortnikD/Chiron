'use client';

import React, { useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  error?: string | null;
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
}

/**
 * Универсальная оболочка модального диалога дизайн-системы Chiron (.dialog).
 * Устраняет дублирование оверлея, обработчиков Escape, клика вне контента,
 * фокусных ловушек и стандартной шапки/подвала во всех модальных окнах проекта.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  loading = false,
  error = null,
  onSubmit,
  children,
  footer,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  className = '',
  bodyClassName = '',
  style,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, loading, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'dialog-sm' : size === 'lg' ? 'dialog-lg' : '';

  const bodyAndFoot = (
    <>
      <div className={['dialog-body', bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
      {footer && <div className="dialog-foot">{footer}</div>}
    </>
  );

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (closeOnOverlayClick && !loading && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={['dialog', sizeClass, className].filter(Boolean).join(' ')}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="dialog-head"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 4 }}>
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

        {error && (
          <div className="alert alert-destructive" style={{ margin: '8px 20px 0' }} role="alert">
            <AlertCircle size={16} className="ic flex-none" />
            <div>{error}</div>
          </div>
        )}

        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
          >
            {bodyAndFoot}
          </form>
        ) : (
          bodyAndFoot
        )}
      </div>
    </div>
  );
}
