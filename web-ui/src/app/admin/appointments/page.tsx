'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { adminApi, clinicApi } from '../../../api';
import {
  Appointment,
  AppointmentStatus,
  Veterinarian,
  Service,
  Species,
  Pet,
  User,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  getVetName,
  getServiceName,
  getPet,
  getOwnerName,
  AdminAppointmentsFilters,
  AdminAppointmentsTable,
  AdminAppointmentDetailIsland,
  AdminCreateAppointmentModal,
  AdminEditAppointmentModal,
  AdminCancelAppointmentModal,
  AdminDeleteAppointmentModal,
} from './_components';

/**
 * Страница администрирования записей на приём клиники Chiron.
 * Компактный оркестратор состояния фильтров, списков и модальных окон.
 */
export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vetFilter, setVetFilter] = useState<string>('ALL');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Выбранная запись (Master-Detail) и состояние модалок
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [deleteAppt, setDeleteAppt] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsRes, vetsRes, svcsRes, speciesRes, petsRes, usersRes] = await Promise.all([
        adminApi
          .getAppointments(0, 100, {
            status: statusFilter !== 'ALL' ? (statusFilter as AppointmentStatus) : undefined,
            veterinarianId: vetFilter !== 'ALL' ? vetFilter : undefined,
          })
          .catch(() => ({ items: [] })),
        adminApi.getVeterinarians().catch(() => [] as Veterinarian[]),
        clinicApi.getServices().catch(() => [] as Service[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        adminApi.getPets(0, 100).catch(() => ({ items: [] })),
        adminApi.getUsers(0, 100).catch(() => ({ items: [] })),
      ]);

      const appts = apptsRes?.items || [];
      setAppointments(appts);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setServices(Array.isArray(svcsRes) ? svcsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setPets(petsRes?.items || []);
      setUsers(usersRes?.items || []);

      if (selectedAppt) {
        const updated = appts.find((a: Appointment) => a.id === selectedAppt.id);
        if (updated) setSelectedAppt(updated);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных приёмов:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, vetFilter, selectedAppt?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteAppt = async () => {
    if (!deleteAppt) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteAppointment(deleteAppt.id);
      if (selectedAppt?.id === deleteAppt.id) setSelectedAppt(null);
      setDeleteAppt(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении записи');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = (item: Appointment) => {
    setSelectedAppt(item);
    loadData();
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const p = getPet(a.petId, pets);
      if (speciesFilter !== 'ALL' && (!p || p.speciesId !== speciesFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const sName = getServiceName(a.serviceId, services).toLowerCase();
        const vName = getVetName(a.veterinarianId, veterinarians, users).toLowerCase();
        const pName = (p?.name || '').toLowerCase();
        const oName = getOwnerName(p?.ownerId, users).toLowerCase();
        if (!sName.includes(q) && !vName.includes(q) && !pName.includes(q) && !oName.includes(q)) {
          return false;
        }
      }
      if (dateFrom && a.startAt.split('T')[0] < dateFrom) return false;
      if (dateTo && a.startAt.split('T')[0] > dateTo) return false;
      return true;
    });
  }, [appointments, speciesFilter, search, dateFrom, dateTo, pets, services, veterinarians, users]);

  return (
    <AppShell crumbGroup="Клиника" crumb="Записи">
      <div className="content-row">
        <div className="content-col grow">
          <AdminAppointmentsFilters
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            vetFilter={vetFilter} onVetFilterChange={setVetFilter}
            speciesFilter={speciesFilter} onSpeciesFilterChange={setSpeciesFilter}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            search={search} onSearchChange={setSearch}
            veterinarians={veterinarians} speciesList={speciesList} users={users}
            onCreateClick={() => setIsCreateOpen(true)}
          />

          <AdminAppointmentsTable
            appointments={filteredAppointments} veterinarians={veterinarians}
            services={services} pets={pets} users={users}
            selectedAppt={selectedAppt} loading={loading}
            onSelect={setSelectedAppt} onEdit={setEditAppt}
            onCancel={setCancelAppt} onDelete={setDeleteAppt}
          />
        </div>

        {selectedAppt && (
          <AdminAppointmentDetailIsland
            appointment={selectedAppt} veterinarians={veterinarians}
            services={services} pets={pets} users={users}
            onClose={() => setSelectedAppt(null)} onEdit={setEditAppt}
            onCancel={setCancelAppt} onDelete={setDeleteAppt}
          />
        )}
      </div>

      <AdminCreateAppointmentModal
        isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={handleModalSuccess}
        veterinarians={veterinarians} services={services} pets={pets} users={users}
      />

      <AdminEditAppointmentModal
        isOpen={Boolean(editAppt)} appointment={editAppt} onClose={() => setEditAppt(null)}
        onSuccess={handleModalSuccess} veterinarians={veterinarians} services={services} pets={pets} users={users}
      />

      <AdminCancelAppointmentModal
        isOpen={Boolean(cancelAppt)} appointment={cancelAppt} onClose={() => setCancelAppt(null)}
        onSuccess={handleModalSuccess} veterinarians={veterinarians} services={services} pets={pets} users={users}
      />

      <AdminDeleteAppointmentModal
        isOpen={Boolean(deleteAppt)} appointment={deleteAppt}
        petName={getPet(deleteAppt?.petId || '', pets)?.name}
        serviceName={getServiceName(deleteAppt?.serviceId || '', services)}
        isDeleting={isDeleting} onClose={() => setDeleteAppt(null)} onConfirm={handleDeleteAppt}
      />
    </AppShell>
  );
}
