'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { getHomeByRole } from '@/shared/lib';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLandingData } from './_hooks/useLandingData';
import { LandingHeroSection } from './_components/LandingHeroSection';
import { LandingDoctorsSection } from './_components/LandingDoctorsSection';
import { LandingServicesSection } from './_components/LandingServicesSection';
import { LandingCtaSection } from './_components/LandingCtaSection';
import { LandingFooter } from './_components/LandingFooter';

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();
  const { services, vets, specs, error } = useLandingData();

  // Автоматический редирект авторизованного пользователя в соответствующий дашборд
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      router.replace(getHomeByRole(role));
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (!isLoading && isAuthenticated) {
    return (
      <div
        className="app"
        data-theme={resolvedTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
          <span className="small muted">Перенаправление в личный кабинет...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app" data-theme={resolvedTheme} style={{ flexDirection: 'column' }}>
      {/* Шапка гостевого интерфейса */}
      <PublicHeader />

      {/* Основной контент страницы «О клинике» */}
      <div className="content-row">
        <div className="scroll-col grow">
          <LandingHeroSection
            vetsCount={vets.length}
            specsCount={specs.length}
            servicesCount={services.length}
          />
          <LandingDoctorsSection vets={vets} specializations={specs} />
          <LandingServicesSection services={services} specializations={specs} error={error} />
          <LandingCtaSection />
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
