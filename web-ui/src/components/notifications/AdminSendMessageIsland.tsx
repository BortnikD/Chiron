'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, Search, User as UserIcon, ChevronDown } from 'lucide-react';
import { adminApi } from '@/modules/admin/api';
import { saveAdminSentMessage } from '@/modules/admin/sentMessagesStore';
import { UserRoleBadge } from '@/shared/components';
import { formatUserFullName } from '@/shared/lib';
import type { User } from '@/shared/types';

export interface AdminSendMessageIslandProps {
  onClose: () => void;
  onSent?: () => void;
}

export function AdminSendMessageIsland({
  onClose,
  onSent,
}: AdminSendMessageIslandProps) {
  const [recipientId, setRecipientId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [debouncedQuery, setDebouncedQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Server-side search with debounce and abort controller
  useEffect(() => {
    const abortController = new AbortController();
    setLoadingUsers(true);

    adminApi
      .getUsers(
        0,
        50,
        debouncedQuery ? { search: debouncedQuery } : undefined,
        { signal: abortController.signal }
      )
      .then((res) => {
        setUsers(res.items || []);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError' && !abortController.signal.aborted) {
          // ignore or keep previous
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoadingUsers(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 30);

    const matches = users.filter((u) => {
      const fn = (u.firstName || '').toLowerCase();
      const ln = (u.lastName || '').toLowerCase();
      const em = (u.email || '').toLowerCase();
      const ph = (u.phone || '').toLowerCase();
      const roleStr =
        u.role === 'VETERINARIAN'
          ? 'врач veterinarian'
          : u.role === 'ADMIN'
          ? 'админ администратор admin'
          : 'клиент client';

      return (
        fn.includes(q) ||
        ln.includes(q) ||
        `${ln} ${fn}`.includes(q) ||
        `${fn} ${ln}`.includes(q) ||
        em.includes(q) ||
        ph.includes(q) ||
        roleStr.includes(q)
      );
    });

    return matches.sort((a, b) => {
      const aEmail = (a.email || '').toLowerCase();
      const bEmail = (b.email || '').toLowerCase();
      const aExact = aEmail === q || aEmail.startsWith(q + '@');
      const bExact = bEmail === q || bEmail.startsWith(q + '@');
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
  }, [users, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId) {
      setError('Выберите пользователя-получателя');
      return;
    }
    if (!title.trim()) {
      setError('Укажите тему сообщения');
      return;
    }
    if (!body.trim()) {
      setError('Введите текст сообщения');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await adminApi.sendNotification(recipientId, {
        title: title.trim(),
        body: body.trim(),
      });

      saveAdminSentMessage({
        id: (res as any)?.id || String(Date.now()),
        recipientId,
        recipientName: selectedUser ? formatUserFullName(selectedUser) : 'Пользователь',
        recipientEmail: selectedUser?.email,
        recipientPhone: selectedUser?.phone,
        recipientRole: selectedUser?.role,
        title: title.trim(),
        body: body.trim(),
        createdAt: (res as any)?.createdAt || new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSent?.();
      }, 1000);
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || 'Не удалось отправить сообщение';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="island detail-island" aria-label="Написать сообщение">
      <button
        type="button"
        className="detail-pinned-close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>

      <div className="island-head">
        <span className="island-title">
          <Mail className="ic text-primary" size={18} />
          <span>Написать пользователю</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="form-vertical">
        <div className="island-body p-island col gap-lg">
          {error && (
            <div className="alert alert-destructive small" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success small" role="alert">
              <CheckCircle2 size={15} />
              <span>Сообщение успешно отправлено в личный кабинет пользователя!</span>
            </div>
          )}

          {/* Выбор получателя */}
          <div className="col gap-xs">
            <label htmlFor="island-recipient-search" className="small font-semibold">
              Получатель <span className="text-danger">*</span>
            </label>

            {selectedUser ? (
              <div className="selected-recipient-card">
                <div className="row middle gap-md min-w-0">
                  <div className="initial-avatar-sm">
                    {(selectedUser.firstName?.[0] || selectedUser.email?.[0] || 'П').toUpperCase()}
                  </div>
                  <div className="col gap-1 min-w-0">
                    <div className="row middle gap-xs">
                      <span className="text-sm font-semibold">
                        {formatUserFullName(selectedUser)}
                      </span>
                      <UserRoleBadge role={selectedUser.role} short />
                    </div>
                    <span className="small muted text-2xs">
                      {[selectedUser.phone, selectedUser.email].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm flex-none"
                  onClick={() => {
                    setSelectedUser(null);
                    setRecipientId('');
                    setSearchQuery('');
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  title="Выбрать другого получателя"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div ref={dropdownRef} className="pos-rel">
                <div className="row middle pos-rel">
                  <Search
                    size={15}
                    className="text-muted pos-abs-l"
                  />
                  <input
                    ref={inputRef}
                    id="island-recipient-search"
                    type="text"
                    className="input sm search-input-with-icon"
                    placeholder="Имя, телефон или email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    autoComplete="off"
                  />

                  {searchQuery ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm pos-abs-btn"
                      onClick={() => {
                        setSearchQuery('');
                        inputRef.current?.focus();
                      }}
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <ChevronDown
                      size={14}
                      className="text-muted pos-abs-r"
                    />
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="dropdown-menu-island">
                    {loadingUsers && filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted">
                        Поиск пользователей...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted">
                        Пользователь не найден
                      </div>
                    ) : (
                      <>
                        {loadingUsers && (
                          <div className="p-1 text-xs text-primary border-b">
                            Обновление списка...
                          </div>
                        )}
                        {filteredUsers.map((u) => {
                          const name = formatUserFullName(u);
                          return (
                            <div
                              key={u.id}
                              className="dropdown-item-user"
                              onClick={() => {
                                setSelectedUser(u);
                                setRecipientId(String(u.id));
                                setIsDropdownOpen(false);
                                setError(null);
                              }}
                            >
                              <div className="col gap-1 min-w-0">
                                <div className="row middle gap-xs">
                                  <span className="text-sm font-semibold">{name}</span>
                                  <UserRoleBadge role={u.role} short />
                                </div>
                                <span className="small muted text-2xs">
                                  {[u.phone, u.email].filter(Boolean).join(' · ')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Тема сообщения */}
          <div className="col gap-xs">
            <label htmlFor="island-notif-title" className="small font-semibold">
              Тема сообщения <span className="text-danger">*</span>
            </label>
            <input
              id="island-notif-title"
              type="text"
              className="input sm"
              placeholder="Например: Изменение времени приёма"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Текст сообщения */}
          <div className="col gap-xs">
            <label htmlFor="island-notif-body" className="small font-semibold">
              Текст сообщения <span className="text-danger">*</span>
            </label>
            <textarea
              id="island-notif-body"
              className="input textarea-message"
              rows={6}
              placeholder="Введите текст сообщения..."
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <span className="small muted text-right text-2xs">
              {body.length} / 4000
            </span>
          </div>
        </div>

        <div className="island-foot p-island border-t row justify-end gap-md">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting || success || !recipientId}
          >
            <Send size={14} />
            <span>{submitting ? 'Отправка...' : 'Отправить'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
