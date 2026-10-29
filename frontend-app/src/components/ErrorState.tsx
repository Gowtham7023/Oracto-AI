import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Unable to load data.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center ${className}`}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-rose-900">{message}</h3>
      <p className="mt-1 text-xs text-rose-600">
        Please verify the backend service is running or check your connection.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-800 shadow-xs hover:bg-rose-50 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
