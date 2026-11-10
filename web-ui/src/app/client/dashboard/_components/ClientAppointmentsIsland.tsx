'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateRu,
  formatSlotTime,
  getMoscowDateKey,
  getSpeciesTone,
  pluralRu,
} from '@/shared/lib';
import { ST_COL } from './constants';

export interface ClientAppointmentsIslandProps {
  appointments: Appointment[];
  pets: Pet[];
  servicesMap?: Record<string, Service>;
  veterinariansMap?: Record<string, Veterinarian>;
  speciesMap?: Record<string, string>;
  upcomingTotal?: number;
  pastTotal?: number;
}

export function ClientAppointmentsIsland({
  appointments,
  pets,
  servicesMap = {},
  veterinariansMap = {},
  speciesMap = {},
  upcomingTotal,
  pastTotal,
}: ClientAppointmentsIslandProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

  const upcomingAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  const pastAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW'))
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [appointments]);

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
        const dayLabel = formatDateRu(`${key}T12:00:00`, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        }).toUpperCase();
        const countText = `${items.length} ${pluralRu(items.length, 'запись', 'записи', 'записей')}`;
        groups.push({ dateKey: key, dayLabel, countText, items });
      });

    return groups;
  }, [upcomingAppts]);

  const upcomingBadgeCount = upcomingTotal ?? upcomingAppts.length;
  const pastBadgeCount = pastTotal ?? pastAppts.length;

  return (
    <section className="island">
      <div className="island-head">
        <span className="island-title">
          <Calendar className="ic" />
          Записи на приём
        </span>
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
          <div className="seg" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'UPCOMING'}
              className={`seg-item ${tab === 'UPCOMING' ? 'on' : ''}`}
              onClick={() => setTab('UPCOMING')}
            >
              <span>Предстоящие</span>
              {upcomingBadgeCount > 0 && <span className="count">{upcomingBadgeCount}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'PAST'}
              className={`seg-item ${tab === 'PAST' ? 'on' : ''}`}
              onClick={() => setTab('PAST')}
            >
              <span>Прошедшие</span>
              {pastBadgeCount > 0 && <span className="count">{pastBadgeCount}</span>}
            </button>
          </div>
          <Link href="/client/appointments" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            <span>Все записи</span>
            <ChevronRight className="ic" />
          </Link>
        </div>
      </div>

      <div className="island-body" style={{ paddingTop: 0 }}>
        {tab === 'UPCOMING' ? (
          groupedUpcoming.length === 0 ? (
            <div className="empty" style={{ padding: '24px' }}>
              <span className="small muted">Нет предстоящих записей</span>
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
                  const pet = pets.find((p) => p.id === a.petId);
                  const tone = getSpeciesTone(pet?.speciesId, speciesMap);
                  const svc = servicesMap[a.serviceId];
                  const vet = veterinariansMap[a.veterinarianId];
                  const vetName = vet ? getDoctorDisplay(vet).name : 'Врач клиники';
                  const statusShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;

                  return (
                    <Link
                      key={a.id}
                      href="/client/appointments"
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
                          {pet?.name || 'Питомец'} — {svc?.name || 'Приём'}
                        </span>
                        <span className="cell-sub hm-ell">
                          {vetName} · {a.priceSnapshot != null ? formatCurrency(a.priceSnapshot) : '—'}
                        </span>
                      </span>
                      <span className={`badge st badge-${a.status}`}>{statusShort}</span>
                    </Link>
                  );
                })}
              </React.Fragment>
            ))
          )
        ) : pastAppts.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>
            <span className="small muted">Нет завершённых визитов</span>
          </div>
        ) : (
          <div className="table-wrap" style={{ marginTop: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Питомец</th>
                  <th>Услуга</th>
                  <th>Врач</th>
                  <th>Статус</th>
                  <th className="right">Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {pastAppts.map((a) => {
                  const pet = pets.find((p) => p.id === a.petId);
                  const tone = getSpeciesTone(pet?.speciesId, speciesMap);
                  const svc = servicesMap[a.serviceId];
                  const vet = veterinariansMap[a.veterinarianId];
                  const vetName = vet ? getDoctorDisplay(vet).name : 'Врач клиники';
                  const statusShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;

                  return (
                    <tr key={a.id} onClick={() => router.push('/client/appointments')}>
                      <td>
                        <div className="col" style={{ gap: '2px' }}>
                          <span className="font-medium">
                            {formatDateRu(a.startAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="cell-sub">{formatSlotTime(a.startAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                          <span
                            className={`hm-ava sm tone-${tone}`}
                            style={{ width: 24, height: 24 }}
                          >
                            <SpeciesIcon species={tone} size={14} />
                          </span>
                          <span className="font-medium">{pet?.name || 'Питомец'}</span>
                        </div>
                      </td>
                      <td>{svc?.name || 'Приём'}</td>
                      <td>{vetName}</td>
                      <td>
                        <span className={`badge st badge-${a.status}`}>{statusShort}</span>
                      </td>
                      <td className="right">
                        {a.priceSnapshot != null ? formatCurrency(a.priceSnapshot) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
