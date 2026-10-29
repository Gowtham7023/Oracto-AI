import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: "positive" | "negative" | "neutral" | "warning";
  };
  accentColor?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  className?: string;
  action?: ReactNode;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  className = "",
  action,
}: MetricCardProps) {
  const badgeColors = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    negative: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-100">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {badge && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
              badgeColors[badge.variant ?? "neutral"]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.direction === "up"
                ? "text-emerald-600"
                : trend.direction === "down"
                ? "text-rose-600"
                : "text-slate-500"
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      )}

      {action && <div className="mt-3 pt-3 border-t border-slate-100">{action}</div>}
    </div>
  );
}
