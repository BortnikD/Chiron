'use client';

import { useShellHeader } from '@/components/layout/AppShell';
import { NotificationsView } from '@/components/notifications/NotificationsView';

export default function AdminNotificationsPage() {
  useShellHeader({
    crumbGroup: 'Личное',
    crumb: 'Уведомления',
  });

  return (
    <div className="scroll-col grow">
      <NotificationsView />
    </div>
  );
}
