import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: StatCardProps) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border p-5 transition-colors ${
        accent
          ? "border-primary/30 bg-primary-container/40"
          : "border-outline-variant bg-surface-container-low"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          accent
            ? "bg-primary text-white"
            : "bg-surface-container text-on-surface-variant"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-label-sm font-medium text-on-surface-variant">
          {label}
        </p>
        <p className="text-h3 font-semibold leading-tight text-on-surface">
          {value}
        </p>
        {hint ? (
          <p className="truncate text-label-sm text-on-surface-variant">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
