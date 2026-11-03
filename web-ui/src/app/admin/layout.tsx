import React from 'react';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>;
}
