'use client';

import React from 'react';
import {
  X,
  Send,
  Clock,
  CheckCheck,
  User as UserIcon,
  Mail,
  Phone,
} from 'lucide-react';
import { UserRoleBadge } from '@/shared/components';
import type { AdminSentMessage } from '@/modules/admin/sentMessagesStore';

export interface AdminSentMessageDetailIslandProps {
  message: AdminSentMessage | null;
  onClose: () => void;
  onComposeNew?: () => void;
}

export function AdminSentMessageDetailIsland({
  message,
  onClose,
  onComposeNew,
}: AdminSentMessageDetailIslandProps) {
  if (!message) {
    return (
      <section className="island detail-island" aria-label="Детали сообщения">
        <div className="empty h-full min-h-360 justify-center">
          <div className="empty-art">
            <Send className="ic ic-40" />
          </div>
          <span className="empty-title">Выберите отправленное сообщение</span>
          <span className="small muted max-w-280 text-center">
            Нажмите на любое сообщение из списка слева, чтобы посмотреть текст и данные получателя
          </span>
          {onComposeNew && (
            <button
              type="button"
              className="btn btn-primary btn-sm mt-md"
              onClick={onComposeNew}
            >
              <Mail size={15} />
              <span>Написать пользователю</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  const formattedDate = message.createdAt
    ? new Date(message.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const initialLetter = (message.recipientName?.[0] || message.recipientEmail?.[0] || 'П').toUpperCase();

  return (
    <section className="island detail-island" aria-label="Детали отправленного сообщения">
      <button
        type="button"
        className="detail-pinned-close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>

      {/* Шапка островка */}
      <div className="island-head">
        <div className="row middle gap-base min-w-0">
          <div className="notif-ic bg-accent text-primary">
            <Send size={16} />
          </div>
          <div className="col gap-xs min-w-0">
            <span className="text-sm font-semibold">Отправленное сообщение</span>
            <span className="small muted inline-flex items-center gap-xs text-xs">
              <Clock size={11} />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Тело островка */}
      <div className="island-body p-island col gap-xl">
        {/* Карточка получателя */}
        <div className="col gap-sm">
          <span className="small muted font-semibold">
            Получатель сообщения
          </span>
          <div className="row middle p-2 gap-base bg-muted border rounded-lg">
            <div className="initial-avatar">
              {initialLetter}
            </div>
            <div className="col gap-xs min-w-0 flex-1">
              <div className="row middle gap-sm">
                <span className="text-sm font-semibold">{message.recipientName}</span>
                <UserRoleBadge role={message.recipientRole} short />
              </div>
              <div className="row wrap middle muted gap-md text-xs">
                {message.recipientPhone && (
                  <span className="row middle gap-xs">
                    <Phone size={11} />
                    {message.recipientPhone}
                  </span>
                )}
                {message.recipientEmail && (
                  <span className="row middle gap-xs">
                    <Mail size={11} />
                    {message.recipientEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Тема */}
        <div className="col gap-xs">
          <span className="small muted">Тема сообщения</span>
          <div className="message-subject-box">
            {message.title}
          </div>
        </div>

        {/* Текст */}
        <div className="col gap-xs flex-1">
          <span className="small muted">Текст сообщения</span>
          <div className="message-content-box">
            {message.body}
          </div>
        </div>

        {/* Статус доставки */}
        <div className="row middle delivery-status-banner">
          <CheckCheck size={16} />
          <span>Доставлено в личный кабинет получателя</span>
        </div>
      </div>

      {/* Подвал островка */}
      {onComposeNew && (
        <div className="island-foot p-sm">
          <button
            type="button"
            className="btn btn-primary btn-sm w-full justify-center"
            onClick={onComposeNew}
          >
            <Mail size={15} />
            <span>Написать ещё сообщение</span>
          </button>
        </div>
      )}
    </section>
  );
}
