import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileText, ExternalLink, BookOpen } from "lucide-react";
import { ResourceSourceBadge } from "./ResourceSourceBadge";
import type { ResourceSubjectNode, ResourceTopicNode, ResourceItem } from "@/services/resourceApi";

interface ResourceSubjectNodeProps {
  subject: ResourceSubjectNode;
  defaultExpanded?: boolean;
  onReadResource: (resource: ResourceItem) => void;
  searchFilter?: string;
  sourceFilter?: string;
}

export function ResourceSubjectTreeNode({
  subject,
  defaultExpanded = false,
  onReadResource,
  searchFilter = "",
  sourceFilter = "all",
}: ResourceSubjectNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Filter topics and resources if search/source filters are active
  const filteredTopics = subject.topics
    .map((topic) => {
      const filteredResources = topic.resources.filter((res) => {
        const matchesSearch =
          !searchFilter.trim() ||
          res.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          res.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
          res.topic.toLowerCase().includes(searchFilter.toLowerCase()) ||
          res.subject.toLowerCase().includes(searchFilter.toLowerCase());

        const matchesSource =
          sourceFilter === "all" ||
          (sourceFilter === "letshelp" && res.source.toLowerCase().includes("let's help")) ||
          (sourceFilter === "gfg" && res.source.toLowerCase().includes("geeksforgeeks"));

        return matchesSearch && matchesSource;
      });

      return {
        ...topic,
        resources: filteredResources,
      };
    })
    .filter((topic) => topic.resources.length > 0);

  const totalFilteredCount = filteredTopics.reduce(
    (acc, t) => acc + t.resources.length,
    0
  );

  // If search filter is active and matches, auto-expand
  const shouldExpand = searchFilter.trim().length > 0 ? true : isExpanded;

  if (filteredTopics.length === 0 && searchFilter.trim().length > 0) {
    return null;
  }

  return (
    <div className="surface-card rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-200">
      {/* Subject Header / Accordion trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left hover:bg-[var(--bg-surface-elevated)]/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            {shouldExpand ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
              {subject.name}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
              {subject.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="rounded-full bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)]">
            {totalFilteredCount} {totalFilteredCount === 1 ? "resource" : "resources"}
          </span>
        </div>
      </button>

      {/* Topics & Resources Tree Body */}
      {shouldExpand && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-surface-elevated)]/20 p-3 sm:p-4 space-y-3">
          {filteredTopics.map((topic) => (
            <ResourceTopicTreeNode
              key={topic.name}
              topic={topic}
              defaultExpanded={true}
              onReadResource={onReadResource}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ResourceTopicTreeNodeProps {
  topic: ResourceTopicNode;
  defaultExpanded?: boolean;
  onReadResource: (resource: ResourceItem) => void;
}

export function ResourceTopicTreeNode({
  topic,
  defaultExpanded = true,
  onReadResource,
}: ResourceTopicTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-2xs">
      {/* Topic header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-surface-elevated)]/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Folder size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {topic.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
            {topic.resources.length}
          </span>
          {isOpen ? (
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
          )}
        </div>
      </button>

      {/* Resource Leaves */}
      {isOpen && (
        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] bg-[var(--bg-surface)]">
          {topic.resources.map((resource) => (
            <div
              key={resource.id}
              className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--bg-surface-elevated)]/50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <FileText
                  size={16}
                  className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onReadResource(resource)}
                      className="text-sm font-medium text-[var(--text-primary)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                    >
                      {resource.title}
                    </button>
                    <ResourceSourceBadge source={resource.source} size="sm" />
                  </div>
                  {resource.description && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-1">
                      {resource.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                <button
                  onClick={() => onReadResource(resource)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                >
                  <BookOpen size={13} />
                  <span>Read</span>
                </button>

                {resource.sourceUrl && (
                  <a
                    href={resource.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-transparent p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-colors"
                    title="Open official resource website in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
