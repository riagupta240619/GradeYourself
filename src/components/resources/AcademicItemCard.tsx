import { useState } from "react";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  FileText,
  BookOpen,
  Video,
  Globe,
  FileCheck2,
  Compass,
  FolderDown,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceSourceBadge } from "./ResourceSourceBadge";
import type { AcademicResourceItem } from "@/services/resourceApi";

interface AcademicItemCardProps {
  item: AcademicResourceItem;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: AcademicResourceItem) => void;
}

export function AcademicItemCard({
  item,
  isBookmarked = false,
  onToggleBookmark,
}: AcademicItemCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Determine platform details based on URL
  const getPlatformDetails = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes("drive.google.com")) {
      return {
        name: "Google Drive",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: FolderDown,
      };
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return {
        name: "YouTube",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: Video,
      };
    }
    if (lower.includes("geeksforgeeks.org")) {
      return {
        name: "GeeksforGeeks",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Code2,
      };
    }
    if (lower.includes("notion.site") || lower.includes("notion.so")) {
      return {
        name: "Notion",
        color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
        icon: FileText,
      };
    }
    if (lower.includes("hackerrank.com") || lower.includes("leetcode.com")) {
      return {
        name: "Practice Portal",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: Code2,
      };
    }
    if (lower.includes("github.com")) {
      return {
        name: "GitHub",
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: Globe,
      };
    }
    return {
      name: "Direct Resource",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      icon: ExternalLink,
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "notes":
        return FileText;
      case "books":
        return BookOpen;
      case "youtube":
        return Video;
      case "gfg":
        return Code2;
      case "website":
        return Globe;
      case "exams":
        return FileCheck2;
      case "roadmap":
        return Compass;
      default:
        return FileText;
    }
  };

  const platform = getPlatformDetails(item.link);
  const CategoryIcon = getCategoryIcon(item.category);
  const PlatformIcon = platform.icon;

  return (
    <div className="group surface-card relative flex flex-col justify-between rounded-xl border border-[var(--border)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md bg-[var(--bg-surface)]">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <ResourceSourceBadge source={item.source} size="sm" />
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${platform.color}`}
            >
              <PlatformIcon size={11} />
              <span>{platform.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-colors"
              title="Copy link"
              aria-label="Copy link"
            >
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>

            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(item);
                }}
                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-purple-600 transition-colors"
                title={isBookmarked ? "Remove from saved" : "Save resource"}
                aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={15} className="text-purple-600" />
                ) : (
                  <Bookmark size={15} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="mt-3 text-sm font-semibold text-[var(--text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
          {item.title}
        </h4>

        {/* Description */}
        {item.description ? (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)] italic">
            Curated study material for {item.subject}.
          </p>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-tertiary)] capitalize">
          <CategoryIcon size={12} />
          <span>{item.category === "gfg" ? "GFG Tutorial" : item.category}</span>
        </span>

        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/10 dark:bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-all duration-200"
          title={`Open ${item.title}`}
        >
          <span>Open Resource</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
