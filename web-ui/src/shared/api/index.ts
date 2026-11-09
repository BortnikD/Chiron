import { api, ApiError } from '../../api/client';
import {
  AuthResult,
  User,
  AppNotification,
  PageResponse,
} from '../../types';

// ─── Авторизация ──────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResult>('/api/v1/auth/login', data),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    middleName?: string;
  }) => api.post<AuthResult>('/api/v1/auth/register', data),
};

// ─── Профиль текущего пользователя ────────────────────────

export const userApi = {
  getMe: async (): Promise<User> => {
    try {
      return await api.get<User>('/api/v1/users/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Запасной путь для совместимости со старыми версиями бэкенда
        return await api.get<User>('/api/v1/auth/me');
      }
      throw err;
    }
  },

  updateMe: async (
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'middleName' | 'email' | 'phone'>>
  ): Promise<User> => {
    try {
      return await api.patch<User>('/api/v1/users/me', data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await api.patch<User>('/api/v1/auth/me', data);
      }
      throw err;
    }
  },

  changePassword: async (data: {
    oldPassword?: string;
    currentPassword?: string;
    newPassword: string;
  }): Promise<void> => {
    const payload = {
      currentPassword: data.currentPassword || data.oldPassword,
      oldPassword: data.oldPassword || data.currentPassword,
      newPassword: data.newPassword,
    };
    try {
      await api.post('/api/v1/auth/change-password', payload);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        try {
          await api.patch('/api/v1/users/me/password', payload);
        } catch (err2) {
          if (err2 instanceof ApiError && (err2.status === 404 || err2.status === 405)) {
            await api.patch('/api/v1/users/password', payload);
            return;
          }
          throw err2;
        }
        return;
      }
      throw err;
    }
  },
};

// ─── Уведомления ──────────────────────────────────────────

export const notificationsApi = {
  getNotifications: (page = 0, size = 20, unreadOnly = false) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    return api.get<PageResponse<AppNotification>>(`/api/v1/notifications?${params.toString()}`);
  },

  getUnreadCount: () => api.get<number>('/api/v1/notifications/unread-count'),

  markAsRead: (id: string) => api.post<AppNotification>(`/api/v1/notifications/${id}/read`, {}),

  markAllAsRead: () => api.post<number>('/api/v1/notifications/read-all', {}),
};
