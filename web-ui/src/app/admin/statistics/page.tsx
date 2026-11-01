'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../api';
import {
  OverviewStatistics,
  TimelinePoint,
  VeterinarianStatistics,
  ServiceStatistics,
  SpeciesStatistics,
  StatisticsGranularity,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Percent,
  Activity,
  BarChart3,
  Stethoscope,
  Briefcase,
  Heart,
  Filter,
  RefreshCw,
  X,
  PawPrint,
} from 'lucide-react';

export default function AdminStatisticsPage() {
  const [granularity, setGranularity] = useState<StatisticsGranularity>('DAY');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Данные статистики
  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [vetsStats, setVetsStats] = useState<VeterinarianStatistics[]>([]);
  const [servicesStats, setServicesStats] = useState<ServiceStatistics[]>([]);
  const [speciesStats, setSpeciesStats] = useState<SpeciesStatistics[]>([]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const fromParam = fromDate || undefined;
      const toParam = toDate || undefined;

      const [ovRes, timeRes, vetsRes, svcsRes, specRes] = await Promise.all([
        adminApi.getStatisticsOverview(fromParam, toParam).catch(() => null),
        adminApi.getStatisticsTimeline(granularity, fromParam, toParam).catch(() => []),
        adminApi.getStatisticsVeterinarians(fromParam, toParam).catch(() => []),
        adminApi.getStatisticsServices(fromParam, toParam).catch(() => []),
        adminApi.getStatisticsSpecies(fromParam, toParam).catch(() => []),
      ]);

      setOverview(ovRes);
      setTimeline(Array.isArray(timeRes) ? timeRes : []);
      setVetsStats(Array.isArray(vetsRes) ? vetsRes : []);
      setServicesStats(Array.isArray(svcsRes) ? svcsRes : []);
      setSpeciesStats(Array.isArray(specRes) ? specRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [granularity]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadStatistics();
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    setTimeout(loadStatistics, 50);
  };

  return (
    <AppShell
      title="Аналитика и статистика"
      subtitle="Финансовые показатели, динамика приёмов, эффективность врачей и видов животных"
      actions={
        <button
          type="button"
          onClick={loadStatistics}
          className="btn btn-ghost btn-icon btn-sm"
          title="Обновить данные"
        >
          <RefreshCw className={`ic ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="content-col grow" style={{ gap: '8px' }}>
        {/* Панель фильтрации по датам */}
        <section className="island filters" aria-label="Период аналитики">
          <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            <div className="field">
              <span className="field-label">С даты</span>
              <input
                type="date"
                className="input input-sm font-mono"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="field">
              <span className="field-label">По дату</span>
              <input
                type="date"
                className="input input-sm font-mono"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="field" style={{ justifyContent: 'flex-end', paddingTop: '16px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Filter className="ic" style={{ width: '13px', height: '13px' }} />
                <span>Применить</span>
              </button>
            </div>

            {(fromDate || toDate) && (
              <div className="field" style={{ justifyContent: 'flex-end', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleResetFilter}
                >
                  <X className="ic" style={{ width: '13px', height: '13px' }} />
                  <span>Сбросить даты</span>
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Карточки ключевых показателей клиники */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          <div className="island kpi">
            <span className="kpi-label">Фактическая выручка</span>
            <span className="kpi-value">
              {loading
                ? '—'
                : overview?.revenue !== undefined
                ? `${Math.round(overview.revenue).toLocaleString('ru-RU')} ₽`
                : '0 ₽'}
            </span>
            <span className="kpi-hint">
              {overview?.expectedRevenue
                ? `Ожидаемая: ${Math.round(overview.expectedRevenue).toLocaleString('ru-RU')} ₽`
                : 'За оплаченные консультации'}
            </span>
          </div>

          <div className="island kpi">
            <span className="kpi-label">Всего приёмов</span>
            <span className="kpi-value font-mono">
              {loading ? '—' : overview?.totalAppointments ?? 0}
            </span>
            <span className="kpi-hint">
              {overview?.averageCheck
                ? `Средний чек: ${Math.round(overview.averageCheck).toLocaleString('ru-RU')} ₽`
                : 'Записи в журнале'}
            </span>
          </div>

          <div className="island kpi">
            <span className="kpi-label">Новые пациенты</span>
            <span className="kpi-value font-mono text-[var(--primary-text)]">
              {loading ? '—' : `+${overview?.newPets ?? 0}`}
            </span>
            <span className="kpi-hint">
              {overview?.newClients !== undefined
                ? `+${overview.newClients} новых владельцев`
                : 'Прирост базы'}
            </span>
          </div>

          <div className="island kpi">
            <span className="kpi-label">Отмены и неявка</span>
            <span className="kpi-value font-mono">
              {loading
                ? '—'
                : overview?.cancellationRate !== null && overview?.cancellationRate !== undefined
                ? `${(overview.cancellationRate * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
            <span className="kpi-hint">
              {overview?.noShowRate !== null && overview?.noShowRate !== undefined
                ? `Неявка: ${(overview.noShowRate * 100).toFixed(1)}%`
                : 'Процент отмен'}
            </span>
          </div>
        </div>

        {/* График динамики приёмов и выручки */}
        <section className="island" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="island-head">
            <span className="island-title">
              <BarChart3 className="ic" />
              <span>Динамика приёмов и выручки</span>
            </span>

            <div className="segmented" style={{ width: 'auto' }}>
              <button
                type="button"
                className={granularity === 'DAY' ? 'on' : ''}
                onClick={() => setGranularity('DAY')}
              >
                По дням
              </button>
              <button
                type="button"
                className={granularity === 'WEEK' ? 'on' : ''}
                onClick={() => setGranularity('WEEK')}
              >
                По неделям
              </button>
              <button
                type="button"
                className={granularity === 'MONTH' ? 'on' : ''}
                onClick={() => setGranularity('MONTH')}
              >
                По месяцам
              </button>
            </div>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: '140px', borderRadius: '8px' }} />
          ) : timeline.length > 0 ? (
            <div className="table-wrap">
              <table className="table" aria-label="Динамика выручки">
                <thead>
                  <tr>
                    <th>Период</th>
                    <th>Всего приёмов</th>
                    <th>Завершено</th>
                    <th style={{ textAlign: 'right' }}>Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((point) => (
                    <tr key={point.periodStart}>
                      <td>
                        <span className="font-semibold text-sm tnum font-mono">{point.periodStart}</span>
                      </td>
                      <td>
                        <span className="tnum font-mono">{point.appointments}</span>
                      </td>
                      <td>
                        <span className="tnum font-mono text-[var(--primary-text)] font-semibold">{point.completed}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tnum font-bold text-sm font-mono">
                          {Math.round(point.revenue).toLocaleString('ru-RU')} ₽
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted text-xs italic py-4 text-center">За выбранный период данных нет.</p>
          )}
        </section>

        {/* Сводка по врачам и услугам */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '8px' }}>
          {/* Статистика по врачам */}
          <section className="island" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="island-head">
              <span className="island-title">
                <Stethoscope className="ic" />
                <span>Эффективность врачей</span>
              </span>
            </div>

            {vetsStats.length > 0 ? (
              <div className="table-wrap">
                <table className="table" aria-label="Эффективность врачей">
                  <thead>
                    <tr>
                      <th>Врач</th>
                      <th>Завершено</th>
                      <th>Отмен / Неявок</th>
                      <th style={{ textAlign: 'right' }}>Выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vetsStats.map((v) => (
                      <tr key={v.veterinarianId}>
                        <td>
                          <span className="font-semibold text-sm">{v.fullName}</span>
                        </td>
                        <td>
                          <span className="tnum font-mono text-[var(--primary-text)] font-semibold">{v.completed}</span>
                        </td>
                        <td>
                          <span className="muted text-xs tnum font-mono">{v.cancelled} / {v.noShows}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="tnum font-bold text-sm font-mono">
                            {Math.round(v.revenue).toLocaleString('ru-RU')} ₽
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted text-xs italic py-4 text-center">Нет записей по врачам за период</p>
            )}
          </section>

          {/* Статистика по услугам */}
          <section className="island" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="island-head">
              <span className="island-title">
                <Briefcase className="ic" />
                <span>Востребованность услуг</span>
              </span>
            </div>

            {servicesStats.length > 0 ? (
              <div className="table-wrap">
                <table className="table" aria-label="Востребованность услуг">
                  <thead>
                    <tr>
                      <th>Услуга</th>
                      <th>Направление</th>
                      <th>Приёмов</th>
                      <th style={{ textAlign: 'right' }}>Выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesStats.map((s) => (
                      <tr key={s.serviceId}>
                        <td>
                          <span className="font-semibold text-sm">{s.name}</span>
                        </td>
                        <td>
                          <span className="badge text-[10px]">{s.specializationName}</span>
                        </td>
                        <td>
                          <span className="tnum font-mono">{s.completed}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="tnum font-bold text-sm font-mono">
                            {Math.round(s.revenue).toLocaleString('ru-RU')} ₽
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted text-xs italic py-4 text-center">Нет записей по услугам за период</p>
            )}
          </section>
        </div>

        {/* Распределение приёмов по видам животных */}
        <section className="island" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="island-head">
            <span className="island-title">
              <PawPrint className="ic" />
              <span>Распределение по видам животных</span>
            </span>
          </div>

          {speciesStats.length > 0 ? (
            <div className="table-wrap">
              <table className="table" aria-label="Распределение по видам животных">
                <thead>
                  <tr>
                    <th>Вид животного</th>
                    <th>Активных питомцев в клинике</th>
                    <th>Приёмов за период</th>
                    <th style={{ textAlign: 'right' }}>Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {speciesStats.map((sp) => (
                    <tr key={sp.speciesId}>
                      <td>
                        <span className="font-bold text-sm">{sp.name}</span>
                      </td>
                      <td>
                        <span className="tnum font-mono">{sp.activePets}</span>
                      </td>
                      <td>
                        <span className="tnum font-mono font-semibold text-[var(--primary-text)]">{sp.appointments}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tnum font-bold text-sm font-mono">
                          {Math.round(sp.revenue).toLocaleString('ru-RU')} ₽
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted text-xs italic py-4 text-center">Нет данных по видам животных за период</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
