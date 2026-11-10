'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Syringe } from 'lucide-react';
import type { Pet, Vaccination } from '@/modules/client/types';
import { formatIsoDateDisplay, getMoscowDateKey } from '@/shared/lib';
import { getVaccinationStatus } from '../_hooks/useClientVaccinations';

export interface PetVaccinationPassportProps {
  pet: Pet;
  vaccines: Vaccination[];
  speciesMap: Record<string, string>;
}

export function PetVaccinationPassport({
  pet,
  vaccines,
  speciesMap,
}: PetVaccinationPassportProps) {
  const speciesLabel = pet.species?.name || pet.speciesName || speciesMap[pet.speciesId] || 'Питомец';

  return (
    <section className="island" style={{ padding: '20px' }}>
      <div className="island-head" style={{ marginBottom: '14px' }}>
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          <span
            className="avatar"
            style={{
              width: '38px',
              height: '38px',
              fontSize: '15px',
              fontWeight: 700,
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            {pet.name.charAt(0).toUpperCase()}
          </span>
          <div className="col" style={{ gap: '1px' }}>
            <span className="island-title" style={{ fontSize: '15px', fontWeight: 600 }}>
              {pet.name}
            </span>
            <span className="small muted">
              {speciesLabel}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </span>
          </div>
        </div>

        <Link
          href={`/client/book?petId=${pet.id}`}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <Plus className="ic" style={{ width: '14px', height: '14px' }} />
          <span>Записать на вакцинацию</span>
        </Link>
      </div>

      {vaccines.length === 0 ? (
        <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'var(--card)' }}>
          <span className="small muted">Вакцинаций в электронной медкарте пока нет</span>
          <div style={{ marginTop: '8px' }}>
            <Link href={`/client/book?petId=${pet.id}`} className="linkish small">
              Записаться на первичную вакцинацию
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <div
            className="dtable"
            style={{ '--cols': '1.8fr 1.2fr 1.2fr 1.2fr', minWidth: '550px' } as React.CSSProperties}
          >
            <div className="thead">
              <span>Вакцина</span>
              <span>Дата введения</span>
              <span>Следующая доза</span>
              <span>Статус</span>
            </div>
            {vaccines.map((v) => {
              const name = v.name || v.vaccineName || 'Вакцинация';
              const rawAdmin = v.administeredOn || v.administeredAt;
              const adminDate = rawAdmin
                ? formatIsoDateDisplay(getMoscowDateKey(rawAdmin) || rawAdmin)
                : '—';
              const rawNextDue = v.nextDueOn || v.validUntil;
              const nextDueDisplay = rawNextDue
                ? formatIsoDateDisplay(getMoscowDateKey(rawNextDue) || rawNextDue)
                : 'По показаниям';
              const status = getVaccinationStatus(rawNextDue);

              return (
                <div key={v.id} className="trow static">
                  <span className="row" style={{ gap: '8px', alignItems: 'center' }}>
                    <Syringe className="ic muted" style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    <span className="cell-main font-semibold">{name}</span>
                  </span>
                  <span className="tnum font-mono">{adminDate}</span>
                  <span className="tnum font-mono">{nextDueDisplay}</span>
                  <span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
