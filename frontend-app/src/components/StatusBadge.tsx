interface ComplexityBadgeProps {
  complexity: string;
  size?: "sm" | "md";
}

export function ComplexityBadge({ complexity, size = "md" }: ComplexityBadgeProps) {
  const norm = complexity?.toLowerCase() || "simple";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  if (norm === "complex") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 font-medium text-purple-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        Complex
      </span>
    );
  }

  if (norm === "moderate") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 font-medium text-amber-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Moderate
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-medium text-emerald-700 ${sizeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Simple
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = status?.toLowerCase() || "";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  if (norm === "passed" || norm === "pass" || norm === "verified") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-medium text-emerald-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Passed
      </span>
    );
  }

  if (norm === "failed" || norm === "fail") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 font-medium text-rose-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Failed
      </span>
    );
  }

  if (norm === "escalated") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 font-medium text-purple-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        Escalated
      </span>
    );
  }

  if (norm === "fallback") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 font-medium text-orange-700 ${sizeClasses}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Fallback
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 font-medium text-slate-700 ${sizeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {status || "Unknown"}
    </span>
  );
}

interface QualityTierBadgeProps {
  tier: number;
}

export function QualityTierBadge({ tier }: QualityTierBadgeProps) {
  if (tier >= 3) {
    return (
      <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
        Tier 3
      </span>
    );
  }
  if (tier === 2) {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        Tier 2
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Tier 1
    </span>
  );
}

interface ProviderBadgeProps {
  provider: string;
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const norm = provider?.toLowerCase() || "";
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-500";

  if (norm === "ollama") {
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    dotColor = "bg-blue-500";
  } else if (norm === "gemini") {
    badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
    dotColor = "bg-purple-500";
  } else if (norm === "claude") {
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    dotColor = "bg-amber-500";
  } else if (norm === "openai") {
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotColor = "bg-emerald-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${badgeColor}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {provider}
    </span>
  );
}
