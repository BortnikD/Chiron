'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === 'ADMIN') router.push('/admin/dashboard');
      else if (role === 'VETERINARIAN') router.push('/vet/dashboard');
      else router.push('/client/dashboard');
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router]);

  if (isLoading || !isAuthenticated || (allowedRoles && role && !allowedRoles.includes(role))) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
