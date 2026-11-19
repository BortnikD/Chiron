'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export interface UseSelectionSyncOptions<T extends { id: string }> {
  items: readonly T[];
  storageKey?: string;
  paramKey?: string;
  fetchById?: (id: string) => Promise<T | null>;
  onSelect?: (item: T | null) => void;
}

/**
 * Хук для двусторонней синхронизации выбранной сущности (например, питомца или пользователя)
 * с параметром адресной строки (по умолчанию ?sel=...) и sessionStorage.
 * Гарантирует сохранение выбора при переходах по ссылкам и возврате по кнопке «Назад».
 */
export function useSelectionSync<T extends { id: string }>(options: UseSelectionSyncOptions<T>) {
  const {
    items,
    storageKey,
    paramKey = 'sel',
    fetchById,
    onSelect,
  } = options;

  const searchParams = useSearchParams();
  const paramVal = searchParams.get(paramKey);

  const getStoredId = useCallback((): string => {
    if (!storageKey || typeof window === 'undefined') return '';
    try {
      return sessionStorage.getItem(storageKey) || '';
    } catch {
      return '';
    }
  }, [storageKey]);

  const persistId = useCallback(
    (id: string | null) => {
      if (!storageKey || typeof window === 'undefined') return;
      try {
        if (id) {
          sessionStorage.setItem(storageKey, id);
        } else {
          sessionStorage.removeItem(storageKey);
        }
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const syncToUrl = useCallback(
    (id: string | null) => {
      if (typeof window === 'undefined') return;
      try {
        const url = new URL(window.location.href);
        const currentParam = url.searchParams.get(paramKey);
        if (id) {
          if (currentParam === id) return;
          url.searchParams.set(paramKey, id);
        } else {
          if (!currentParam) return;
          url.searchParams.delete(paramKey);
        }
        const nextSearch = url.searchParams.toString();
        const currentSearch = window.location.search.replace(/^\?/, '');
        if (nextSearch !== currentSearch) {
          setTimeout(() => {
            try {
              window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
            } catch {
              // ignore
            }
          }, 0);
        }
      } catch {
        // ignore
      }
    },
    [paramKey]
  );

  const [selected, setSelectedState] = useState<T | null>(null);
  const selectedRef = useRef<T | null>(selected);
  selectedRef.current = selected;

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const fetchByIdRef = useRef(fetchById);
  fetchByIdRef.current = fetchById;

  const initialAppliedRef = useRef(false);
  const isMountedRef = useRef(false);

  const setSelected = useCallback(
    (itemOrUpdater: T | null | ((prev: T | null) => T | null)) => {
      setSelectedState((prev) => {
        const next = typeof itemOrUpdater === 'function' ? itemOrUpdater(prev) : itemOrUpdater;
        return next;
      });
    },
    []
  );

  // Синхронизируем изменения selected с URL и хранилищем вне фазы рендера
  useEffect(() => {
    if (!isMountedRef.current) return;
    const nextId = selected?.id ?? null;
    persistId(nextId);
    if (nextId !== paramVal) {
      syncToUrl(nextId);
    }
    onSelect?.(selected);
  }, [selected, paramVal, persistId, syncToUrl, onSelect]);

  useEffect(() => {
    const targetId = paramVal || (!initialAppliedRef.current ? getStoredId() : null);
    if (!targetId) {
      if (paramVal === null && initialAppliedRef.current && selectedRef.current) {
        setSelectedState(null);
        persistId(null);
      }
      isMountedRef.current = true;
      return;
    }

    initialAppliedRef.current = true;

    // Ищем среди уже загруженных элементов текущей страницы
    const found = itemsRef.current.find((i) => i.id === targetId);
    if (found) {
      setSelectedState(found);
      persistId(targetId);
      if (targetId !== paramVal) {
        syncToUrl(targetId);
      }
    } else if (fetchByIdRef.current && (!selectedRef.current || selectedRef.current.id !== targetId)) {
      fetchByIdRef.current(targetId)
        .then((fetched) => {
          if (fetched) {
            setSelectedState(fetched);
            persistId(targetId);
            if (targetId !== paramVal) {
              syncToUrl(targetId);
            }
          }
        })
        .catch(() => {});
    }
    isMountedRef.current = true;
  }, [paramVal, getStoredId, syncToUrl, persistId]);

  return [selected, setSelected] as const;
}
