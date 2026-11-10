'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, PawPrint } from 'lucide-react';
import type { Pet, Appointment } from '@/modules/client/types';
import { APPOINTMENT_STATUS_META, formatDateTimeCompact } from '@/shared/lib';

export interface UserRelationsTabsProps {
  activeTab: 'pets' | 'appointments';
  pets: Pet[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

export const UserRelationsTabs: React.FC<UserRelationsTabsProps> = ({
  activeTab,
  pets,
  appointments,
  loading,
  error,
}) => {
  if (error) {
    return (
      <div className="alert alert-destructive" role="alert">
        <AlertCircle size={16} className="ic" />
        <div>{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty" style={{ padding: 24 }}>
        <span className="spinner" aria-hidden="true" />
        <span className="muted">Загрузка…</span>
      </div>
    );
  }

  if (activeTab === 'pets') {
    return (
      <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
        {pets.map((p) => (
          <Link key={p.id} href="/admin/pets" className="lrow">
            <span className="pet-ava" style={{ width: 36, height: 36, borderRadius: 10 }}>
              <PawPrint size={16} />
            </span>
            <span className="col" style={{ gap: 1 }}>
              <span className="cell-main">{p.name}</span>
              <span className="cell-sub">{p.gender === 'MALE' ? 'Самец' : 'Самка'}</span>
            </span>
            {p.isArchived && <span className="badge">Архив</span>}
          </Link>
        ))}

        {pets.length === 0 && (
          <div className="empty" style={{ padding: 24 }}>
            Питомцев нет
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 4, margin: '0 -10px' }}>
      {appointments.map((a) => {
        const dt = formatDateTimeCompact(a.startAt);
        const [dd, mon] = dt.date.split(' ');
        const stMeta = APPOINTMENT_STATUS_META[a.status];

        return (
          <Link key={a.id} href="/admin/appointments" className="lrow">
            <span className="datebox">
              <b>{dd}</b>
              <span>{mon}</span>
            </span>
            <span className="col" style={{ gap: 1 }}>
              <span className="cell-main">{a.service?.name || 'Услуга'}</span>
              <span className="cell-sub">{dt.time}</span>
            </span>
            <span className={`badge st ${stMeta?.cls || `badge-${a.status}`}`}>
              {stMeta?.short || a.status}
            </span>
          </Link>
        );
      })}

      {appointments.length === 0 && (
        <div className="empty" style={{ padding: 24 }}>
          Записей нет
        </div>
      )}
    </div>
  );
};
