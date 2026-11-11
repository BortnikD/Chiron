'use client';

import React, { useEffect, useState } from 'react';
import { SpeciesIcon, type SpeciesIconType } from './SpeciesIcon';
import { resolvePhotoUrl, type PhotoEntity } from '@/shared/lib';

function inferVariantFromClassName(className: string): 'thumb' | 'full' {
  const tokens = className.split(/\s+/);
  if (
    tokens.includes('xs') ||
    tokens.includes('sm') ||
    tokens.includes('avatar-xs') ||
    (tokens.includes('avatar') && !tokens.includes('avatar-lg'))
  ) {
    return 'thumb';
  }
  return 'full';
}

export interface PhotoAvatarProps {
  photo?: PhotoEntity | null;
  variant?: 'thumb' | 'full';
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback: React.ReactNode;
}

/**
 * Универсальный аватар с автоматическим выбором 64×64 / 512×512
 * и безопасным откатом к инициалам или иконке при отсутствии либо ошибке загрузки фото.
 */
export const PhotoAvatar: React.FC<PhotoAvatarProps> = ({
  photo,
  variant,
  alt,
  className = '',
  style,
  fallback,
}) => {
  const resolvedVariant = variant ?? inferVariantFromClassName(className);
  const src = resolvePhotoUrl(photo, resolvedVariant);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showImg = Boolean(src && !imgFailed);
  const composedClass = showImg ? `${className} ava-has-photo`.trim() : className;

  return (
    <span className={composedClass} style={style}>
      {showImg && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="ava-img"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        fallback
      )}
    </span>
  );
};

export interface PetAvatarProps {
  pet?: (PhotoEntity & { name?: string | null }) | null;
  tone?: string;
  species?: SpeciesIconType;
  iconSize?: number;
  variant?: 'thumb' | 'full';
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Аватар питомца: отображает фото (или векторную иконку вида при отсутствии фото).
 */
export const PetAvatar: React.FC<PetAvatarProps> = ({
  pet,
  tone = 'cat',
  species,
  iconSize = 20,
  variant,
  className,
  style,
  alt,
}) => {
  const resolvedClass = className ?? `t-ava tone-${tone}`;
  return (
    <PhotoAvatar
      photo={pet}
      variant={variant}
      alt={alt || pet?.name || 'Фото питомца'}
      className={resolvedClass}
      style={style}
      fallback={<SpeciesIcon species={species || tone} size={iconSize} />}
    />
  );
};

export interface VetAvatarProps {
  vet?: (PhotoEntity & { fullName?: string | null }) | null;
  initials: string;
  tone?: string;
  variant?: 'thumb' | 'full';
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Аватар врача: отображает фото (или инициалы при отсутствии фото).
 */
export const VetAvatar: React.FC<VetAvatarProps> = ({
  vet,
  initials,
  tone,
  variant,
  className,
  style,
  alt,
}) => {
  const resolvedClass = className ?? `t-ava lg round${tone ? ` tone-${tone}` : ''}`;
  return (
    <PhotoAvatar
      photo={vet}
      variant={variant}
      alt={alt || vet?.fullName || 'Фото врача'}
      className={resolvedClass}
      style={style}
      fallback={initials}
    />
  );
};
