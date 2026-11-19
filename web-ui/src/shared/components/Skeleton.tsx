import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

/**
 * Базовый компонент скелетона с анимацией пульсации из chiron.css (.skeleton)
 */
export function Skeleton({
  className = '',
  style,
  width,
  height,
  borderRadius,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Круглый скелетон для аватаров и иконок
 */
export function SkeletonCircle({
  size = 40,
  className = '',
  style,
  ...props
}: Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'> & { size?: number | string }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
      style={{ flexShrink: 0, ...style }}
      {...props}
    />
  );
}
