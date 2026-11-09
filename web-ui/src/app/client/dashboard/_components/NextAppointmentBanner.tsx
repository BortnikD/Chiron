'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';
import { getDoctorDisplay } from '../../../../utils/doctorHelpers';
import { NextAppointmentBannerProps } from './types';
import { STATUS_SHORT, ST_COL, SP_TONE } from './constants';
import { getCountdown, getSpeciesTone } from './utils';

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
  const toneColor = SP_TONE[tone] || 'var(--primary)';
  const vetName = veterinarian ? getDoctorDisplay(veterinarian).name : 'Врач клиники';

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
        <span className={`badge st badge-${appt.status}`}>
          {STATUS_SHORT[appt.status] || appt.status}
        </span>
      </div>

      <div className="hm-next-when">
        <b>
          {new Date(appt.startAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Moscow',
          })}
        </b>
        <span className="col" style={{ gap: 0 }}>
          <span className="hm-next-day">
            {new Date(appt.startAt).toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'Europe/Moscow',
            })}
          </span>
          <span className="hm-next-cd">
            {getCountdown(appt.startAt)}
          </span>
        </span>
      </div>

      <div className="hm-next-who">
        <span
          className="hm-ava sm"
          style={{ '--tone': toneColor } as React.CSSProperties}
        >
          <SpeciesIcon species={tone} size={20} />
        </span>
        <span className="col" style={{ gap: '1px', minWidth: 0 }}>
          <span className="hm-next-pet">
            {pet?.name || 'Питомец'} — {service?.name || 'Приём'}
          </span>
          <span className="cell-sub">
            {vetName} · {appt.priceSnapshot ? `${appt.priceSnapshot.toLocaleString('ru-RU')} ₽` : '1 500 ₽'}
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
