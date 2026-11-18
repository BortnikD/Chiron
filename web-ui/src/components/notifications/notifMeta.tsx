import React from 'react';
import {
  AlarmClock,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Repeat,
  Syringe,
  UserX,
} from 'lucide-react';
import type { AppNotification, UserRole } from '@/shared/types';

export interface NotifMeta {
  cls: string;
  icon: React.ReactNode;
  label: string;
  tone: string;
  shortType: string;
}

export function getNotifMeta(n: AppNotification): NotifMeta {
  const t = String(n.type || '');
  if (t === 'APPOINTMENT_NO_SHOW' || t.includes('NO_SHOW')) {
    return {
      cls: 't-noshow',
      icon: <UserX className="ic" />,
      label: 'Неявка на приём',
      tone: 'neutral',
      shortType: 'Неявка',
    };
  }
  if (t === 'FOLLOW_UP_SCHEDULED' || t.includes('FOLLOW_UP')) {
    return {
      cls: 't-followup',
      icon: <Repeat className="ic" />,
      label: 'Повторный приём',
      tone: 'blue',
      shortType: 'Повторный',
    };
  }
  if (t === 'APPOINTMENT_REMINDER' || t.includes('REMINDER')) {
    return {
      cls: 't-reminder',
      icon: <AlarmClock className="ic" />,
      label: 'Напоминание о приёме',
      tone: 'amber',
      shortType: 'Напоминание',
    };
  }
  if (t === 'APPOINTMENT_CANCELLED' || t.includes('CANCEL')) {
    return {
      cls: 't-cancelled',
      icon: <CalendarX className="ic" />,
      label: 'Приём отменён',
      tone: 'red',
      shortType: 'Отмена',
    };
  }
  if (t === 'APPOINTMENT_CONFIRMED' || t.includes('CONFIRM')) {
    return {
      cls: 't-confirmed',
      icon: <CalendarCheck className="ic" />,
      label: 'Приём подтверждён',
      tone: 'green',
      shortType: 'Подтверждено',
    };
  }
  if (t === 'APPOINTMENT_RESCHEDULED' || t.includes('RESCHED')) {
    return {
      cls: 't-rescheduled',
      icon: <Calendar className="ic" />,
      label: 'Приём перенесён',
      tone: 'amber',
      shortType: 'Перенос',
    };
  }
  if (t === 'APPOINTMENT_BOOKED' || t.includes('BOOK')) {
    return {
      cls: 't-booked',
      icon: <CalendarPlus className="ic" />,
      label: 'Новая запись на приём',
      tone: 'blue',
      shortType: 'Запись',
    };
  }
  if (
    t === 'VACCINATION_DUE' ||
    t.includes('VACC') ||
    Boolean(n.vaccinationId) ||
    n.title?.toLowerCase().includes('привив') ||
    n.title?.toLowerCase().includes('вакцин')
  ) {
    return {
      cls: 't-vaccine',
      icon: <Syringe className="ic" />,
      label: 'Срок вакцинации',
      tone: 'purple',
      shortType: 'Вакцинация',
    };
  }
  return {
    cls: '',
    icon: <Bell className="ic" />,
    label: 'Оповещение',
    tone: 'blue',
    shortType: 'Инфо',
  };
}

export function getNotificationHref(
  n: AppNotification,
  role?: UserRole | null
): string | null {
  if (n.appointmentId) {
    if (role === 'VETERINARIAN') {
      return `/vet/appointments?sel=${encodeURIComponent(n.appointmentId)}`;
    }
    if (role === 'ADMIN') {
      return `/admin/appointments?sel=${encodeURIComponent(n.appointmentId)}`;
    }
    return `/client/appointments?sel=${encodeURIComponent(n.appointmentId)}`;
  }

  if (n.vaccinationId || n.petId || n.type === 'VACCINATION_DUE') {
    const petQuery = n.petId ? `?petId=${encodeURIComponent(n.petId)}` : '';
    if (role === 'VETERINARIAN') {
      return `/vet/vaccinations${petQuery}`;
    }
    if (role === 'CLIENT') {
      return `/client/vaccinations${petQuery}`;
    }
    return null;
  }

  return null;
}
