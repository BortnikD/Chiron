export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_PIXELS = 20_000_000;
export const PHOTO_ACCEPT_ATTR = 'image/jpeg,image/png,.jpg,.jpeg,.png';

export interface PhotoEntity {
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  photoUrlExpiresAt?: string | null;
}

/**
 * Выбирает подходящий URL фотографии:
 * — `'thumb'` (64×64) для компактных аватаров до 32×32 CSS px;
 * — `'full'` (512×512) для крупных карточек и предпросмотров.
 */
export function resolvePhotoUrl(
  entity?: PhotoEntity | null,
  variant: 'thumb' | 'full' = 'thumb'
): string | null {
  if (!entity) return null;
  const primary = variant === 'thumb' ? entity.photoThumbnailUrl : entity.photoUrl;
  const fallback = variant === 'thumb' ? entity.photoUrl : entity.photoThumbnailUrl;
  const url = (primary || fallback || '').trim();
  return url || null;
}

/**
 * Проверяет, не истёк ли срок действия подписанной ссылки на фото.
 */
export function isPhotoUrlFresh(entity?: PhotoEntity | null, bufferMs = 30_000): boolean {
  if (!entity?.photoUrlExpiresAt) return true;
  const expiresAtMs = Date.parse(entity.photoUrlExpiresAt);
  if (Number.isNaN(expiresAtMs)) return true;
  return expiresAtMs > Date.now() + bufferMs;
}

/**
 * Проверяет выбранный файл перед загрузкой (формат JPEG/PNG, размер ≤ 5 МБ, разрешение ≤ 20 Мп).
 */
export async function validatePhotoFile(file: File): Promise<string | null> {
  if (!file || file.size <= 0) {
    return 'Выберите непустой файл изображения';
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return 'Размер фотографии не должен превышать 5 МБ';
  }

  const mime = (file.type || '').toLowerCase();
  const extMatch = /\.(jpe?g|png)$/i.test(file.name || '');
  const mimeAllowed = mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png';
  if (mime ? !mimeAllowed : !extMatch) {
    return 'Поддерживаются только изображения JPEG и PNG';
  }

  if (typeof window === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('decode_failed'));
      img.src = objectUrl;
    });

    if (
      dimensions.width <= 0 ||
      dimensions.height <= 0 ||
      dimensions.width * dimensions.height > MAX_PHOTO_PIXELS
    ) {
      return 'Разрешение изображения не должно превышать 20 млн пикселей';
    }
    return null;
  } catch {
    return 'Не удалось прочитать изображение. Проверьте, что файл является корректным JPEG или PNG';
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
