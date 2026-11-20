import { ApiResponse, ApiErrorResponse, ApiViolation } from '@/shared/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public violations?: ApiViolation[] | null,
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

export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
}

async function executeSingleRequest<T>(
  endpoint: string,
  options: RequestOptions
): Promise<T> {
  const token = tokenStorage.get();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Не удалось связаться с сервером (Failed to fetch). Повторите попытку.');
  }

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
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/users/me/password')
    ) {
      tokenStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chiron:unauthorized'));
      }
    }
    const errorDetails = data.error;
    const message = errorDetails?.message || `Ошибка сервера (${response.status})`;
    throw new ApiError(response.status, message, errorDetails?.violations, errorDetails);
  }

  return data.result as unknown as T;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  // По умолчанию для GET запросов делаем до 2 повторных попыток при 5xx или разрыве сети
  const maxRetries = options.retries ?? (method === 'GET' ? 2 : 0);
  const baseDelay = options.retryDelayMs ?? 400;

  let attempt = 0;
  while (true) {
    try {
      return await executeSingleRequest<T>(endpoint, options);
    } catch (err: unknown) {
      const isRetryable =
        err instanceof ApiError &&
        (err.status === 0 || (err.status >= 500 && err.status < 600));

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  putForm: <T>(url: string, body: FormData, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body,
    }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
