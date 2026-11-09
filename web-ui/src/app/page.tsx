'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '../components/layout/PublicHeader';
import { clinicApi } from '../api';
import { Service, Veterinarian, Specialization } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LandingHeroSection,
  LandingDoctorsSection,
  LandingServicesSection,
  LandingCtaSection,
  LandingFooter,
} from './_components';

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specs, setSpecs] = useState<Specialization[]>([]);

  // Автоматический редирект авторизованного пользователя в соответствующий дашборд
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (role === 'VETERINARIAN') {
        router.replace('/vet/dashboard');
      } else {
        router.replace('/client/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  useEffect(() => {
    Promise.all([
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
    ])
      .then(([svc, vt, sp]) => {
        setServices(Array.isArray(svc) ? svc : []);
        setVets(Array.isArray(vt) ? vt : []);
        setSpecs(Array.isArray(sp) ? sp : []);
      })
      .catch((err) => console.error(err));
  }, []);

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
          <LandingServicesSection services={services} />
          <LandingCtaSection />
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
