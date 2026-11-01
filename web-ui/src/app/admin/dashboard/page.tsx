'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../api';
import { OverviewStatistics } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Users,
  Stethoscope,
  Calendar,
  ArrowRight,
  TrendingUp,
  PawPrint,
  Percent,
  Clock,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number>(0);
  const [apptCount, setApptCount] = useState<number>(0);
  const [serviceCount, setServiceCount] = useState<number>(0);
  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(0, 1),
      adminApi.getAppointments(0, 1),
      adminApi.getServices(),
      adminApi.getStatisticsOverview().catch(() => null),
    ])
      .then(([usersRes, apptRes, servicesRes, statsRes]) => {
        setUserCount(usersRes?.totalElements ?? 0);
        setApptCount(apptRes?.totalElements ?? 0);
        setServiceCount(Array.isArray(servicesRes) ? servicesRes.length : 0);
        setOverview(statsRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (n?: number | null) => (n !== undefined && n !== null ? `${Math.round(n).toLocaleString('ru-RU')} ₽` : '—');

  return (
    <AppShell
      title="Панель администратора"
      subtitle="Ключевые показатели клиники, оперативное управление и справочники"
      actions={
        <Link href="/admin/statistics" className="btn btn-outline h-8 px-3 text-xs flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Подробная статистика</span>
        </Link>
      }
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Ключевые показатели клиники */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">Финансовые и операционные показатели</h2>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">Текущий отчётный период</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="kpi card p-4 bg-[var(--card)]">
              <span className="kpi-label text-xs text-[var(--muted-foreground)]">Фактическая выручка</span>
              <span className="font-mono text-2xl font-extrabold text-[var(--primary-text)] mt-1">
                {formatMoney(overview?.revenue ?? overview?.actualRevenue)}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1">Завершённые приёмы</span>
            </div>

            <div className="kpi card p-4 bg-[var(--card)]">
              <span className="kpi-label text-xs text-[var(--muted-foreground)]">Ожидаемая выручка</span>
              <span className="font-mono text-2xl font-extrabold text-[var(--foreground)] mt-1">
                {formatMoney(overview?.expectedRevenue)}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1">Включая подтверждённые</span>
            </div>

            <div className="kpi card p-4 bg-[var(--card)]">
              <span className="kpi-label text-xs text-[var(--muted-foreground)]">Всего приёмов</span>
              <span className="font-mono text-2xl font-extrabold text-[var(--foreground)] mt-1">
                {overview?.totalAppointments ?? apptCount}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Отмен: {overview?.cancellationRate !== undefined ? `${overview.cancellationRate}%` : '—'}
              </span>
            </div>

            <div className="kpi card p-4 bg-[var(--card)]">
              <span className="kpi-label text-xs text-[var(--muted-foreground)]">Средний чек</span>
              <span className="font-mono text-2xl font-extrabold text-[var(--foreground)] mt-1">
                {formatMoney(overview?.averageCheck)}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Неявки: {overview?.noShowRate !== undefined ? `${overview.noShowRate}%` : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Модули быстрого перехода */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="pb-2 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold">Разделы управления клиникой</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/admin/appointments"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Журнал записей</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Все приёмы, статусы, слоты</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>

            <Link
              href="/admin/veterinarians"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Врачи и графики</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Расписания, смены, отпуска</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>

            <Link
              href="/admin/pets"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Пациенты</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Картотека, вакцинации</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>

            <Link
              href="/admin/services"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Услуги и цены</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{serviceCount} позиций прейскуранта</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>

            <Link
              href="/admin/users"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Пользователи</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{userCount} зарегистрированных</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>

            <Link
              href="/admin/statistics"
              className="card clickable p-4 flex items-center justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)] text-inherit no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Аналитика</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Динамика, врачи, виды</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
