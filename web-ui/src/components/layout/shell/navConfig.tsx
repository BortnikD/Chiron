import React from 'react';
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
  Bell,
  Settings,
  User as UserIcon,
  Syringe,
} from 'lucide-react';
import type { UserRole } from '@/shared/types';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  matchPrefixes?: string[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function getNavGroups(
  role: UserRole | null,
  unreadCount: number,
  todayCount = 0
): NavGroup[] {
  const notifBadge = unreadCount > 0 ? unreadCount : undefined;
  const vetTodayBadge = todayCount > 0 ? todayCount : undefined;

  if (role === 'ADMIN') {
    return [
      {
        label: 'Обзор',
        items: [{ href: '/admin/dashboard', label: 'Дашборд', icon: <BarChart2 className="ic" /> }],
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
          { href: '/admin/notifications', label: 'Уведомления', icon: <Bell className="ic" /> },
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
          { href: '/vet/dashboard', label: 'Сегодня', icon: <Clock className="ic" />, badge: vetTodayBadge },
          { href: '/vet/appointments', label: 'Мои записи', icon: <Calendar className="ic" /> },
          { href: '/vet/patients', label: 'Пациенты', icon: <PawPrint className="ic" /> },
          { href: '/vet/vaccinations', label: 'Прививки', icon: <Syringe className="ic" /> },
          { href: '/vet/schedule', label: 'Мой график', icon: <CalendarDays className="ic" /> },
          { href: '/vet/profile?tab=practice', label: 'Профиль врача', icon: <Stethoscope className="ic" /> },
          { href: '/vet/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: notifBadge },
          { href: '/vet/profile', label: 'Профиль', icon: <UserIcon className="ic" /> },
          { href: '/vet/settings', label: 'Настройки', icon: <Settings className="ic" /> },
        ],
      },
    ];
  }

  return [
    {
      items: [
        { href: '/client/dashboard', label: 'Главная', icon: <Home className="ic" /> },
        { href: '/client/pets', label: 'Питомцы', icon: <PawPrint className="ic" /> },
        {
          href: '/client/appointments',
          label: 'Записи',
          icon: <Calendar className="ic" />,
          matchPrefixes: ['/client/book'],
        },
        { href: '/client/vaccinations', label: 'Прививки', icon: <Syringe className="ic" /> },
        { href: '/services', label: 'Услуги', icon: <ClipboardList className="ic" /> },
        { href: '/veterinarians', label: 'Врачи', icon: <Stethoscope className="ic" /> },
        { href: '/client/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: notifBadge },
        { href: '/client/profile', label: 'Профиль', icon: <UserIcon className="ic" /> },
        { href: '/client/settings', label: 'Настройки', icon: <Settings className="ic" /> },
      ],
    },
  ];
}

export interface MobileNavItem {
  href: string;
  title: string;
  icon: React.ReactNode;
  matchPrefixes?: string[];
}

export function getMobileNavItems(role: UserRole | null): MobileNavItem[] {
  if (role === 'ADMIN') {
    return [];
  }
  if (role === 'VETERINARIAN') {
    return [
      { href: '/vet/dashboard', title: 'Сегодня', icon: <Clock className="ic ic-20" /> },
      { href: '/vet/appointments', title: 'Мои записи', icon: <Calendar className="ic ic-20" /> },
      { href: '/vet/patients', title: 'Пациенты', icon: <PawPrint className="ic ic-20" /> },
      { href: '/vet/vaccinations', title: 'Прививки', icon: <Syringe className="ic ic-20" /> },
      { href: '/vet/schedule', title: 'Мой график', icon: <CalendarDays className="ic ic-20" /> },
    ];
  }
  return [
    { href: '/client/dashboard', title: 'Главная', icon: <Home className="ic ic-20" /> },
    { href: '/client/pets', title: 'Питомцы', icon: <PawPrint className="ic ic-20" /> },
    {
      href: '/client/appointments',
      title: 'Записи',
      icon: <Calendar className="ic ic-20" />,
      matchPrefixes: ['/client/book'],
    },
    { href: '/client/vaccinations', title: 'Прививки', icon: <Syringe className="ic ic-20" /> },
    { href: '/client/notifications', title: 'Уведомления', icon: <Bell className="ic ic-20" /> },
  ];
}

export function resolveBreadcrumbs(
  pathname: string,
  role: UserRole | null,
  fallback?: { group?: string; crumb?: string; crumb2?: string; section?: string; title?: string }
): [string, string, string?] {
  if (fallback?.group && (fallback.crumb || fallback.title || fallback.section)) {
    return [fallback.group, (fallback.crumb || fallback.section || fallback.title)!, fallback.crumb2];
  }

  if (role === 'ADMIN' || pathname.startsWith('/admin')) {
    if (pathname.includes('/profile')) return ['Личное', 'Профиль', fallback?.crumb2];
    if (pathname.includes('/settings')) return ['Личное', 'Настройки', fallback?.crumb2];
    if (pathname.includes('/notifications')) return ['Личное', 'Уведомления', fallback?.crumb2];
    if (pathname.includes('/appointments')) return ['Клиника', 'Записи', fallback?.crumb2];
    if (pathname.includes('/pets')) return ['Клиника', 'Питомцы', fallback?.crumb2];
    if (pathname.includes('/vaccinations')) return ['Клиника', 'Прививки', fallback?.crumb2];
    if (pathname.includes('/users')) return ['Клиника', 'Пользователи', fallback?.crumb2];
    if (pathname.includes('/schedules')) return ['Персонал', 'Расписания', fallback?.crumb2];
    if (pathname.includes('/veterinarians')) return ['Персонал', 'Врачи', fallback?.crumb2];
    if (pathname.includes('/services')) return ['Справочники', 'Услуги', fallback?.crumb2];
    return ['Обзор', fallback?.section || fallback?.title || 'Дашборд', fallback?.crumb2];
  }

  if (role === 'VETERINARIAN' || pathname.startsWith('/vet')) {
    if (pathname.includes('/profile')) return ['Врач', 'Профиль', fallback?.crumb2];
    if (pathname.includes('/settings')) return ['Врач', 'Настройки', fallback?.crumb2];
    if (pathname.includes('/notifications')) return ['Врач', 'Уведомления', fallback?.crumb2];
    if (pathname.includes('/appointments')) return ['Врач', 'Мои записи', fallback?.crumb2];
    if (pathname.includes('/patients')) return ['Врач', 'Пациенты', fallback?.crumb2];
    if (pathname.includes('/vaccinations')) return ['Врач', 'Прививки', fallback?.crumb2];
    if (pathname.includes('/schedule')) return ['Врач', 'Мой график', fallback?.crumb2];
    if (pathname.includes('/services')) return ['Врач', 'Услуги', fallback?.crumb2];
    if (pathname.includes('/veterinarians')) return ['Врач', 'Врачи', fallback?.crumb2];
    return ['Врач', fallback?.section || fallback?.title || 'Сегодня', fallback?.crumb2];
  }

  if (pathname.includes('/profile')) return ['Кабинет', 'Профиль', fallback?.crumb2];
  if (pathname.includes('/settings')) return ['Кабинет', 'Настройки', fallback?.crumb2];
  if (pathname.includes('/notifications')) return ['Кабинет', 'Уведомления', fallback?.crumb2];
  if (pathname.includes('/pets')) return ['Кабинет', 'Питомцы', fallback?.crumb2];
  if (pathname.includes('/book')) return ['Кабинет', 'Записи', fallback?.crumb2 || 'Новая запись'];
  if (pathname.includes('/appointments')) return ['Кабинет', 'Записи', fallback?.crumb2];
  if (pathname.includes('/vaccinations')) return ['Кабинет', 'Прививки', fallback?.crumb2];
  if (pathname.includes('/services')) return ['Кабинет', 'Услуги', fallback?.crumb2];
  if (pathname.includes('/veterinarians')) return ['Кабинет', 'Врачи', fallback?.crumb2];
  return ['Кабинет', fallback?.section || fallback?.title || 'Главная', fallback?.crumb2];
}
