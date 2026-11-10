'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import type { Pet } from '@/modules/client/types';

export interface VaccinationsPetFilterProps {
  pets: Pet[];
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
}

export function VaccinationsPetFilter({
  pets,
  selectedPetId,
  onSelectPet,
}: VaccinationsPetFilterProps) {
  return (
    <section className="island" style={{ padding: '16px 20px' }}>
      <div className="row between wrap" style={{ alignItems: 'center', gap: '12px' }}>
        <div className="seg" role="tablist">
          <button
            type="button"
            className={`seg-item ${selectedPetId === 'all' ? 'on font-semibold' : ''}`}
            onClick={() => onSelectPet('all')}
          >
            <span>Все питомцы</span>
            <span className="small muted font-mono">({pets.length})</span>
          </button>
          {pets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`seg-item ${selectedPetId === p.id ? 'on font-semibold' : ''}`}
              onClick={() => onSelectPet(p.id)}
            >
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <Link
          href="/client/book"
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <Calendar className="ic" style={{ width: '15px', height: '15px' }} />
          <span>Записаться на прививку</span>
        </Link>
      </div>
    </section>
  );
}
