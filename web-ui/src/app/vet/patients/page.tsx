'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { vetApi, clinicApi } from '../../../api';
import { Pet, Vaccination, Appointment, Species } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  VetPatientsFilters,
  VetPatientsList,
  VetPatientDetailIsland,
  VetAddVaccinationModal,
  getSpeciesName,
} from './_components';

/**
 * Страница пациентов врача Chiron:
 * оркестратор списка пациентов, фильтрации по кличке/виду,
 * правого master-detail острова и модального окна добавления вакцинаций.
 */
export default function VetPatientsPage() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Выбранный пациент для правого master-detail острова
  const [selectedPatient, setSelectedPatient] = useState<Pet | null>(null);
  const [patientVacs, setPatientVacs] = useState<Vaccination[]>([]);

  // Состояние модального окна добавления вакцинации
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);

  // Загрузка первичных данных врача
  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsData, apptsData, speciesData] = await Promise.all([
        vetApi.getPatients().catch(() => [] as Pet[]),
        vetApi.getAppointments(0, 100).catch(() => ({ items: [] as Appointment[] })),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      const safePatients = Array.isArray(patientsData) ? patientsData : [];
      const safeAppts = apptsData?.items || [];
      const safeSpecies = Array.isArray(speciesData) ? speciesData : [];

      setPatients(safePatients);
      setAppointments(safeAppts);
      setSpeciesList(safeSpecies);

      if (selectedPatient) {
        const updated = safePatients.find((p: Pet) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    } catch (err) {
      console.error('Failed to load vet patients data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Загрузка вакцинаций выбранного пациента
  const loadPatientVaccinations = async (petId: string) => {
    try {
      const res = await vetApi.getVaccinations(0, 50, petId);
      setPatientVacs(res?.items || []);
    } catch {
      setPatientVacs([]);
    }
  };

  useEffect(() => {
    if (!selectedPatient) return;
    loadPatientVaccinations(selectedPatient.id);
  }, [selectedPatient]);

  // Обработчик успешного добавления новой вакцинации
  const handleVaccinationSuccess = async () => {
    if (selectedPatient) {
      await loadPatientVaccinations(selectedPatient.id);
    }
  };

  // Фильтрация пациентов по кличке или виду
  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      const pName = p.name.toLowerCase();
      const sName = getSpeciesName(speciesList, p.speciesId).toLowerCase();
      return pName.includes(q) || sName.includes(q);
    });
  }, [patients, search, speciesList]);

  return (
    <AppShell crumbGroup="Пациенты" crumb="Список">
      <div className="content-row">
        {/* Left Column: Table / Cards */}
        <div className="content-col grow">
          <section className="island grow">
            <VetPatientsFilters
              search={search}
              onSearchChange={setSearch}
              count={filteredPatients.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <VetPatientsList
              patients={filteredPatients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
              speciesList={speciesList}
              appointments={appointments}
              loading={loading}
              viewMode={viewMode}
            />
          </section>
        </div>

        {/* Right Column: Master-Detail Island (460px) */}
        {selectedPatient && (
          <VetPatientDetailIsland
            patient={selectedPatient}
            speciesList={speciesList}
            appointments={appointments}
            vaccinations={patientVacs}
            onClose={() => setSelectedPatient(null)}
            onAddVaccination={() => setIsAddVacOpen(true)}
          />
        )}
      </div>

      {/* Modal: Add Vaccination */}
      <VetAddVaccinationModal
        isOpen={isAddVacOpen && !!selectedPatient}
        patient={selectedPatient}
        onClose={() => setIsAddVacOpen(false)}
        onSuccess={handleVaccinationSuccess}
      />
    </AppShell>
  );
}
