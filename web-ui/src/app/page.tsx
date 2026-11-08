'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '../components/layout/PublicHeader';
import { clinicApi } from '../api';
import { Service, Veterinarian, Specialization } from '../types';
import { HeroIllustration } from '../components/home/HeroIllustration';
import { SpeciesIcon } from '../components/ui/SpeciesIcon';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  ChevronRight,
  Stethoscope,
  ClipboardList,
  CalendarPlus,
  ShieldCheck,
  Phone,
} from 'lucide-react';

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

  // Направления клиники (согласно прототипу Guest.html)
  const defaultSpecs = [
    { id: 'ther', name: 'Терапия', who: 'И. И. Петров' },
    { id: 'surg', name: 'Хирургия', who: 'М. А. Соколова' },
    { id: 'dent', name: 'Стоматология', who: 'О. В. Ким' },
    { id: 'derm', name: 'Дерматология', who: 'Е. П. Морозова' },
    { id: 'opht', name: 'Офтальмология', who: 'А. С. Белов' },
    { id: 'prev', name: 'Профилактика', who: 'Н. И. Орлова' },
  ];

  // Популярные услуги (согласно прототипу Guest.html)
  const popularOffers = [
    {
      spec: 'ther',
      specName: 'Терапия',
      name: 'Первичный осмотр',
      desc: 'Осмотр, сбор анамнеза, план обследования и лечения.',
      dur: 30,
      price: '1 500 ₽',
      serviceId: services.find((s) => s.name.toLowerCase().includes('осмотр') || s.name.toLowerCase().includes('check-up'))?.id,
    },
    {
      spec: 'surg',
      specName: 'Хирургия',
      name: 'Стерилизация и кастрация',
      desc: 'Плановые операции под ингаляционным наркозом с мониторингом.',
      dur: 60,
      price: '4 500 ₽',
      serviceId: services.find((s) => s.name.toLowerCase().includes('spaying') || s.name.toLowerCase().includes('стерил'))?.id,
    },
    {
      spec: 'dent',
      specName: 'Стоматология',
      name: 'Ультразвуковая чистка зубов',
      desc: 'Снятие зубного камня, полировка, санация ротовой полости.',
      dur: 40,
      price: '3 000 ₽',
      serviceId: services.find((s) => s.name.toLowerCase().includes('teeth') || s.name.toLowerCase().includes('чистк'))?.id,
    },
  ];

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
          {/* Главный Hero-баннер с иллюстрацией */}
          <section className="island ab-hero" style={{ flex: 'none' }}>
            <div className="ab-hero-text">
              <span className="hm-date">
                ВЕТЕРИНАРНАЯ КЛИНИКА · РОСТОВ-НА-ДОНУ · +7 863 200-10-00
              </span>
              <h1 className="ab-title">
                Забота о питомце —<br />
                <span>от первого осмотра до ревакцинации</span>
              </h1>
              <p className="ab-lead">
                Chiron — клиника и онлайн-кабинет в одном. Выбирайте врача и свободное время,
                храните историю приёмов и прививок, получайте напоминания о записях и ревакцинации.
              </p>

              <div className="row wrap" style={{ gap: '8px' }}>
                <Link href="/client/book" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
                  <CalendarPlus className="ic" />
                  <span>Записаться на приём</span>
                </Link>
                <Link href="/services" className="btn btn-outline btn-lg" style={{ textDecoration: 'none' }}>
                  <span>Услуги и цены</span>
                  <ChevronRight className="ic" />
                </Link>
              </div>

              {/* Ключевые показатели клиники */}
              <div className="ab-facts">
                <div>
                  <b>{vets.length || 6}</b>
                  <span>врачей</span>
                </div>
                <div>
                  <b>{specs.length || 6}</b>
                  <span>направлений</span>
                </div>
                <div>
                  <b>{services.length || 12}</b>
                  <span>услуг</span>
                </div>
                <div>
                  <b>4</b>
                  <span>вида животных</span>
                </div>
              </div>
            </div>

            {/* Иллюстрация кошки и собаки с анимированными бейджами */}
            <HeroIllustration />
          </section>

          {/* Блок «Приём ведут» — сетка направлений и ведущих специалистов */}
          <section className="island" style={{ flex: 'none' }}>
            <div className="island-head">
              <span className="island-title">
                <Stethoscope className="ic" />
                Приём ведут
              </span>
              <Link href="/veterinarians" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                <span>Все врачи</span>
                <ChevronRight className="ic" />
              </Link>
            </div>
            <div className="island-body" style={{ paddingTop: 0 }}>
              <div className="ab-specs">
                {defaultSpecs.map((sp) => (
                  <Link
                    key={sp.id}
                    href={`/veterinarians?spec=${sp.id}`}
                    className={`ab-spec tone-${sp.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="t-ava">
                      <Stethoscope className="ic ic-20" />
                    </span>
                    <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                      <b>{sp.name}</b>
                      <span>{sp.who}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Двухколоночная сетка: Популярные услуги + Как записаться */}
          <div className="ab-grid">
            {/* Левая колонка: Популярные услуги */}
            <section className="island">
              <div className="island-head">
                <span className="island-title">
                  <ClipboardList className="ic" />
                  Популярные услуги
                </span>
                <Link href="/services" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                  <span>Все услуги</span>
                  <ChevronRight className="ic" />
                </Link>
              </div>
              <div className="island-body" style={{ paddingTop: 0 }}>
                <div className="ab-offers">
                  {popularOffers.map((offer) => (
                    <Link
                      key={offer.name}
                      href={offer.serviceId ? `/services?open=${offer.serviceId}` : '/services'}
                      className={`ab-offer tone-${offer.spec}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span className="t-badge">{offer.specName}</span>
                      <b className="ab-offer-name">{offer.name}</b>
                      <span className="tcard-desc">{offer.desc}</span>
                      <span className="ab-offer-foot">
                        <span className="tcard-meta">
                          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {offer.dur} мин
                        </span>
                        <span className="tcard-price">от {offer.price}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* Правая колонка: Как записаться */}
            <section className="island">
              <div className="island-head">
                <span className="island-title">
                  <CalendarPlus className="ic" />
                  Как записаться
                </span>
              </div>
              <div className="island-body" style={{ paddingTop: 0 }}>
                <ol className="ab-steps">
                  <li>
                    <span className="ab-step-n">1</span>
                    <span className="col" style={{ gap: '2px' }}>
                      <b>Создайте аккаунт</b>
                      <span>Добавьте питомцев — вид, возраст, особенности</span>
                    </span>
                  </li>
                  <li>
                    <span className="ab-step-n">2</span>
                    <span className="col" style={{ gap: '2px' }}>
                      <b>Выберите услугу и время</b>
                      <span>Видны только свободные окна врачей, которые лечат ваш вид</span>
                    </span>
                  </li>
                  <li>
                    <span className="ab-step-n">3</span>
                    <span className="col" style={{ gap: '2px' }}>
                      <b>Приходите на приём</b>
                      <span>Напомним заранее, а история и прививки сохранятся в кабинете</span>
                    </span>
                  </li>
                </ol>
                <Link
                  href="/register"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '14px', textDecoration: 'none' }}
                >
                  Создать аккаунт
                </Link>
              </div>
            </section>
          </div>

          {/* Нижний гарантийный баннер клиники */}
          <section className="island ab-cta" style={{ flex: 'none' }}>
            <span className="t-ava lg tone-prev">
              <ShieldCheck className="ic" style={{ width: '26px', height: '26px' }} />
            </span>
            <span className="col grow" style={{ gap: '2px', minWidth: 0 }}>
              <b>Мы делаем животных здоровыми, а хозяев — спокойными</b>
              <span className="muted small">
                Лечим кошек, собак, кроликов и попугаев · приём Пн–Пт 9:00–18:00, Сб 10:00–15:00
              </span>
            </span>
            <div className="row" style={{ gap: '6px' }}>
              <span className="sp-chip tone-cat">
                <SpeciesIcon species="cat" size={16} />
                Кошки
              </span>
              <span className="sp-chip tone-dog">
                <SpeciesIcon species="dog" size={16} />
                Собаки
              </span>
              <span className="sp-chip tone-rab">
                <SpeciesIcon species="rab" size={16} />
                Кролики
              </span>
              <span className="sp-chip tone-par">
                <SpeciesIcon species="par" size={16} />
                Попугаи
              </span>
            </div>
          </section>

          {/* Подвал главной страницы */}
          <footer
            className="island shrink-0 text-sm text-[var(--muted-foreground)] flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              flex: 'none',
              padding: '16px 20px',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div className="flex items-center gap-2 font-mono" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone className="ic" style={{ width: '18px', height: '18px', color: 'var(--primary-text)' }} />
              <span style={{ fontSize: '14px' }}>Приёмная клиники: +7 863 200-10-00 (08:00–21:00)</span>
            </div>
            <div style={{ fontSize: '13.5px' }}>© {new Date().getFullYear()} Chiron Veterinary Clinic · Все права защищены</div>
          </footer>
        </div>
      </div>
    </div>
  );
}
