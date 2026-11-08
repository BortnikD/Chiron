'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { userApi } from '../../api';
import { Sun, Moon, Monitor, Check, Lock, Info, ChevronRight, X, AlertCircle } from 'lucide-react';

export const AppSettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  // Порядок тем в строгом соответствии с прототипом: Системная -> Светлая -> Тёмная
  const themes: { id: Theme; label: string; icon: React.ReactNode; previewCls: string }[] = [
    {
      id: 'system',
      label: 'Системная',
      icon: <Monitor className="ic" style={{ width: '16px', height: '16px' }} />,
      previewCls: 'tp-i-monitor',
    },
    {
      id: 'light',
      label: 'Светлая',
      icon: <Sun className="ic" style={{ width: '16px', height: '16px' }} />,
      previewCls: 'tp-i-sun',
    },
    {
      id: 'dark',
      label: 'Тёмная',
      icon: <Moon className="ic" style={{ width: '16px', height: '16px' }} />,
      previewCls: 'tp-i-moon',
    },
  ];

  // Состояние модального окна смены пароля
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать не менее 8 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    setPasswordSaving(true);
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Пароль успешно изменён');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Не удалось изменить пароль. Проверьте правильность текущего пароля.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="set-grid">
      {/* 1. Оформление (во всю ширину) */}
      <section className="island set-span">
        <div className="island-head">
          <span className="island-title">
            <Sun className="ic" />
            Оформление
          </span>
          <span className="small muted">Выбор запоминается на этом устройстве</span>
        </div>
        <div className="island-body" style={{ paddingTop: 0 }}>
          <div className="theme-tiles">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-tile ${isSelected ? 'sel on' : ''}`}
                  onClick={() => setTheme(t.id)}
                  aria-pressed={isSelected}
                >
                  <span className={`theme-prev ${t.previewCls}`}>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="row" style={{ gap: '8px', alignItems: 'center' }}>
                    {t.icon}
                    <span className="cell-main grow" style={{ textAlign: 'left', fontSize: '13px' }}>
                      {t.label}
                    </span>
                    {isSelected && (
                      <span className="tcard-check">
                        <Check className="ic" style={{ strokeWidth: 3 }} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="small muted" style={{ display: 'block', marginTop: '10px' }}>
            «Системная» повторяет тему операционной системы.
          </span>
        </div>
      </section>

      {/* 2. Безопасность */}
      <section className="island">
        <div className="island-head">
          <span className="island-title">
            <Lock className="ic" />
            Безопасность
          </span>
        </div>
        <div className="island-body set-list" style={{ paddingTop: 0 }}>
          <div className="set-row">
            <span className="col grow" style={{ gap: '2px' }}>
              <b>Пароль</b>
              <span className="small muted">Обновление пароля учётной записи</span>
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setPasswordModalOpen(true);
                setPasswordError(null);
                setPasswordSuccess(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Изменить
            </button>
          </div>
          <div className="set-row">
            <span className="col grow" style={{ gap: '2px' }}>
              <b>Сессия</b>
              <span className="small muted">Токен действует 30 дней</span>
            </span>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </section>

      {/* 3. О приложении */}
      <section className="island">
        <div className="island-head">
          <span className="island-title">
            <Info className="ic" />
            О приложении
          </span>
        </div>
        <div className="island-body set-list" style={{ paddingTop: 0 }}>
          <Link className="set-row set-link" href="/services">
            <span className="col grow" style={{ gap: '2px' }}>
              <b>О клинике Chiron</b>
              <span className="small muted">Врачи, направления, популярные услуги</span>
            </span>
            <ChevronRight className="ic" />
          </Link>
          <div className="set-row">
            <span className="col grow" style={{ gap: '2px' }}>
              <b>Версия</b>
              <span className="small muted">Прототип интерфейса · 2026.10</span>
            </span>
          </div>
        </div>
      </section>

      {/* Модальное окно смены пароля */}
      {passwordModalOpen && (
        <div className="overlay" onClick={() => setPasswordModalOpen(false)}>
          <div
            className="dialog dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Смена пароля"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <div className="row between" style={{ alignItems: 'center' }}>
                <span className="dialog-title row" style={{ gap: '8px', alignItems: 'center' }}>
                  <Lock className="ic" style={{ width: '18px', height: '18px' }} />
                  <span>Смена пароля</span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setPasswordModalOpen(false)}
                  aria-label="Закрыть"
                >
                  <X className="ic" style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <span className="dialog-desc">
                Введите текущий пароль и новый пароль (не менее 8 символов)
              </span>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="dialog-body">
                {passwordError && (
                  <div
                    className="alert"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle className="ic" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div
                    className="alert"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#22c55e',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Check className="ic" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="cur-pass">
                    Текущий пароль <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    id="cur-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Введите текущий пароль"
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="new-pass">
                    Новый пароль <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Не менее 8 символов"
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="conf-pass">
                    Повторите новый пароль <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Повторите новый пароль"
                  />
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={passwordSaving}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Сохранение...' : 'Обновить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
