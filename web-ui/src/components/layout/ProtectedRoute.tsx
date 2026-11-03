'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { tokenStorage } from '../../api/client';
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
  const { isAuthenticated, isLoading, role, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // BFCache (Back/Forward Cache) защита: при нажатии кнопки «Назад» в браузере
  useEffect(() => {
    const handleAuthCheck = () => {
      const token = tokenStorage.get();
      if (!token) {
        logout();
        window.location.replace('/login');
      }
    };

    window.addEventListener('pageshow', handleAuthCheck);
    window.addEventListener('storage', handleAuthCheck);
    return () => {
      window.removeEventListener('pageshow', handleAuthCheck);
      window.removeEventListener('storage', handleAuthCheck);
    };
  }, [logout]);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      if (isAuthenticated) logout();
      router.replace('/login');
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === 'ADMIN') router.replace('/admin/dashboard');
      else if (role === 'VETERINARIAN') router.replace('/vet/dashboard');
      else router.replace('/client/dashboard');
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router, logout, pathname]);

  const isAuthorized = useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated || !tokenStorage.get()) return false;
    if (allowedRoles && (!role || !allowedRoles.includes(role))) return false;
    return true;
  }, [isLoading, isAuthenticated, role, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
