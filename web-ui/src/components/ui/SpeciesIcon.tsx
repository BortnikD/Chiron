'use client';

import React from 'react';

export type SpeciesIconType = 'cat' | 'dog' | 'rab' | 'par' | string;

interface SpeciesIconProps extends React.SVGProps<SVGSVGElement> {
  species?: SpeciesIconType;
  size?: number;
}

export const SpeciesIcon: React.FC<SpeciesIconProps> = ({
  species = 'cat',
  size = 18,
  className = 'ic',
  style,
  ...props
}) => {
  const norm = species.toLowerCase();

  if (norm.includes('dog') || norm.includes('соб') || norm.includes('5eed0001-0000-0000-0000-000000000002')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <path d="M11.25 16.25h1.5L12 17z" />
        <path d="M16 14v.5" />
        <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" />
        <path d="M8 14v.5" />
        <path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" />
      </svg>
    );
  }

  if (norm.includes('rab') || norm.includes('крол') || norm.includes('5eed0001-0000-0000-0000-000000000003')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <path d="M13 16a3 3 0 0 1 2.24 5" />
        <path d="M18 12h.01" />
        <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />
        <path d="M20 8.54V4a2 2 0 1 0-4 0v3" />
        <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" />
      </svg>
    );
  }

  if (norm.includes('par') || norm.includes('попуг') || norm.includes('птиц') || norm.includes('5eed0001-0000-0000-0000-000000000004')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        {...props}
      >
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
      </svg>
    );
  }

  // По умолчанию — кошка
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M8 14v.5" />
      <path d="M16 14v.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </svg>
  );
};
