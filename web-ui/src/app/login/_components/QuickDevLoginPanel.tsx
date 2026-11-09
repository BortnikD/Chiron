'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { DevAccount, QuickDevLoginPanelProps } from './types';

export const DEV_ACCOUNTS: DevAccount[] = [
  {
    id: 'client',
    roleName: 'Клиент',
    subTitle: 'И. Соколов · 2 питомца',
    initials: 'ИС',
    email: 'client1@seed.chiron.local',
    password: 'password123',
  },
  {
    id: 'vet',
    roleName: 'Ветеринар',
    subTitle: 'П. Петров · терапевт',
    initials: 'ПП',
    email: 'vet2@seed.chiron.local',
    password: 'password123',
  },
  {
    id: 'admin',
    roleName: 'Администратор',
    subTitle: 'Администратор клиники',
    initials: 'АД',
    email: 'admin@chiron.local',
    password: 'admin123',
  },
];

export function QuickDevLoginPanel({ onQuickLogin, disabled }: QuickDevLoginPanelProps) {
  return (
    <div className="col" style={{ gap: '10px' }}>
      <div className="row between wrap">
        <span className="section-title">Демо-режим — войти как</span>
        <span className="dev-note">только в Dev</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        {DEV_ACCOUNTS.map((acc) => (
          <button
            key={acc.id}
            type="button"
            disabled={disabled}
            onClick={() => onQuickLogin(acc.email, acc.password)}
            className="card clickable"
            style={{ textAlign: 'left', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="row">
              <span className="avatar">{acc.initials}</span>
              <div className="col" style={{ gap: 0 }}>
                <span className="cell-main">{acc.roleName}</span>
                <span className="cell-sub">{acc.subTitle}</span>
              </div>
            </div>
          </button>
        ))}

        <Link
          href="/services"
          className="card clickable"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="row">
            <span className="avatar">
              <ClipboardList className="ic" />
            </span>
            <div className="col" style={{ gap: 0 }}>
              <span className="cell-main">Гость</span>
              <span className="cell-sub">Каталог без входа</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
