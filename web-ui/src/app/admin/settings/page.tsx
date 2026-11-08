'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { AppSettingsView } from '../../../components/settings/AppSettingsView';

export default function AdminSettingsPage() {
  return (
    <AppShell title="Настройки">
      <div className="scroll-col grow">
        <AppSettingsView />
      </div>
    </AppShell>
  );
}
