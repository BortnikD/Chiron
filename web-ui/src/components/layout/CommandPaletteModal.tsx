'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clinicApi } from '../../api';
import { Service, Veterinarian, UserRole } from '../../types';
import {
  Search,
  Home,
  Calendar,
  ClipboardList,
  Stethoscope,
  Syringe,
  Bell,
  User as UserIcon,
  Settings,
  Users,
  Clock,
  Layers,
  ChevronRight,
  PawPrint,
  X,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole | null;
}

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Загрузка услуг и врачей для быстрого поиска
  useEffect(() => {
    if (isOpen && services.length === 0) {
      clinicApi.getServices().then((data) => setServices(data || [])).catch(() => {});
      clinicApi.getVeterinarians().then((data) => setVets(data || [])).catch(() => {});
    }
  }, [isOpen, services.length]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  // Формирование разделов в зависимости от роли (БЕЗ питомцев и записей)
  const navItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    if (role === 'ADMIN') {
      items.push(
        { id: 'admin-dash', label: 'Дашборд и аналитика', hint: 'Раздел', icon: <Home className="ic" />, action: () => navigateTo('/admin/dashboard') },
        { id: 'admin-users', label: 'Пользователи клиники', hint: 'Управление', icon: <Users className="ic" />, action: () => navigateTo('/admin/users') },
        { id: 'admin-vets', label: 'Врачи и персонал', hint: 'Справочник', icon: <Stethoscope className="ic" />, action: () => navigateTo('/admin/veterinarians') },
        { id: 'admin-sched', label: 'Расписания врачей', hint: 'Графики', icon: <Clock className="ic" />, action: () => navigateTo('/admin/schedules') },
        { id: 'admin-services', label: 'Услуги и прейскурант', hint: 'Каталог', icon: <ClipboardList className="ic" />, action: () => navigateTo('/admin/services') },
        { id: 'admin-species', label: 'Виды животных', hint: 'Справочник', icon: <PawPrint className="ic" />, action: () => navigateTo('/admin/services?tab=species') },
        { id: 'admin-specs', label: 'Специализации врачей', hint: 'Справочник', icon: <Layers className="ic" />, action: () => navigateTo('/admin/services?tab=specs') },
        { id: 'admin-vacc', label: 'Реестр вакцинации', hint: 'Журнал', icon: <Syringe className="ic" />, action: () => navigateTo('/admin/vaccinations') },
        { id: 'admin-notifs', label: 'Системные уведомления', hint: 'Журнал', icon: <Bell className="ic" />, action: () => navigateTo('/admin/notifications') },
        { id: 'admin-prof', label: 'Профиль администратора', hint: 'Аккаунт', icon: <UserIcon className="ic" />, action: () => navigateTo('/admin/profile') },
        { id: 'admin-set', label: 'Настройки системы', hint: 'Параметры', icon: <Settings className="ic" />, action: () => navigateTo('/admin/settings') },
      );
    } else if (role === 'VETERINARIAN') {
      items.push(
        { id: 'vet-today', label: 'Сегодня — расписание и приёмы', hint: 'Кабинет', icon: <Clock className="ic" />, action: () => navigateTo('/vet/dashboard') },
        { id: 'vet-patients', label: 'Пациенты клиники', hint: 'Картотека', icon: <PawPrint className="ic" />, action: () => navigateTo('/vet/patients') },
        { id: 'vet-services', label: 'Каталог услуг', hint: 'Справочник', icon: <ClipboardList className="ic" />, action: () => navigateTo('/services') },
        { id: 'vet-colleagues', label: 'Врачи клиники', hint: 'Коллеги', icon: <Stethoscope className="ic" />, action: () => navigateTo('/veterinarians') },
        { id: 'vet-notifs', label: 'Уведомления врача', hint: 'Оповещения', icon: <Bell className="ic" />, action: () => navigateTo('/vet/notifications') },
        { id: 'vet-prof', label: 'Профиль специалиста', hint: 'Публичные данные', icon: <UserIcon className="ic" />, action: () => navigateTo('/vet/profile') },
        { id: 'vet-set', label: 'Настройки кабинета', hint: 'Параметры', icon: <Settings className="ic" />, action: () => navigateTo('/vet/settings') },
      );
    } else {
      // CLIENT
      items.push(
        { id: 'cl-home', label: 'Главная страница кабинета', hint: 'Обзор', icon: <Home className="ic" />, action: () => navigateTo('/client/dashboard') },
        { id: 'cl-book', label: 'Записаться на приём', hint: 'Мастер записи', icon: <Calendar className="ic" />, action: () => navigateTo('/client/book') },
        { id: 'cl-services', label: 'Услуги и цены', hint: 'Каталог', icon: <ClipboardList className="ic" />, action: () => navigateTo('/services') },
        { id: 'cl-vets', label: 'Врачи клиники', hint: 'Специалисты', icon: <Stethoscope className="ic" />, action: () => navigateTo('/veterinarians') },
        { id: 'cl-vacc', label: 'Вакцинация и ветпаспорт', hint: 'Прививки', icon: <Syringe className="ic" />, action: () => navigateTo('/client/vaccinations') },
        { id: 'cl-notifs', label: 'Центр уведомлений', hint: 'История', icon: <Bell className="ic" />, action: () => navigateTo('/client/notifications') },
        { id: 'cl-prof', label: 'Личный профиль', hint: 'Контакты', icon: <UserIcon className="ic" />, action: () => navigateTo('/client/profile') },
        { id: 'cl-set', label: 'Настройки оформления', hint: 'Тема и каналы', icon: <Settings className="ic" />, action: () => navigateTo('/client/settings') },
      );
    }

    return items;
  }, [role]);

  // Фильтрация групп по запросу
  const cmdGroups: PaletteGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text?: string | null) => !q || (text && text.toLowerCase().includes(q));

    const groups: PaletteGroup[] = [];

    // Группа 1: Разделы
    const matchedNav = navItems.filter((item) => match(item.label) || match(item.hint));
    if (matchedNav.length > 0) {
      groups.push({ label: 'Разделы', items: matchedNav });
    }

    // Группа 2: Услуги клиники
    const matchedServices = services
      .filter((s) => match(s.name) || match(s.description))
      .slice(0, 6)
      .map((s) => ({
        id: `svc-${s.id}`,
        label: s.name,
        hint: `${s.basePrice?.toLocaleString('ru-RU')} ₽ · ${s.baseDurationMin} мин`,
        icon: <ClipboardList className="ic" />,
        action: () => {
          if (role === 'CLIENT') {
            navigateTo(`/client/book?serviceId=${s.id}`);
          } else if (role === 'ADMIN') {
            navigateTo('/admin/services');
          } else {
            navigateTo('/services');
          }
        },
      }));

    if (matchedServices.length > 0) {
      groups.push({ label: 'Услуги клиники', items: matchedServices });
    }

    // Группа 3: Врачи клиники
    const matchedVets = vets
      .filter((v) => {
        const name = v.user?.fullName || `${v.user?.firstName || ''} ${v.user?.lastName || ''}`;
        return match(name) || match(v.specialization?.name);
      })
      .slice(0, 5)
      .map((v) => {
        const name = v.user?.fullName || `${v.user?.firstName || ''} ${v.user?.lastName || ''}`.trim() || 'Ветеринарный врач';
        return {
          id: `vet-${v.id}`,
          label: name,
          hint: v.specialization?.name || 'Терапевт',
          icon: <Stethoscope className="ic" />,
          action: () => {
            if (role === 'CLIENT') {
              navigateTo(`/client/book?vetId=${v.id}`);
            } else if (role === 'ADMIN') {
              navigateTo('/admin/veterinarians');
            } else {
              navigateTo('/veterinarians');
            }
          },
        };
      });

    if (matchedVets.length > 0) {
      groups.push({ label: 'Врачи клиники', items: matchedVets });
    }

    return groups;
  }, [query, navItems, services, vets, role]);

  // Плоский список элементов для навигации стрелками клавиатуры
  const flatItems = useMemo(() => {
    return cmdGroups.flatMap((g) => g.items);
  }, [cmdGroups]);

  // Обработка клавиш Enter, ArrowUp, ArrowDown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div
      className="overlay"
      style={{
        alignItems: 'flex-start',
        paddingTop: '90px',
        zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="dialog cmd"
        role="dialog"
        aria-modal="true"
        aria-label="Быстрый поиск"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          borderRadius: '14px',
        }}
      >
        <div className="rel" style={{ position: 'relative' }}>
          <Search
            className="ic"
            style={{
              position: 'absolute',
              left: '16px',
              top: '16px',
              width: '18px',
              height: '18px',
              color: 'var(--muted-foreground)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder={
              role === 'ADMIN'
                ? 'Разделы, услуги или специалисты...'
                : 'Поиск разделов, услуг и врачей...'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            aria-label="Быстрый поиск"
          />
        </div>

        <div className="cmd-list">
          {cmdGroups.length === 0 ? (
            <div className="empty" style={{ padding: '28px 16px', textAlign: 'center' }}>
              <span className="small muted">Ничего не найдено</span>
            </div>
          ) : (
            cmdGroups.map((g) => (
              <div key={g.label} className="col" style={{ gap: '2px', marginBottom: '8px' }}>
                <div
                  className="menu-label"
                  style={{
                    padding: '6px 10px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {g.label}
                </div>
                {g.items.map((item) => {
                  const itemIndex = currentIndex++;
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`menu-item ${isSelected ? 'active' : ''}`}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--muted)' : 'transparent',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={item.action}
                    >
                      <span style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center' }}>
                        {item.icon}
                      </span>
                      <span className="cell-main grow" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="small muted" style={{ fontSize: '11px', marginLeft: 'auto' }}>
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
