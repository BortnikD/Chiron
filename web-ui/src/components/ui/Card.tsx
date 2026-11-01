import React, { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all ${
        hoverable
          ? 'hover:border-slate-300 hover:shadow-md cursor-pointer active:scale-[0.99]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
