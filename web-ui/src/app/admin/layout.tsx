import React from 'react';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { AppShell } from '../../components/layout/AppShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
