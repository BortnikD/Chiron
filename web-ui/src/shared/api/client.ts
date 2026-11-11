import { ApiResponse, ApiErrorResponse } from '@/shared/types';

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

  if (response.status === 204) {
    return {} as T;
  }

  let data: ApiResponse<T>;
  try {
    const rawText = await response.text();
    if (!rawText.trim()) {
      if (response.ok) return {} as T;
      throw new ApiError(response.status, `Ошибка сервера (${response.status})`);
    }
    data = JSON.parse(rawText) as ApiResponse<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
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
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  putForm: <T>(url: string, body: FormData) =>
    request<T>(url, {
      method: 'PUT',
      body,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
