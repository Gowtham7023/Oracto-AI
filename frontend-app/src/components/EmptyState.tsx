import { type ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionText && actionHref && (
        <Link
          to={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition"
        >
          {actionText}
        </Link>
      )}
      {actionText && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
        >
          {actionText}
        </button>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
