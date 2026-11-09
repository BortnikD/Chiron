// Design tokens matching prototype and chiron.css
export const ST_COLORS = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
} as const;

export const ST_LABELS = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
} as const;

export const DOWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DP_MONS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Prototype realistic default datasets for 01.10.2026 — 31.10.2026
export const PROTOTYPE_OVERVIEW = {
  totalAppointments: 50,
  completed: 30,
  cancelled: 4,
  noShow: 4,
  pending: 6,
  confirmed: 6,
  revenue: 72200,
  expectedRevenue: 20800,
  averageCheck: 2407,
  followUps: 7,
  newClients: 3,
  newPets: 6,
  totalClients: 10,
  totalPets: 22,
};

export const PROTOTYPE_VETS = [
  {
    veterinarianId: 'v1',
    fullName: 'И. И. Петров',
    appointments: 27,
    completed: 15,
    active: 9,
    cancelled: 2,
    noShows: 1,
    revenue: 24600,
  },
  {
    veterinarianId: 'v2',
    fullName: 'М. А. Соколова',
    appointments: 11,
    completed: 7,
    active: 2,
    cancelled: 1,
    noShows: 1,
    revenue: 21500,
  },
  {
    veterinarianId: 'v3',
    fullName: 'О. В. Ким',
    appointments: 8,
    completed: 5,
    active: 1,
    cancelled: 1,
    noShows: 1,
    revenue: 14200,
  },
  {
    veterinarianId: 'v4',
    fullName: 'Е. П. Морозова',
    appointments: 4,
    completed: 3,
    active: 0,
    cancelled: 0,
    noShows: 1,
    revenue: 11900,
  },
];

export const PROTOTYPE_SERVICES = [
  { name: 'Первичный осмотр', spec: 'Терапия', total: 18, done: 14, rev: 21000 },
  { name: 'Кастрация кота', spec: 'Хирургия', total: 4, done: 4, rev: 18000 },
  { name: 'Стерилизация собаки', spec: 'Хирургия', total: 2, done: 2, rev: 18000 },
  { name: 'УЗИ брюшной полости', spec: 'Терапия', total: 5, done: 4, rev: 10000 },
  { name: 'Повторный осмотр', spec: 'Терапия', total: 8, done: 6, rev: 6000 },
  { name: 'Ультразвуковая чистка зубов', spec: 'Стоматология', total: 2, done: 1, rev: 3500 },
  { name: 'Удаление зуба', spec: 'Стоматология', total: 1, done: 1, rev: 2000 },
];

export const PROTOTYPE_SPECIES = [
  { name: 'Кошка', pets: 12, total: 28, rev: 38200, color: 'var(--chart-1)' },
  { name: 'Собака', pets: 7, total: 16, rev: 29500, color: 'var(--chart-2)' },
  { name: 'Кролик', pets: 2, total: 4, rev: 3500, color: 'var(--chart-3)' },
  { name: 'Попугай', pets: 1, total: 2, rev: 1000, color: 'var(--chart-4)' },
];

export const PROTOTYPE_TIMELINE_HEIGHTS: [number, number][] = [
  [1, 1], [1, 1], [1, 1], [2, 2], [1, 1],
  [3, 0], [1, 1], [2, 1], [1, 1], [4, 4],
  [4, 4], [0, 0], [1, 0], [0, 0], [1, 1],
  [1, 1], [4, 4], [1, 1], [0, 0], [0, 0],
  [2, 2], [1, 0], [4, 4], [1, 1], [3, 1],
  [0, 0], [9, 3], [1, 0], [1, 0], [3, 0],
  [1, 0],
];
