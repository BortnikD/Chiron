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
        <div className="empty" style={{ height: '100%', minHeight: '360px', justifyContent: 'center' }}>
          <div className="empty-art">
            <Send className="ic ic-40" />
          </div>
          <span className="empty-title">Выберите отправленное сообщение</span>
          <span className="small muted" style={{ maxWidth: '280px', textAlign: 'center' }}>
            Нажмите на любое сообщение из списка слева, чтобы посмотреть текст и данные получателя
          </span>
          {onComposeNew && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px' }}
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
      {/* Шапка островка */}
      <div className="island-head">
        <div className="row middle" style={{ gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--primary)',
              flex: 'none',
            }}
          >
            <Send size={16} />
          </div>
          <div className="col" style={{ gap: '2px', minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '13.5px' }}>Отправленное сообщение</span>
            <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <Clock size={11} />
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
          <X size={16} />
        </button>
      </div>

      {/* Тело островка */}
      <div
        className="island-body"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {/* Карточка получателя */}
        <div className="col" style={{ gap: '6px' }}>
          <span className="small muted" style={{ fontWeight: 600 }}>
            Получатель сообщения
          </span>
          <div
            className="row middle"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--card)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
                border: '1px solid var(--border)',
                color: 'var(--primary)',
                flex: 'none',
              }}
            >
              {initialLetter}
            </div>
            <div className="col" style={{ gap: '2px', minWidth: 0, flex: 1 }}>
              <div className="row middle" style={{ gap: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{message.recipientName}</span>
                <UserRoleBadge role={message.recipientRole} short />
              </div>
              <div className="row wrap middle muted" style={{ gap: '8px', fontSize: '11px' }}>
                {message.recipientPhone && (
                  <span className="row middle" style={{ gap: '4px' }}>
                    <Phone size={11} />
                    {message.recipientPhone}
                  </span>
                )}
                {message.recipientEmail && (
                  <span className="row middle" style={{ gap: '4px' }}>
                    <Mail size={11} />
                    {message.recipientEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Тема */}
        <div className="col" style={{ gap: '4px' }}>
          <span className="small muted">Тема сообщения</span>
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: 600,
              color: 'var(--foreground)',
              padding: '8px 10px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            {message.title}
          </div>
        </div>

        {/* Текст */}
        <div className="col" style={{ gap: '4px', flex: 1 }}>
          <span className="small muted">Текст сообщения</span>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--foreground)',
              minHeight: '80px',
            }}
          >
            {message.body}
          </div>
        </div>

        {/* Статус доставки */}
        <div
          className="row middle"
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            gap: '8px',
            color: 'var(--primary)',
            fontSize: '12px',
          }}
        >
          <CheckCheck size={16} />
          <span>Доставлено в личный кабинет получателя</span>
        </div>
      </div>

      {/* Подвал островка */}
      {onComposeNew && (
        <div className="island-foot" style={{ padding: '12px 16px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
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
