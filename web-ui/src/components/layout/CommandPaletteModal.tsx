'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clinicApi } from '@/modules/clinic/api';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { UserRole } from '@/shared/types';
import { formatCurrency } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getNavGroups } from './shell/navConfig';
import {
  Search,
  Calendar,
  ClipboardList,
  Stethoscope,
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

const ROUTE_HINTS: Record<string, string> = {
  '/admin/dashboard': 'Раздел',
  '/admin/appointments': 'Журнал',
  '/admin/pets': 'Картотека',
  '/admin/vaccinations': 'Журнал',
  '/admin/users': 'Управление',
  '/admin/veterinarians': 'Персонал',
  '/admin/schedules': 'Графики',
  '/admin/schedules?tab=exc': 'Исключения',
  '/admin/services': 'Каталог',
  '/admin/services?tab=species': 'Справочник',
  '/admin/services?tab=specs': 'Справочник',
  '/admin/notifications': 'Оповещения',
  '/admin/profile': 'Аккаунт',
  '/admin/settings': 'Параметры',
  '/vet/dashboard': 'Кабинет',
  '/vet/patients': 'Картотека',
  '/vet/schedule': 'График',
  '/vet/profile': 'Профиль',
  '/vet/notifications': 'Оповещения',
  '/vet/settings': 'Параметры',
  '/client/dashboard': 'Обзор',
  '/client/pets': 'Питомцы',
  '/client/appointments': 'Записи',
  '/client/vaccinations': 'Прививки',
  '/client/book': 'Мастер записи',
  '/client/notifications': 'История',
  '/client/profile': 'Контакты',
  '/client/settings': 'Параметры',
  '/services': 'Каталог',
  '/veterinarians': 'Врачи',
};

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

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    if (services.length === 0) {
      clinicApi.getServices().then((data) => {
        if (!cancelled) setServices(data || []);
      }).catch(() => {});
    }
    if (vets.length === 0) {
      clinicApi.getVeterinarians().then((data) => {
        if (!cancelled) setVets(data || []);
      }).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, services.length, vets.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navigateTo = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router]
  );

  const navItems: PaletteItem[] = useMemo(() => {
    const groups = getNavGroups(role ?? null, 0);
    const items: PaletteItem[] = [];

    if (!role || role === 'CLIENT') {
      items.push({
        id: 'nav-client-book',
        label: 'Записаться на приём',
        hint: ROUTE_HINTS['/client/book'],
        icon: <Calendar className="ic" />,
        action: () => navigateTo('/client/book'),
      });
    }

    for (const g of groups) {
      for (const item of g.items) {
        items.push({
          id: `nav-${item.href}`,
          label: item.label,
          hint: ROUTE_HINTS[item.href] || g.label || 'Раздел',
          icon: item.icon,
          action: () => navigateTo(item.href),
        });
      }
    }

    return items;
  }, [role, navigateTo]);

  const cmdGroups: PaletteGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text?: string | null) => !q || Boolean(text && text.toLowerCase().includes(q));

    const groups: PaletteGroup[] = [];

    const matchedNav = navItems.filter((item) => match(item.label) || match(item.hint));
    if (matchedNav.length > 0) {
      groups.push({ label: 'Разделы', items: matchedNav });
    }

    const matchedServices = services
      .filter((s) => match(s.name) || match(s.description))
      .slice(0, 6)
      .map((s) => ({
        id: `svc-${s.id}`,
        label: s.name,
        hint: `${formatCurrency(s.basePrice)} · ${s.baseDurationMin} мин`,
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

    const matchedVets = vets
      .filter((v) => {
        const display = getDoctorDisplay(v);
        return match(display.fullName) || match(display.name) || match(display.specName);
      })
      .slice(0, 5)
      .map((v) => {
        const display = getDoctorDisplay(v);
        return {
          id: `vet-${v.id}`,
          label: display.fullName,
          hint: display.specName,
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
  }, [query, navItems, services, vets, role, navigateTo]);

  const { indexedGroups, flatItems } = useMemo(() => {
    let idx = 0;
    const flat: PaletteItem[] = [];
    const mapped = cmdGroups.map((g) => ({
      label: g.label,
      items: g.items.map((item) => {
        const itemIndex = idx++;
        flat.push(item);
        return { item, itemIndex };
      }),
    }));
    return { indexedGroups: mapped, flatItems: flat };
  }, [cmdGroups]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flatItems[selectedIndex]?.action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay overlay-top" onClick={onClose}>
      <div
        className="dialog cmd"
        role="dialog"
        aria-modal="true"
        aria-label="Быстрый поиск"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-search-wrap">
          <Search className="ic cmd-search-ic" />
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
          {indexedGroups.length === 0 ? (
            <div className="empty">
              <span className="small muted">Ничего не найдено</span>
            </div>
          ) : (
            indexedGroups.map((g) => (
              <div key={g.label} className="col" style={{ gap: '2px', marginBottom: '6px' }}>
                <div className="menu-label">{g.label}</div>
                {g.items.map(({ item, itemIndex }) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`menu-item ${itemIndex === selectedIndex ? 'active' : ''}`}
                    style={{ width: '100%' }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    onClick={item.action}
                  >
                    {item.icon}
                    <span className="mi-label">{item.label}</span>
                    {item.hint && <span className="small muted mi-hint">{item.hint}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
