import type { ReactNode } from 'react';

export interface EmptyAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

/** Instead of a dead end: what is missing, why it matters, and buttons that lead there. */
export function EmptyState({
  icon,
  title,
  children,
  actions = [],
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  actions?: EmptyAction[];
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <strong>{title}</strong>
      {children && <small className="muted">{children}</small>}
      {actions.length > 0 && (
        <div className="empty-actions">
          {actions.map((a) => (
            <button
              key={a.label}
              className={`btn ${a.primary ? 'btn-primary' : ''}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
