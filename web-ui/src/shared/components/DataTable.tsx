'use client';

import React, { useMemo } from 'react';
import { PaginationFooter, type PaginationFooterProps } from './PaginationFooter';
import { Skeleton } from './Skeleton';

export interface DataTableColumn<T> {
  key: string;
  title: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  selectedId?: string | null;
  onRowClick?: (item: T) => void;
  paginationProps?: PaginationFooterProps;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  headerActions?: React.ReactNode;
  activeFilterChips?: React.ReactNode;
  className?: string;
  minWidth?: string;
  keepTableOnMobile?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}

/**
 * Унифицированный табличный компонент с поддержкой колонок, грид-раскладки,
 * состояний загрузки, пустых состояний, мобильной адаптивности и пагинации.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = 'Ничего не найдено',
  emptyIcon,
  selectedId,
  onRowClick,
  paginationProps,
  title,
  icon,
  count,
  headerActions,
  activeFilterChips,
  className = '',
  minWidth = '760px',
  keepTableOnMobile = false,
  compact = false,
  ariaLabel,
}: DataTableProps<T>) {
  const gridCols = useMemo(() => {
    return columns.map((c) => c.width || '1fr').join(' ');
  }, [columns]);

  const displayCount = count ?? paginationProps?.totalElements ?? data.length;

  return (
    <section
      className={`island grow ${className}`.trim()}
      aria-label={ariaLabel || (typeof title === 'string' ? title : 'Таблица данных')}
    >
      {(title || icon || headerActions) && (
        <div className="island-head">
          <div className="row items-center" style={{ gap: '8px' }}>
            {icon}
            {title && (
              <span className="island-title">
                {title}
                {displayCount !== undefined && (
                  <span className="count">Найдено: {displayCount}</span>
                )}
              </span>
            )}
          </div>
          {headerActions && <div className="row items-center">{headerActions}</div>}
        </div>
      )}

      {activeFilterChips && <div className="active-filters">{activeFilterChips}</div>}

      <div className="table-wrap">
        <div
          className={`dtable ${keepTableOnMobile ? 'keep-table' : ''}`}
          style={
            {
              '--cols': gridCols,
              minWidth,
            } as React.CSSProperties
          }
        >
          <div className="thead">
            {columns.map((col) => (
              <span
                key={col.key}
                className={`${col.align === 'right' ? 'right' : ''} ${col.headerClassName || ''}`.trim()}
              >
                {col.title}
              </span>
            ))}
          </div>

          {loading && data.length === 0 ? (
            Array.from({ length: Math.min(paginationProps?.pageSize || 6, 8) }).map((_, rIdx) => (
              <div key={`skel-row-${rIdx}`} className={`trow static ${compact ? 'compact' : ''}`}>
                {columns.map((col, cIdx) => {
                  const widths = ['65%', '85%', '50%', '75%', '40%', '90%'];
                  const w = widths[(rIdx + cIdx) % widths.length];
                  return (
                    <span
                      key={`skel-cell-${col.key}`}
                      className={`${col.align === 'right' ? 'right' : ''} ${col.className || ''}`.trim()}
                    >
                      <Skeleton
                        height="16px"
                        width={col.align === 'right' ? '50px' : w}
                        borderRadius="4px"
                        style={{ display: 'inline-block' }}
                      />
                    </span>
                  );
                })}
              </div>
            ))
          ) : (
            data.map((item, index) => {
              const rowKey = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || String(index);
              const isSelected = selectedId === rowKey;
              const isClickable = Boolean(onRowClick);

              return (
                <div
                  key={rowKey}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  className={`trow ${isSelected ? 'sel' : ''} ${!isClickable ? 'static' : ''} ${compact ? 'compact' : ''}`.trim()}
                  onClick={isClickable ? () => onRowClick?.(item) : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick?.(item);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <span
                      key={col.key}
                      className={`${col.align === 'right' ? 'right' : ''} ${col.className || ''}`.trim()}
                    >
                      {col.render(item, index)}
                    </span>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {!loading && data.length === 0 && (
          <div className="empty">
            {emptyIcon}
            <span className="empty-title">{emptyText}</span>
          </div>
        )}
      </div>

      {paginationProps && (
        <PaginationFooter
          page={paginationProps.page}
          pageSize={paginationProps.pageSize}
          totalElements={paginationProps.totalElements}
          totalPages={paginationProps.totalPages}
          loading={loading || paginationProps.loading}
          pageSizes={paginationProps.pageSizes}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
        />
      )}
    </section>
  );
}
