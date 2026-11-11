'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatSlotTime,
  getSpeciesTone,
} from '@/shared/lib';
import { ST_COL } from './constants';
import { formatAppointmentCountdown, formatMoscowDayHeading } from './utils';

export interface NextAppointmentBannerProps {
  nextAppointment?: Appointment | null;
  pet?: Pet | null;
  service?: Service | null;
  veterinarian?: Veterinarian | null;
  speciesMap?: Record<string, string>;
}

export function NextAppointmentBanner({
  nextAppointment,
  pet,
  service,
  veterinarian,
  speciesMap,
}: NextAppointmentBannerProps) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!nextAppointment) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [nextAppointment]);

  if (!nextAppointment) {
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

  const tone = getSpeciesTone(pet?.species?.name || pet?.speciesId || nextAppointment.pet?.speciesId, speciesMap);
  const petName = pet?.name || nextAppointment.pet?.name || nextAppointment.petName || 'Питомец';
  const serviceName =
    service?.name || nextAppointment.service?.name || nextAppointment.serviceName || 'Приём';
  const vetObj = veterinarian || nextAppointment.veterinarian;
  const vetName = vetObj
    ? getDoctorDisplay(vetObj).name
    : nextAppointment.veterinarianName || 'Врач клиники';
  const statusShort = APPOINTMENT_STATUS_META[nextAppointment.status]?.short || nextAppointment.status;
  const priceVal = nextAppointment.priceSnapshot ?? nextAppointment.price;

  return (
    <div
      className="hm-next"
      style={{ '--st': ST_COL[nextAppointment.status] || 'var(--border)' } as React.CSSProperties}
    >
      <div className="row between">
        <span className="hm-kicker">
          <Clock className="ic" />
          Следующий приём
        </span>
        <span className={`badge st badge-${nextAppointment.status}`}>{statusShort}</span>
      </div>

      <div className="hm-next-when">
        <b>{formatSlotTime(nextAppointment.startAt)}</b>
        <span className="col" style={{ gap: 0 }}>
          <span className="hm-next-day">{formatMoscowDayHeading(nextAppointment.startAt)}</span>
          <span className="hm-next-cd">{formatAppointmentCountdown(nextAppointment.startAt, nowMs)}</span>
        </span>
      </div>

      <div className="hm-next-who">
        <PetAvatar
          pet={pet || nextAppointment.pet}
          tone={tone}
          species={tone}
          iconSize={20}
          variant="full"
          className={`hm-ava tone-${tone}`}
        />
        <span className="col" style={{ gap: '1px', minWidth: 0 }}>
          <span className="hm-next-pet">
            {petName} · {serviceName}
          </span>
          <span className="cell-sub">
            {vetName} · {priceVal != null ? formatCurrency(priceVal) : '—'}
          </span>
        </span>
      </div>

      <div className="row" style={{ gap: '8px' }}>
        <Link
          href={`/client/appointments?sel=${encodeURIComponent(nextAppointment.id)}`}
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
