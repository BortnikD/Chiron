'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import { AppNotification } from '../../types';
import { Button } from '../ui/Button';
import {
  Calendar,
  LogOut,
  LogIn,
  UserPlus,
  Activity,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi
        .getUnreadCount()
        .then((count) => setUnreadCount(typeof count === 'number' ? count : 0))
        .catch(() => setUnreadCount(0));
    }
  }, [isAuthenticated, pathname]);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationsApi.getNotifications(0, 5);
      setNotifications(res?.items ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Логотип клиники */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
            <Activity className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              Chiron
            </span>
            <span className="block text-[10px] font-medium tracking-wide uppercase text-slate-400 -mt-1">
              Ветклиника
            </span>
          </div>
        </Link>

        {/* Динамическая навигация по ролям */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Публичные разделы */}
          <Link
            href="/services"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive('/services')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Услуги
          </Link>
          <Link
            href="/veterinarians"
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive('/veterinarians')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Врачи
          </Link>

          {/* Разделы клиента */}
          {isAuthenticated && role === 'CLIENT' && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <Link
                href="/client/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/client/dashboard')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Мой кабинет
              </Link>
              <Link
                href="/client/pets"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/client/pets')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Мои питомцы
              </Link>
              <Link
                href="/client/appointments"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/client/appointments')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Записи
              </Link>
            </>
          )}

          {/* Разделы ветеринарного врача */}
          {isAuthenticated && role === 'VETERINARIAN' && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <Link
                href="/vet/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/vet/dashboard')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Приёмы врача
              </Link>
              <Link
                href="/vet/patients"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/vet/patients')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Пациенты
              </Link>
              <Link
                href="/vet/profile"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/vet/profile')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Профиль
              </Link>
            </>
          )}

          {/* Панель администратора */}
          {isAuthenticated && role === 'ADMIN' && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <Link
                href="/admin/dashboard"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Обзор
              </Link>
              <Link
                href="/admin/appointments"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/appointments')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Записи
              </Link>
              <Link
                href="/admin/veterinarians"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/veterinarians')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Врачи
              </Link>
              <Link
                href="/admin/pets"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/pets')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Пациенты
              </Link>
              <Link
                href="/admin/services"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/services')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Услуги
              </Link>
              <Link
                href="/admin/users"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Пользователи
              </Link>
              <Link
                href="/admin/statistics"
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive('/admin/statistics')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Статистика
              </Link>
            </>
          )}
        </nav>

        {/* Правая панель / Управление сессией */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 relative">
              {role === 'CLIENT' && (
                <Link href="/client/book">
                  <Button size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
                    Записаться
                  </Button>
                </Link>
              )}

              {/* Колокольчик уведомлений */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  title="Уведомления"
                  className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Выпадающий список уведомлений */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Уведомления</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Прочитать все</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                      {loadingNotifications ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          Загрузка уведомлений...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg border text-xs space-y-1 transition-colors ${
                              n.readAt
                                ? 'bg-white border-slate-100 text-slate-600'
                                : 'bg-emerald-50/50 border-emerald-100 text-slate-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold">{n.title}</span>
                              {!n.readAt && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-slate-400 hover:text-emerald-600 p-0.5 cursor-pointer"
                                  title="Пометить как прочитанное"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{n.body}</p>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(n.createdAt).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                          Новых уведомлений нет
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {role === 'ADMIN' && 'Администратор'}
                  {role === 'VETERINARIAN' && 'Ветеринарный врач'}
                  {role === 'CLIENT' && 'Клиент'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Выйти"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Регистрация
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
