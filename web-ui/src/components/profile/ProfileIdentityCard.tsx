'use client';

import React from 'react';
import { Phone, Calendar } from 'lucide-react';

export interface ProfileStatItem {
  val: string | number;
  label: string;
}

export interface ProfileStats {
  s1: ProfileStatItem;
  s2: ProfileStatItem;
  s3: ProfileStatItem;
}

interface ProfileIdentityCardProps {
  roleClass: string;
  initials: string;
  fullName: string;
  email: string;
  phone: string;
  roleBadgeLabel: string;
  regDateLabel: string;
  stats: ProfileStats;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({
  roleClass,
  initials,
  fullName,
  email,
  phone,
  roleBadgeLabel,
  regDateLabel,
  stats,
}) => {
  return (
    <section className={`island idcard ${roleClass}`}>
      <span className="t-ava xl round">{initials}</span>

      <span className="col" style={{ gap: '2px' }}>
        <span className="idcard-name">{fullName}</span>
        <span className="cell-sub">{email}</span>
      </span>

      <span className="t-badge">{roleBadgeLabel}</span>

      <div className="idcard-kv">
        <div>
          <Phone className="ic" />
          <span>{phone}</span>
        </div>
        <div>
          <Calendar className="ic" />
          <span>В Chiron с {regDateLabel}</span>
        </div>
      </div>

      <div className="idcard-stats">
        <div>
          <b>{stats.s1.val}</b>
          <span>{stats.s1.label}</span>
        </div>
        <div>
          <b>{stats.s2.val}</b>
          <span>{stats.s2.label}</span>
        </div>
        <div>
          <b>{stats.s3.val}</b>
          <span>{stats.s3.label}</span>
        </div>
      </div>
    </section>
  );
};
