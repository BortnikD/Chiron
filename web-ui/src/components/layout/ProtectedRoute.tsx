'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { tokenStorage } from '@/shared/api';
import { getHomeByRole } from '@/shared/lib';
import { UserRole } from '@/shared/types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, isLoading, role, authError, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleAuthCheck = () => {
      if (!tokenStorage.get()) {
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
    if (!tokenStorage.get()) {
      if (isAuthenticated) logout();
      router.replace('/login');
      return;
    }

    if (!isLoading && !isAuthenticated && !authError) {
      router.replace('/login');
    } else if (!isLoading && allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(getHomeByRole(role));
    }
  }, [isLoading, isAuthenticated, authError, role, allowedRoles, router, logout, pathname]);

  const isAuthorized = useMemo(() => {
    if (isLoading || !isAuthenticated || !tokenStorage.get()) return false;
    if (allowedRoles && (!role || !allowedRoles.includes(role))) return false;
    return true;
  }, [isLoading, isAuthenticated, role, allowedRoles]);

  if (!isAuthorized) {
    if (!isLoading && authError && tokenStorage.get()) {
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
            padding: '16px',
          }}
        >
          <div className="island dialog dialog-sm" style={{ padding: '20px', gap: '12px' }}>
            <div className="alert alert-destructive" role="alert">
              <AlertCircle className="ic" />
              <span>{authError}</span>
            </div>
            <div className="row between" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  router.replace('/login');
                }}
              >
                Выйти
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => refreshUser()}
              >
                Повторить
              </button>
            </div>
          </div>
        </div>
      );
    }

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
