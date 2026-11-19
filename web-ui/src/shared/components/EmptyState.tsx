import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  style,
}) => {
  return (
    <div className={`empty ${className}`.trim()} style={style}>
      {icon && <div className="empty-art">{icon}</div>}
      <span className="empty-title">{title}</span>
      {description && <span className="small muted">{description}</span>}
      {action}
    </div>
  );
};
