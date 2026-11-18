'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Syringe,
  ExternalLink,
  Clock,
  CircleDot,
  PawPrint,
} from 'lucide-react';
import type { AppNotification, UserRole } from '@/shared/types';
import { getNotifMeta, getNotificationHref } from './notifMeta';
import { formatSlotTime } from '@/shared/lib';

export interface NotificationDetailIslandProps {
  notification: AppNotification | null;
  role?: UserRole | null;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
}

export const NotificationDetailIsland: React.FC<NotificationDetailIslandProps> = ({
  notification,
  role,
  onClose,
  onMarkRead,
}) => {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  if (!notification) {
    return (
      <section className="island detail-island" style={{ width: 420 }} aria-label="Детали уведомления">
        <div className="empty" style={{ height: '100%', minHeight: '360px', justifyContent: 'center' }}>
          <div className="empty-art">
            <Bell className="ic ic-40" />
          </div>
          <span className="empty-title">Выберите уведомление</span>
          <span className="small muted" style={{ maxWidth: '280px', textAlign: 'center' }}>
            Нажмите на любое событие из списка слева, чтобы посмотреть подробный текст, дату и связанные записи
          </span>
        </div>
      </section>
    );
  }

  const meta = getNotifMeta(notification);
  const href = getNotificationHref(notification, role);
  const isUnread = !notification.readAt;

  const handleMarkAsReadClick = async () => {
    if (!isUnread || marking) return;
    setMarking(true);
    try {
      await onMarkRead(notification.id);
    } finally {
      setMarking(false);
    }
  };

  const handleNavigate = () => {
    if (href) {
      if (isUnread) {
        void onMarkRead(notification.id);
      }
      router.push(href);
    }
  };

  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const formattedReadDate = notification.readAt
    ? new Date(notification.readAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="island detail-island" style={{ width: 420 }} aria-label="Детали уведомления">
      {/* Шапка островка */}
      <div className="island-head">
        <div className="row" style={{ alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span className={`notif-ic ${meta.cls}`} style={{ flexShrink: 0 }}>
            {meta.icon}
          </span>
          <div className="col" style={{ gap: '3px', minWidth: 0, flex: 1 }}>
            <div className="row wrap items-center" style={{ gap: '6px' }}>
              <span
                className={`sp-chip tone-${meta.tone}`}
                style={{
                  fontSize: '11.5px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {meta.label}
              </span>
              {isUnread && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  Новое
                </span>
              )}
            </div>
            <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {formattedDate}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="ic" size={16} />
        </button>
      </div>

      {/* Тело островка с подробностями */}
      <div className="island-body col" style={{ gap: '18px', padding: '16px 20px' }}>
        {/* Заголовок события */}
        <div className="col" style={{ gap: '6px' }}>
          <span className="menu-label" style={{ padding: 0 }}>Тема оповещения</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
            {notification.title || 'Оповещение клиники'}
          </h3>
        </div>

        {/* Полный текст сообщения */}
        <div className="col" style={{ gap: '6px' }}>
          <span className="menu-label" style={{ padding: 0 }}>Сообщение</span>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'color-mix(in srgb, var(--card) 60%, var(--muted))',
              border: '1px solid var(--border)',
              fontSize: '14px',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {notification.body || 'Текст сообщения отсутствует'}
          </div>
        </div>

        {/* Статус доставки и прочтения */}
        <div
          className="row wrap between items-center"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'color-mix(in srgb, var(--muted) 45%, transparent)',
            fontSize: '13px',
          }}
        >
          <span className="muted">Статус прочтения:</span>
          {isUnread ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              <CircleDot size={14} />
              Не прочитано
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--success, #22c55e)',
                fontWeight: 600,
              }}
            >
              <CheckCheck size={15} />
              Прочитано {formattedReadDate ? `(${formattedReadDate})` : ''}
            </span>
          )}
        </div>

        {/* Связанные сущности (приём, питомец, вакцинация) */}
        {(notification.appointmentId || notification.petId || notification.vaccinationId) && (
          <div className="col" style={{ gap: '8px' }}>
            <span className="menu-label" style={{ padding: 0 }}>Связанные данные клиники</span>

            {notification.appointmentId && (
              <div
                className="row between items-center"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'color-mix(in srgb, var(--card) 85%, transparent)',
                }}
              >
                <div className="row items-center" style={{ gap: '10px' }}>
                  <Calendar size={18} className="text-primary" />
                  <div className="col" style={{ gap: '2px' }}>
                    <b style={{ fontSize: '13.5px' }}>Запись на приём</b>
                    <span className="small muted font-mono">ID: {notification.appointmentId.slice(0, 18)}…</span>
                  </div>
                </div>
                {href && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleNavigate}
                  >
                    <ExternalLink size={13} />
                    Открыть
                  </button>
                )}
              </div>
            )}

            {notification.petId && (
              <div
                className="row between items-center"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'color-mix(in srgb, var(--card) 85%, transparent)',
                }}
              >
                <div className="row items-center" style={{ gap: '10px' }}>
                  <PawPrint size={18} className="text-primary" />
                  <div className="col" style={{ gap: '2px' }}>
                    <b style={{ fontSize: '13.5px' }}>Пациент клиники</b>
                    <span className="small muted font-mono">ID: {notification.petId.slice(0, 18)}…</span>
                  </div>
                </div>
                {role === 'ADMIN' && (
                  <Link
                    href={`/admin/pets?sel=${encodeURIComponent(notification.petId)}`}
                    className="btn btn-outline btn-xs"
                  >
                    <ExternalLink size={13} />
                    Карта
                  </Link>
                )}
              </div>
            )}

            {notification.vaccinationId && (
              <div
                className="row between items-center"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'color-mix(in srgb, var(--card) 85%, transparent)',
                }}
              >
                <div className="row items-center" style={{ gap: '10px' }}>
                  <Syringe size={18} className="text-primary" />
                  <div className="col" style={{ gap: '2px' }}>
                    <b style={{ fontSize: '13.5px' }}>Запись вакцинации</b>
                    <span className="small muted font-mono">ID: {notification.vaccinationId.slice(0, 18)}…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Подвал островка с быстрыми действиями */}
      <div className="island-foot row wrap between" style={{ gap: '10px', alignItems: 'center' }}>
        {isUnread ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleMarkAsReadClick}
            disabled={marking}
          >
            <Check size={14} />
            {marking ? 'Отмечаем...' : 'Отметить прочитанным'}
          </button>
        ) : (
          <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCheck size={14} className="text-success" /> Прочитано
          </span>
        )}

        {href && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleNavigate}
          >
            <ExternalLink size={14} />
            Перейти к записи
          </button>
        )}
      </div>
    </section>
  );
};
