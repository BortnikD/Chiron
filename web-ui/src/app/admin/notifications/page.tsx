'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { NotificationsView } from '@/components/notifications/NotificationsView';

export default function AdminNotificationsPage() {
  const [isComposing, setIsComposing] = useState(false);

  useShellHeader({
    crumbGroup: 'Личное',
    crumb: 'Уведомления',
    actions: (
      <button
        type="button"
        className={`btn ${isComposing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
        onClick={() => setIsComposing((prev) => !prev)}
      >
        {isComposing ? <ArrowLeft size={15} /> : <Mail size={15} />}
        <span>{isComposing ? 'К просмотру' : 'Написать пользователю'}</span>
      </button>
    ),
  });

  return (
    <NotificationsView
      isComposing={isComposing}
      onOpenCompose={() => setIsComposing(true)}
      onCloseCompose={() => setIsComposing(false)}
      onSentMessage={() => {
        setIsComposing(false);
      }}
    />
  );
}
