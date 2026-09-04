import { BookOpen, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { ResourceSourceBadge } from "./ResourceSourceBadge";
import type { ResourceItem } from "@/services/resourceApi";

interface ResourceCardProps {
  resource: ResourceItem;
  onRead: (resource: ResourceItem) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (resource: ResourceItem) => void;
}

export function ResourceCard({
  resource,
  onRead,
  isBookmarked = false,
  onToggleBookmark,
}: ResourceCardProps) {
  return (
    <div className="group surface-card relative flex flex-col justify-between rounded-xl border border-[var(--border)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2">
          <ResourceSourceBadge source={resource.source} size="sm" />
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              {resource.contentType}
            </span>
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(resource);
                }}
                className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-purple-600 transition-colors"
                title={isBookmarked ? "Remove from bookmarks" : "Save resource"}
                aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={14} className="text-purple-600" />
                ) : (
                  <Bookmark size={14} />
                )}
              </button>
            )}
          </div>
        </div>

        <h4 className="mt-2.5 text-sm font-semibold text-[var(--text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
          {resource.title}
        </h4>

        {resource.description && (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <button
          onClick={() => onRead(resource)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
        >
          <BookOpen size={13} />
          <span>Read in GradeWise</span>
        </button>

        {resource.sourceUrl && (
          <a
            href={resource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="Open original website"
          >
            <span>Source</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}
