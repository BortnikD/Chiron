'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { UserProfileCard } from '../../../components/profile/UserProfileCard';

export default function AdminProfilePage() {
  return (
    <AppShell title="Профиль">
      <div className="scroll-col grow">
        <UserProfileCard />
      </div>
    </AppShell>
  );
}
