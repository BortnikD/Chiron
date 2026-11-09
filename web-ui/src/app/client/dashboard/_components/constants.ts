export const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

export const ST_COL: Record<string, string> = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
};

export const SP_TONE: Record<string, string> = {
  cat: 'var(--chart-3)',
  dog: 'var(--chart-2)',
  rab: 'var(--chart-4)',
  par: 'var(--chart-1)',
};
