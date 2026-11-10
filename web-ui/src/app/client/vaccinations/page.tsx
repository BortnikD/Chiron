'use client';

import React from 'react';
import { Syringe, AlertCircle } from 'lucide-react';
import { useClientVaccinations } from './_hooks/useClientVaccinations';
import { VaccinationsSummaryCards } from './_components/VaccinationsSummaryCards';
import { VaccinationsPetFilter } from './_components/VaccinationsPetFilter';
import { PetVaccinationPassport } from './_components/PetVaccinationPassport';

export default function ClientVaccinationsPage() {
  const {
    pets,
    speciesMap,
    selectedPetId,
    setSelectedPetId,
    loading,
    error,
    reload,
    filteredData,
    totalCount,
    overdueCount,
    soonCount,
  } = useClientVaccinations();

  return (
    <div className="scroll-col grow" style={{ maxWidth: '1000px', width: '100%' }}>
      <VaccinationsSummaryCards
        totalCount={totalCount}
        overdueCount={overdueCount}
        soonCount={soonCount}
        petsCount={pets.length}
      />

      <VaccinationsPetFilter
        pets={pets}
        selectedPetId={selectedPetId}
        onSelectPet={setSelectedPetId}
      />

      {error && (
        <div className="alert alert-destructive">
          <AlertCircle className="ic" />
          <div className="grow">{error}</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            Повторить
          </button>
        </div>
      )}

      {loading ? (
        <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
          Загрузка данных о вакцинации питомцев...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="island empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
          <Syringe className="ic muted" style={{ width: '36px', height: '36px', margin: '0 auto 12px', opacity: 0.5 }} />
          <span className="empty-title">Питомцы не найдены</span>
          <p className="small muted">Добавьте питомца в разделе «Питомцы», чтобы отслеживать график вакцинации</p>
        </div>
      ) : (
        <div className="col" style={{ gap: '16px' }}>
          {filteredData.map(({ pet, vaccines }) => (
            <PetVaccinationPassport
              key={pet.id}
              pet={pet}
              vaccines={vaccines}
              speciesMap={speciesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
