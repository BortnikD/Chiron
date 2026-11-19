'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Syringe, AlertCircle, Plus } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { Skeleton, SkeletonCircle } from '@/shared/components';
import { useClientVaccinations } from './_hooks/useClientVaccinations';
import { VaccinationsSummaryCards } from './_components/VaccinationsSummaryCards';
import { VaccinationsPetFilter } from './_components/VaccinationsPetFilter';
import { PetVaccinationPassport } from './_components/PetVaccinationPassport';
import { VaccinationDetailIsland } from './_components/VaccinationDetailIsland';

function VaccinationsContent() {
  const searchParams = useSearchParams();
  const petIdParam = searchParams.get('petId');
  const selParam = searchParams.get('sel');

  const {
    pets,
    petsMap,
    petVaccines,
    speciesMap,
    selectedPetId,
    setSelectedPetId,
    selectedVac,
    setSelectedVac,
    loading,
    error,
    reload,
    filteredData,
    totalCount,
    overdueCount,
    soonCount,
  } = useClientVaccinations(petIdParam, selParam);

  useShellHeader({
    crumbGroup: 'Кабинет',
    crumb: 'Прививки',
    crumb2: selectedVac ? selectedVac.name || selectedVac.vaccineName || 'Прививка' : undefined,
  });

  return (
    <div className="content-row">
      <div className="scroll-col grow">
        <VaccinationsSummaryCards
          totalCount={totalCount}
          overdueCount={overdueCount}
          soonCount={soonCount}
          petsCount={pets.length}
        />

        <VaccinationsPetFilter
          petVaccines={petVaccines}
          speciesMap={speciesMap}
          selectedPetId={selectedPetId}
          onSelectPet={setSelectedPetId}
        />

        {error && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle className="ic" />
            <div className="grow">{error}</div>
            <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
              Повторить
            </button>
          </div>
        )}

        {loading ? (
          <div className="col" style={{ gap: 'var(--gap)' }}>
            {[1, 2].map((i) => (
              <section key={`vac-skel-${i}`} className="island" style={{ padding: '16px' }}>
                <div className="island-head" style={{ marginBottom: '16px' }}>
                  <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                    <SkeletonCircle size={40} />
                    <div className="col" style={{ gap: '6px' }}>
                      <Skeleton width="130px" height="18px" borderRadius="4px" />
                      <Skeleton width="100px" height="13px" borderRadius="4px" />
                    </div>
                  </div>
                </div>
                <div className="col" style={{ gap: '8px' }}>
                  {[1, 2, 3].map((r) => (
                    <div
                      key={r}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div className="row items-center" style={{ gap: '12px' }}>
                        <Skeleton width="18px" height="18px" borderRadius="4px" />
                        <div className="col" style={{ gap: '4px' }}>
                          <Skeleton width="140px" height="15px" borderRadius="4px" />
                          <Skeleton width="180px" height="12px" borderRadius="4px" />
                        </div>
                      </div>
                      <Skeleton width="90px" height="22px" borderRadius="12px" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="island grow">
            <div className="empty">
              <div className="empty-art">
                <Syringe className="ic ic-40" />
              </div>
              <span className="empty-title">Питомцы не найдены</span>
              <span>Добавьте питомца, чтобы отслеживать график вакцинации</span>
              <Link href="/client/pets?action=create" className="btn btn-primary">
                <Plus className="ic" />
                <span>Добавить питомца</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="col" style={{ gap: 'var(--gap)' }}>
            {filteredData.map(({ pet, vaccines }) => (
              <PetVaccinationPassport
                key={pet.id}
                pet={pet}
                vaccines={vaccines}
                speciesMap={speciesMap}
                selectedVacId={selectedVac?.id}
                onSelectVac={setSelectedVac}
              />
            ))}
          </div>
        )}
      </div>

      {selectedVac && (
        <VaccinationDetailIsland
          vaccination={selectedVac}
          pet={petsMap[selectedVac.petId]}
          onClose={() => setSelectedVac(null)}
        />
      )}
    </div>
  );
}

export default function ClientVaccinationsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка прививок...</span>
          </div>
        </div>
      }
    >
      <VaccinationsContent />
    </Suspense>
  );
}
