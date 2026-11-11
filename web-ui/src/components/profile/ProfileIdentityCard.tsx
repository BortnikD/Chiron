'use client';

import React from 'react';
import { Phone, Calendar } from 'lucide-react';
import { PhotoAvatar } from '@/components/ui/EntityAvatar';
import type { PhotoEntity } from '@/shared/lib';

export interface ProfileStatItem {
  val: string | number;
  label: string;
}

export interface ProfileStats {
  s1: ProfileStatItem;
  s2: ProfileStatItem;
  s3: ProfileStatItem;
}

export interface SecondaryBadge {
  label: string;
  tone?: string;
}

interface ProfileIdentityCardProps {
  roleClass: string;
  initials: string;
  photo?: PhotoEntity | null;
  fullName: string;
  email: string;
  phone: string;
  roleBadgeLabel: string;
  secondaryBadge?: SecondaryBadge | null;
  regDateLabel: string;
  stats: ProfileStats;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({
  roleClass,
  initials,
  photo,
  fullName,
  email,
  phone,
  roleBadgeLabel,
  secondaryBadge,
  regDateLabel,
  stats,
}) => {
  return (
    <section className={`island idcard ${roleClass}`}>
      <PhotoAvatar
        photo={photo}
        alt={fullName}
        className="t-ava xl round"
        variant="full"
        fallback={initials}
      />

      <span className="col" style={{ gap: '2px' }}>
        <span className="idcard-name">{fullName}</span>
        <span className="cell-sub">{email}</span>
      </span>

      {secondaryBadge ? (
        <span className="row wrap" style={{ gap: '6px', justifyContent: 'center' }}>
          <span className="t-badge">{roleBadgeLabel}</span>
          <span className={`t-badge ${secondaryBadge.tone ? `tone-${secondaryBadge.tone}` : ''}`}>
            {secondaryBadge.label}
          </span>
        </span>
      ) : (
        <span className="t-badge">{roleBadgeLabel}</span>
      )}

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
