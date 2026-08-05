import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "blue" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-zinc-800/80 text-zinc-300 border-slate-200 dark:border-white/10",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  accent: "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(124,58,237,0.2)]",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md transition-all duration-200",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
