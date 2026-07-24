import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
        {icon}
      </div>
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--bg-elevated)]", className)} />;
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "success" | "warning" }) {
  const colors = {
    accent: "bg-[var(--color-accent)]",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
