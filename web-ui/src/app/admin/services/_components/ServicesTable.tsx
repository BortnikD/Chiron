'use client';

import React, { useMemo } from 'react';
import { ClipboardList, Edit2, Trash2 } from 'lucide-react';
import type {
  Service,
  Specialization,
  Species,
  ServiceSpecies,
} from '@/modules/clinic/types';
import { formatCurrency, toIdNameMap } from '@/shared/lib';
import { DataTable, type DataTableColumn } from '@/shared/components';

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
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const columns = useMemo<DataTableColumn<Service>[]>(() => {
    return [
      {
        key: 'name',
        title: 'Название ↑',
        width: '1.7fr',
        render: (r) => <span className="cell-main">{r.name}</span>,
      },
      {
        key: 'specialization',
        title: 'Специализация',
        width: '1fr',
        render: (r) => <span className="muted">{specsMap[r.specializationId] || '—'}</span>,
      },
      {
        key: 'price',
        title: 'Цена',
        width: '0.7fr',
        align: 'right',
        render: (r) => <span className="right tnum">{formatCurrency(r.basePrice)}</span>,
      },
      {
        key: 'duration',
        title: 'Длит.',
        width: '0.7fr',
        align: 'right',
        render: (r) => <span className="right tnum">{r.baseDurationMin} мин</span>,
      },
      {
        key: 'buffer',
        title: 'Буфер',
        width: '0.6fr',
        align: 'right',
        render: (r) => <span className="right tnum">{r.bufferAfterMin} мин</span>,
      },
      {
        key: 'species',
        title: 'Виды',
        width: '1.3fr',
        render: (r) => {
          const links = serviceSpeciesMap[r.id] || [];
          return (
            <span className="chips">
              {links.length > 0 ? (
                links.map((l) => (
                  <span key={l.speciesId} className="badge badge-outline">
                    {speciesMap[l.speciesId] || '—'}
                  </span>
                ))
              ) : (
                <span className="small muted">Нет видов</span>
              )}
            </span>
          );
        },
      },
      {
        key: 'status',
        title: 'Статус',
        width: '1.1fr',
        render: (r) => (
          <span className="row between" style={{ alignItems: 'center', width: '100%' }}>
            <span className={`badge ${r.isActive ? 'badge-accent' : 'badge-outline'}`}>
              {r.isActive ? 'Активна' : 'Отключена'}
            </span>
            {(onEditService || onDeleteService) && (
              <span className="row-actions" onClick={(e) => e.stopPropagation()}>
                {onEditService && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Редактировать услугу «${r.name}»`}
                    title="Редактировать"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditService(r);
                    }}
                  >
                    <Edit2 size={13} />
                  </button>
                )}
                {onDeleteService && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Удалить услугу «${r.name}»`}
                    title="Удалить"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteService(r);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            )}
          </span>
        ),
      },
    ];
  }, [specsMap, speciesMap, serviceSpeciesMap, onEditService, onDeleteService]);

  return (
    <DataTable<Service>
      title="Услуги"
      icon={<ClipboardList size={18} />}
      columns={columns}
      data={services}
      selectedId={selectedService?.id}
      onRowClick={onSelectService}
      loading={loading}
      emptyText="Услуги не найдены"
      minWidth="860px"
      count={services.length}
    />
  );
};
