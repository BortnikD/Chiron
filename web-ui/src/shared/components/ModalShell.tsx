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
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Сохраняем фокус перед открытием диалога
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const dialogEl = dialogRef.current;
    if (dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        // Фокусируемся на первом интерактивном элементе с небольшой задержкой для плавности
        requestAnimationFrame(() => {
          focusable[0]?.focus();
        });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && !loading) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Возвращаем фокус на сохранённый элемент
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
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
        <div className="dialog-head flex-row between items-start">
          <div className="col gap-xs">
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
          <div className="alert alert-destructive mt-xs mx-md" role="alert">
            <AlertCircle size={16} className="ic flex-none" />
            <div>{error}</div>
          </div>
        )}

        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            className="form-vertical"
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
