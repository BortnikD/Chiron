import { api } from './client';
import {
  AuthResult,
  User,
  AppNotification,
  PageResponse,
} from '@/shared/types';

export { ApiError, tokenStorage, request, api } from './client';

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
  getMe: (): Promise<User> => api.get<User>('/api/v1/users/me'),

  updateMe: (
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'middleName' | 'email' | 'phone'>>
  ): Promise<User> => api.patch<User>('/api/v1/users/me', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> =>
    api.post<void>('/api/v1/users/me/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
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
