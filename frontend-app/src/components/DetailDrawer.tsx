import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  width?: string;
}

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  width = "max-w-2xl",
}: DetailDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          className={`w-screen ${width} bg-white border-l border-slate-200 shadow-2xl flex flex-col`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {badge}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 font-mono">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
