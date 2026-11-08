'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { Bell } from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <AppShell title="Уведомления">
      <div className="scroll-col grow">
        <section className="island grow" style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
          <div className="island-head">
            <span className="island-title">
              <Bell className="ic" />
              Уведомления
            </span>
          </div>
          <div className="empty">
            <div className="empty-art">
              <Bell className="ic ic-40" style={{ width: '40px', height: '40px' }} />
            </div>
            <span className="empty-title">Администраторам уведомления не приходят</span>
            <span>Уведомления получают клиенты и врачи — о записях, отменах, переносах и ревакцинации</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
