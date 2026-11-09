export function getPetAge(birthDate?: string | null): string {
  if (!birthDate) return 'возраст не указан';
  const years = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 86400000)
  );
  if (years <= 0) return 'до года';
  if (years === 1) return '1 год';
  if (years < 5) return `${years} года`;
  return `${years} лет`;
}

export function getSpeciesTone(speciesId?: string, speciesMap?: Record<string, string>): string {
  const spName = speciesId && speciesMap ? speciesMap[speciesId] || '' : '';
  const norm = spName.toLowerCase();
  if (norm.includes('соб') || norm.includes('dog')) return 'dog';
  if (norm.includes('крол')) return 'rab';
  if (norm.includes('попуг') || norm.includes('птиц')) return 'par';
  return 'cat';
}

export function getCountdown(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return 'сейчас';
  if (diffMin < 60) return `через ${diffMin} мин`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `через ${diffHours} ч`;
  const diffDays = Math.round(diffHours / 24);
  return `через ${diffDays} дн`;
}

export function getDueInfo(dateStr?: string | null): { text: string; cls: string; label: string } {
  if (!dateStr) return { text: 'не задана', cls: '', label: '—' };
  const target = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = target.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (diffDays < 0) return { text: 'просрочена', cls: 'due-over', label };
  if (diffDays <= 7) {
    return { text: diffDays === 0 ? 'сегодня' : `через ${diffDays} дн.`, cls: 'due-soon', label };
  }
  const months = Math.round(diffDays / 30);
  return { text: `через ${months} мес.`, cls: 'due-later', label };
}
