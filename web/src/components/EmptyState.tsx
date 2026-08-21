import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  hint?: string;
  children?: ReactNode;
}

export function EmptyState({ icon = "🔍", title, hint, children }: EmptyStateProps) {
  return (
    <div className="no-products">
      <span className="empty-icon" aria-hidden="true">
        {icon}
      </span>
      <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>{title}</p>
      {hint && <p style={{ fontSize: "var(--text-sm)" }}>{hint}</p>}
      {children}
    </div>
  );
}
