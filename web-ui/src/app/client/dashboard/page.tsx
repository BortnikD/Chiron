'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { AppShell } from '../../../components/layout/AppShell';
import { clientApi } from '../../../api';
import { Pet, Appointment, Vaccination } from '../../../types';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  PawPrint,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Plus,
  Syringe,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clientApi.getAppointments(0, 10),
    ])
      .then(async ([petsData, apptsData]) => {
        const safePets = Array.isArray(petsData) ? petsData : [];
        setPets(safePets);

        const items = apptsData?.items ?? (Array.isArray(apptsData) ? apptsData : []);
        setAppointments(items);

        // Загрузка вакцинаций для питомцев клиента
        try {
          const vacPromises = safePets.map((p) =>
            clientApi.getVaccinations(p.id).catch(() => [])
          );
          const vacResults = await Promise.all(vacPromises);
          setVaccinations(vacResults.flat());
        } catch {
          setVaccinations([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
        setPets([]);
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const upcomingAppointment = (appointments || []).find(
    (a) => a && (a.status === 'PENDING' || a.status === 'CONFIRMED')
  );

  const formatPrice = (p?: number) => (p !== undefined ? `${p.toLocaleString('ru-RU')} ₽` : '—');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-PENDING">Ожидает</span>;
      case 'CONFIRMED':
        return <span className="badge badge-CONFIRMED">Подтверждена</span>;
      case 'COMPLETED':
        return <span className="badge badge-COMPLETED">Завершена</span>;
      case 'CANCELLED':
        return <span className="badge badge-CANCELLED">Отменена</span>;
      case 'NO_SHOW':
        return <span className="badge badge-NO_SHOW">Неявка</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <AppShell
      title="Личный кабинет"
      subtitle={`Здравствуйте, ${user?.firstName || 'клиент'}!`}
      actions={
        <Link href="/client/book" className="btn btn-primary h-8 px-3 text-xs flex items-center gap-1.5">
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Новая запись</span>
        </Link>
      }
    >
      <div className="flex flex-col gap-2 p-1">
        {/* Главный блок: ближайший приём или приветствие */}
        {upcomingAppointment ? (
          <section className="island lead p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[var(--primary-text)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Ближайшая запись на приём
                </span>
              </div>
              {getStatusBadge(upcomingAppointment.status)}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="datebox shrink-0">
                  <b>
                    {upcomingAppointment.startAt
                      ? new Date(upcomingAppointment.startAt).toLocaleDateString('ru-RU', { day: '2-digit' })
                      : '—'}
                  </b>
                  <span>
                    {upcomingAppointment.startAt
                      ? new Date(upcomingAppointment.startAt).toLocaleDateString('ru-RU', { month: 'short' })
                      : ''}
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="text-base font-extrabold flex items-center gap-2">
                    <span className="font-mono">
                      {upcomingAppointment.startAt
                        ? new Date(upcomingAppointment.startAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                    <span>·</span>
                    <span>{upcomingAppointment.pet?.name || 'Питомец'}</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
                    <span>{upcomingAppointment.service?.name || 'Консультация'}</span>
                    <span>·</span>
                    <span>Врач: {upcomingAppointment.veterinarian?.user?.fullName || 'Специалист Chiron'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-base font-bold text-[var(--foreground)]">
                  {formatPrice(upcomingAppointment.priceSnapshot || upcomingAppointment.service?.basePrice)}
                </span>
                <Link
                  href="/client/appointments"
                  className="btn btn-outline h-8 px-3 text-xs flex items-center gap-1"
                >
                  <span>Все детали</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="island p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--primary)]/5 border-[var(--primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary-text)] flex items-center justify-center shrink-0">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">У вас пока нет активных записей</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Выберите удобный день и время для консультации или плановой вакцинации
                </span>
              </div>
            </div>
            <Link href="/client/book" className="btn btn-primary h-8 px-4 text-xs shrink-0 flex items-center gap-1.5">
              <span>Записаться к врачу</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}

        {/* Блок питомцев клиента */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">Мои питомцы</h2>
              <span className="badge text-[10px] font-mono">{pets.length}</span>
            </div>
            <Link
              href="/client/pets"
              className="text-xs text-[var(--primary-text)] hover:underline flex items-center gap-1"
            >
              <span>Управление питомцами</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
              Загрузка данных...
            </div>
          ) : pets.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center gap-2">
              <PawPrint className="w-8 h-8 opacity-25" />
              <span>Вы ещё не добавили ни одного питомца</span>
              <Link href="/client/pets" className="btn btn-outline h-7 px-3 text-xs mt-1">
                + Добавить питомца
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pets.map((pet) => {
                const petVacs = vaccinations.filter((v) => v.petId === pet.id);
                const today = new Date().toISOString().substring(0, 10);
                const hasOverdue = petVacs.some((v) => v.nextDueOn && v.nextDueOn <= today);

                return (
                  <div
                    key={pet.id}
                    className="card p-4 flex flex-col justify-between hover:border-[var(--primary)] transition-all bg-[var(--card)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--muted)] text-[var(--foreground)] flex items-center justify-center font-bold text-sm shrink-0">
                        {pet.name.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{pet.name}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {pet.gender === 'MALE' ? 'самец' : 'самка'}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] truncate">
                          {pet.species?.name || 'Вид не указан'}
                          {pet.weightKg ? ` · ${pet.weightKg} кг` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs">
                      {hasOverdue ? (
                        <span className="badge due-over text-[10px]">Требуется прививка</span>
                      ) : petVacs.length > 0 ? (
                        <span className="badge due-later text-[10px]">Прививки в норме</span>
                      ) : (
                        <span className="badge text-[10px]">Нет прививок</span>
                      )}

                      <Link
                        href={`/client/book?petId=${pet.id}`}
                        className="text-[var(--primary-text)] hover:underline font-medium text-[11px]"
                      >
                        Записать
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Блок недавних приёмов */}
        <section className="island p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-bold">История приёмов</h2>
            </div>
            <Link
              href="/client/appointments"
              className="text-xs text-[var(--primary-text)] hover:underline flex items-center gap-1"
            >
              <span>Все записи</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
              История посещений пуста
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата и время</th>
                    <th>Питомец</th>
                    <th>Услуга</th>
                    <th>Врач</th>
                    <th>Статус</th>
                    <th className="right">Стоимость</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 6).map((appt) => (
                    <tr key={appt.id}>
                      <td className="font-mono text-xs">
                        {appt.startAt
                          ? new Date(appt.startAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="font-semibold text-xs">{appt.pet?.name || '—'}</td>
                      <td className="text-xs">{appt.service?.name || '—'}</td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {appt.veterinarian?.user?.fullName || 'Врач Chiron'}
                      </td>
                      <td>{getStatusBadge(appt.status)}</td>
                      <td className="right font-mono text-xs font-semibold">
                        {formatPrice(appt.priceSnapshot || appt.service?.basePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
