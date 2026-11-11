'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatSlotTime,
  getMoscowDateKey,
  getSpeciesTone,
  pluralRu,
} from '@/shared/lib';
import { ST_COL } from './constants';
import { formatMoscowDayHeading } from './utils';

export interface ClientAppointmentsIslandProps {
  appointments: Appointment[];
  pets: Pet[];
  servicesMap?: Record<string, Service>;
  veterinariansMap?: Record<string, Veterinarian>;
  speciesMap?: Record<string, string>;
  nextAppointmentId?: string | null;
}

export function ClientAppointmentsIsland({
  appointments,
  pets,
  servicesMap = {},
  veterinariansMap = {},
  speciesMap = {},
  nextAppointmentId,
}: ClientAppointmentsIslandProps) {
  const upcomingAppts = useMemo(() => {
    const sorted = appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    if (sorted.length > 1 && nextAppointmentId) {
      const withoutNext = sorted.filter((a) => a.id !== nextAppointmentId);
      if (withoutNext.length > 0) return withoutNext.slice(0, 6);
    }
    return sorted.slice(0, 6);
  }, [appointments, nextAppointmentId]);

  const groupedUpcoming = useMemo(() => {
    const groups: { dateKey: string; dayLabel: string; countText: string; items: Appointment[] }[] = [];
    const map: Record<string, Appointment[]> = {};

    upcomingAppts.forEach((a) => {
      const key = getMoscowDateKey(a.startAt);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    Object.keys(map)
      .sort()
      .forEach((key) => {
        const items = map[key];
        const dayLabel = formatMoscowDayHeading(items[0].startAt);
        const countText = `${items.length} ${pluralRu(items.length, 'запись', 'записи', 'записей')}`;
        groups.push({ dateKey: key, dayLabel, countText, items });
      });

    return groups;
  }, [upcomingAppts]);

  return (
    <section className="island">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Ближайшие записи
        </span>
        <Link href="/client/appointments" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все записи</span>
          <ChevronRight className="ic" />
        </Link>
      </div>

      <div className="island-body" style={{ paddingTop: 0 }}>
        {groupedUpcoming.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>
            <span>Нет предстоящих записей</span>
          </div>
        ) : (
          groupedUpcoming.map((group) => (
            <React.Fragment key={group.dateKey}>
              <div className="hm-day">
                <span className="hm-day-label">{group.dayLabel}</span>
                <span className="hm-day-line" />
                <span className="cell-sub">{group.countText}</span>
              </div>
              {group.items.map((a) => {
                const pet = pets.find((p) => p.id === a.petId) || a.pet;
                const tone = getSpeciesTone(pet?.species?.name || pet?.speciesId, speciesMap);
                const svc = servicesMap[a.serviceId] || a.service;
                const vet = veterinariansMap[a.veterinarianId] || a.veterinarian;
                const vetName = vet
                  ? getDoctorDisplay(vet).name
                  : a.veterinarianName || 'Врач клиники';
                const statusShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;
                const priceVal = a.priceSnapshot ?? a.price;

                return (
                  <Link
                    key={a.id}
                    href={`/client/appointments?sel=${encodeURIComponent(a.id)}`}
                    className="hm-appt"
                    style={{
                      '--st': ST_COL[a.status] || 'var(--border)',
                      textDecoration: 'none',
                    } as React.CSSProperties}
                  >
                    <span className="hm-appt-time">{formatSlotTime(a.startAt)}</span>
                    <span className={`hm-ava sm tone-${tone}`}>
                      <SpeciesIcon species={tone} size={16} />
                    </span>
                    <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                      <span className="cell-main hm-ell">
                        {pet?.name || a.petName || 'Питомец'} — {svc?.name || a.serviceName || 'Приём'}
                      </span>
                      <span className="cell-sub hm-ell">
                        {vetName} · {priceVal != null ? formatCurrency(priceVal) : '—'}
                      </span>
                    </span>
                    <span className={`badge st badge-${a.status}`}>{statusShort}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          ))
        )}
      </div>
    </section>
  );
}
