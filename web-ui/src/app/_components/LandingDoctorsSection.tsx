'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Stethoscope, ChevronRight } from 'lucide-react';
import { KNOWN_DOCTORS, getDoctorDisplay } from '@/utils/doctorHelpers';
import { getSpecTone, pluralRu, toIdNameMap } from '@/shared/lib';
import type { LandingDoctorsSectionProps, DoctorCardData } from './types';

const FALLBACK_DOCTOR_META: ReadonlyArray<{
  id: string;
  tone: string;
  experienceYears: number;
}> = [
  { id: '5eed0006-0000-0000-0000-000000000001', tone: 'ther', experienceYears: 8 },
  { id: '5eed0006-0000-0000-0000-000000000003', tone: 'surg', experienceYears: 12 },
  { id: '5eed0006-0000-0000-0000-000000000004', tone: 'dent', experienceYears: 7 },
  { id: '5eed0006-0000-0000-0000-000000000002', tone: 'ther', experienceYears: 5 },
];

export const LandingDoctorsSection: React.FC<LandingDoctorsSectionProps> = ({
  vets = [],
  specializations = [],
}) => {
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const doctorsList: DoctorCardData[] = useMemo(() => {
    if (!vets || vets.length === 0) {
      return FALLBACK_DOCTOR_META.map(({ id, tone, experienceYears }) => {
        const known = KNOWN_DOCTORS[id];
        const display = getDoctorDisplay({ id }, specsMap);

        return {
          id,
          name: known?.shortName ?? display.name,
          fullName: known?.fullName ?? display.fullName,
          initials: known?.initials ?? display.initials,
          specName: known?.specName ?? display.specName,
          tone,
          experienceYears,
        };
      });
    }

    return vets.slice(0, 4).map((v) => {
      const display = getDoctorDisplay(v, specsMap);

      return {
        id: v.id,
        name: display.name,
        fullName: display.fullName,
        initials: display.initials,
        specName: display.specName,
        tone: getSpecTone(v.specializationId),
        experienceYears: v.experienceYears || 5,
      };
    });
  }, [vets, specsMap]);

  return (
    <section className="island" style={{ flex: 'none' }} aria-label="Ведущие специалисты клиники">
      <div className="island-head">
        <span className="island-title">
          <Stethoscope className="ic" />
          Ведущие специалисты
        </span>
        <Link href="/veterinarians" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
          <span>Все врачи</span>
          <ChevronRight className="ic" />
        </Link>
      </div>
      <div className="island-body" style={{ paddingTop: 0 }}>
        <div className="cards">
          {doctorsList.map((doc) => {
            const years = doc.experienceYears > 0 ? doc.experienceYears : 5;
            return (
              <Link
                key={doc.id}
                href={`/veterinarians?spec=${doc.tone}`}
                className={`tcard tone-${doc.tone}`}
                style={{
                  textDecoration: 'none',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="tcard-head"
                  style={{
                    minHeight: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  <span className="t-ava lg round" style={{ flexShrink: 0 }}>
                    {doc.initials}
                  </span>
                  <span className="col" style={{ gap: '2px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <span
                      className="tcard-title"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        display: 'block',
                        fontWeight: 600,
                        fontSize: '15px',
                      }}
                      title={doc.fullName}
                    >
                      {doc.name}
                    </span>
                    <span
                      className="cell-sub"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        fontSize: '12.5px',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {`стаж ${years} ${pluralRu(years, 'год', 'года', 'лет')}`}
                    </span>
                  </span>
                </div>

                <div className="row" style={{ gap: '6px' }}>
                  <span className="t-badge">{doc.specName}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
