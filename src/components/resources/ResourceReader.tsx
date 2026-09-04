import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  BookOpen,
  Calendar,
  Tag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceSourceBadge } from "./ResourceSourceBadge";
import type { ResourceDetail } from "@/services/resourceApi";
import { toast } from "sonner";

interface ResourceReaderProps {
  resource: ResourceDetail;
  onBack: () => void;
  onNavigate?: (id: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (resource: ResourceDetail) => void;
}

/**
 * Lightweight Markdown-like renderer for GradeWise native study reader
 */
function MarkdownContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, idx) => {
    // Code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="my-3 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs font-mono text-zinc-100 dark:bg-black/60 border border-[var(--border)]"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${idx}`}
          className="mt-6 mb-3 text-2xl font-bold text-[var(--text-primary)] tracking-tight"
        >
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${idx}`}
          className="mt-5 mb-2.5 text-xl font-semibold text-[var(--text-primary)] tracking-tight"
        >
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${idx}`}
          className="mt-4 mb-2 text-base font-semibold text-purple-600 dark:text-purple-400"
        >
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.slice(2);
      elements.push(
        <li
          key={`li-${idx}`}
          className="ml-4 list-disc text-sm leading-relaxed text-[var(--text-secondary)]"
        >
          {renderFormattedText(text)}
        </li>
      );
      return;
    }

    // Numbered lists
    const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (matchNum) {
      elements.push(
        <div
          key={`num-${idx}`}
          className="ml-2 flex items-start gap-2 text-sm text-[var(--text-secondary)] leading-relaxed"
        >
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {matchNum[1]}.
          </span>
          <span>{renderFormattedText(matchNum[2])}</span>
        </div>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p
        key={`p-${idx}`}
        className="text-sm leading-relaxed text-[var(--text-secondary)]"
      >
        {renderFormattedText(trimmed)}
      </p>
    );
  });

  return <div className="space-y-1.5">{elements}</div>;
}

function renderFormattedText(text: string): React.ReactNode {
  // Simple bold and inline code parser
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-md bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 text-xs font-mono text-purple-600 dark:text-purple-400 border border-[var(--border)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function ResourceReader({
  resource,
  onBack,
  onNavigate,
  isBookmarked = false,
  onToggleBookmark,
}: ResourceReaderProps) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resource.id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(resource.sourceUrl || window.location.href);
      setCopied(true);
      toast.success("Resource URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const hasContent = Boolean(resource.content && resource.content.trim().length > 0);

  return (
    <article className="surface-card overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
      {/* ── TOP NAV BAR & BREADCRUMBS ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--bg-surface-elevated)]/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-purple-600 hover:border-purple-500/40 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Resources</span>
          </button>

          {/* Breadcrumbs: Resources / Subject / Topic */}
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-1.5 text-xs text-[var(--text-tertiary)] md:flex"
          >
            <span>Resources</span>
            <span>/</span>
            <span className="font-medium text-[var(--text-secondary)]">
              {resource.subject}
            </span>
            <span>/</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {resource.topic}
            </span>
          </nav>
        </div>

        {/* Actions (Bookmark, Share, Open Original) */}
        <div className="flex items-center gap-2">
          {onToggleBookmark && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleBookmark(resource)}
              className="h-8 gap-1.5 text-xs"
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck size={14} className="text-purple-600" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark size={14} />
                  <span>Save</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8 gap-1.5 text-xs"
            title="Copy link"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>Share</span>
          </Button>

          {resource.sourceUrl && (
            <a
              href={resource.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-purple-600 px-3 text-xs font-medium text-white hover:bg-purple-700 transition-colors shadow-xs"
            >
              <span>Open Original Source</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* ── HEADER DETAILS ────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-[var(--border)] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ResourceSourceBadge source={resource.source} size="md" />
          <span className="rounded-md bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)]">
            {resource.topic}
          </span>
          <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            {resource.contentType}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {resource.title}
        </h1>

        {resource.description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
            <Tag size={13} className="text-[var(--text-muted)] mr-1" />
            {resource.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--bg-surface-elevated)] px-2.5 py-0.5 text-[11px] text-[var(--text-tertiary)] border border-[var(--border)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── NATIVE READING CONTENT (ZERO IFRAMES) ──────────────────────── */}
      <div className="p-6 sm:p-8 bg-[var(--bg-surface)] min-h-[300px]">
        {hasContent ? (
          <div className="max-w-3xl mx-auto prose prose-purple dark:prose-invert">
            <MarkdownContent content={resource.content || ""} />
          </div>
        ) : (
          <div className="max-w-xl mx-auto my-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-8 text-center space-y-3">
            <BookOpen className="mx-auto text-purple-600" size={32} />
            <h3 className="font-semibold text-base text-[var(--text-primary)]">
              Official Study Resource
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This resource is hosted on the official provider repository and provides notes, files, or reference links.
            </p>
            <div className="pt-2">
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 transition"
              >
                <span>Open Resource on {resource.source}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ATTRIBUTION & PREVIOUS / NEXT NAVIGATION ───────────── */}
      <div className="flex flex-col gap-4 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--bg-surface-elevated)]/30">
        <div className="text-xs text-[var(--text-secondary)]">
          <span>Source: </span>
          <strong className="text-[var(--text-primary)]">{resource.source}</strong>
          <span className="mx-1.5">•</span>
          <span>Preserving original student & academic attribution</span>
        </div>

        {/* Previous & Next Navigation */}
        <div className="flex items-center gap-2">
          {resource.navigation?.prev && onNavigate && (
            <button
              onClick={() => {
                const prevId = resource.navigation?.prev?.id;
                if (prevId) startTransition(() => onNavigate(prevId));
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-purple-600 hover:border-purple-500/40 transition-colors"
              title={`Previous: ${resource.navigation.prev.title}`}
            >
              <ChevronLeft size={14} />
              <span className="max-w-[120px] truncate">Previous</span>
            </button>
          )}

          {resource.navigation?.next && onNavigate && (
            <button
              onClick={() => {
                const nextId = resource.navigation?.next?.id;
                if (nextId) startTransition(() => onNavigate(nextId));
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-purple-600 hover:border-purple-500/40 transition-colors"
              title={`Next: ${resource.navigation.next.title}`}
            >
              <span className="max-w-[120px] truncate">Next</span>
              <ChevronRight size={14} />
            </button>
          )}

          {resource.sourceUrl && (
            <a
              href={resource.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:underline ml-2"
            >
              <span>Original Source</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
