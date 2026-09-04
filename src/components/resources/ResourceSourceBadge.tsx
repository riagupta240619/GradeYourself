import { BookOpen, Code2, Globe } from "lucide-react";

interface ResourceSourceBadgeProps {
  source: string;
  size?: "sm" | "md";
  className?: string;
}

export function ResourceSourceBadge({
  source,
  size = "sm",
  className = "",
}: ResourceSourceBadgeProps) {
  const isLetsHelp =
    source.toLowerCase().includes("let's help") ||
    source.toLowerCase().includes("letshelp");
  const isGfg =
    source.toLowerCase().includes("geeksforgeeks") ||
    source.toLowerCase().includes("gfg");

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-2";

  if (isLetsHelp) {
    return (
      <span
        className={`inline-flex items-center rounded-md font-medium border transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ${sizeClasses} ${className}`}
        title="Source: Let's Help Everyone"
      >
        <BookOpen size={size === "sm" ? 12 : 14} className="shrink-0" />
        <span>Let&apos;s Help Everyone</span>
      </span>
    );
  }

  if (isGfg) {
    return (
      <span
        className={`inline-flex items-center rounded-md font-medium border transition-colors bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/25 ${sizeClasses} ${className}`}
        title="Source: GeeksforGeeks"
      >
        <Code2 size={size === "sm" ? 12 : 14} className="shrink-0" />
        <span>GeeksforGeeks</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border transition-colors bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 ${sizeClasses} ${className}`}
    >
      <Globe size={size === "sm" ? 12 : 14} className="shrink-0" />
      <span>{source}</span>
    </span>
  );
}
