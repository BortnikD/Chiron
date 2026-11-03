import React from 'react';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['CLIENT']}>{children}</ProtectedRoute>;
}
