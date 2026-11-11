import type { PageResponse } from '@/shared/types';

export const MAX_BACKEND_PAGE_SIZE = 100;

export interface FetchAllPagesOptions {
  pageSize?: number;
  maxPages?: number;
  concurrency?: number;
}

/**
 * Загружает все страницы Spring PageResponse пакетами (size <= 100, ограниченная конкурентность).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>,
  options?: FetchAllPagesOptions
): Promise<T[]> {
  const size = Math.min(Math.max(options?.pageSize ?? MAX_BACKEND_PAGE_SIZE, 1), MAX_BACKEND_PAGE_SIZE);
  const maxPages = Math.max(options?.maxPages ?? 50, 1);
  const concurrency = Math.max(options?.concurrency ?? 4, 1);

  const first = await fetchPage(0, size);
  const items: T[] = [...(first?.items ?? [])];
  const totalPages = Math.min(Math.max(1, first?.totalPages ?? 1), maxPages);

  for (let start = 1; start < totalPages; start += concurrency) {
    const end = Math.min(start + concurrency, totalPages);
    const batchPromises: Array<Promise<PageResponse<T>>> = [];
    for (let page = start; page < end; page += 1) {
      batchPromises.push(fetchPage(page, size));
    }
    const batchResults = await Promise.all(batchPromises);
    for (const res of batchResults) {
      if (Array.isArray(res?.items)) {
        items.push(...res.items);
      }
    }
  }

  return items;
}

/**
 * Выполняет асинхронную обработку массива с ограничением одновременных запросов (worker pool).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency = 6
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  const limit = Math.min(Math.max(concurrency, 1), items.length);
  let cursor = 0;

  async function runWorker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: limit }, runWorker));
  return results;
}
