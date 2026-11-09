'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChironLogo } from '../ui/ChironLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { notificationsApi } from '../../api';
import { tokenStorage } from '../../api/client';
import { AppNotification } from '../../types';
import {
  Home,
  PawPrint,
  Calendar,
  CalendarDays,
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
  Search,
  Settings,
  Syringe,
  Info,
} from 'lucide-react';
import { isDevMode } from '../../utils/env';
import { CommandPaletteModal } from './CommandPaletteModal';

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

interface SidebarNavLinksProps {
  navGroups: NavGroup[];
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}

function SidebarNavLinks({ navGroups, collapsed, pathname, onItemClick }: SidebarNavLinksProps) {
  const searchParams = useSearchParams();

  const isItemActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const targetParams = new URLSearchParams(query);
      for (const [k, v] of targetParams.entries()) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    if (pathname !== href) return false;
    const tab = searchParams.get('tab');
    return !tab;
  };

  return (
    <>
      {navGroups.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-0.5">
          {group.label && !collapsed && (
            <span className="nav-group-label">{group.label}</span>
          )}
          {group.items.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={onItemClick}
              >
                {item.icon}
                {!collapsed && <span className="label">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span className="nav-count">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

function SidebarNavLinksFallback({ navGroups, collapsed, pathname, onItemClick }: SidebarNavLinksProps) {
  return (
    <>
      {navGroups.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-0.5">
          {group.label && !collapsed && (
            <span className="nav-group-label">{group.label}</span>
          )}
          {group.items.map((item) => {
            const isActive = !item.href.includes('?') && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={onItemClick}
              >
                {item.icon}
                {!collapsed && <span className="label">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span className="nav-count">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export interface ShellHeaderData {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  currentSection?: string;
  crumbGroup?: string;
  crumb?: string;
}

interface AppShellContextType {
  insideShell: boolean;
  setHeaderData: React.Dispatch<React.SetStateAction<ShellHeaderData>>;
}

export const AppShellContext = React.createContext<AppShellContextType | null>(null);

export const useAppShell = () => React.useContext(AppShellContext);

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  currentSection?: string;
  crumbGroup?: string;
  crumb?: string;
}

const NestedAppShell: React.FC<AppShellProps & { setHeaderData: React.Dispatch<React.SetStateAction<ShellHeaderData>> }> = ({
  children,
  title,
  subtitle,
  actions,
  currentSection,
  crumbGroup,
  crumb,
  setHeaderData,
}) => {
  useEffect(() => {
    setHeaderData({
      title,
      subtitle,
      actions,
      currentSection,
      crumbGroup,
      crumb,
    });
    return () => {
      setHeaderData({});
    };
  }, [title, subtitle, actions, currentSection, crumbGroup, crumb, setHeaderData]);

  return <>{children}</>;
};

const RootAppShell: React.FC<AppShellProps> = ({
  children,
  title,
  subtitle,
  actions,
  currentSection,
  crumbGroup,
  crumb,
}) => {
  const [headerData, setHeaderData] = useState<ShellHeaderData>({});
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // BFCache (Back/Forward Cache) защита: при нажатии кнопки «Назад» в браузере после логаута
  useEffect(() => {
    const handleAuthCheck = () => {
      const token = tokenStorage.get();
      if (!token) {
        logout();
        window.location.replace('/login');
      }
    };

    window.addEventListener('pageshow', handleAuthCheck);
    window.addEventListener('storage', handleAuthCheck);
    return () => {
      window.removeEventListener('pageshow', handleAuthCheck);
      window.removeEventListener('storage', handleAuthCheck);
    };
  }, [logout]);

  // Автоматический редирект неавторизованных или несоответствующих роли пользователей
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      if (isAuthenticated) logout();
      router.replace('/login');
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isLoading && role) {
      if ((pathname.startsWith('/admin/') || pathname === '/admin') && role !== 'ADMIN') {
        router.replace(role === 'VETERINARIAN' ? '/vet/dashboard' : '/client/dashboard');
      } else if ((pathname.startsWith('/vet/') || pathname === '/vet') && role !== 'VETERINARIAN') {
        router.replace(role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard');
      } else if ((pathname.startsWith('/client/') || pathname === '/client') && role !== 'CLIENT') {
        router.replace(role === 'ADMIN' ? '/admin/dashboard' : '/vet/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, role, pathname, router, logout]);

  // Проверка прав для текущего раздела
  const isAuthorized = React.useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated || !tokenStorage.get()) return false;
    if (pathname.startsWith('/admin/') || pathname === '/admin') return role === 'ADMIN';
    if (pathname.startsWith('/vet/') || pathname === '/vet') return role === 'VETERINARIAN';
    if (pathname.startsWith('/client/') || pathname === '/client') return role === 'CLIENT';
    return true;
  }, [isLoading, isAuthenticated, role, pathname]);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [bellDropdown, setBellDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);


  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  // Горячая клавиша Ctrl+K / Cmd+K для открытия командной строки поиска
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          label: 'Обзор',
          items: [
            { href: '/admin/dashboard', label: 'Дашборд', icon: <BarChart2 className="ic" /> },
          ],
        },
        {
          label: 'Клиника',
          items: [
            { href: '/admin/appointments', label: 'Записи', icon: <Calendar className="ic" /> },
            { href: '/admin/pets', label: 'Питомцы', icon: <PawPrint className="ic" /> },
            { href: '/admin/vaccinations', label: 'Прививки', icon: <Syringe className="ic" /> },
            { href: '/admin/users', label: 'Пользователи', icon: <Users className="ic" /> },
          ],
        },
        {
          label: 'Персонал',
          items: [
            { href: '/admin/veterinarians', label: 'Врачи', icon: <Stethoscope className="ic" /> },
            { href: '/admin/schedules', label: 'Расписания', icon: <Clock className="ic" /> },
            { href: '/admin/schedules?tab=exc', label: 'Исключения', icon: <CalendarPlus className="ic" /> },
          ],
        },
        {
          label: 'Справочники',
          items: [
            { href: '/admin/services', label: 'Услуги', icon: <ClipboardList className="ic" /> },
            { href: '/admin/services?tab=species', label: 'Виды животных', icon: <PawPrint className="ic" /> },
            { href: '/admin/services?tab=specs', label: 'Специализации', icon: <Stethoscope className="ic" /> },
          ],
        },
        {
          label: 'Личное',
          items: [
            { href: '/admin/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: unreadCount > 0 ? unreadCount : undefined },
            { href: '/admin/profile', label: 'Профиль', icon: <UserIcon className="ic" /> },
            { href: '/admin/settings', label: 'Настройки', icon: <Settings className="ic" /> },
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
            { href: '/vet/schedule', label: 'Мой график', icon: <CalendarDays className="ic" /> },
            { href: '/vet/profile', label: 'Профиль врача', icon: <Stethoscope className="ic" /> },
            { href: '/services', label: 'Услуги клиники', icon: <ClipboardList className="ic" /> },
            { href: '/veterinarians', label: 'Коллеги', icon: <Users className="ic" /> },
            { href: '/vet/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: unreadCount > 0 ? unreadCount : undefined },
            { href: '/vet/settings', label: 'Настройки', icon: <Settings className="ic" /> },
          ],
        },
      ];
    }

    // По умолчанию: роль CLIENT
    return [
      {
        items: [
          { href: '/client/dashboard', label: 'Главная', icon: <Home className="ic" /> },
          { href: '/client/pets', label: 'Питомцы', icon: <PawPrint className="ic" /> },
          { href: '/client/appointments', label: 'Записи', icon: <Calendar className="ic" /> },
          { href: '/client/vaccinations', label: 'Прививки', icon: <Syringe className="ic" /> },
          { href: '/services', label: 'Услуги', icon: <ClipboardList className="ic" /> },
          { href: '/veterinarians', label: 'Врачи', icon: <Stethoscope className="ic" /> },
          { href: '/client/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: unreadCount > 0 ? unreadCount : undefined },
          { href: '/client/profile', label: 'Профиль', icon: <UserIcon className="ic" /> },
          { href: '/client/settings', label: 'Настройки', icon: <Settings className="ic" /> },
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
    role === 'ADMIN' ? 'Администратор' : role === 'VETERINARIAN' ? 'Кабинет врача' : 'Кабинет клиента';

  const homeHref =
    role === 'ADMIN' ? '/admin/dashboard' : role === 'VETERINARIAN' ? '/vet/dashboard' : '/client/dashboard';

  const effectiveCrumbGroup = headerData.crumbGroup || crumbGroup;
  const effectiveCrumb = headerData.crumb || crumb;
  const effectiveSection = headerData.currentSection || currentSection;
  const effectiveTitle = headerData.title || title;
  const effectiveActions = headerData.actions || actions;

  // Определение хлебных крошек согласно таблице TITLES прототипа
  const getBreadcrumbs = (): [string, string] => {
    if (effectiveCrumbGroup && (effectiveCrumb || effectiveTitle || effectiveSection)) {
      return [effectiveCrumbGroup, (effectiveCrumb || effectiveSection || effectiveTitle)!];
    }

    // Разделы администратора
    if (role === 'ADMIN' || pathname.startsWith('/admin/') || pathname === '/admin') {
      if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
      if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
      if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
      if (pathname.includes('/dashboard')) return ['Обзор', 'Дашборд'];
      if (pathname.includes('/appointments')) return ['Клиника', 'Записи'];
      if (pathname.includes('/pets')) return ['Клиника', 'Питомцы'];
      if (pathname.includes('/vaccinations')) return ['Клиника', 'Прививки'];
      if (pathname.includes('/users')) return ['Клиника', 'Пользователи'];
      if (pathname.includes('/schedules')) return ['Персонал', 'Расписания'];
      if (pathname.includes('/veterinarians')) return ['Персонал', 'Врачи'];
      if (pathname.includes('/services')) return ['Справочники', 'Услуги'];
      return ['Обзор', effectiveSection || effectiveTitle || 'Дашборд'];
    }

    // Разделы врача
    if (role === 'VETERINARIAN' || pathname.startsWith('/vet/') || pathname === '/vet') {
      if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
      if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
      if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
      if (pathname.includes('/dashboard')) return ['Врач', 'Сегодня'];
      if (pathname.includes('/appointments')) return ['Врач', 'Мои записи'];
      if (pathname.includes('/patients')) return ['Врач', 'Пациенты'];
      if (pathname.includes('/vaccinations')) return ['Врач', 'Прививки'];
      if (pathname.includes('/schedule')) return ['Врач', 'Мой график'];
      if (pathname.includes('/services')) return ['Клиника', 'Услуги клиники'];
      if (pathname.includes('/veterinarians')) return ['Клиника', 'Коллеги'];
      return ['Врач', effectiveSection || effectiveTitle || 'Сегодня'];
    }

    // Разделы клиента
    if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
    if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
    if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
    if (pathname.includes('/dashboard')) return ['Кабинет', 'Главная'];
    if (pathname.includes('/pets')) return ['Кабинет', 'Питомцы'];
    if (pathname.includes('/book')) return ['Кабинет', 'Запись на приём'];
    if (pathname.includes('/appointments')) return ['Кабинет', 'Записи'];
    if (pathname.includes('/vaccinations')) return ['Кабинет', 'Прививки'];
    if (pathname.includes('/services')) return ['Кабинет', 'Услуги'];
    if (pathname.includes('/veterinarians')) return ['Кабинет', 'Врачи'];
    return ['Кабинет', effectiveSection || effectiveTitle || 'Главная'];
  };

  const [resolvedGroup, resolvedCrumb] = getBreadcrumbs();

  if (!isAuthorized) {
    return (
      <div
        className="app"
        data-theme={resolvedTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
          <span className="small muted">Проверка прав доступа...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShellContext.Provider value={{ insideShell: true, setHeaderData }}>
      <div className="app" data-theme={resolvedTheme}>
      {/* Затемнение фона мобильного меню */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 mobile-only backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Боковая панель навигации */}
      <aside
        className={`island sidebar flex flex-col justify-between shrink-0 transition-all duration-200 ${
          collapsed ? 'collapsed' : ''
        } ${mobileOpen ? 'open' : ''}`}
      >
        <div className="flex flex-col gap-1 min-h-0">
          {/* Логотип клиники */}
          <div className="brand p-2 flex items-center justify-between">
            <Link href={homeHref} className="flex items-center gap-2.5 text-inherit no-underline">
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
              className="mobile-only btn btn-ghost btn-icon h-7 w-7"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Группы пунктов навигации */}
          <div className="overflow-y-auto flex-1 py-2 flex flex-col gap-1">
            <Suspense
              fallback={
                <SidebarNavLinksFallback
                  navGroups={navGroups}
                  collapsed={collapsed}
                  pathname={pathname}
                  onItemClick={() => setMobileOpen(false)}
                />
              }
            >
              <SidebarNavLinks
                navGroups={navGroups}
                collapsed={collapsed}
                pathname={pathname}
                onItemClick={() => setMobileOpen(false)}
              />
            </Suspense>
          </div>
        </div>

        {/* Подвал боковой панели */}
        <div className="sidebar-foot shrink-0">
          {isDev && (
            <div className="health" title="GET /actuator/health → UP">
              <span className="dot" />
              {!collapsed && <span className="label text-xs">Сервер доступен</span>}
            </div>
          )}

          <button
            type="button"
            className="nav-item hidden lg:flex items-center text-xs text-[var(--muted-foreground)]"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <ChevronRight className="ic" /> : <ChevronLeft className="ic" />}
            {!collapsed && <span className="label text-xs">Свернуть</span>}
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
              className="mobile-only btn btn-ghost btn-icon h-8 w-8 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Хлебные крошки согласно прототипу */}
            <nav className="crumbs" aria-label="Хлебные крошки">
              <span>{effectiveCrumbGroup || resolvedGroup}</span>
              <ChevronRight className="ic" style={{ width: '14px', height: '14px' }} />
              <span className="cur">{effectiveCrumb || effectiveSection || resolvedCrumb}</span>
            </nav>
          </div>

          <div className="spacer" />

          {/* Панель действий справа */}
          <div className="flex items-center gap-2 shrink-0">
            {effectiveActions}

            {/* Быстрый поиск (Ctrl+K) */}
            <button
              type="button"
              className="search-trigger hidden md:inline-flex"
              onClick={() => setCmdOpen(true)}
              aria-label="Быстрый поиск (Ctrl+K)"
            >
              <Search className="ic" />
              <span>{role === 'ADMIN' ? 'Разделы, услуги, врачи...' : 'Разделы, услуги, врачи...'}</span>
              <span className="kbd">Ctrl K</span>
            </button>

            {/* Колокольчик уведомлений */}
            <div className="rel" ref={bellMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon h-8 w-8"
                onClick={() => setBellDropdown(!bellDropdown)}
                aria-label="Уведомления"
                title="Уведомления"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="bell-badge">{unreadCount}</span>
                )}
              </button>

              {bellDropdown && (
                <div
                  className="popover shadow-xl flex flex-col gap-2 p-3"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    width: '360px',
                    maxWidth: 'calc(100vw - 32px)',
                    zIndex: 100,
                  }}
                  role="dialog"
                  aria-label="Уведомления"
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

                  <div className="pt-1.5 border-t border-[var(--border)] text-center">
                    <Link
                      href={role === 'ADMIN' ? '/admin/notifications' : role === 'VETERINARIAN' ? '/vet/notifications' : '/client/notifications'}
                      className="text-xs text-[var(--primary-text)] hover:underline inline-block py-0.5"
                      onClick={() => setBellDropdown(false)}
                    >
                      Все уведомления →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Меню профиля пользователя (аватар) */}
            <div className={`rel tone-${role || 'CLIENT'}`} ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0 4px' }}
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="Меню профиля"
              >
                <span className="t-ava sm round font-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                  {initials}
                </span>
              </button>

              {userDropdown && (
                <div
                  className="popover menu shadow-xl flex flex-col p-1.5"
                  style={{
                    position: 'absolute',
                    right: 0,
                    left: 'auto',
                    top: 'calc(100% + 6px)',
                    width: '220px',
                    maxWidth: 'calc(100vw - 24px)',
                    zIndex: 100,
                  }}
                >
                  <div className="menu-label">
                    {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Пользователь'} · {roleLabel}
                  </div>

                  <Link
                    href={role === 'ADMIN' ? '/admin/profile' : role === 'VETERINARIAN' ? '/vet/profile' : '/client/profile'}
                    className="menu-item flex items-center gap-2"
                    onClick={() => setUserDropdown(false)}
                  >
                    <UserIcon className="ic text-[var(--muted-foreground)]" />
                    <span>Профиль</span>
                  </Link>

                  <Link
                    href={role === 'ADMIN' ? '/admin/settings' : role === 'VETERINARIAN' ? '/vet/settings' : '/client/settings'}
                    className="menu-item flex items-center gap-2"
                    onClick={() => setUserDropdown(false)}
                  >
                    <Settings className="ic text-[var(--muted-foreground)]" />
                    <span>Настройки</span>
                  </Link>

                  <Link
                    href="/services"
                    className="menu-item flex items-center gap-2"
                    onClick={() => setUserDropdown(false)}
                  >
                    <Info className="ic text-[var(--muted-foreground)]" />
                    <span>О клинике</span>
                  </Link>

                  <div className="menu-sep" />
                  <div className="px-2 py-1 flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-foreground)]">Тема</span>
                    <ThemeToggle />
                  </div>
                  <div className="menu-sep" />

                  <button
                    type="button"
                    className="menu-item flex items-center gap-2 text-[var(--destructive)] w-full text-left"
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                      router.replace('/login');
                    }}
                  >
                    <LogOut className="ic" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Прокручиваемая область страницы */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 w-full" style={{ minHeight: 0 }}>
          {children}
        </main>
      </div>

      {/* Нижняя панель навигации для мобильных устройств (< 768px) согласно прототипу */}
      <nav className="mobile-nav" aria-label="Нижняя навигация">
        {role === 'CLIENT' && (
          <>
            <Link
              href="/client/dashboard"
              className={`btn btn-icon ${pathname === '/client/dashboard' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Главная"
            >
              <Home className="ic" />
            </Link>
            <Link
              href="/client/pets"
              className={`btn btn-icon ${pathname === '/client/pets' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Питомцы"
            >
              <PawPrint className="ic" />
            </Link>
            <Link
              href="/client/appointments"
              className={`btn btn-icon ${pathname === '/client/appointments' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Записи"
            >
              <Calendar className="ic" />
            </Link>
            <Link
              href="/client/book"
              className={`btn btn-icon ${pathname === '/client/book' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Записаться"
            >
              <CalendarPlus className="ic" />
            </Link>
            <button
              type="button"
              className={`btn btn-icon ${bellDropdown ? 'btn-secondary' : 'btn-ghost'} relative`}
              onClick={() => setBellDropdown(!bellDropdown)}
              title="Уведомления"
            >
              <Bell className="ic" />
              {unreadCount > 0 && (
                <span className="dot dot-danger" style={{ position: 'absolute', top: '8px', right: '8px' }} />
              )}
            </button>
          </>
        )}

        {role === 'VETERINARIAN' && (
          <>
            <Link
              href="/vet/dashboard"
              className={`btn btn-icon ${pathname === '/vet/dashboard' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Расписание"
            >
              <Clock className="ic" />
            </Link>
            <Link
              href="/vet/patients"
              className={`btn btn-icon ${pathname === '/vet/patients' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Пациенты"
            >
              <PawPrint className="ic" />
            </Link>
            <Link
              href="/vet/profile"
              className={`btn btn-icon ${pathname === '/vet/profile' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Мой профиль"
            >
              <UserIcon className="ic" />
            </Link>
            <button
              type="button"
              className={`btn btn-icon ${bellDropdown ? 'btn-secondary' : 'btn-ghost'} relative`}
              onClick={() => setBellDropdown(!bellDropdown)}
              title="Уведомления"
            >
              <Bell className="ic" />
              {unreadCount > 0 && (
                <span className="dot dot-danger" style={{ position: 'absolute', top: '8px', right: '8px' }} />
              )}
            </button>
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <Link
              href="/admin/dashboard"
              className={`btn btn-icon ${pathname === '/admin/dashboard' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Обзор"
            >
              <BarChart2 className="ic" />
            </Link>
            <Link
              href="/admin/appointments"
              className={`btn btn-icon ${pathname === '/admin/appointments' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Записи"
            >
              <Calendar className="ic" />
            </Link>
            <Link
              href="/admin/pets"
              className={`btn btn-icon ${pathname === '/admin/pets' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Пациенты"
            >
              <PawPrint className="ic" />
            </Link>
            <Link
              href="/admin/veterinarians"
              className={`btn btn-icon ${pathname === '/admin/veterinarians' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Врачи"
            >
              <Stethoscope className="ic" />
            </Link>
            <Link
              href="/admin/services"
              className={`btn btn-icon ${pathname === '/admin/services' ? 'btn-secondary' : 'btn-ghost'}`}
              title="Услуги"
            >
              <ClipboardList className="ic" />
            </Link>
          </>
        )}
      </nav>

      {/* Модальное окно быстрого поиска (Command Palette) */}
      <CommandPaletteModal
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        role={role}
      />
    </div>
    </AppShellContext.Provider>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  const parentShell = React.useContext(AppShellContext);

  if (parentShell?.insideShell) {
    return <NestedAppShell {...props} setHeaderData={parentShell.setHeaderData} />;
  }

  return <RootAppShell {...props} />;
};
