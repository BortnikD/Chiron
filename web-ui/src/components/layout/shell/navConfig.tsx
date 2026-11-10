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
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function getNavGroups(role: UserRole | null, unreadCount: number): NavGroup[] {
  const notifBadge = unreadCount > 0 ? unreadCount : undefined;

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
          { href: '/admin/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: notifBadge },
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
          { href: '/vet/notifications', label: 'Уведомления', icon: <Bell className="ic" />, badge: notifBadge },
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
        { href: '/client/appointments', label: 'Записи', icon: <Calendar className="ic" /> },
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
  href?: string;
  title: string;
  icon: React.ReactNode;
  isBell?: boolean;
}

export function getMobileNavItems(role: UserRole | null): MobileNavItem[] {
  if (role === 'ADMIN') {
    return [
      { href: '/admin/dashboard', title: 'Обзор', icon: <BarChart2 className="ic" /> },
      { href: '/admin/appointments', title: 'Записи', icon: <Calendar className="ic" /> },
      { href: '/admin/pets', title: 'Пациенты', icon: <PawPrint className="ic" /> },
      { href: '/admin/veterinarians', title: 'Врачи', icon: <Stethoscope className="ic" /> },
      { href: '/admin/services', title: 'Услуги', icon: <ClipboardList className="ic" /> },
    ];
  }
  if (role === 'VETERINARIAN') {
    return [
      { href: '/vet/dashboard', title: 'Расписание', icon: <Clock className="ic" /> },
      { href: '/vet/patients', title: 'Пациенты', icon: <PawPrint className="ic" /> },
      { href: '/vet/profile', title: 'Мой профиль', icon: <UserIcon className="ic" /> },
      { isBell: true, title: 'Уведомления', icon: <Bell className="ic" /> },
    ];
  }
  return [
    { href: '/client/dashboard', title: 'Главная', icon: <Home className="ic" /> },
    { href: '/client/pets', title: 'Питомцы', icon: <PawPrint className="ic" /> },
    { href: '/client/appointments', title: 'Записи', icon: <Calendar className="ic" /> },
    { href: '/client/book', title: 'Записаться', icon: <CalendarPlus className="ic" /> },
    { isBell: true, title: 'Уведомления', icon: <Bell className="ic" /> },
  ];
}

export function resolveBreadcrumbs(
  pathname: string,
  role: UserRole | null,
  fallback?: { group?: string; crumb?: string; section?: string; title?: string }
): [string, string] {
  if (fallback?.group && (fallback.crumb || fallback.title || fallback.section)) {
    return [fallback.group, (fallback.crumb || fallback.section || fallback.title)!];
  }

  if (role === 'ADMIN' || pathname.startsWith('/admin')) {
    if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
    if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
    if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
    if (pathname.includes('/appointments')) return ['Клиника', 'Записи'];
    if (pathname.includes('/pets')) return ['Клиника', 'Питомцы'];
    if (pathname.includes('/vaccinations')) return ['Клиника', 'Прививки'];
    if (pathname.includes('/users')) return ['Клиника', 'Пользователи'];
    if (pathname.includes('/schedules')) return ['Персонал', 'Расписания'];
    if (pathname.includes('/veterinarians')) return ['Персонал', 'Врачи'];
    if (pathname.includes('/services')) return ['Справочники', 'Услуги'];
    return ['Обзор', fallback?.section || fallback?.title || 'Дашборд'];
  }

  if (role === 'VETERINARIAN' || pathname.startsWith('/vet')) {
    if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
    if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
    if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
    if (pathname.includes('/appointments')) return ['Врач', 'Мои записи'];
    if (pathname.includes('/patients')) return ['Врач', 'Пациенты'];
    if (pathname.includes('/vaccinations')) return ['Врач', 'Прививки'];
    if (pathname.includes('/schedule')) return ['Врач', 'Мой график'];
    if (pathname.includes('/services')) return ['Клиника', 'Услуги клиники'];
    if (pathname.includes('/veterinarians')) return ['Клиника', 'Коллеги'];
    return ['Врач', fallback?.section || fallback?.title || 'Сегодня'];
  }

  if (pathname.includes('/profile')) return ['Личное', 'Профиль'];
  if (pathname.includes('/settings')) return ['Личное', 'Настройки'];
  if (pathname.includes('/notifications')) return ['Личное', 'Уведомления'];
  if (pathname.includes('/pets')) return ['Кабинет', 'Питомцы'];
  if (pathname.includes('/book')) return ['Кабинет', 'Запись на приём'];
  if (pathname.includes('/appointments')) return ['Кабинет', 'Записи'];
  if (pathname.includes('/vaccinations')) return ['Кабинет', 'Прививки'];
  if (pathname.includes('/services')) return ['Кабинет', 'Услуги'];
  if (pathname.includes('/veterinarians')) return ['Кабинет', 'Врачи'];
  return ['Кабинет', fallback?.section || fallback?.title || 'Главная'];
}
