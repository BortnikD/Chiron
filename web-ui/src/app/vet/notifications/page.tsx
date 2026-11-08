'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { NotificationsView } from '../../../components/notifications/NotificationsView';

export default function VetNotificationsPage() {
  return (
    <AppShell title="Уведомления">
      <div className="scroll-col grow">
        <NotificationsView />
      </div>
    </AppShell>
  );
}
