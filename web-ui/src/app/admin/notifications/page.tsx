'use client';

import { Bell } from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <div className="scroll-col grow">
      <section className="island grow" style={{ maxWidth: '860px', width: '100%' }}>
        <div className="island-head">
          <span className="island-title">
            <Bell className="ic" /> Уведомления
          </span>
        </div>
        <div className="empty">
          <div className="empty-art">
            <Bell className="ic ic-40" />
          </div>
          <span className="empty-title">Администраторам уведомления не приходят</span>
          <span>
            Уведомления получают клиенты и врачи — о записях, отменах, переносах и ревакцинации
          </span>
        </div>
      </section>
    </div>
  );
}
