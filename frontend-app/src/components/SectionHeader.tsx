import { type ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  action,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
