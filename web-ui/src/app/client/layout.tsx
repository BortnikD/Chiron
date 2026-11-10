import React from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
