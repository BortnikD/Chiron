'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatApiError } from '@/shared/lib';

export interface UseResourceListConfig<
  TItem,
  TFilters extends Record<string, any> = Record<string, any>,
> {
  fetcher: (
    params: { page: number; pageSize: number; filters: TFilters },
    signal?: AbortSignal
  ) => Promise<{ items: TItem[]; totalElements?: number; totalPages?: number } | TItem[]>;
  initialFilters?: TFilters;
  defaultPageSize?: number;
  urlSyncKeys?: Array<keyof TFilters>;
  syncUrl?: boolean;
  debounceMs?: number;
  debouncedKeys?: Array<keyof TFilters>;
  onError?: (err: unknown) => void;
  onSuccess?: (data: { items: TItem[]; totalElements: number; totalPages: number }) => void;
}

export interface UseResourceListReturn<
  TItem,
  TFilters extends Record<string, any>,
> {
  items: TItem[];
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>;
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  page: number;
  setPage: (newPage: number) => void;
  pageSize: number;
  setPageSize: (newSize: number) => void;
  totalElements: number;
  totalPages: number;
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  resetFilters: () => void;
  reload: () => Promise<TItem[] | null>;
  paginationProps: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (p: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
}

/**
 * Унифицированный хук для управления списками сущностей, пагинацией, фильтрами
 * и синхронизацией параметров с адресной строкой (URL) и историей браузера.
 */
export function useResourceList<
  TItem,
  TFilters extends Record<string, any> = Record<string, any>,
>(config: UseResourceListConfig<TItem, TFilters>): UseResourceListReturn<TItem, TFilters> {
  const {
    fetcher,
    initialFilters = {} as TFilters,
    defaultPageSize = 20,
    urlSyncKeys,
    syncUrl = true,
    debounceMs = 250,
    debouncedKeys = [],
    onError,
    onSuccess,
  } = config;

  const searchParams = useSearchParams();

  // Храним функции и изменяемые ссылки в refs, чтобы предотвратить циклические перерендеры
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const initialFiltersRef = useRef(initialFilters);
  const urlSyncKeysRef = useRef(urlSyncKeys);
  urlSyncKeysRef.current = urlSyncKeys;

  // Сериализация ключей дебаунса для стабилизации зависимостей хука
  const debouncedKeysStr = (debouncedKeys || []).map(String).join(',');

  // Инициализация пагинации из URL
  const initialPage = useMemo(() => {
    if (!syncUrl || !searchParams) return 0;
    const p = searchParams.get('page');
    if (!p) return 0;
    const parsed = parseInt(p, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : 0;
  }, [syncUrl, searchParams]);

  const initialSize = useMemo(() => {
    if (!syncUrl || !searchParams) return defaultPageSize;
    const s = searchParams.get('size') || searchParams.get('pageSize');
    if (!s) return defaultPageSize;
    const parsed = parseInt(s, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPageSize;
  }, [syncUrl, searchParams, defaultPageSize]);

  // Восстановление фильтров из URL при первом рендере
  const resolvedInitialFilters = useMemo(() => {
    const base = { ...initialFilters };
    if (!syncUrl || !searchParams) return base;

    const keys = (urlSyncKeys || Object.keys(base)) as Array<keyof TFilters>;
    for (const key of keys) {
      const paramVal = searchParams.get(String(key));
      if (paramVal !== null) {
        const defaultVal = base[key];
        if (Array.isArray(defaultVal)) {
          (base as any)[key] = paramVal.split(',').filter(Boolean);
        } else if (typeof defaultVal === 'number') {
          const num = Number(paramVal);
          if (!Number.isNaN(num)) (base as any)[key] = num;
        } else if (typeof defaultVal === 'boolean') {
          (base as any)[key] = paramVal === 'true';
        } else {
          (base as any)[key] = paramVal;
        }
      }
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialSize);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFiltersState] = useState<TFilters>(resolvedInitialFilters);
  const [debouncedFilterValues, setDebouncedFilterValues] = useState<Partial<TFilters>>({});

  const loadReqIdRef = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);

  // Обработка дебаунсируемых полей (например, поисковый запрос)
  useEffect(() => {
    const keys = debouncedKeysStr ? (debouncedKeysStr.split(',') as Array<keyof TFilters>) : [];
    if (keys.length === 0) return;

    const timer = setTimeout(() => {
      setDebouncedFilterValues((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const k of keys) {
          if (next[k] !== filters[k]) {
            next[k] = filters[k];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debouncedKeysStr, debounceMs]);

  // Эффективные фильтры с учетом дебаунса
  const activeFilters = useMemo(() => {
    const keys = debouncedKeysStr ? (debouncedKeysStr.split(',') as Array<keyof TFilters>) : [];
    if (keys.length === 0) return filters;
    const res = { ...filters };
    for (const k of keys) {
      if (k in debouncedFilterValues) {
        res[k] = debouncedFilterValues[k] as any;
      }
    }
    return res;
  }, [filters, debouncedFilterValues, debouncedKeysStr]);

  // Сериализованный ключ фильтров для гарантированной стабильности зависимостей
  const activeFiltersKey = useMemo(() => {
    try {
      return JSON.stringify(activeFilters);
    } catch {
      return '';
    }
  }, [activeFilters]);

  // Синхронизация состояния с URL query-параметрами (Issue #30)
  const syncToUrl = useCallback(
    (currentFilters: TFilters, currentPage: number, currentSize: number) => {
      if (!syncUrl || typeof window === 'undefined') return;

      const url = new URL(window.location.href);
      const keys = (urlSyncKeysRef.current || Object.keys(currentFilters)) as Array<keyof TFilters>;
      const baseInitial = initialFiltersRef.current;

      for (const key of keys) {
        const val = currentFilters[key];
        const defaultVal = baseInitial[key];
        const strKey = String(key);

        if (
          val === undefined ||
          val === null ||
          val === '' ||
          val === 'ALL' ||
          (Array.isArray(val) && val.length === 0) ||
          val === defaultVal
        ) {
          url.searchParams.delete(strKey);
        } else if (Array.isArray(val)) {
          url.searchParams.set(strKey, val.join(','));
        } else {
          url.searchParams.set(strKey, String(val));
        }
      }

      // Пагинация в URL
      if (currentPage > 0) {
        url.searchParams.set('page', String(currentPage + 1));
      } else {
        url.searchParams.delete('page');
      }

      if (currentSize !== defaultPageSize) {
        url.searchParams.set('size', String(currentSize));
      } else {
        url.searchParams.delete('size');
      }

      const nextSearch = url.searchParams.toString();
      const currentSearch = window.location.search.replace(/^\?/, '');
      if (nextSearch !== currentSearch) {
        const nextUrl = url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash;
        window.history.replaceState(null, '', nextUrl);
      }
    },
    [syncUrl, defaultPageSize]
  );

  // Загрузка данных
  const loadData = useCallback(async (): Promise<TItem[] | null> => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const reqId = ++loadReqIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const res = await fetcherRef.current(
        { page, pageSize, filters: activeFilters },
        controller.signal
      );

      if (reqId !== loadReqIdRef.current || controller.signal.aborted) return null;

      let resultItems: TItem[] = [];
      let totalEl = 0;
      let totalP = 1;

      if (Array.isArray(res)) {
        resultItems = res;
        totalEl = res.length;
        totalP = Math.max(1, Math.ceil(res.length / pageSize));
      } else if (res && typeof res === 'object') {
        resultItems = Array.isArray(res.items) ? res.items : [];
        totalEl = typeof res.totalElements === 'number' ? res.totalElements : resultItems.length;
        totalP =
          typeof res.totalPages === 'number'
            ? Math.max(1, res.totalPages)
            : Math.max(1, Math.ceil(totalEl / pageSize));
      }

      setItems(resultItems);
      setTotalElements(totalEl);
      setTotalPages(totalP);

      onSuccessRef.current?.({ items: resultItems, totalElements: totalEl, totalPages: totalP });
      return resultItems;
    } catch (err: any) {
      if (controller.signal.aborted || reqId !== loadReqIdRef.current) return null;
      const msg = formatApiError(err, 'Не удалось загрузить данные');
      setError(msg);
      onErrorRef.current?.(err);
      return null;
    } finally {
      if (reqId === loadReqIdRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, activeFiltersKey]);

  // Запуск загрузки при изменении страницы, размера или значений активных фильтров
  useEffect(() => {
    loadData();
    syncToUrl(activeFilters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  // Поддержка навигации «Назад / Вперёд» (popstate)
  useEffect(() => {
    if (!syncUrl) return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('page');
      const pageNum = p ? Math.max(0, parseInt(p, 10) - 1) : 0;
      setPageState(pageNum);

      const keys = (urlSyncKeysRef.current || Object.keys(initialFiltersRef.current)) as Array<keyof TFilters>;
      const nextFilters = { ...initialFiltersRef.current };
      for (const key of keys) {
        const val = params.get(String(key));
        if (val !== null) {
          (nextFilters as any)[key] = val;
        }
      }
      setFiltersState(nextFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncUrl]);

  // Переключение страницы
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  // Изменение размера страницы
  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(0);
  }, []);

  // Изменение одного фильтра (со сбросом страницы на 0)
  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPageState(0);
  }, []);

  // Изменение всех фильтров (со сбросом страницы на 0)
  const setFilters: React.Dispatch<React.SetStateAction<TFilters>> = useCallback(
    (action) => {
      setFiltersState((prev) => {
        const next = typeof action === 'function' ? (action as any)(prev) : action;
        return next;
      });
      setPageState(0);
    },
    []
  );

  // Сброс фильтров в исходное состояние
  const resetFilters = useCallback(() => {
    setFiltersState(initialFiltersRef.current);
    setPageState(0);
  }, []);

  // Объект пропсов для унифицированной пагинации (Issue #29)
  const paginationProps = useMemo(
    () => ({
      page,
      pageSize,
      totalElements,
      totalPages,
      loading,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [page, pageSize, totalElements, totalPages, loading, setPage, setPageSize]
  );

  return {
    items,
    setItems,
    loading,
    error,
    setError,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    totalPages,
    filters,
    setFilters,
    setFilter,
    resetFilters,
    reload: loadData,
    paginationProps,
  };
}
