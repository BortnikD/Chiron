'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Syringe, ChevronRight } from 'lucide-react';
import type { Vaccination, Pet } from '@/modules/client/types';
import { getMoscowDateKey } from '@/shared/lib';
import { getDueInfo } from './utils';

export interface ClientVaccinationsIslandProps {
  vaccinations: Vaccination[];
  pets: Pet[];
}

export function ClientVaccinationsIsland({
  vaccinations,
  pets,
}: ClientVaccinationsIslandProps) {
  const sortedUpcoming = useMemo(() => {
    const activePetIds = new Set(pets.filter((p) => !p.isArchived).map((p) => p.id));
    return vaccinations
      .filter((v) => {
        const due = v.nextDueOn || v.validUntil;
        if (!due) return false;
        return activePetIds.size === 0 || activePetIds.has(v.petId);
      })
      .sort((a, b) => {
        const ka = getMoscowDateKey(a.nextDueOn || a.validUntil) || '';
        const kb = getMoscowDateKey(b.nextDueOn || b.validUntil) || '';
        return ka.localeCompare(kb);
      })
      .slice(0, 4);
  }, [vaccinations, pets]);

  return (
    <section className="island" style={{ flex: 'none' }}>
      <div className="island-head">
        <span className="island-title">
          <Syringe className="ic" />
          Вакцинация
        </span>
        <Link href="/client/vaccinations" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
      <div className="island-body hm-list" style={{ paddingTop: 0 }}>
        {sortedUpcoming.length === 0 ? (
          <div className="empty" style={{ padding: '20px' }}>
            <span className="small muted">Нет предстоящих прививок</span>
          </div>
        ) : (
          sortedUpcoming.map((v) => {
            const pet = pets.find((p) => p.id === v.petId);
            const dueInfo = getDueInfo(v.nextDueOn || v.validUntil);
            const vacName = v.name || v.vaccineName || 'Вакцинация';

            return (
              <Link
                key={v.id}
                href={`/client/vaccinations?petId=${encodeURIComponent(v.petId)}&sel=${encodeURIComponent(v.id)}`}
                className={`hm-vac ${dueInfo.cls}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="hm-vac-ic">
                  <Syringe className="ic" />
                </span>
                <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                  <span className="cell-main hm-ell">
                    {pet?.name || 'Питомец'} — {vacName}
                  </span>
                  <span className="cell-sub">Следующая доза {dueInfo.label}</span>
                </span>
                <span className={`badge ${dueInfo.cls}`}>{dueInfo.text}</span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
