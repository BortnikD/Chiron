'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { notificationsApi } from '@/shared/api';
import { useToast, UserRoleBadge, EmptyState } from '@/shared/components';
import { useAppShell } from '@/components/layout/AppShell';
import {
  formatApiError,
  formatSlotTime,
  groupItemsByDate,
} from '@/shared/lib';
import type { AppNotification } from '@/shared/types';
import { getNotifMeta, getNotificationHref } from './notifMeta';
import { NotificationDetailIsland } from './NotificationDetailIsland';
import { AdminSendMessageIsland } from './AdminSendMessageIsland';
import { AdminSentMessageDetailIsland } from './AdminSentMessageDetailIsland';
import {
  getAdminSentMessages,
  type AdminSentMessage,
} from '@/modules/admin/sentMessagesStore';
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Filter,
  Send,
  Mail,
  User as UserIcon,
} from 'lucide-react';

const PAGE_SIZE = 25;

export interface NotificationsViewProps {
  isComposing?: boolean;
  onOpenCompose?: () => void;
  onCloseCompose?: () => void;
  onSentMessage?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  isComposing,
  onOpenCompose,
  onCloseCompose,
  onSentMessage,
}) => {
  const { role } = useAuth();
  const { wsConnected } = useAppShell();
  const { toast } = useToast();
  const router = useRouter();

  // Режим вкладки для администратора: Входящие или Отправленные
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SENT'>('INBOX');

  const [onlyUnread, setOnlyUnread] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Список отправленных администратором сообщений
  const [sentMessages, setSentMessages] = useState<AdminSentMessage[]>([]);
  const [selectedSentMessage, setSelectedSentMessage] = useState<AdminSentMessage | null>(null);

  // Загрузка отправленных сообщений для администратора
  useEffect(() => {
    if (role === 'ADMIN') {
      const msgs = getAdminSentMessages();
      setSentMessages(msgs);

      const handleUpdate = () => {
        const updated = getAdminSentMessages();
        setSentMessages(updated);
        if (updated.length > 0) {
          setSelectedSentMessage((prev) => {
            if (!prev) return null;
            const found = updated.find((m) => m.id === prev.id);
            return found || null;
          });
        }
      };

      window.addEventListener('chiron:admin-sent-messages-updated', handleUpdate);
      return () => {
        window.removeEventListener('chiron:admin-sent-messages-updated', handleUpdate);
      };
    }
  }, [role]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications(0, 100, onlyUnread);
      const items = Array.isArray(res) ? res : res?.items || [];
      setNotifications(items);
      // Не выбираем автоматически первое уведомление по умолчанию, чтобы не перекрывать экран
      setSelectedNotification((prev) => {
        if (!prev) return null;
        const found = items.find((it) => it.id === prev.id);
        return found || null;
      });
    } catch (err) {
      setError(formatApiError(err, 'Не удалось загрузить уведомления'));
      setNotifications([]);
      setSelectedNotification(null);
    } finally {
      setLoading(false);
    }
  }, [onlyUnread]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Real-time WebSocket обновления
  useEffect(() => {
    const handleIncoming = (event: Event) => {
      const incoming = (event as CustomEvent<AppNotification>).detail;
      if (!incoming?.id) return;
      if (onlyUnread && incoming.readAt) return;
      setNotifications((prev) => [incoming, ...prev.filter((n) => n.id !== incoming.id)]);
      setSelectedNotification((prev) => prev || incoming);
    };

    const handleAllRead = () => {
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      setSelectedNotification((prev) =>
        prev ? { ...prev, readAt: prev.readAt || now } : null
      );
    };

    window.addEventListener('chiron:notification-received', handleIncoming);
    window.addEventListener('chiron:notifications-marked-all-read', handleAllRead);
    return () => {
      window.removeEventListener('chiron:notification-received', handleIncoming);
      window.removeEventListener('chiron:notifications-marked-all-read', handleAllRead);
    };
  }, [onlyUnread]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread
          ? prev.filter((n) => n.id !== id)
          : prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || nowIso } : n))
      );
      setSelectedNotification((prev) =>
        prev && prev.id === id ? { ...prev, readAt: prev.readAt || nowIso } : prev
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
    } catch (err) {
      toast('Ошибка', formatApiError(err, 'Не удалось отметить уведомление'), 'err');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadBefore = notifications.filter((n) => !n.readAt).length;
    setMarkingAll(true);
    setError(null);
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      setSelectedNotification((prev) =>
        prev ? { ...prev, readAt: prev.readAt || now } : null
      );
      window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
      if (unreadBefore > 0) {
        toast(`Отмечено прочитанными: ${unreadBefore}`);
      }
    } catch (err) {
      const msg = formatApiError(err, 'Не удалось отметить уведомления прочитанными');
      setError(msg);
      toast('Ошибка отметки уведомлений', msg, 'err');
    } finally {
      setMarkingAll(false);
    }
  };

  // Фильтрация входящих уведомлений
  const filteredInbox = useMemo(() => {
    return notifications.filter((n) => {
      if (onlyUnread && n.readAt) return false;
      if (selectedType !== 'ALL') {
        const meta = getNotifMeta(n);
        if (meta.shortType !== selectedType && meta.label !== selectedType) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, onlyUnread, selectedType]);

  // Доступные типы событий для быстрых фильтров входящих
  const availableTypes = useMemo(() => {
    const typesMap = new Map<string, { shortType: string; tone: string }>();
    notifications.forEach((n) => {
      const meta = getNotifMeta(n);
      if (!typesMap.has(meta.shortType)) {
        typesMap.set(meta.shortType, { shortType: meta.shortType, tone: meta.tone });
      }
    });
    return Array.from(typesMap.values());
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Пагинация для текущей активной вкладки
  const currentTotal = activeTab === 'INBOX' ? filteredInbox.length : sentMessages.length;
  const pageCount = Math.max(1, Math.ceil(currentTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  const pageInboxItems = filteredInbox.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const inboxGroups = groupItemsByDate(pageInboxItems);

  const pageSentItems = sentMessages.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const sentGroups = groupItemsByDate(pageSentItems);

  return (
    <div className="content-row">
      {/* Левая колонка: Реестр событий с фильтрами */}
      <section className="island grow content-col" style={{ minWidth: 0 }}>
        {/* Шапка реестра */}
        <div className="island-head" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <div className="row middle" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <span className="island-title">
              <Bell className="ic" />
              <span>Уведомления</span>
            </span>

            {/* Вкладки Входящие / Отправленные для администратора */}
            {role === 'ADMIN' && (
              <div className="seg" role="tablist" style={{ marginLeft: '4px' }}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'INBOX'}
                  className={`seg-item${activeTab === 'INBOX' ? ' on' : ''}`}
                  onClick={() => {
                    setActiveTab('INBOX');
                    setPage(0);
                  }}
                >
                  <Bell size={13} />
                  <span>Входящие</span>
                  {unreadCount > 0 && (
                    <span
                      className="badge badge-accent small"
                      style={{ fontSize: '10px', padding: '1px 5px', height: '17px' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'SENT'}
                  className={`seg-item${activeTab === 'SENT' ? ' on' : ''}`}
                  onClick={() => {
                    setActiveTab('SENT');
                    setPage(0);
                  }}
                >
                  <Send size={13} />
                  <span>Отправленные</span>
                  {sentMessages.length > 0 && (
                    <span
                      className="badge badge-outline small"
                      style={{ fontSize: '10px', padding: '1px 5px', height: '17px' }}
                    >
                      {sentMessages.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Правая часть шапки: зависит от активной вкладки */}
          {activeTab === 'INBOX' ? (
            <div className="row wrap" style={{ gap: '10px', alignItems: 'center' }}>
              <span
                className="row small muted"
                style={{ gap: '6px' }}
                title="WebSocket STOMP /user/queue/notifications"
              >
                <span className={`dot ${wsConnected ? '' : 'off'}`} />
                {wsConnected ? 'Онлайн' : 'Офлайн'}
              </span>

              <label className="row small" style={{ gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <button
                  id="notif-only-unread"
                  className={`switch ${onlyUnread ? 'on' : ''}`}
                  role="switch"
                  type="button"
                  aria-checked={onlyUnread}
                  aria-label="Только непрочитанные"
                  onClick={() => {
                    setOnlyUnread((v) => !v);
                    setPage(0);
                  }}
                />
                Только новые
              </label>

              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll || unreadCount === 0}
              >
                <CheckCheck className="ic" size={15} />
                Прочитать все
              </button>
            </div>
          ) : (
            <div className="row wrap middle" style={{ gap: '10px' }}>
              <span className="small muted">
                Всего отправлено: <strong style={{ color: 'var(--foreground)' }}>{sentMessages.length}</strong>
              </span>
              {onOpenCompose && !isComposing && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenCompose}
                >
                  <Mail size={14} />
                  <span>Написать сообщение</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Фильтры по типам событий (только для входящих) */}
        {activeTab === 'INBOX' && availableTypes.length > 1 && (
          <div
            className="row wrap"
            style={{
              padding: '6px 14px 10px',
              gap: '6px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Filter size={13} /> Тип:
            </span>
            <button
              type="button"
              className={`btn btn-xs ${selectedType === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setSelectedType('ALL');
                setPage(0);
              }}
            >
              Все ({notifications.length})
            </button>
            {availableTypes.map((t) => (
              <button
                key={t.shortType}
                type="button"
                className={`btn btn-xs ${selectedType === t.shortType ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setSelectedType(t.shortType);
                  setPage(0);
                }}
              >
                {t.shortType}
              </button>
            ))}
          </div>
        )}

        {/* Список сообщений (Входящие или Отправленные) */}
        <div className="island-body" style={{ padding: '8px 12px 14px' }}>
          {activeTab === 'INBOX' ? (
            <>
              {error && (
                <div className="alert alert-destructive" role="alert" style={{ margin: '0 0 10px' }}>
                  <AlertCircle className="ic" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="empty">
                  <span className="spinner" aria-hidden="true" />
                  <span className="small muted">Загрузка уведомлений...</span>
                </div>
              ) : filteredInbox.length === 0 ? (
                <div className="empty">
                  <div className="empty-art">
                    <Bell className="ic ic-40" />
                  </div>
                  <span className="empty-title">
                    {onlyUnread ? 'Непрочитанных нет' : 'Уведомлений пока нет'}
                  </span>
                  <span className="small muted">
                    {onlyUnread
                      ? 'Все входящие события прочитаны'
                      : 'Новые уведомления о записях и визитах появятся здесь автоматически'}
                  </span>
                </div>
              ) : (
                inboxGroups.map((g) => (
                  <div key={g.label} className="col" style={{ gap: '4px', paddingBottom: '10px' }}>
                    <span className="menu-label">{g.label}</span>
                    {g.items.map((n) => {
                      const meta = getNotifMeta(n);
                      const isUnread = !n.readAt;
                      const isSelected = selectedNotification?.id === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={`notif ${isUnread ? 'unread' : ''} ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelectedNotification(n)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: '12px',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: '10px',
                          }}
                        >
                          <span className={`notif-ic ${meta.cls}`} style={{ width: 34, height: 34, flexShrink: 0 }}>
                            {meta.icon}
                          </span>

                          <span className="col" style={{ gap: '3px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                            <div className="row wrap items-center" style={{ gap: '6px' }}>
                              <span
                                className={`sp-chip tone-${meta.tone}`}
                                style={{
                                  fontSize: '11px',
                                  padding: '1px 7px',
                                  height: '19px',
                                  borderRadius: '5px',
                                  fontWeight: 600,
                                }}
                              >
                                {meta.shortType}
                              </span>
                            </div>
                            <span
                              className="notif-title"
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: 'var(--foreground)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {n.title || 'Уведомление'}
                            </span>
                            <span
                              className="notif-body"
                              style={{
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                opacity: 0.85,
                              }}
                            >
                              {n.body || ''}
                            </span>
                          </span>

                          <span className="notif-time" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '11.5px' }}>{n.createdAt ? formatSlotTime(n.createdAt) : ''}</span>
                            {isUnread && <span className="dot accent" style={{ width: 8, height: 8 }} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </>
          ) : (
            // Режим вкладки "Отправленные"
            <>
              {sentMessages.length === 0 ? (
                <div className="empty">
                  <div className="empty-art">
                    <Send className="ic ic-40" />
                  </div>
                  <span className="empty-title">Отправленных сообщений пока нет</span>
                  <span className="small muted">
                    Здесь сохраняется история всех сообщений, которые вы отправили пользователям клиники
                  </span>
                  {onOpenCompose && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '12px' }}
                      onClick={onOpenCompose}
                    >
                      <Mail size={15} />
                      <span>Написать пользователю</span>
                    </button>
                  )}
                </div>
              ) : (
                sentGroups.map((g) => (
                  <div key={g.label} className="col" style={{ gap: '4px', paddingBottom: '10px' }}>
                    <span className="menu-label">{g.label}</span>
                    {g.items.map((m) => {
                      const isSelected = selectedSentMessage?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`notif ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            setSelectedSentMessage(m);
                            onCloseCompose?.();
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: '12px',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: '10px',
                          }}
                        >
                          <span
                            className="notif-ic"
                            style={{
                              width: 34,
                              height: 34,
                              flexShrink: 0,
                              background: 'var(--accent)',
                              color: 'var(--primary)',
                            }}
                          >
                            <Send size={16} />
                          </span>

                          <span className="col" style={{ gap: '3px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                            <div className="row wrap items-center" style={{ gap: '6px' }}>
                              <span
                                className="sp-chip tone-accent"
                                style={{
                                  fontSize: '11px',
                                  padding: '1px 7px',
                                  height: '19px',
                                  borderRadius: '5px',
                                  fontWeight: 600,
                                }}
                              >
                                Кому: {m.recipientName}
                              </span>
                              <UserRoleBadge role={m.recipientRole} short />
                            </div>
                            <span
                              className="notif-title"
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: 'var(--foreground)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {m.title}
                            </span>
                            <span
                              className="notif-body"
                              style={{
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                opacity: 0.85,
                              }}
                            >
                              {m.body}
                            </span>
                          </span>

                          <span className="notif-time" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '11.5px' }}>{m.createdAt ? formatSlotTime(m.createdAt) : ''}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Пагинатор */}
        <div className="island-foot">
          <span className="small muted">
            Показано {activeTab === 'INBOX' ? pageInboxItems.length : pageSentItems.length} из {currentTotal}
          </span>

          {pageCount > 1 && (
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`btn btn-ghost btn-sm ${idx === currentPage ? 'on' : ''}`}
                  onClick={() => setPage(idx)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Правая колонка: Островок отправки сообщения ЛИБО детальный островок (появляется только при выборе или написании) */}
      {isComposing ? (
        <AdminSendMessageIsland
          onClose={() => onCloseCompose?.()}
          onSent={() => {
            setActiveTab('SENT');
            const updated = getAdminSentMessages();
            setSentMessages(updated);
            if (updated.length > 0) {
              setSelectedSentMessage(updated[0]);
            }
            onSentMessage?.();
          }}
        />
      ) : activeTab === 'SENT' && selectedSentMessage ? (
        <AdminSentMessageDetailIsland
          message={selectedSentMessage}
          onClose={() => setSelectedSentMessage(null)}
          onComposeNew={onOpenCompose}
        />
      ) : activeTab === 'INBOX' && selectedNotification ? (
        <NotificationDetailIsland
          notification={selectedNotification}
          role={role}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={handleMarkAsRead}
          onOpenCompose={onOpenCompose}
        />
      ) : null}
    </div>
  );
};
