/**
 * Утилиты форматирования дат, валют и чисел для ветеринарной системы Chiron.
 */

export function formatCurrency(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return '0 ₽';
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function formatDateRu(isoStr?: string | null, includeYear = true): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: includeYear ? 'numeric' : undefined,
    });
  } catch {
    return isoStr;
  }
}

export function formatDateShort(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return isoStr;
  }
}

export function pluralRu(count: number, one: string, two: string, five: string): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
}

export function calculateAgeRu(birthDate?: string | null): string {
  if (!birthDate) return '—';
  try {
    const b = new Date(birthDate);
    const now = new Date();
    if (isNaN(b.getTime())) return '—';

    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();

    if (months < 0 || (months === 0 && now.getDate() < b.getDate())) {
      years--;
      months += 12;
    }

    if (years <= 0 && months <= 0) {
      return 'Меньше месяца';
    }

    if (years <= 0) {
      return `${months} ${pluralRu(months, 'месяц', 'месяца', 'месяцев')}`;
    }

    if (months === 0) {
      return `${years} ${pluralRu(years, 'год', 'года', 'лет')}`;
    }

    return `${years} ${pluralRu(years, 'г.', 'г.', 'л.')} ${months} мес.`;
  } catch {
    return '—';
  }
}
