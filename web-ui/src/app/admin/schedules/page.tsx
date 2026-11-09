'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi, clinicApi } from '../../../api';
import { Veterinarian, WorkSchedule, ScheduleException } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { CalendarDays, CalendarOff, Plus } from 'lucide-react';
import {
  INDEX_TO_DOW,
  formatIsoDisplay,
  WeeklyScheduleMatrix,
  ExceptionsTable,
  WorkScheduleModal,
  ScheduleExceptionModal,
  DeleteConfirmModal,
} from './_components';

/**
 * Основное содержимое страницы управления расписаниями и исключениями.
 * Компактный оркестратор стейтов, загрузки данных и модальных окон.
 */
function AdminSchedulesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const vetParam = searchParams.get('vetId') || searchParams.get('vet');

  const [activeTab, setActiveTab] = useState<'sched' | 'exc'>('sched');
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);

  // Выбранный врач и его недельный рабочий график
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Список исключений клиники (отпуска, больничные, особые часы)
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);

  // Состояние модальных окон
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean;
    schedule?: WorkSchedule | null;
    dayIndex?: number;
  }>({ open: false });

  const [exceptionModal, setExceptionModal] = useState<{
    open: boolean;
    exception?: ScheduleException | null;
  }>({ open: false });

  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'schedule'; id: string; dowName: string }
    | { type: 'exception'; exception: ScheduleException }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Синхронизация вкладки с параметрами URL (?tab=exc)
  useEffect(() => {
    setActiveTab(tabParam === 'exc' || tabParam === 'exceptions' ? 'exc' : 'sched');
  }, [tabParam]);

  // Загрузка списка врачей
  const loadVets = async () => {
    setLoadingVets(true);
    try {
      const res = await adminApi.getVeterinarians();
      const list = Array.isArray(res) ? res : [];
      setVets(list);
      if (list.length > 0) {
        if (vetParam && list.some((v) => v.id === vetParam)) {
          setSelectedVetId(vetParam);
        } else if (!selectedVetId) {
          setSelectedVetId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки врачей:', err);
      setVets([]);
    } finally {
      setLoadingVets(false);
    }
  };

  useEffect(() => {
    loadVets();
  }, []);

  // Загрузка графика выбранного врача
  const loadSchedule = async (vetId: string) => {
    if (!vetId) return;
    setLoadingSchedule(true);
    try {
      const res = await clinicApi.getWorkSchedules(vetId);
      setSchedules(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Ошибка загрузки графика:', err);
      setSchedules([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (selectedVetId) loadSchedule(selectedVetId);
  }, [selectedVetId]);

  // Загрузка списка всех исключений клиники
  const loadExceptions = async () => {
    setLoadingExceptions(true);
    try {
      const res = await adminApi.getScheduleExceptions(0, 100);
      setExceptions(res?.items ?? []);
    } catch (err) {
      console.error('Ошибка загрузки исключений:', err);
      setExceptions([]);
    } finally {
      setLoadingExceptions(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const selectedVet = useMemo(() => vets.find((v) => v.id === selectedVetId), [vets, selectedVetId]);
  const selectedVetName = selectedVet?.user?.fullName || 'Врач';

  // Обработка подтвержденного удаления графика или исключения
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'schedule') {
        await adminApi.deleteWorkSchedule(deleteTarget.id);
        loadSchedule(selectedVetId);
      } else {
        await adminApi.deleteScheduleException(deleteTarget.exception.id);
        loadExceptions();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.message || 'Не удалось выполнить удаление');
    } finally {
      setIsDeleting(false);
    }
  };

  // Вычисление первого свободного дня недели для быстрого добавления
  const handleOpenAddDay = (dayIdx?: number) => {
    let targetDay = dayIdx ?? 0;
    if (dayIdx === undefined) {
      const scheduledDows = new Set(schedules.map((s) => s.dayOfWeek));
      const firstFree = INDEX_TO_DOW.findIndex((d) => !scheduledDows.has(d));
      targetDay = firstFree >= 0 ? firstFree : 0;
    }
    setScheduleModal({ open: true, schedule: null, dayIndex: targetDay });
  };

  return (
    <AppShell
      crumbGroup="Персонал"
      crumb={activeTab === 'sched' ? 'Расписания' : 'Исключения из расписания'}
      actions={
        activeTab === 'sched' ? (
          <button type="button" className="btn btn-primary" onClick={() => handleOpenAddDay()}>
            <Plus className="ic" />
            <span>Добавить рабочий день</span>
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setExceptionModal({ open: true, exception: null })}>
            <Plus className="ic" />
            <span>Добавить исключение</span>
          </button>
        )
      }
    >
      <div className="content-col grow" style={{ gap: '10px' }}>
        {/* Вкладки навигации */}
        <section className="island filters" style={{ padding: '8px 12px' }}>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${activeTab === 'sched' ? 'on' : ''}`}
              onClick={() => {
                setActiveTab('sched');
                router.replace('/admin/schedules');
              }}
            >
              <CalendarDays className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Недельные графики</span>
            </button>
            <button
              type="button"
              className={`seg-item ${activeTab === 'exc' ? 'on' : ''}`}
              onClick={() => {
                setActiveTab('exc');
                router.replace('/admin/schedules?tab=exc');
              }}
            >
              <CalendarOff className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Исключения из расписания</span>
            </button>
          </div>
        </section>

        {activeTab === 'sched' ? (
          <WeeklyScheduleMatrix
            vets={vets}
            selectedVetId={selectedVetId}
            selectedVetName={selectedVetName}
            schedules={schedules}
            loadingVets={loadingVets}
            loadingSchedule={loadingSchedule}
            onSelectVet={setSelectedVetId}
            onRefresh={() => selectedVetId && loadSchedule(selectedVetId)}
            onAddDay={handleOpenAddDay}
            onEditDay={(ws, dayIdx) => setScheduleModal({ open: true, schedule: ws, dayIndex: dayIdx })}
            onDeleteDay={(id, dow) => setDeleteTarget({ type: 'schedule', id, dowName: dow })}
          />
        ) : (
          <ExceptionsTable
            exceptions={exceptions}
            vets={vets}
            loading={loadingExceptions}
            onRefresh={loadExceptions}
            onEdit={(ex) => setExceptionModal({ open: true, exception: ex })}
            onDelete={(ex) => setDeleteTarget({ type: 'exception', exception: ex })}
            initialVetFilter={selectedVetId}
          />
        )}
      </div>

      {/* Модальное окно рабочего графика */}
      <WorkScheduleModal
        isOpen={scheduleModal.open}
        schedule={scheduleModal.schedule}
        dayIndex={scheduleModal.dayIndex}
        veterinarianId={selectedVetId}
        doctorName={selectedVetName}
        onClose={() => setScheduleModal({ open: false })}
        onSuccess={() => selectedVetId && loadSchedule(selectedVetId)}
      />

      {/* Модальное окно исключения */}
      <ScheduleExceptionModal
        isOpen={exceptionModal.open}
        exception={exceptionModal.exception}
        vets={vets}
        defaultVetId={selectedVetId}
        onClose={() => setExceptionModal({ open: false })}
        onSuccess={loadExceptions}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'schedule'
            ? `Удалить рабочий график на ${deleteTarget.dowName}?`
            : 'Удалить исключение из расписания?'
        }
        description={
          deleteTarget?.type === 'schedule'
            ? `Рабочий график на ${deleteTarget.dowName} будет удален, день станет выходным.`
            : deleteTarget?.type === 'exception'
              ? `Исключение (${deleteTarget.exception.type === 'ABSENCE' ? 'Отсутствие' : 'Особые часы'}, ${
                  deleteTarget.exception.startDate === deleteTarget.exception.endDate
                    ? formatIsoDisplay(deleteTarget.exception.startDate)
                    : `${formatIsoDisplay(deleteTarget.exception.startDate)} – ${formatIsoDisplay(deleteTarget.exception.endDate)}`
                }) будет удалено.`
              : ''
        }
        isLoading={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </AppShell>
  );
}

export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '200px', margin: '24px' }} />}>
      <AdminSchedulesContent />
    </Suspense>
  );
}
