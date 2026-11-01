'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ChironLogo } from '../ui/ChironLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { notificationsApi } from '../../api';
import { AppNotification } from '../../types';
import {
  Home,
  PawPrint,
  Calendar,
  CalendarPlus,
  Stethoscope,
  ClipboardList,
  Users,
  Clock,
  BarChart2,
  TrendingUp,
  Phone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
  Bell,
  Check,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [bellDropdown, setBellDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const bellMenuRef = useRef<HTMLDivElement>(null);

  // Получение количества непрочитанных уведомлений при монтировании
  useEffect(() => {
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        const count = typeof res === 'number' ? res : (res as any)?.count ?? 0;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  // Загрузка уведомлений при открытии выпадающего списка
  useEffect(() => {
    if (bellDropdown) {
      setLoadingNotifications(true);
      notificationsApi
        .getNotifications(0, 15)
        .then((res) => {
          const items = Array.isArray(res) ? res : res?.items || [];
          setNotifications(items);
        })
        .catch(() => setNotifications([]))
        .finally(() => setLoadingNotifications(false));
    }
  }, [bellDropdown]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Закрытие выпадающих меню при клике снаружи
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
      if (bellMenuRef.current && !bellMenuRef.current.contains(e.target as Node)) {
        setBellDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Закрытие мобильного меню при смене маршрута
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Определение разделов навигации в зависимости от роли
  const getNavGroups = (): NavGroup[] => {
    if (role === 'ADMIN') {
      return [
        {
          label: 'Клиника',
          items: [
            { href: '/admin/dashboard', label: 'Обзор', icon: <BarChart2 className="ic" /> },
            { href: '/admin/appointments', label: 'Записи', icon: <Calendar className="ic" /> },
            { href: '/admin/pets', label: 'Пациенты', icon: <PawPrint className="ic" /> },
            { href: '/admin/users', label: 'Пользователи', icon: <Users className="ic" /> },
            { href: '/admin/statistics', label: 'Статистика', icon: <TrendingUp className="ic" /> },
          ],
        },
        {
          label: 'Персонал и справочники',
          items: [
            { href: '/admin/veterinarians', label: 'Врачи и графики', icon: <Stethoscope className="ic" /> },
            { href: '/admin/services', label: 'Услуги и цены', icon: <ClipboardList className="ic" /> },
          ],
        },
      ];
    }

    if (role === 'VETERINARIAN') {
      return [
        {
          items: [
            { href: '/vet/dashboard', label: 'Сегодня', icon: <Clock className="ic" /> },
            { href: '/vet/patients', label: 'Пациенты', icon: <PawPrint className="ic" /> },
            { href: '/vet/profile', label: 'Мой профиль', icon: <Stethoscope className="ic" /> },
            { href: '/services', label: 'Услуги клиники', icon: <ClipboardList className="ic" /> },
            { href: '/veterinarians', label: 'Коллеги', icon: <Users className="ic" /> },
          ],
        },
      ];
    }

    // По умолчанию: роль CLIENT
    return [
      {
        items: [
          { href: '/client/dashboard', label: 'Главная', icon: <Home className="ic" /> },
          { href: '/client/pets', label: 'Мои питомцы', icon: <PawPrint className="ic" /> },
          { href: '/client/appointments', label: 'Мои записи', icon: <Calendar className="ic" /> },
          { href: '/client/book', label: 'Записаться', icon: <CalendarPlus className="ic text-[var(--primary-text)]" /> },
          { href: '/services', label: 'Услуги и цены', icon: <ClipboardList className="ic" /> },
          { href: '/veterinarians', label: 'Врачи клиники', icon: <Stethoscope className="ic" /> },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  // Инициалы пользователя для аватара
  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'CH'
    : 'CH';

  const roleLabel =
    role === 'ADMIN' ? 'Администратор' : role === 'VETERINARIAN' ? 'Ветеринар' : 'Клиент';

  return (
    <div className="flex w-full h-screen overflow-hidden p-2 gap-2 bg-[var(--background)] text-[var(--foreground)]">
      {/* Затемнение фона мобильного меню */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Боковая панель навигации */}
      <aside
        className={`island sidebar flex flex-col justify-between shrink-0 z-50 transition-all duration-200 ${
          collapsed ? 'collapsed' : ''
        } ${
          mobileOpen
            ? 'fixed inset-y-2 left-2 z-50 shadow-2xl flex!'
            : 'hidden lg:flex'
        }`}
      >
        <div className="flex flex-col gap-1 min-h-0">
          {/* Логотип клиники */}
          <div className="brand p-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
              <div className="brand-mark bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                <ChironLogo size={18} />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="brand-name font-bold text-sm tracking-tight leading-tight">Chiron</span>
                  <span className="brand-role text-[11px] text-[var(--muted-foreground)] leading-tight">{roleLabel}</span>
                </div>
              )}
            </Link>

            {/* Кнопка закрытия мобильного меню */}
            <button
              type="button"
              className="lg:hidden btn btn-ghost btn-icon h-7 w-7"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Группы пунктов навигации */}
          <div className="overflow-y-auto flex-1 py-2 flex flex-col gap-1">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-0.5">
                {group.label && !collapsed && (
                  <div className="nav-group-label uppercase tracking-wider text-[10px] font-semibold text-[var(--muted-foreground)] px-2.5 pt-3 pb-1">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${isActive ? 'on font-semibold' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && <span className="label flex-1 truncate text-xs">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span className="nav-count text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Подвал боковой панели */}
        <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-1 shrink-0">
          <a
            href="tel:+78632001000"
            className="nav-item call-nav text-xs text-[var(--muted-foreground)] hover:text-[var(--primary-text)]"
            title="Позвонить в приёмную: +7 863 200-10-00"
          >
            <Phone className="ic shrink-0 text-emerald-500" />
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-medium leading-none">Приёмная</span>
                <span className="text-[10px] opacity-75 font-mono leading-tight">+7 863 200-10-00</span>
              </div>
            )}
          </a>

          {/* Кнопка сворачивания панели (десктоп) */}
          <button
            type="button"
            className="nav-item hidden lg:flex items-center text-xs text-[var(--muted-foreground)]"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <ChevronRight className="ic" /> : <ChevronLeft className="ic" />}
            {!collapsed && <span className="text-xs">Свернуть</span>}
          </button>
        </div>
      </aside>

      {/* Основная область контента */}
      <div className="main-col flex-1 flex flex-col min-w-0 min-h-0 gap-2">
        {/* Верхняя панель (топбар) */}
        <header className="island topbar shrink-0 flex items-center justify-between px-3 py-2 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Кнопка мобильного меню */}
            <button
              type="button"
              className="lg:hidden btn btn-ghost btn-icon h-8 w-8 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-semibold truncate leading-tight text-[var(--foreground)]">
                {title || 'Chiron'}
              </h1>
              {subtitle && (
                <span className="text-[11px] text-[var(--muted-foreground)] truncate leading-tight">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Панель действий справа */}
          <div className="flex items-center gap-1.5 shrink-0">
            {actions}

            {/* Колокольчик уведомлений */}
            <div className="relative" ref={bellMenuRef}>
              <button
                type="button"
                className="btn btn-ghost btn-icon h-8 w-8 relative"
                onClick={() => setBellDropdown(!bellDropdown)}
                title="Уведомления"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" />
                )}
              </button>

              {bellDropdown && (
                <div
                  className="popover shadow-xl flex flex-col gap-2 p-3"
                  style={{
                    position: 'absolute',
                    right: 0,
                    left: 'auto',
                    top: 'calc(100% + 6px)',
                    width: '320px',
                    maxWidth: 'calc(100vw - 24px)',
                    zIndex: 100,
                  }}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">Уведомления</span>
                      {unreadCount > 0 && (
                        <span className="badge font-mono text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] px-1.5 py-0.2 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="text-[10px] text-[var(--primary-text)] hover:underline flex items-center gap-1"
                        onClick={handleMarkAllRead}
                      >
                        <Check className="w-3 h-3" />
                        Прочитать все
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
                    {loadingNotifications ? (
                      <div className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                        Загрузка уведомлений...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                        Новых уведомлений нет
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2 rounded-md border text-xs flex flex-col gap-0.5 transition-colors ${
                            n.readAt
                              ? 'bg-transparent border-[var(--border)] text-[var(--muted-foreground)]'
                              : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--foreground)] font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-[11px] leading-tight">
                              {n.title || 'Уведомление'}
                            </span>
                            {n.createdAt && (
                              <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Europe/Moscow',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] leading-snug line-clamp-2">
                            {n.body || (n as any).message || ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Переключатель темы оформления */}
            <ThemeToggle />

            {/* Меню профиля пользователя */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--accent)] transition-colors"
                onClick={() => setUserDropdown(!userDropdown)}
              >
                <span className="avatar w-7 h-7 text-[11px] font-bold">
                  {initials}
                </span>
                <span className="text-xs font-medium hidden sm:inline-block max-w-[120px] truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName?.charAt(0) || ''}.` : 'Мой аккаунт'}
                </span>
              </button>

              {userDropdown && (
                <div
                  className="popover shadow-xl flex flex-col gap-0.5 p-1.5"
                  style={{
                    position: 'absolute',
                    right: 0,
                    left: 'auto',
                    top: 'calc(100% + 6px)',
                    width: '200px',
                    maxWidth: 'calc(100vw - 24px)',
                    zIndex: 100,
                  }}
                >
                  <div className="px-2 py-1.5 border-b border-[var(--border)] mb-1">
                    <div className="font-semibold text-xs truncate">
                      {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Пользователь'}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] truncate">{user?.email}</div>
                  </div>

                  <Link
                    href={role === 'VETERINARIAN' ? '/vet/profile' : '/client/dashboard'}
                    className="menu-item flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--accent)] text-inherit no-underline"
                    onClick={() => setUserDropdown(false)}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Профиль</span>
                  </Link>

                  <button
                    type="button"
                    className="menu-item flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-[var(--destructive)] w-full text-left"
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                      router.push('/login');
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Прокручиваемая область страницы */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
