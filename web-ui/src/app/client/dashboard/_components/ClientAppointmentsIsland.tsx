'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { Appointment } from '../../../../types';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';
import { getDoctorDisplay } from '../../../../utils/doctorHelpers';
import { ClientAppointmentsIslandProps } from './types';
import { STATUS_SHORT, ST_COL, SP_TONE } from './constants';
import { getSpeciesTone } from './utils';

export function ClientAppointmentsIsland({
  appointments,
  pets,
  servicesMap = {},
  veterinariansMap = {},
  speciesMap = {},
}: ClientAppointmentsIslandProps) {
  const [tab, setTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

  // Предстоящие записи
  const upcomingAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  // Завершённые и прошедшие визиты
  const pastAppts = useMemo(() => {
    return appointments
      .filter((a) => a && (a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW'))
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [appointments]);

  // Группировка предстоящих записей по дням
  const groupedUpcoming = useMemo(() => {
    const groups: { dateKey: string; dayLabel: string; countText: string; items: Appointment[] }[] = [];
    const map: Record<string, Appointment[]> = {};

    upcomingAppts.forEach((a) => {
      const key = new Date(a.startAt).toISOString().split('T')[0];
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(a);
    });

    Object.keys(map).sort().forEach((key) => {
      const items = map[key];
      const date = new Date(`${key}T12:00:00`);
      const dayLabel = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
      const countText = `${items.length} ${items.length === 1 ? 'запись' : items.length < 5 ? 'записи' : 'записей'}`;
      groups.push({ dateKey: key, dayLabel, countText, items });
    });

    return groups;
  }, [upcomingAppts]);

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
              {upcomingAppts.length > 0 && <span className="count">{upcomingAppts.length}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'PAST'}
              className={`seg-item ${tab === 'PAST' ? 'on' : ''}`}
              onClick={() => setTab('PAST')}
            >
              <span>Прошедшие</span>
              {pastAppts.length > 0 && <span className="count">{pastAppts.length}</span>}
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
                  const toneColor = SP_TONE[tone] || 'var(--primary)';
                  const svc = servicesMap[a.serviceId];
                  const vet = veterinariansMap[a.veterinarianId];
                  const vetName = vet ? getDoctorDisplay(vet).name : 'Врач клиники';

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
                      <span className="hm-appt-time">
                        {new Date(a.startAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/Moscow',
                        })}
                      </span>
                      <span
                        className="hm-ava sm"
                        style={{ '--tone': toneColor } as React.CSSProperties}
                      >
                        <SpeciesIcon species={tone} size={16} />
                      </span>
                      <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                        <span className="cell-main hm-ell">
                          {pet?.name || 'Питомец'} — {svc?.name || 'Приём'}
                        </span>
                        <span className="cell-sub hm-ell">
                          {vetName} · {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : '1 500 ₽'}
                        </span>
                      </span>
                      <span className={`badge st badge-${a.status}`}>
                        {STATUS_SHORT[a.status] || a.status}
                      </span>
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
                  const toneColor = SP_TONE[tone] || 'var(--primary)';
                  const svc = servicesMap[a.serviceId];
                  const vet = veterinariansMap[a.veterinarianId];
                  const vetName = vet ? getDoctorDisplay(vet).name : 'Врач клиники';

                  return (
                    <tr
                      key={a.id}
                      onClick={() => {
                        window.location.href = '/client/appointments';
                      }}
                    >
                      <td>
                        <div className="col" style={{ gap: '2px' }}>
                          <span className="font-medium">
                            {new Date(a.startAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="cell-sub">
                            {new Date(a.startAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Moscow',
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                          <span
                            className="hm-ava sm"
                            style={{ '--tone': toneColor, width: 24, height: 24 } as React.CSSProperties}
                          >
                            <SpeciesIcon species={tone} size={14} />
                          </span>
                          <span className="font-medium">{pet?.name || 'Питомец'}</span>
                        </div>
                      </td>
                      <td>{svc?.name || 'Приём'}</td>
                      <td>{vetName}</td>
                      <td>
                        <span className={`badge st badge-${a.status}`}>
                          {STATUS_SHORT[a.status] || a.status}
                        </span>
                      </td>
                      <td className="right">
                        {a.priceSnapshot ? `${a.priceSnapshot.toLocaleString('ru-RU')} ₽` : '1 500 ₽'}
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
