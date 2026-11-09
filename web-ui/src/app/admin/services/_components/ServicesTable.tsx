'use client';

import React from 'react';
import { ClipboardList, Edit2, Trash2 } from 'lucide-react';
import { Service, Specialization, Species, ServiceSpecies } from '../../../../types';

export interface ServicesTableProps {
  services: Service[];
  loading: boolean;
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  specializations: Specialization[];
  speciesList: Species[];
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  loading,
  selectedService,
  onSelectService,
  serviceSpeciesMap,
  specializations,
  speciesList,
  onEditService,
  onDeleteService,
}) => {
  const getSpecName = (specId?: string) => {
    if (!specId) return '—';
    const s = specializations.find((sp) => sp.id === specId);
    return s ? s.name : '—';
  };

  const getSpeciesName = (spId?: string) => {
    if (!spId) return '—';
    const s = speciesList.find((sp) => sp.id === spId);
    return s ? s.name : '—';
  };

  return (
    <section className="island grow">
      <div className="island-head">
        <span className="island-title">
          <ClipboardList size={18} />
          Услуги <span className="count">{services.length} · включая неактивные</span>
        </span>
      </div>

      <div className="table-wrap">
        <div
          className="dtable"
          style={
            {
              '--cols': '1.7fr 1fr 0.7fr 0.7fr 0.6fr 1.3fr 0.7fr',
              minWidth: '860px',
            } as React.CSSProperties
          }
        >
          <div className="thead">
            <span>Название ↑</span>
            <span>Специализация</span>
            <span className="right">Цена</span>
            <span className="right">Длит.</span>
            <span className="right">Буфер</span>
            <span>Виды</span>
            <span>Статус</span>
          </div>

          {services.map((r) => {
            const isSelected = selectedService?.id === r.id;
            const links = serviceSpeciesMap[r.id] || [];

            return (
              <button
                key={r.id}
                type="button"
                className={`trow ${isSelected ? 'sel' : ''}`}
                onClick={() => onSelectService(r)}
              >
                <span className="cell-main">{r.name}</span>
                <span className="muted">{getSpecName(r.specializationId)}</span>
                <span className="right tnum">{r.basePrice.toLocaleString('ru-RU')} ₽</span>
                <span className="right tnum">{r.baseDurationMin} мин</span>
                <span className="right tnum">{r.bufferAfterMin} мин</span>
                <span className="chips">
                  {links.length > 0 ? (
                    links.map((l) => (
                      <span key={l.speciesId} className="badge badge-outline">
                        {getSpeciesName(l.speciesId)}
                      </span>
                    ))
                  ) : (
                    <span className="small muted">Нет видов</span>
                  )}
                </span>
                <span className="row between" style={{ alignItems: 'center' }}>
                  <span
                    className={`badge ${r.isActive ? 'badge-accent' : 'badge-outline'}`}
                  >
                    {r.isActive ? 'Активна' : 'Отключена'}
                  </span>
                  {(onEditService || onDeleteService) && (
                    <span
                      className="row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEditService && (
                        <span
                          className="btn btn-ghost btn-icon btn-sm"
                          role="button"
                          tabIndex={0}
                          title="Редактировать"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditService(r);
                          }}
                        >
                          <Edit2 size={13} />
                        </span>
                      )}
                      {onDeleteService && (
                        <span
                          className="btn btn-ghost btn-icon btn-sm"
                          role="button"
                          tabIndex={0}
                          title="Удалить"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteService(r);
                          }}
                        >
                          <Trash2 size={13} />
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {services.length === 0 && !loading && (
          <div className="empty">
            <span className="empty-title">Услуги не найдены</span>
          </div>
        )}
      </div>
    </section>
  );
};
