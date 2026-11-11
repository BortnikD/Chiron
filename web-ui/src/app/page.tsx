'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLandingData } from './_hooks/useLandingData';
import { LandingHeroSection } from './_components/LandingHeroSection';
import { LandingServicesSection } from './_components/LandingServicesSection';
import { LandingCtaSection } from './_components/LandingCtaSection';
import { LandingFooter } from './_components/LandingFooter';

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, role } = useAuth();
  const { services, vets, specs, species, loading, error, reload } = useLandingData();

  const activeVetsCount = vets.filter((v) => v.isActive !== false).length;
  const activeServicesCount = services.filter((s) => s.isActive !== false).length;

  return (
    <div className="app" data-theme={resolvedTheme} style={{ flexDirection: 'column' }}>
      <PublicHeader />

      <div className="content-row">
        <div className="scroll-col grow">
          {error && (
            <div className="alert" role="alert" style={{ flex: 'none' }}>
              <AlertCircle className="ic" />
              <div className="row between wrap grow" style={{ gap: '8px' }}>
                <span>{error}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
                  Повторить
                </button>
              </div>
            </div>
          )}
          <LandingHeroSection
            vetsCount={activeVetsCount}
            specsCount={specs.length}
            servicesCount={activeServicesCount}
            speciesCount={species.length}
            loading={loading}
            isAuthenticated={isAuthenticated}
            role={role}
          />
          <LandingServicesSection
            services={services}
            vets={vets}
            specializations={specs}
            isAuthenticated={isAuthenticated}
          />
          <LandingCtaSection />
          <LandingFooter isAuthenticated={isAuthenticated} role={role} />
        </div>
      </div>
    </div>
  );
}
