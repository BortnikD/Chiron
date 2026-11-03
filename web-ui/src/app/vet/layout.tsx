import React from 'react';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';

export default function VetLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['VETERINARIAN']}>{children}</ProtectedRoute>;
}
