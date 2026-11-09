'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Stethoscope, ChevronRight } from 'lucide-react';
import { LandingDoctorsSectionProps, DoctorCardData } from './types';
import { getDoctorDisplay, KNOWN_DOCTORS } from '../../utils/doctorHelpers';

const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

const DEFAULT_DOCTORS: DoctorCardData[] = [
  {
    id: '5eed0006-0000-0000-0000-000000000001',
    name: 'Анна Иванова',
    fullName: 'Иванова Анна Сергеевна',
    initials: 'АИ',
    specName: 'Терапия',
    tone: 'ther',
    experienceYears: 8,
  },
  {
    id: '5eed0006-0000-0000-0000-000000000003',
    name: 'Елена Смирнова',
    fullName: 'Смирнова Елена Викторовна',
    initials: 'ЕС',
    specName: 'Хирургия',
    tone: 'surg',
    experienceYears: 12,
  },
  {
    id: '5eed0006-0000-0000-0000-000000000004',
    name: 'Олег Кузнецов',
    fullName: 'Кузнецов Олег Владимирович',
    initials: 'ОК',
    specName: 'Стоматология',
    tone: 'dent',
    experienceYears: 7,
  },
  {
    id: '5eed0006-0000-0000-0000-000000000002',
    name: 'Павел Петров',
    fullName: 'Петров Павел Игоревич',
    initials: 'ПП',
    specName: 'Терапия',
    tone: 'ther',
    experienceYears: 5,
  },
];

function formatExperience(years?: number): string {
  const y = typeof years === 'number' && years > 0 ? years : 5;
  const mod10 = y % 10;
  const mod100 = y % 100;
  let suffix = 'лет';
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) suffix = 'год';
    else if (mod10 >= 2 && mod10 <= 4) suffix = 'года';
  }
  return `стаж ${y} ${suffix}`;
}

function getDoctorCardName(fullNameOrName: string): string {
  const parts = fullNameOrName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    const isPatronymic = (p: string) => /(?:ович|евич|ич|овна|евна|ична|ыч)$/i.test(p);
    const nonPatronymic = parts.filter((p) => !isPatronymic(p));
    if (nonPatronymic.length === 2) {
      return `${nonPatronymic[0]} ${nonPatronymic[1]}`;
    }
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return fullNameOrName;
}

export const LandingDoctorsSection: React.FC<LandingDoctorsSectionProps> = ({
  vets = [],
  specializations = [],
}) => {
  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    specializations.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [specializations]);

  const doctorsList: DoctorCardData[] = useMemo(() => {
    if (!vets || vets.length === 0) {
      return DEFAULT_DOCTORS;
    }

    return vets.slice(0, 4).map((v) => {
      const known = v.id ? KNOWN_DOCTORS[v.id] : undefined;
      const display = getDoctorDisplay(v, specsMap);
      const tone = (v.specializationId && SPEC_TONES[v.specializationId]) || 'ther';
      const compactName = known?.shortName || getDoctorCardName(display.name);

      return {
        id: v.id,
        name: compactName,
        fullName: display.fullName,
        initials: display.initials,
        specName: display.specName,
        tone,
        experienceYears: v.experienceYears || 5,
        bio: v.bio || undefined,
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
        <div
          className="cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: '10px',
          }}
        >
          {doctorsList.map((doc) => (
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
                    {formatExperience(doc.experienceYears)}
                  </span>
                </span>
              </div>

              <div className="row" style={{ gap: '6px' }}>
                <span className="t-badge">{doc.specName}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
