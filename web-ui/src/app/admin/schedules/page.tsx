'use client';

import React, { useMemo, Suspense } from 'react';
import { CalendarDays, CalendarOff, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useAdminSchedules } from './_hooks/useAdminSchedules';
import { WeeklyScheduleMatrix } from './_components/WeeklyScheduleMatrix';
import { ExceptionsTable } from './_components/ExceptionsTable';
import { WorkScheduleModal } from './_components/WorkScheduleModal';
import { ScheduleExceptionModal } from './_components/ScheduleExceptionModal';

function AdminSchedulesContent() {
  const s = useAdminSchedules();

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        className="btn btn-primary"
        onClick={s.activeTab === 'sched' ? () => s.openAddDay() : s.openAddException}
      >
        <Plus className="ic" />
        <span>{s.activeTab === 'sched' ? 'Добавить рабочий день' : 'Добавить исключение'}</span>
      </button>
    ),
    [s.activeTab, s.openAddDay, s.openAddException]
  );

  useShellHeader({
    crumbGroup: 'Персонал',
    crumb: s.activeTab === 'sched' ? 'Расписания' : 'Исключения из расписания',
    actions: headerActions,
  });

  return (
    <>
      <div className="content-col grow" style={{ gap: '10px' }}>
        {s.error && (
          <div className="alert alert-destructive" role="alert" style={{ alignItems: 'center' }}>
            <AlertCircle className="ic" />
            <span className="grow">{s.error}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={s.reload}>
              <RefreshCw className="ic" style={{ width: '14px', height: '14px' }} />
              Повторить
            </button>
          </div>
        )}

        <section className="island filters" style={{ padding: '8px 12px' }}>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${s.activeTab === 'sched' ? 'on' : ''}`}
              onClick={() => s.switchTab('sched')}
            >
              <CalendarDays className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Недельные графики</span>
            </button>
            <button
              type="button"
              className={`seg-item ${s.activeTab === 'exc' ? 'on' : ''}`}
              onClick={() => s.switchTab('exc')}
            >
              <CalendarOff className="ic" style={{ width: '15px', height: '15px' }} />
              <span>Исключения из расписания</span>
            </button>
          </div>
        </section>

        {s.activeTab === 'sched' ? (
          <WeeklyScheduleMatrix
            vets={s.vets}
            selectedVetId={s.selectedVetId}
            selectedVetName={s.selectedVetName}
            schedules={s.schedules}
            loadingVets={s.loadingVets}
            loadingSchedule={s.loadingSchedule}
            onSelectVet={s.setSelectedVetId}
            onRefresh={() => s.selectedVetId && s.loadSchedule(s.selectedVetId)}
            onAddDay={s.openAddDay}
            onEditDay={s.openEditDay}
            onDeleteDay={s.requestDeleteSchedule}
          />
        ) : (
          <ExceptionsTable
            exceptions={s.exceptions}
            vets={s.vets}
            loading={s.loadingExceptions}
            onRefresh={s.loadExceptions}
            onEdit={s.openEditException}
            onDelete={s.requestDeleteException}
            initialVetFilter={s.selectedVetId}
          />
        )}
      </div>

      <WorkScheduleModal
        isOpen={s.scheduleModal.open}
        schedule={s.scheduleModal.schedule}
        dayIndex={s.scheduleModal.dayIndex}
        veterinarianId={s.selectedVetId}
        doctorName={s.selectedVetName}
        onClose={s.closeScheduleModal}
        onSave={s.saveWorkSchedule}
      />

      <ScheduleExceptionModal
        isOpen={s.exceptionModal.open}
        exception={s.exceptionModal.exception}
        vets={s.vets}
        defaultVetId={s.selectedVetId}
        onClose={s.closeExceptionModal}
        onSave={s.saveScheduleException}
      />

      <ConfirmModal
        isOpen={Boolean(s.deleteTarget)}
        title={s.deleteConfirmMeta.title}
        description={s.deleteConfirmMeta.description}
        confirmLabel="Удалить"
        loading={s.isDeleting}
        error={s.deleteError}
        onClose={s.closeDeleteModal}
        onConfirm={s.confirmDelete}
      />
    </>
  );
}

export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '200px', margin: '24px' }} />}>
      <AdminSchedulesContent />
    </Suspense>
  );
}
