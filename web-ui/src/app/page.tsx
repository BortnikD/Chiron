'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '../components/layout/PublicHeader';
import { clinicApi } from '../api';
import { Service, Veterinarian, Specialization } from '../types';
import { getDoctorDisplay } from '../utils/doctorHelpers';
import { HeroIllustration } from '../components/home/HeroIllustration';
import {
  Calendar,
  CalendarCheck,
  Stethoscope,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  Clock,
  Heart,
  ChevronRight,
  Phone,
  Syringe,
  PawPrint,
} from 'lucide-react';

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specsMap, setSpecsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
    ])
      .then(([svc, vt, sp]) => {
        setServices(svc.slice(0, 6));
        setVets(vt.slice(0, 4));
        const map: Record<string, string> = {};
        if (Array.isArray(sp)) {
          sp.forEach((s) => {
            map[s.id] = s.name;
          });
        }
        setSpecsMap(map);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full p-2 gap-2 bg-[var(--background)] text-[var(--foreground)]">
      {/* Верхняя шапка сайта */}
      <PublicHeader />

      <main className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
        {/* Главный баннер (Hero) с иллюстрацией */}
        <section className="island ab-hero shrink-0 min-h-fit" style={{ flex: 'none' }}>
          <div className="ab-hero-text">
            <span className="hm-date text-xs font-mono text-[var(--muted-foreground)] tracking-wide">
              ВЕТЕРИНАРНАЯ КЛИНИКА · РОСТОВ-НА-ДОНУ · +7 863 200-10-00
            </span>
            <h1 className="ab-title">
              Забота о питомце —<br />
              <span>от первого осмотра до ревакцинации</span>
            </h1>
            <p className="ab-lead">
              Chiron — клиника и онлайн-кабинет в одном. Выбирайте врача и свободное время, храните историю приёмов и прививок, получайте напоминания о записях и ревакцинации.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/client/book"
                className="btn btn-primary h-11 px-6 text-sm font-semibold flex items-center gap-2 shadow-md"
              >
                <Calendar className="w-4 h-4" />
                <span>Записаться на приём</span>
              </Link>
              <Link
                href="/services"
                className="btn btn-outline h-11 px-5 text-sm font-medium flex items-center gap-2"
              >
                <span>Услуги и цены</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ключевые показатели клиники */}
            <div className="ab-facts">
              <div>
                <b>{vets.length || 6}</b>
                <span>врачей</span>
              </div>
              <div>
                <b>{Object.keys(specsMap).length || 6}</b>
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

          {/* Иллюстрация кошки и собаки с бейджами */}
          <HeroIllustration />
        </section>

        {/* Блок «Как записаться» и гарантии стандартов */}
        <div className="ab-grid shrink-0">
          <section className="island p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CalendarCheck className="w-4 h-4 text-[var(--primary-text)]" />
                <span>Как записаться на приём</span>
              </div>
            </div>
            <ol className="ab-steps">
              <li>
                <span className="ab-step-n">1</span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-sm">Создайте аккаунт</strong>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Добавьте питомцев — вид, породу, возраст и особенности здоровья
                  </span>
                </span>
              </li>
              <li>
                <span className="ab-step-n">2</span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-sm">Выберите услугу и время</strong>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Видны только свободные окна врачей, которые лечат ваш вид животного
                  </span>
                </span>
              </li>
              <li>
                <span className="ab-step-n">3</span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-sm">Приходите на приём</strong>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Напомним заранее, а протоколы осмотра и вакцинации сохранятся в кабинете
                  </span>
                </span>
              </li>
            </ol>
            <Link
              href="/register"
              className="btn btn-primary h-9 w-full justify-center text-xs font-semibold mt-2"
            >
              Создать аккаунт
            </Link>
          </section>

          <section className="island p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/15 text-[var(--primary-text)] w-fit border border-[var(--primary)]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Гарантия стандартов Chiron</span>
              </div>
              <h3 className="text-lg font-bold">
                Мы делаем животных здоровыми, а хозяев — спокойными
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Квалифицированные терапевты, хирурги и стоматологи. Собственная операционная, УЗИ и лаборатория экспресс-анализов в Ростове-на-Дону.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">Принимаем пациентов:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="badge b-completed text-xs font-medium">Кошки</span>
                <span className="badge b-completed text-xs font-medium">Собаки</span>
                <span className="badge b-completed text-xs font-medium">Кролики</span>
                <span className="badge b-completed text-xs font-medium">Грызуны и птицы</span>
              </div>
            </div>
          </section>
        </div>

        {/* Популярные услуги клиники */}
        <section className="island shrink-0 min-h-fit p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-base font-bold">Популярные услуги клиники</h2>
            </div>
            <Link href="/services" className="linkish text-xs flex items-center gap-1">
              <span>Весь прайс-лист</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="card p-4 flex flex-col justify-between hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-snug">{svc.name}</h3>
                    <span className="badge font-mono text-[11px] shrink-0 font-semibold bg-[var(--primary)]/10 text-[var(--primary-text)]">
                      {svc.basePrice?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {svc.description && (
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {svc.baseDurationMin ?? svc.durationMin ?? 30} минут
                  </span>
                  <Link
                    href={`/client/book?serviceId=${svc.id}`}
                    className="text-[var(--primary-text)] hover:underline font-medium flex items-center gap-1 text-[11px]"
                  >
                    Записаться
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ведущие ветеринарные врачи */}
        <section className="island shrink-0 min-h-fit p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-base font-bold">Наши ведущие ветеринары</h2>
            </div>
            <Link href="/veterinarians" className="linkish text-xs flex items-center gap-1">
              <span>Все врачи</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {vets.map((v) => {
              const { name, initials, title } = getDoctorDisplay(v, specsMap);

              return (
                <div key={v.id} className="card p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="avatar w-12 h-12 text-sm font-bold bg-[var(--primary)]/15 text-[var(--primary-text)] shrink-0">
                      {initials}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate" title={name}>{name}</span>
                      <span className="text-xs text-[var(--muted-foreground)] truncate" title={title}>{title}</span>
                    </div>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <span>Стаж: <strong className="font-mono text-[var(--foreground)]">{v.experienceYears} лет</strong></span>
                    <Link
                      href={`/client/book?vetId=${v.id}`}
                      className="text-[var(--primary-text)] hover:underline font-medium text-[11px]"
                    >
                      К врачу
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Подвал главной страницы */}
        <footer className="island shrink-0 p-4 text-xs text-[var(--muted-foreground)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Приёмная клиники: +7 863 200-10-00 (08:00–21:00)</span>
          </div>
          <div>© {new Date().getFullYear()} Chiron Veterinary Clinic · Все права защищены</div>
        </footer>
      </main>
    </div>
  );
}
