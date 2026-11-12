'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  const safeTotal = Math.max(1, totalPages);
  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, i) => i);
  }

  const tokens: PageToken[] = [0];
  let winStart: number;
  let winEnd: number;

  if (currentPage <= 2) {
    winStart = 1;
    winEnd = 3;
  } else if (currentPage >= safeTotal - 3) {
    winStart = safeTotal - 4;
    winEnd = safeTotal - 2;
  } else {
    winStart = currentPage - 1;
    winEnd = currentPage + 1;
  }

  if (winStart > 1) tokens.push('ellipsis-left');
  for (let i = winStart; i <= winEnd; i += 1) {
    tokens.push(i);
  }
  if (winEnd < safeTotal - 2) tokens.push('ellipsis-right');
  tokens.push(safeTotal - 1);

  return tokens;
}

export interface PaginationFooterProps {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  loading?: boolean;
  pageSizes?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const PaginationFooter: React.FC<PaginationFooterProps> = ({
  page,
  pageSize,
  totalElements,
  totalPages,
  loading = false,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const tokens = useMemo(
    () => buildPageTokens(safePage, safeTotalPages),
    [safePage, safeTotalPages]
  );

  const [jumpValue, setJumpValue] = useState(String(safePage + 1));

  useEffect(() => {
    setJumpValue(String(safePage + 1));
  }, [safePage]);

  const startItem = totalElements === 0 ? 0 : safePage * pageSize + 1;
  const endItem =
    totalElements === 0 ? 0 : Math.min(totalElements, (safePage + 1) * pageSize);

  const commitJump = () => {
    const parsed = Number.parseInt(jumpValue.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setJumpValue(String(safePage + 1));
      return;
    }
    const clamped = Math.min(Math.max(1, parsed), safeTotalPages) - 1;
    setJumpValue(String(clamped + 1));
    if (clamped !== safePage) {
      onPageChange(clamped);
    }
  };

  return (
    <div className="island-foot">
      <div className="row wrap small muted" style={{ gap: '12px', alignItems: 'center' }}>
        <span className="tnum">
          {totalElements > 0
            ? `Показано ${startItem}–${endItem} из ${totalElements}`
            : 'Записей: 0'}
        </span>

        {onPageSizeChange && (
          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <span>На странице</span>
            <div className="seg">
              {pageSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`seg-item ${pageSize === sz ? 'on' : ''}`}
                  disabled={loading}
                  onClick={() => onPageSizeChange(sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pager" style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon"
          disabled={safePage <= 0 || loading}
          aria-label="Предыдущая страница"
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
        >
          <ChevronLeft className="ic" />
        </button>

        {tokens.map((tok) =>
          typeof tok === 'number' ? (
            <button
              key={tok}
              type="button"
              className={`btn btn-ghost btn-sm ${tok === safePage ? 'on' : ''}`}
              disabled={loading}
              aria-current={tok === safePage ? 'page' : undefined}
              onClick={() => onPageChange(tok)}
            >
              {tok + 1}
            </button>
          ) : (
            <span
              key={tok}
              className="small muted"
              style={{ padding: '0 4px', userSelect: 'none' }}
              aria-hidden="true"
            >
              …
            </span>
          )
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon"
          disabled={safePage >= safeTotalPages - 1 || loading}
          aria-label="Следующая страница"
          onClick={() => onPageChange(Math.min(safeTotalPages - 1, safePage + 1))}
        >
          <ChevronRight className="ic" />
        </button>

        {safeTotalPages > 7 && (
          <form
            className="row"
            style={{ gap: '4px', alignItems: 'center', marginLeft: '6px' }}
            onSubmit={(e) => {
              e.preventDefault();
              commitJump();
            }}
          >
            <span className="small muted">Стр.</span>
            <input
              type="number"
              min={1}
              max={safeTotalPages}
              inputMode="numeric"
              className="input input-sm tnum"
              style={{ width: '58px', height: '30px', padding: '0 6px', textAlign: 'center' }}
              aria-label="Перейти к странице"
              value={jumpValue}
              disabled={loading}
              onChange={(e) => setJumpValue(e.target.value)}
              onBlur={commitJump}
            />
          </form>
        )}
      </div>
    </div>
  );
};
