'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateRu,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import { ST_COL } from './constants';

export interface NextAppointmentBannerProps {
  nextAppointment?: Appointment | null;
  nextAppt?: Appointment | null;
  pet?: Pet | null;
  service?: Service | null;
  veterinarian?: Veterinarian | null;
  speciesMap?: Record<string, string>;
}

function getCountdown(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return 'сейчас';
  if (diffMin < 60) return `через ${diffMin} мин`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `через ${diffHours} ч`;
  const diffDays = Math.round(diffHours / 24);
  return `через ${diffDays} дн`;
}

export function NextAppointmentBanner({
  nextAppointment,
  nextAppt: legacyNextAppt,
  pet,
  service,
  veterinarian,
  speciesMap,
}: NextAppointmentBannerProps) {
  const appt = nextAppointment ?? legacyNextAppt;

  if (!appt) {
    return (
      <div className="hm-next hm-next-empty">
        <span className="hm-kicker">Следующий приём</span>
        <span className="muted">Предстоящих записей нет</span>
        <Link href="/client/book" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
          <span>Выбрать время</span>
        </Link>
      </div>
    );
  }

  const tone = getSpeciesTone(pet?.speciesId, speciesMap);
  const vetName = veterinarian ? getDoctorDisplay(veterinarian).name : 'Врач клиники';
  const statusShort = APPOINTMENT_STATUS_META[appt.status]?.short || appt.status;

  return (
    <div
      className="hm-next"
      style={{ '--st': ST_COL[appt.status] || 'var(--border)' } as React.CSSProperties}
    >
      <div className="row between">
        <span className="hm-kicker">
          <Clock className="ic" />
          Следующий приём
        </span>
        <span className={`badge st badge-${appt.status}`}>{statusShort}</span>
      </div>

      <div className="hm-next-when">
        <b>{formatSlotTime(appt.startAt)}</b>
        <span className="col" style={{ gap: 0 }}>
          <span className="hm-next-day">
            {formatDateRu(appt.startAt, { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="hm-next-cd">{getCountdown(appt.startAt)}</span>
        </span>
      </div>

      <div className="hm-next-who">
        <span className={`hm-ava sm tone-${tone}`}>
          <SpeciesIcon species={tone} size={20} />
        </span>
        <span className="col" style={{ gap: '1px', minWidth: 0 }}>
          <span className="hm-next-pet">
            {pet?.name || 'Питомец'} — {service?.name || 'Приём'}
          </span>
          <span className="cell-sub">
            {vetName} · {appt.priceSnapshot != null ? formatCurrency(appt.priceSnapshot) : '—'}
          </span>
        </span>
      </div>

      <div className="row" style={{ gap: '8px' }}>
        <Link
          href="/client/appointments"
          className="btn btn-outline btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <span>Подробнее</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
    </div>
  );
}
