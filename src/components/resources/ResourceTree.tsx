import { useState, useMemo } from "react";
import { Search, X, Layers, BookOpen, Code2, ChevronsDown, ChevronsUp } from "lucide-react";
import { ResourceSubjectTreeNode } from "./ResourceNode";
import type { ResourceSubjectNode, ResourceItem } from "@/services/resourceApi";

interface ResourceTreeProps {
  subjects: ResourceSubjectNode[];
  onReadResource: (resource: ResourceItem) => void;
}

export function ResourceTree({ subjects, onReadResource }: ResourceTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "letshelp" | "gfg">("all");
  const [expandAll, setExpandAll] = useState(false);

  // Compute total counts
  const totalResources = useMemo(
    () => subjects.reduce((acc, s) => acc + s.totalResources, 0),
    [subjects]
  );

  return (
    <div className="space-y-4">
      {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────────── */}
      <div className="surface-card rounded-2xl p-4 sm:p-5 border border-[var(--border)] space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, topics, or keywords (e.g. Normalization, Arrays, OSI)..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Expand / Collapse controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
            >
              {expandAll ? (
                <>
                  <ChevronsUp size={14} />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronsDown size={14} />
                  <span>Expand All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-[var(--text-tertiary)] mr-1">Source:</span>
          <button
            onClick={() => setSourceFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              sourceFilter === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
            }`}
          >
            <Layers size={12} />
            <span>All Sources ({totalResources})</span>
          </button>

          <button
            onClick={() => setSourceFilter("letshelp")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              sourceFilter === "letshelp"
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
            }`}
          >
            <BookOpen size={12} />
            <span>Let&apos;s Help Everyone</span>
          </button>

          <button
            onClick={() => setSourceFilter("gfg")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              sourceFilter === "gfg"
                ? "bg-green-700 text-white shadow-xs"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
            }`}
          >
            <Code2 size={12} />
            <span>GeeksforGeeks</span>
          </button>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-purple-600 hover:underline font-medium ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── TREE NODES ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {subjects.map((subject, idx) => (
          <ResourceSubjectTreeNode
            key={subject.id}
            subject={subject}
            defaultExpanded={expandAll || idx < 2}
            onReadResource={onReadResource}
            searchFilter={searchQuery}
            sourceFilter={sourceFilter}
          />
        ))}

        {subjects.length === 0 && (
          <div className="surface-card rounded-2xl p-12 text-center border border-dashed border-[var(--border)]">
            <Layers className="mx-auto text-[var(--text-muted)] mb-3" size={32} />
            <h4 className="font-semibold text-[var(--text-primary)]">No resources found</h4>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              No study materials match your current search query or source filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
