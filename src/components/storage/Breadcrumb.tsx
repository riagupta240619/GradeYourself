import { ChevronLeft } from "lucide-react";
import { cn } from "@/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  trail: BreadcrumbItem[];
}

export function Breadcrumb({ trail }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="breadcrumb">
      {trail.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {item.href && !item.isCurrent ? (
            <a
              href={item.href}
              className="hover:underline underline-offset-2 text-primary transition-colors"
              target="_self"
              rel="noopener noreferrer"
            >
              {item.label}
            </a>
          ) : (
            <span className="relative">
              {item.label}
            </span>
          )}

          {item.isCurrent !== false && index < trail.length - 1 && (
            <ChevronLeft
              className="h-2 w-2 text-muted-opacity mr-1 opacity-60"
              aria-hidden="true"
            />
          )}
        </span>
      ))}

    </nav>
  );
}