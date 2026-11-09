'use client';

import React from 'react';
import Link from 'next/link';
import { Syringe, ChevronRight } from 'lucide-react';
import { ClientVaccinationsIslandProps } from './types';
import { getDueInfo } from './utils';

export function ClientVaccinationsIsland({
  vaccinations,
  pets,
}: ClientVaccinationsIslandProps) {
  return (
    <section className="island" style={{ flex: 'none' }}>
      <div className="island-head">
        <span className="island-title">
          <Syringe className="ic" />
          Вакцинация
        </span>
        <Link href="/client/appointments?tab=VACC" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
      <div className="island-body hm-list" style={{ paddingTop: 0 }}>
        {vaccinations.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
            Данных о прививках нет
          </div>
        ) : (
          vaccinations.slice(0, 4).map((v) => {
            const pet = pets.find((p) => p.id === v.petId);
            const dueInfo = getDueInfo(v.nextDueOn);

            return (
              <div
                key={v.id}
                className={`hm-vac ${dueInfo.cls}`}
              >
                <span className="hm-vac-ic">
                  <Syringe className="ic" />
                </span>
                <span className="col" style={{ gap: '1px', minWidth: 0 }}>
                  <span className="cell-main hm-ell">
                    {pet?.name || 'Питомец'} — {v.name}
                  </span>
                  <span className="cell-sub">
                    Следующая доза {dueInfo.label}
                  </span>
                </span>
                <span className={`badge ${dueInfo.cls}`}>
                  {dueInfo.text}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
