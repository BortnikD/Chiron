'use client';

import { useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/shared/types';

export interface UseNotificationSocketOptions {
  onNotification?: (notification: AppNotification) => void;
  onConnect?: () => void;
}

export function resolveNotificationWsUrl(): string {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicitWsUrl) {
    return explicitWsUrl;
  }

  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') {
      return `wss://${window.location.host}/ws`;
    }

    const proxyTarget = process.env.NEXT_PUBLIC_API_PROXY_TARGET?.trim();
    if (proxyTarget && (proxyTarget.startsWith('http://') || proxyTarget.startsWith('https://'))) {
      const normalized = proxyTarget.replace(/\/+$/, '');
      const wsBase = normalized.startsWith('https://')
        ? normalized.replace(/^https:\/\//, 'wss://')
        : normalized.replace(/^http:\/\//, 'ws://');
      return `${wsBase}/ws`;
    }

    const host = window.location.hostname || 'localhost';
    return `ws://${host}:8080/ws`;
  }

  return 'ws://localhost:8080/ws';
}

export function useNotificationSocket({
  onNotification,
  onConnect,
}: UseNotificationSocketOptions = {}) {
  const { token, isAuthenticated, role } = useAuth();
  const [connected, setConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);
  const onConnectRef = useRef(onConnect);

  onNotificationRef.current = onNotification;
  onConnectRef.current = onConnect;

  useEffect(() => {
    if (!isAuthenticated || !token || role === 'ADMIN') {
      setConnected(false);
      return;
    }

    const brokerURL = resolveNotificationWsUrl();
    const client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        onConnectRef.current?.();
        client.subscribe('/user/queue/notifications', (message: IMessage) => {
          if (!message.body) return;
          try {
            const notif = JSON.parse(message.body) as AppNotification;
            onNotificationRef.current?.(notif);
            window.dispatchEvent(
              new CustomEvent<AppNotification>('chiron:notification-received', {
                detail: notif,
              })
            );
            window.dispatchEvent(new CustomEvent('chiron:notifications-updated'));
          } catch {
            // Игнорируем некорректный кадр от брокера
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onWebSocketClose: () => {
        setConnected(false);
      },
      onStompError: () => {
        setConnected(false);
        // Ошибки авторизации или подписки STOMP обрабатываются переподключением/HTTP fallback
      },
      onWebSocketError: () => {
        setConnected(false);
        // Ошибки сокета обрабатываются встроенным механизмом reconnectDelay
      },
    });

    client.activate();

    return () => {
      setConnected(false);
      void client.deactivate();
    };
  }, [isAuthenticated, token, role]);

  return { connected };
}
