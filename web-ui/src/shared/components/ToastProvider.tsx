'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

export type ToastKind = 'ok' | 'err';

export interface ToastItem {
  id: string;
  title: string;
  body?: string;
  kind: ToastKind;
}

export interface ToastContextValue {
  toast: (title: string, body?: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, body?: string, kind: ToastKind = 'ok') => {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => {
        const next = [...prev, { id, title, body: body || undefined, kind }];
        if (next.length > 3) {
          const evicted = next.slice(0, next.length - 3);
          evicted.forEach((old) => {
            const oldTimer = timersRef.current.get(old.id);
            if (oldTimer !== undefined) {
              window.clearTimeout(oldTimer);
              timersRef.current.delete(old.id);
            }
          });
          return next.slice(-3);
        }
        return next;
      });
      const timer = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5200);
      timersRef.current.set(id, timer);
    },
    []
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismissToast }), [toast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'err' ? 'toast-err' : 'toast-ok'}`} role="status">
            {t.kind === 'err' ? <AlertCircle className="ic" /> : <Check className="ic" />}
            <div className="col" style={{ gap: '2px' }}>
              <b style={{ fontWeight: 600 }}>{t.title}</b>
              {t.body && <span className="small muted">{t.body}</span>}
            </div>
            <button
              type="button"
              className="chip-x"
              aria-label="Закрыть"
              onClick={() => dismissToast(t.id)}
            >
              <X className="ic" style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const NOOP_TOAST: ToastContextValue = {
  toast: () => {},
  dismissToast: () => {},
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
