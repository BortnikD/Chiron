import React from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

export default function VetLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['VETERINARIAN']}>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
