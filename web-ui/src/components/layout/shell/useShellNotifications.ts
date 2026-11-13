'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/shared/api';
import { vetApi } from '@/modules/vet/api';
import { useNotificationSocket } from '@/shared/realtime/useNotificationSocket';
import { useToast } from '@/shared/components';
import { getMoscowDateKey, getMoscowTodayIso, nextMoscowDayIso } from '@/shared/lib';
import type { AppNotification, UserRole } from '@/shared/types';
import { getNotificationHref } from '@/components/notifications/notifMeta';

export function useShellNotifications(params: {
  role: UserRole | null;
  pathname: string;
  bellDropdown: boolean;
  bellTab: 'all' | 'unread';
  onCloseBell: () => void;
}) {
  const { role, pathname, bellDropdown, bellTab, onCloseBell } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [vetTodayCount, setVetTodayCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnread = useCallback(() => {
    if (!role || role === 'ADMIN') {
      setUnreadCount(0);
      return;
    }
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        const count = typeof res === 'number' ? res : (res as { count?: number })?.count ?? 0;
        setUnreadCount(count);
      })
      .catch(() => {});
  }, [role]);

  const fetchVetTodayCount = useCallback(() => {
    if (role !== 'VETERINARIAN') {
      setVetTodayCount(0);
      return;
    }
    const todayIso = getMoscowTodayIso();
    const nowMs = Date.now();
    vetApi
      .getAppointments({
        page: 0,
        size: 100,
        status: ['PENDING', 'CONFIRMED'],
        from: new Date(`${todayIso}T00:00:00+03:00`).toISOString(),
        to: new Date(`${nextMoscowDayIso(todayIso)}T00:00:00+03:00`).toISOString(),
      })
      .then((res) => {
        const activeToday = (res?.items || []).filter(
          (a) => getMoscowDateKey(a.startAt) === todayIso && new Date(a.endAt).getTime() > nowMs
        ).length;
        setVetTodayCount(activeToday);
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    fetchUnread();
    if (!role || role === 'ADMIN') return;
    window.addEventListener('chiron:notifications-updated', fetchUnread);
    return () => window.removeEventListener('chiron:notifications-updated', fetchUnread);
  }, [role, fetchUnread]);

  useEffect(() => {
    fetchVetTodayCount();
    if (role !== 'VETERINARIAN') return;
    window.addEventListener('chiron:notification-received', fetchVetTodayCount);
    window.addEventListener('chiron:notifications-updated', fetchVetTodayCount);
    window.addEventListener('chiron:vet-appointments-updated', fetchVetTodayCount);
    return () => {
      window.removeEventListener('chiron:notification-received', fetchVetTodayCount);
      window.removeEventListener('chiron:notifications-updated', fetchVetTodayCount);
      window.removeEventListener('chiron:vet-appointments-updated', fetchVetTodayCount);
    };
  }, [role, pathname, fetchVetTodayCount]);

  const handleIncoming = useCallback(
    (notif: AppNotification) => {
      if (!notif?.id) return;
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notif.id);
        if (!exists && !notif.readAt) setUnreadCount((c) => c + 1);
        return [notif, ...prev.filter((item) => item.id !== notif.id)].slice(0, 15);
      });
      toast(notif.title || 'Новое уведомление', notif.body || undefined, 'ok');
    },
    [toast]
  );

  const { connected: wsConnected } = useNotificationSocket({
    onNotification: handleIncoming,
    onConnect: fetchUnread,
  });

  useEffect(() => {
    if (!bellDropdown) return;
    if (role === 'ADMIN') {
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    notificationsApi
      .getNotifications(0, 15, bellTab === 'unread')
      .then((res) => setNotifications(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifications(false));
  }, [bellDropdown, bellTab, role]);

  const handleMarkAllRead = async () => {
    const prevUnread = unreadCount;
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      const now = new Date().toISOString();
      setNotifications((prev) =>
        bellTab === 'unread' ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-marked-all-read'));
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
      if (prevUnread > 0) toast(`Отмечено прочитанными: ${prevUnread}`);
    } catch {
      toast('Не удалось отметить уведомления прочитанными', undefined, 'err');
    }
  };

  const handleClickNotification = async (notif: AppNotification) => {
    if (!notif.readAt) {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        bellTab === 'unread'
          ? prev.filter((item) => item.id !== notif.id)
          : prev.map((item) => (item.id === notif.id ? { ...item, readAt: now } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await notificationsApi.markAsRead(notif.id);
        window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
      } catch {
        // Игнорируем сбой фоновой отметки при переходе
      }
    }
    onCloseBell();
    const targetHref = getNotificationHref(notif, role);
    if (targetHref) router.push(targetHref);
  };

  return {
    notifications,
    unreadCount,
    vetTodayCount,
    loadingNotifications,
    wsConnected,
    handleMarkAllRead,
    handleClickNotification,
  };
}
