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
  Mail,
} from 'lucide-react';
import type { AppNotification, UserRole } from '@/shared/types';
import { getNotifMeta, getNotificationHref } from './notifMeta';
import { formatSlotTime } from '@/shared/lib';

export interface NotificationDetailIslandProps {
  notification: AppNotification | null;
  role?: UserRole | null;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onOpenCompose?: () => void;
}

export const NotificationDetailIsland: React.FC<NotificationDetailIslandProps> = ({
  notification,
  role,
  onClose,
  onMarkRead,
  onOpenCompose,
}) => {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  if (!notification) {
    return (
      <section className="island detail-island" aria-label="Детали уведомления">
        <div className="empty h-full min-h-360 justify-center">
          <div className="empty-art">
            <Bell className="ic ic-40" />
          </div>
          <span className="empty-title">Выберите уведомление</span>
          <span className="small muted max-w-280 text-center">
            Нажмите на любое событие из списка слева, чтобы посмотреть подробный текст, дату и связанные записи
          </span>
          {role === 'ADMIN' && onOpenCompose && (
            <button
              type="button"
              className="btn btn-primary btn-sm mt-md"
              onClick={onOpenCompose}
            >
              <Mail size={15} />
              <span>Написать пользователю</span>
            </button>
          )}
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
    <section className="island detail-island" aria-label="Детали уведомления">
      <button
        type="button"
        className="detail-pinned-close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X className="ic" size={16} />
      </button>

      {/* Шапка островка */}
      <div className="island-head">
        <div className="row items-center gap-lg min-w-0">
          <span className={`notif-ic ${meta.cls} shrink-0`}>
            {meta.icon}
          </span>
          <div className="col gap-1 min-w-0 flex-1">
            <div className="row wrap items-center gap-sm">
              <span className={`sp-chip tone-${meta.tone} sp-chip-compact`}>
                {meta.label}
              </span>
              {isUnread && (
                <span className="notif-new-badge">
                  Новое
                </span>
              )}
            </div>
            <span className="small muted inline-flex items-center gap-xs">
              <Clock size={12} />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Тело островка с подробностями */}
      <div className="island-body col gap-xl p-island">
        {/* Заголовок события */}
        <div className="col gap-sm">
          <span className="menu-label p-0">Тема оповещения</span>
          <h3 className="text-lg font-bold m-0 leading-snug">
            {notification.title || 'Оповещение клиники'}
          </h3>
        </div>

        {/* Полный текст сообщения */}
        <div className="col gap-sm">
          <span className="menu-label p-0">Сообщение</span>
          <div className="detail-message-body">
            {notification.body || 'Текст сообщения отсутствует'}
          </div>
        </div>

        {/* Статус доставки и прочтения */}
        <div className="row wrap between items-center detail-status-bar">
          <span className="muted">Статус прочтения:</span>
          {isUnread ? (
            <span className="inline-flex items-center gap-sm text-primary font-semibold">
              <CircleDot size={14} />
              Не прочитано
            </span>
          ) : (
            <span className="inline-flex items-center gap-sm text-success font-semibold">
              <CheckCheck size={15} />
              Прочитано {formattedReadDate ? `(${formattedReadDate})` : ''}
            </span>
          )}
        </div>

        {/* Связанные сущности (приём, питомец, вакцинация) */}
        {(notification.appointmentId || notification.petId || notification.vaccinationId) && (
          <div className="col gap-md">
            <span className="menu-label p-0">
              {role === 'CLIENT' ? 'Связанная запись' : 'Связанные данные клиники'}
            </span>

            {notification.appointmentId && (
              <div className="row between items-center detail-related-card">
                <div className="row items-center gap-base">
                  <Calendar size={18} className="text-primary flex-none" />
                  <div className="col gap-1">
                    <b className="text-sm">Запись на приём</b>
                    {role !== 'CLIENT' && (
                      <span className="small muted font-mono">ID: {notification.appointmentId.slice(0, 18)}…</span>
                    )}
                  </div>
                </div>
                {href && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleNavigate}
                  >
                    <ExternalLink size={13} />
                    <span>Открыть</span>
                  </button>
                )}
              </div>
            )}

            {notification.petId && (
              <div className="row between items-center detail-related-card">
                <div className="row items-center gap-base">
                  <PawPrint size={18} className="text-primary flex-none" />
                  <div className="col gap-1">
                    <b className="text-sm">
                      {role === 'CLIENT' ? 'Карточка питомца' : 'Пациент клиники'}
                    </b>
                    {role !== 'CLIENT' && (
                      <span className="small muted font-mono">ID: {notification.petId.slice(0, 18)}…</span>
                    )}
                  </div>
                </div>
                {role === 'ADMIN' ? (
                  <Link
                    href={`/admin/pets?sel=${encodeURIComponent(notification.petId)}`}
                    className="btn btn-outline btn-xs"
                  >
                    <ExternalLink size={13} />
                    <span>Карта</span>
                  </Link>
                ) : role === 'CLIENT' ? (
                  <Link
                    href={`/client/pets?sel=${encodeURIComponent(notification.petId)}`}
                    className="btn btn-outline btn-xs"
                  >
                    <ExternalLink size={13} />
                    <span>Карта</span>
                  </Link>
                ) : null}
              </div>
            )}

            {notification.vaccinationId && (
              <div className="row between items-center detail-related-card">
                <div className="row items-center gap-base">
                  <Syringe size={18} className="text-primary flex-none" />
                  <div className="col gap-1">
                    <b className="text-sm">
                      {role === 'CLIENT' ? 'Прививка' : 'Запись вакцинации'}
                    </b>
                    {role !== 'CLIENT' && (
                      <span className="small muted font-mono">ID: {notification.vaccinationId.slice(0, 18)}…</span>
                    )}
                  </div>
                </div>
                {role === 'CLIENT' && (
                  <Link
                    href={`/client/vaccinations?sel=${encodeURIComponent(notification.vaccinationId)}`}
                    className="btn btn-outline btn-xs"
                  >
                    <ExternalLink size={13} />
                    <span>Открыть</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Подвал островка с быстрыми действиями */}
      <div className="island-foot row wrap between gap-base items-center">
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
          <span className="small muted inline-flex items-center gap-xs">
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
