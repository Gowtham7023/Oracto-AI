interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({
  message = "Loading...",
  rows = 3,
}: LoadingStateProps) {
  return (
    <div className="space-y-4 py-8">
      <div className="flex items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-600">{message}</span>
      </div>

      <div className="space-y-3 max-w-4xl mx-auto pt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
