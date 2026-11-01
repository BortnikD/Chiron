import { ApiResponse, ApiErrorResponse } from '../types';

/**
 * Базовый класс для ошибок API с поддержкой структурированных ошибок валидации.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public violations?: { field: string; message: string }[],
    public rawError?: ApiErrorResponse | null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Хранилище токена аутентификации.
 */
const TOKEN_KEY = 'chiron_jwt_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clear: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

/**
 * Универсальный HTTP клиент для запросов к бэкенду.
 * Автоматически добавляет заголовок Authorization: Bearer <token>
 * и разворачивает конверт ApiResponse<T>.
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Ответ без тела: 204 (нет содержимого)
  if (response.status === 204) {
    return {} as T;
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(response.status, `Некорректный ответ сервера (${response.status})`);
  }

  if (!response.ok || !data.success) {
    const errorDetails = data.error;
    const message = errorDetails?.message || `Ошибка сервера (${response.status})`;
    throw new ApiError(response.status, message, errorDetails?.violations, errorDetails);
  }

  return data.result;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
