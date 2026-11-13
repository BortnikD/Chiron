export type PickerMode = 'days' | 'months' | 'years';

export const DP_MON = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

export const DP_MS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

export const p2 = (n: number) => String(n).padStart(2, '0');

export function normalizeIso(val: string): string {
  if (!val) return '';
  return /^\d{4}-\d{2}-\d{2}/.test(val) ? val.slice(0, 10) : '';
}

export function formatIsoLabel(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

export function shiftMonthIso(y: number, m: number): string {
  const d = new Date(Date.UTC(y, m - 1, 1));
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}`;
}

export function getPickerTitle(mode: PickerMode, vy: number, vm: number): string {
  if (mode === 'days') return `${DP_MON[vm - 1]} ${vy}`;
  if (mode === 'months') return String(vy);
  const start = Math.floor(vy / 12) * 12;
  return `${start} – ${start + 11}`;
}

export function buildDayCells(
  vy: number,
  vm: number,
  todayIso: string,
  cleanValue: string,
  okDay: (iso: string) => boolean
) {
  const first = new Date(Date.UTC(vy, vm - 1, 1));
  const shift = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(vy, vm - 1, 1 - shift + i));
    const iso = `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
    const ok = okDay(iso);
    const cls = [
      d.getUTCMonth() + 1 !== vm ? 'out' : '',
      iso === todayIso ? 'today' : '',
      iso === cleanValue ? 'on' : '',
      ok ? '' : 'disabled',
      (d.getUTCDay() + 6) % 7 >= 5 ? 'we' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return { n: d.getUTCDate(), iso, ok, cls };
  });
}

export function buildMonthCells(vy: number, todayIso: string, cleanValue: string) {
  const todayY = Number(todayIso.slice(0, 4));
  const todayM = Number(todayIso.slice(5, 7));
  const valY = cleanValue ? Number(cleanValue.slice(0, 4)) : -1;
  const valM = cleanValue ? Number(cleanValue.slice(5, 7)) : -1;
  return DP_MS.map((m, i) => ({
    n: m,
    idx: i + 1,
    cls: [valY === vy && valM === i + 1 ? 'on' : '', todayY === vy && todayM === i + 1 ? 'today' : '']
      .filter(Boolean)
      .join(' '),
  }));
}

export function buildYearCells(vy: number, todayIso: string, cleanValue: string) {
  const y0 = Math.floor(vy / 12) * 12;
  const todayY = Number(todayIso.slice(0, 4));
  const valY = cleanValue ? Number(cleanValue.slice(0, 4)) : -1;
  return Array.from({ length: 12 }, (_, i) => {
    const yr = y0 + i;
    return {
      n: String(yr),
      year: yr,
      cls: [valY === yr ? 'on' : '', yr === todayY ? 'today' : ''].filter(Boolean).join(' '),
    };
  });
}
