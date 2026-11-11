import React from 'react';
import { Calendar, ClipboardList, PawPrint, Stethoscope, Users } from 'lucide-react';
import { clinicApi } from '@/modules/clinic/api';
import { clientApi } from '@/modules/client/api';
import { vetApi } from '@/modules/vet/api';
import { adminApi } from '@/modules/admin/api';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { User, UserRole } from '@/shared/types';
import { formatCurrency, formatDateTimeCompact } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { getNavGroups } from './navConfig';

export interface PaletteDataset {
  pets: Pet[];
  appointments: Appointment[];
  users: User[];
  services: Service[];
  vets: Veterinarian[];
}

export interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

export const EMPTY_PALETTE_DATASET: PaletteDataset = {
  pets: [],
  appointments: [],
  users: [],
  services: [],
  vets: [],
};

export const ROUTE_HINTS: Record<string, string> = {
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
  '/vet/appointments': 'Журнал',
  '/vet/patients': 'Картотека',
  '/vet/vaccinations': 'Журнал',
  '/vet/schedule': 'График',
  '/vet/profile?tab=practice': 'Публичный профиль',
  '/vet/notifications': 'Оповещения',
  '/vet/profile': 'Аккаунт',
  '/vet/settings': 'Параметры',
  '/client/dashboard': 'Обзор',
  '/client/pets': 'Питомцы',
  '/client/appointments': 'Записи',
  '/client/vaccinations': 'Прививки',
  '/client/book': 'Мастер',
  '/client/notifications': 'История',
  '/client/profile': 'Контакты',
  '/client/settings': 'Параметры',
  '/services': 'Каталог',
  '/veterinarians': 'Врачи',
};

export async function loadCommandPaletteData(role?: UserRole | null): Promise<PaletteDataset> {
  if (role === 'CLIENT') {
    const [petsRes, apptsRes, servicesRes, vetsRes] = await Promise.allSettled([
      clientApi.getPets({ withSummary: false }),
      clientApi.getAppointments(0, 50),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
    ]);
    return {
      pets: petsRes.status === 'fulfilled' && Array.isArray(petsRes.value) ? petsRes.value : [],
      appointments: apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value?.items) ? apptsRes.value.items : [],
      users: [],
      services: servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [],
      vets: vetsRes.status === 'fulfilled' && Array.isArray(vetsRes.value) ? vetsRes.value : [],
    };
  }

  if (role === 'VETERINARIAN') {
    const [apptsRes, servicesRes, vetsRes] = await Promise.allSettled([
      vetApi.getAppointments({ page: 0, size: 50, direction: 'DESC' }),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
    ]);
    const appts = apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value?.items) ? apptsRes.value.items : [];
    const petMap = await vetApi.getPatientPetsByIds(appts.map((a) => a.petId)).catch(() => ({} as Record<string, Pet>));
    return {
      pets: Object.values(petMap),
      appointments: appts,
      users: [],
      services: servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [],
      vets: vetsRes.status === 'fulfilled' && Array.isArray(vetsRes.value) ? vetsRes.value : [],
    };
  }

  if (role === 'ADMIN') {
    const [usersRes, petsRes, servicesRes, vetsRes] = await Promise.allSettled([
      adminApi.getUsers(0, 50),
      adminApi.getPets(0, 50),
      clinicApi.getServices(),
      adminApi.getVeterinarians(),
    ]);
    return {
      pets: petsRes.status === 'fulfilled' && Array.isArray(petsRes.value?.items) ? petsRes.value.items : [],
      appointments: [],
      users: usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.items) ? usersRes.value.items : [],
      services: servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [],
      vets: vetsRes.status === 'fulfilled' && Array.isArray(vetsRes.value) ? vetsRes.value : [],
    };
  }

  const [servicesRes, vetsRes] = await Promise.allSettled([
    clinicApi.getServices(),
    clinicApi.getVeterinarians(),
  ]);
  return {
    pets: [],
    appointments: [],
    users: [],
    services: servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [],
    vets: vetsRes.status === 'fulfilled' && Array.isArray(vetsRes.value) ? vetsRes.value : [],
  };
}

export function buildNavItems(role: UserRole | null | undefined, navigateTo: (url: string) => void): PaletteItem[] {
  const groups = getNavGroups(role ?? null, 0);
  const items: PaletteItem[] = [];
  if (!role || role === 'CLIENT') {
    items.push({
      id: 'nav-client-book',
      label: 'Записаться на приём',
      hint: ROUTE_HINTS['/client/book'],
      icon: React.createElement(Calendar, { className: 'ic' }),
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
}

export function buildCommandPaletteGroups(params: {
  query: string;
  navItems: PaletteItem[];
  dataset: PaletteDataset;
  role?: UserRole | null;
  navigateTo: (url: string) => void;
}): PaletteGroup[] {
  const { query, navItems, dataset, role, navigateTo } = params;
  const q = query.trim().toLowerCase();
  const match = (text?: string | null) => !q || Boolean(text && text.toLowerCase().includes(q));
  const groups: PaletteGroup[] = [];

  const matchedNav = navItems.filter((item) => match(item.label) || match(item.hint));
  if (matchedNav.length > 0) groups.push({ label: 'Разделы', items: matchedNav });

  const petById = new Map(dataset.pets.map((p) => [p.id, p]));
  const svcById = new Map(dataset.services.map((s) => [s.id, s]));

  if (role === 'CLIENT') {
    const pets = dataset.pets
      .filter((p) => match(p.name) || match(p.species?.name || p.speciesName))
      .slice(0, 6)
      .map((p) => ({
        id: `pet-${p.id}`,
        label: p.name,
        hint: p.species?.name || p.speciesName || 'Питомец',
        icon: React.createElement(PawPrint, { className: 'ic' }),
        action: () => navigateTo(`/client/pets?sel=${encodeURIComponent(p.id)}`),
      }));
    if (pets.length > 0) groups.push({ label: 'Питомцы', items: pets });
  }

  if (role === 'VETERINARIAN' && q) {
    const patients = dataset.pets
      .filter((p) => match(p.name) || match(p.species?.name || p.speciesName))
      .slice(0, 6)
      .map((p) => ({
        id: `pat-${p.id}`,
        label: p.name,
        hint: p.species?.name || p.speciesName || 'Пациент',
        icon: React.createElement(PawPrint, { className: 'ic' }),
        action: () => navigateTo(`/vet/patients?sel=${encodeURIComponent(p.id)}`),
      }));
    if (patients.length > 0) groups.push({ label: 'Пациенты', items: patients });
  }

  if ((role === 'CLIENT' || role === 'VETERINARIAN') && q) {
    const base = role === 'VETERINARIAN' ? '/vet/appointments' : '/client/appointments';
    const appts = dataset.appointments
      .filter((a) => {
        const pn = a.pet?.name || petById.get(a.petId)?.name || '';
        const sn = a.service?.name || svcById.get(a.serviceId)?.name || '';
        const dt = formatDateTimeCompact(a.startAt);
        return match(`${pn} ${sn} ${dt.date} ${dt.time}`);
      })
      .slice(0, 5)
      .map((a) => {
        const pn = a.pet?.name || petById.get(a.petId)?.name || 'Приём';
        const sn = a.service?.name || svcById.get(a.serviceId)?.name || '';
        const dt = formatDateTimeCompact(a.startAt);
        return {
          id: `appt-${a.id}`,
          label: sn ? `${pn} — ${sn}` : pn,
          hint: `${dt.date} ${dt.time}`,
          icon: React.createElement(Calendar, { className: 'ic' }),
          action: () => navigateTo(`${base}?sel=${encodeURIComponent(a.id)}`),
        };
      });
    if (appts.length > 0) groups.push({ label: 'Записи', items: appts });
  }

  if (role === 'ADMIN' && q) {
    const users = dataset.users
      .filter((u) => match(u.fullName || `${u.firstName} ${u.lastName}`) || match(u.email))
      .slice(0, 5)
      .map((u) => ({
        id: `usr-${u.id}`,
        label: u.fullName || `${u.firstName} ${u.lastName}`.trim(),
        hint: u.email,
        icon: React.createElement(Users, { className: 'ic' }),
        action: () => navigateTo(`/admin/users?sel=${encodeURIComponent(u.id)}`),
      }));
    if (users.length > 0) groups.push({ label: 'Пользователи', items: users });

    const adminPets = dataset.pets
      .filter((p) => match(p.name) || match(p.species?.name || p.speciesName))
      .slice(0, 5)
      .map((p) => ({
        id: `apet-${p.id}`,
        label: p.name,
        hint: p.species?.name || p.speciesName || 'Питомец',
        icon: React.createElement(PawPrint, { className: 'ic' }),
        action: () => navigateTo(`/admin/pets?sel=${encodeURIComponent(p.id)}`),
      }));
    if (adminPets.length > 0) groups.push({ label: 'Питомцы', items: adminPets });
  }

  if (q || role !== 'CLIENT') {
    const services = dataset.services
      .filter((s) => match(s.name) || match(s.description))
      .slice(0, 6)
      .map((s) => ({
        id: `svc-${s.id}`,
        label: s.name,
        hint: `${formatCurrency(s.basePrice)} · ${s.baseDurationMin} мин`,
        icon: React.createElement(ClipboardList, { className: 'ic' }),
        action: () => {
          if (role === 'CLIENT') navigateTo(`/client/book?serviceId=${s.id}`);
          else if (role === 'ADMIN') navigateTo(`/admin/services?sel=${encodeURIComponent(s.id)}`);
          else navigateTo(`/services?sel=${encodeURIComponent(s.id)}`);
        },
      }));
    if (services.length > 0) groups.push({ label: 'Услуги клиники', items: services });

    const vets = dataset.vets
      .filter((v) => {
        const d = getDoctorDisplay(v);
        return match(d.fullName) || match(d.name) || match(d.specName);
      })
      .slice(0, 5)
      .map((v) => {
        const d = getDoctorDisplay(v);
        return {
          id: `vet-${v.id}`,
          label: d.fullName,
          hint: d.specName,
          icon: React.createElement(Stethoscope, { className: 'ic' }),
          action: () => {
            if (role === 'CLIENT') navigateTo(`/client/book?vetId=${v.id}`);
            else if (role === 'ADMIN') navigateTo(`/admin/veterinarians?sel=${encodeURIComponent(v.id)}`);
            else navigateTo(`/veterinarians?sel=${encodeURIComponent(v.id)}`);
          },
        };
      });
    if (vets.length > 0) groups.push({ label: 'Врачи клиники', items: vets });
  }

  return groups;
}
