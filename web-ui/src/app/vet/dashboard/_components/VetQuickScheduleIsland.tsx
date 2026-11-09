'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { VetQuickScheduleIslandProps } from './types';
import { formatSlotTime, getPetName } from './utils';
import { Appointment } from '../../../../types';

/**
 * Компактный виджет расписания врача на сегодня и ближайшие дни:
 * отображает записи, требующие подтверждения, а также расписание приёмов
 * на предстоящие дни с быстрым переходом в полноценный календарь смен.
 */
export const VetQuickScheduleIsland: React.FC<VetQuickScheduleIslandProps> = ({
  appointments,
  pendingAppointments,
  servicesMap,
  petsMap,
  onSelectAppointment,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming'>(
    pendingAppointments.length > 0 ? 'pending' : 'upcoming'
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Предстоящие приёмы на ближайшие дни (начиная с завтра)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const dateStr = a.startAt.split('T')[0];
        return dateStr > todayStr && a.status !== 'CANCELLED';
      })
      .slice(0, 8);
  }, [appointments, todayStr]);

  const displayList = activeTab === 'pending' ? pendingAppointments : upcomingAppointments;

  return (
    <section className="island" style={{ width: '100%' }} aria-label="Расписание врача">
      <div className="island-head">
        <div className="row items-center" style={{ gap: '8px' }}>
          <span className="island-title">
            <Calendar className="ic" />
            Расписание
          </span>
          <div className="btn-group" style={{ display: 'inline-flex' }}>
            {pendingAppointments.length > 0 && (
              <button
                type="button"
                className={`btn btn-xs ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('pending')}
                style={{ fontSize: '11px', height: '22px' }}
              >
                Ожидают ({pendingAppointments.length})
              </button>
            )}
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('upcoming')}
              style={{ fontSize: '11px', height: '22px' }}
            >
              Ближайшие дни ({upcomingAppointments.length})
            </button>
          </div>
        </div>

        <Link
          href="/vet/schedule"
          className="btn btn-ghost btn-xs"
          style={{ fontSize: '11px', height: '22px', gap: '2px' }}
          title="Открыть полный календарь смен и расписания"
        >
          <span>Всё расписание</span>
          <ChevronRight size={12} className="ic" />
        </Link>
      </div>

      <div className="island-body" style={{ padding: '0 8px 8px' }}>
        {displayList.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <span className="empty-title" style={{ fontSize: '13px' }}>
              {activeTab === 'pending'
                ? 'Нет записей, ожидающих подтверждения'
                : 'Нет приёмов на ближайшие дни'}
            </span>
            <span className="small muted">
              {activeTab === 'pending'
                ? 'Все новые записи подтверждены'
                : 'Свободные слоты доступны в общем расписании'}
            </span>
          </div>
        ) : (
          displayList.map((p) => {
            const petName = getPetName(p, petsMap);
            const serviceName = servicesMap[p.serviceId] || 'Приём';

            return (
              <div
                key={p.id}
                className="lrow"
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => onSelectAppointment(p)}
              >
                {/* Дата слота */}
                <span className="datebox">
                  <b>{new Date(p.startAt).getDate()}</b>
                  <span>
                    {new Date(p.startAt).toLocaleDateString('ru-RU', { month: 'short' })}
                  </span>
                </span>

                {/* Время, услуга, пациент */}
                <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                  <span className="row items-center" style={{ gap: '6px' }}>
                    <span className="cell-main tnum" style={{ fontWeight: 600 }}>
                      {formatSlotTime(p.startAt)}
                    </span>
                    <span className="muted small">({petName})</span>
                  </span>
                  <span className="cell-sub" style={{ fontSize: '12px' }}>
                    {serviceName}
                  </span>
                </span>

                {/* Действия */}
                <div className="row" style={{ gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  {p.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onUpdateStatus(p.id, 'CONFIRMED')}
                    >
                      Подтвердить
                    </button>
                  ) : (
                    <span className={`badge st badge-${p.status}`} style={{ fontSize: '11px' }}>
                      {p.status === 'CONFIRMED' ? 'Подтверждён' : p.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
