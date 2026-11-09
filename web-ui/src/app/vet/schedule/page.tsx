'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { clinicApi, vetApi, adminApi } from '../../../api';
import { WorkSchedule, ScheduleException, Appointment } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  VetWeeklyScheduleTable,
  VetExceptionsList,
  VetExceptionModal,
  VetScheduleDetailIsland,
} from './_components';

function VetScheduleContent() {
  const { user } = useAuth();

  const [vetId, setVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [pets, setPets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Выбранные сущности для просмотра в правом острове
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedException, setSelectedException] = useState<ScheduleException | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadExceptions = useCallback(async (targetVetId: string) => {
    try {
      const excRes = await clinicApi.getScheduleExceptions(targetVetId);
      setExceptions(Array.isArray(excRes) ? excRes : []);
    } catch (err) {
      console.error('Failed to load schedule exceptions', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [vetsRes, svcRes, apptsRes, patientsRes] = await Promise.all([
          clinicApi.getVeterinarians(),
          clinicApi.getServices(),
          vetApi.getAppointments(0, 100),
          vetApi.getPatients().catch(() => []),
        ]);

        const svcMap: Record<string, string> = {};
        if (Array.isArray(svcRes)) {
          svcRes.forEach((s) => { svcMap[s.id] = s.name; });
        }
        setServices(svcMap);

        const petMap: Record<string, string> = {};
        if (Array.isArray(patientsRes)) {
          patientsRes.forEach((p) => { petMap[p.id] = p.name; });
        }
        setPets(petMap);

        setAppointments(apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []));

        const vetList = Array.isArray(vetsRes) ? vetsRes : [];
        const myVet = vetList.find((v) => v.userId === user?.id) || vetList[0];

        if (myVet) {
          setVetId(myVet.id);
          const [schedRes, excRes] = await Promise.all([
            clinicApi.getWorkSchedules(myVet.id).catch(() => []),
            clinicApi.getScheduleExceptions(myVet.id).catch(() => []),
          ]);
          setSchedules(Array.isArray(schedRes) ? schedRes : []);
          setExceptions(Array.isArray(excRes) ? excRes : []);
        }
      } catch (err) {
        console.error('Failed to load vet schedule data', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  const handleDeleteException = async (exc: ScheduleException) => {
    if (!confirm('Вы действительно хотите удалить это исключение?')) return;
    try {
      await adminApi.deleteScheduleException(exc.id);
      setSelectedException(null);
      if (vetId) await loadExceptions(vetId);
    } catch (err) {
      console.error('Failed to delete exception', err);
      alert('Не удалось удалить исключение');
    }
  };

  const handleSelectAppt = (appt: Appointment) => {
    setSelectedAppt(appt);
    setSelectedException(null);
  };

  const handleSelectException = (exc: ScheduleException) => {
    setSelectedException(exc);
    setSelectedAppt(null);
  };

  const handleCloseDetail = () => {
    setSelectedAppt(null);
    setSelectedException(null);
  };

  return (
    <AppShell crumbGroup="Врач" crumb="Мой график">
      <div className="content-row">
        <VetWeeklyScheduleTable
          loading={loading}
          schedules={schedules}
          exceptions={exceptions}
          appointments={appointments}
          services={services}
          pets={pets}
          selectedAppt={selectedAppt}
          onSelectAppt={handleSelectAppt}
          selectedException={selectedException}
          onSelectException={handleSelectException}
          weekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
          onNextWeek={() => setWeekOffset((prev) => prev + 1)}
          onCurrentWeek={() => setWeekOffset(0)}
        />

        <VetExceptionsList
          exceptions={exceptions}
          schedules={schedules}
          selectedException={selectedException}
          onSelectException={handleSelectException}
          onAddException={() => setIsModalOpen(true)}
          loading={loading}
        />

        <VetScheduleDetailIsland
          selectedAppt={selectedAppt}
          selectedException={selectedException}
          onClose={handleCloseDetail}
          pets={pets}
          services={services}
          onDeleteException={handleDeleteException}
        />
      </div>

      <VetExceptionModal
        isOpen={isModalOpen}
        vetId={vetId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { if (vetId) loadExceptions(vetId); }}
      />
    </AppShell>
  );
}

export default function VetSchedulePage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '200px', margin: '24px' }} />}>
      <VetScheduleContent />
    </Suspense>
  );
}
