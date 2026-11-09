'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { clientApi, clinicApi } from '../../../api';
import { Appointment, Pet, Service, Veterinarian } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppointmentsFilters,
  AppointmentsList,
  AppointmentDetailIsland,
  CancelAppointmentModal,
  FilterTab,
} from './_components';

/**
 * Страница записей на приём клиента в личном кабинете.
 * Оркестратор фильтрации, отображения списка и детального просмотра выбранного приёма.
 */
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);

  // Фильтры списка
  const [tab, setTab] = useState<FilterTab>('UPCOMING');
  const [selectedPetId, setSelectedPetId] = useState<string>('ALL');

  // Выбранная запись для детального просмотра
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Состояние отмены записи
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Загрузка данных
  const loadAll = async () => {
    try {
      const [apptsRes, petsRes, svcRes, vetsRes] = await Promise.all([
        clientApi.getAppointments(0, 100),
        clientApi.getPets(),
        clinicApi.getServices(),
        clinicApi.getVeterinarians(),
      ]);

      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      setAppointments(items);
      setPets(Array.isArray(petsRes) ? petsRes : []);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);

      if (items.length > 0 && !selectedAppt && typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setSelectedAppt(items[0]);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных приёмов:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Быстрые словари сущностей по ID
  const petsMap = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);

  // Обработчик отмены записи
  const handleCancelAppointment = async () => {
    if (!selectedAppt) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await clientApi.cancelAppointment(selectedAppt.id, cancelReason.trim() || undefined);
      setIsCancelModalOpen(false);
      setCancelReason('');
      await loadAll();
      setSelectedAppt((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
    } catch (err: any) {
      setCancelError(err?.message || 'Не удалось отменить запись');
    } finally {
      setCancelling(false);
    }
  };

  // Фильтрация записей
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const isUpcoming = a.status === 'PENDING' || a.status === 'CONFIRMED';
      const isPast = a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW';

      if (tab === 'UPCOMING' && !isUpcoming) return false;
      if (tab === 'COMPLETED' && !isPast) return false;
      if (selectedPetId !== 'ALL' && a.petId !== selectedPetId) return false;

      return true;
    });
  }, [appointments, tab, selectedPetId]);

  return (
    <AppShell title="Записи на приём" currentSection="Записи">
      <div className="content-col grow">
        <AppointmentsFilters
          tab={tab}
          onTabChange={setTab}
          selectedPetId={selectedPetId}
          onPetChange={setSelectedPetId}
          pets={pets}
        />

        <div className="content-row">
          <AppointmentsList
            appointments={filteredAppointments}
            selectedAppointment={selectedAppt}
            onSelectAppointment={setSelectedAppt}
            petsMap={petsMap}
            servicesMap={servicesMap}
          />

          {selectedAppt && (
            <AppointmentDetailIsland
              appointment={selectedAppt}
              petsMap={petsMap}
              servicesMap={servicesMap}
              veterinariansMap={vetsMap}
              onClose={() => setSelectedAppt(null)}
              onRequestCancel={() => setIsCancelModalOpen(true)}
            />
          )}
        </div>
      </div>

      <CancelAppointmentModal
        isOpen={isCancelModalOpen && !!selectedAppt}
        appointment={selectedAppt}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={handleCancelAppointment}
        onClose={() => setIsCancelModalOpen(false)}
        loading={cancelling}
        error={cancelError}
      />
    </AppShell>
  );
}
