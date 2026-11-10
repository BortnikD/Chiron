'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import {
  APPOINTMENT_STATUS_META,
  formatDateRu,
  formatSlotTime,
  getMoscowDateKey,
  getMoscowTodayIso,
} from '@/shared/lib';
import type { VetQuickScheduleIslandProps } from './types';
import { getPetName } from './utils';

/**
 * Компактный виджет расписания врача на ближайшие дни и подтверждения:
 * отображает записи, требующие подтверждения, а также расписание приёмов
 * на предстоящие дни с быстрым переходом в полноценный календарь смен.
 */
export const VetQuickScheduleIsland: React.FC<VetQuickScheduleIslandProps> = ({
  appointments,
  pendingAppointments,
  servicesMap,
  petsMap,
  loading = false,
  onSelectAppointment,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming'>(
    pendingAppointments.length > 0 ? 'pending' : 'upcoming'
  );

  const userSwitchedTabRef = useRef(false);
  const syncedInitialTabRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!syncedInitialTabRef.current) {
      syncedInitialTabRef.current = true;
      if (!userSwitchedTabRef.current) {
        setActiveTab(pendingAppointments.length > 0 ? 'pending' : 'upcoming');
      }
      return;
    }
    if (activeTab === 'pending' && pendingAppointments.length === 0) {
      setActiveTab('upcoming');
    }
  }, [loading, pendingAppointments.length, activeTab]);

  const handleTabChange = (tab: 'pending' | 'upcoming') => {
    userSwitchedTabRef.current = true;
    setActiveTab(tab);
  };

  const todayStr = getMoscowTodayIso();

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const dateStr = getMoscowDateKey(a.startAt);
        return dateStr > todayStr && a.status !== 'CANCELLED';
      })
      .slice(0, 8);
  }, [appointments, todayStr]);

  const displayList = activeTab === 'pending' ? pendingAppointments : upcomingAppointments;

  return (
    <section
      className="island md:max-h-[240px]"
      style={{ flex: 'none', width: '100%' }}
      aria-label="Расписание врача"
    >
      <div className="island-head">
        <div className="row items-center wrap" style={{ gap: '8px' }}>
          <span className="island-title">
            <Calendar className="ic" />
            Расписание
          </span>
          <div className="seg">
            {pendingAppointments.length > 0 && (
              <button
                type="button"
                className={`seg-item ${activeTab === 'pending' ? 'on' : ''}`}
                style={{ height: '24px', padding: '0 9px', fontSize: '12px' }}
                onClick={() => handleTabChange('pending')}
              >
                Ожидают ({pendingAppointments.length})
              </button>
            )}
            <button
              type="button"
              className={`seg-item ${activeTab === 'upcoming' ? 'on' : ''}`}
              style={{ height: '24px', padding: '0 9px', fontSize: '12px' }}
              onClick={() => handleTabChange('upcoming')}
            >
              Ближайшие дни ({upcomingAppointments.length})
            </button>
          </div>
        </div>

        <Link
          href="/vet/schedule"
          className="btn btn-ghost btn-sm"
          style={{ height: '26px', padding: '0 8px', fontSize: '12px', gap: '2px' }}
          title="Открыть полный календарь смен и расписания"
        >
          <span>Всё расписание</span>
          <ChevronRight size={13} className="ic" />
        </Link>
      </div>

      <div className="island-body" style={{ padding: '0 12px 10px' }}>
        {displayList.length === 0 ? (
          <div className="empty" style={{ padding: '20px 12px' }}>
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
            const dayNum = formatDateRu(p.startAt, { day: 'numeric' });
            const monthShort = formatDateRu(p.startAt, { month: 'short' });

            return (
              <div
                key={p.id}
                className="lrow"
                style={{
                  padding: '8px 6px',
                  borderBottom: '1px solid var(--border)',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
                onClick={() => onSelectAppointment(p)}
              >
                <span className="datebox">
                  <b>{dayNum}</b>
                  <span>{monthShort}</span>
                </span>

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
                      {APPOINTMENT_STATUS_META[p.status]?.short || p.status}
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
