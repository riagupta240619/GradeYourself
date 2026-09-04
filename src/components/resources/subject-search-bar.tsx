import { useState, useRef, useEffect, type ComponentType } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  SlidersHorizontal,
  Shuffle,
  Database,
  Cpu,
  Code2,
  Shield,
  Sparkles,
  GitBranch,
  Layers,
  Check,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export interface ResourceEntry {
  id: string;
  title: string;
  provider: string;
  url: string;
  description: string;
  embed?: boolean;
}

export interface SubjectNode {
  id: string;
  title: string;
  description: string;
  resources: ResourceEntry[];
}

export interface SubjectMeta {
  category: string;
  tags: string[];
}

export const SUBJECT_METADATA: Record<string, SubjectMeta> = {
  dsa: {
    category: "Algorithms",
    tags: ["DSA", "Algorithms", "Roadmaps", "Interview Prep"],
  },
  dbms: {
    category: "Database",
    tags: ["DBMS", "SQL", "Database", "Core CS"],
  },
  "operating-systems": {
    category: "Core CS",
    tags: ["Operating Systems", "Core CS", "Concurrency", "Linux"],
  },
  "computer-networks": {
    category: "Core CS",
    tags: ["Computer Networks", "Core CS", "Protocols", "TCP/IP"],
  },
  oop: {
    category: "Core CS",
    tags: ["OOP", "Core CS", "Design Patterns", "Classes"],
  },
  development: {
    category: "Development",
    tags: ["Development", "Web Dev", "Fullstack", "Roadmaps"],
  },
  cybersecurity: {
    category: "Systems & Security",
    tags: ["Cybersecurity", "Security", "Network Security", "Cryptography"],
  },
  "interview-preparation": {
    category: "Career & Prep",
    tags: ["Interview Prep", "Roadmaps", "Placement", "DSA"],
  },
  "system-design": {
    category: "Systems & Security",
    tags: ["System Design", "Scalability", "Architecture", "Distributed Systems"],
  },
};

export function getSubjectCategoryAndTags(subject: SubjectNode): SubjectMeta {
  if (SUBJECT_METADATA[subject.id]) {
    return SUBJECT_METADATA[subject.id];
  }
  const titleLower = subject.title.toLowerCase();
  if (titleLower.includes("data structure") || titleLower.includes("algorithm")) {
    return { category: "Algorithms", tags: ["DSA", "Algorithms", "Problem Solving"] };
  }
  if (titleLower.includes("database") || titleLower.includes("dbms") || titleLower.includes("sql")) {
    return { category: "Database", tags: ["DBMS", "SQL", "Database"] };
  }
  if (titleLower.includes("operating system") || titleLower.includes("network") || titleLower.includes("architecture") || titleLower.includes("digital") || titleLower.includes("discrete")) {
    return { category: "Core CS", tags: ["Core CS", "Systems", "Theory"] };
  }
  if (titleLower.includes("front end") || titleLower.includes("back end") || titleLower.includes("web") || titleLower.includes("source code") || titleLower.includes("software") || titleLower.includes("python") || titleLower.includes("cpp") || titleLower.includes("c programming") || titleLower.includes("java")) {
    return { category: "Development", tags: ["Development", "Programming", "Software Engineering"] };
  }
  if (titleLower.includes("ai") || titleLower.includes("machine learning") || titleLower.includes("intelligence") || titleLower.includes("system design") || titleLower.includes("linux") || titleLower.includes("iot") || titleLower.includes("embedded")) {
    return { category: "Systems & Security", tags: ["AI/ML", "Linux", "System Design", "IoT"] };
  }
  if (titleLower.includes("aptitude") || titleLower.includes("exam") || titleLower.includes("math") || titleLower.includes("calculus") || titleLower.includes("statistics") || titleLower.includes("differential") || titleLower.includes("physics")) {
    return { category: "Career & Prep", tags: ["Mathematics", "Foundations", "Aptitude"] };
  }
  return { category: "Core CS", tags: ["Computer Science", subject.title] };
}


export interface CategoryItem {
  id: string;
  name: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", name: "All Topics", icon: Layers, iconColor: "text-zinc-400 dark:text-zinc-300" },
  { id: "Algorithms", name: "Algorithms", icon: GitBranch, iconColor: "text-amber-500" },
  { id: "Database", name: "Database", icon: Database, iconColor: "text-blue-500" },
  { id: "Core CS", name: "Core CS", icon: Cpu, iconColor: "text-emerald-500" },
  { id: "Development", name: "Development", icon: Code2, iconColor: "text-sky-500" },
  { id: "Systems & Security", name: "Systems & Security", icon: Shield, iconColor: "text-purple-500" },
  { id: "Career & Prep", name: "Career & Prep", icon: Sparkles, iconColor: "text-pink-500" },
];

export type SortOption = "default" | "name-asc" | "name-desc" | "resources-desc";

export interface FilterState {
  provider: string; // "all" | provider name
  embeddableOnly: boolean;
  status: "all" | "explored" | "unexplored";
}

interface SubjectSearchBarProps {
  subjects: SubjectNode[];
  onFilterChange: (filtered: SubjectNode[]) => void;
  onSelectSubject: (subject: SubjectNode) => void;
  exploredIds: string[];
}

export function SubjectSearchBar({
  subjects,
  onFilterChange,
  onSelectSubject,
  exploredIds,
}: SubjectSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    provider: "all",
    embeddableOnly: false,
    status: "all",
  });

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute available topic tags and their counts
  const tagCounts: Record<string, number> = {};
  subjects.forEach((subject) => {
    const meta = SUBJECT_METADATA[subject.id];
    if (meta?.tags) {
      meta.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const visibleTags = isExpanded ? sortedTags : sortedTags.slice(0, 7);

  // Available unique providers
  const providers = Array.from(
    new Set(subjects.flatMap((s) => s.resources.map((r) => r.provider)))
  );

  // Compute filtered & sorted subjects
  useEffect(() => {
    let result = [...subjects];

    // 1. Text Search Filter
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (cleanQuery) {
      result = result.filter((subject) => {
        const meta = SUBJECT_METADATA[subject.id];
        const inTitle = subject.title.toLowerCase().includes(cleanQuery);
        const inDesc = subject.description.toLowerCase().includes(cleanQuery);
        const inTags = meta?.tags.some((t) => t.toLowerCase().includes(cleanQuery));
        const inResources = subject.resources.some(
          (r) =>
            r.title.toLowerCase().includes(cleanQuery) ||
            r.description.toLowerCase().includes(cleanQuery) ||
            r.provider.toLowerCase().includes(cleanQuery)
        );
        return inTitle || inDesc || inTags || inResources;
      });
    }

    // 2. Category Filter

    if (selectedCategory !== "all") {
      result = result.filter((subject) => {
        const meta = getSubjectCategoryAndTags(subject);
        return meta?.category === selectedCategory;
      });
    }

    // 3. Topic Tag Filter
    if (selectedTag) {
      result = result.filter((subject) => {
        const meta = getSubjectCategoryAndTags(subject);
        return meta?.tags.includes(selectedTag);
      });
    }


    // 4. Secondary Filters
    if (filters.provider !== "all") {
      result = result.filter((subject) =>
        subject.resources.some((r) => r.provider === filters.provider)
      );
    }
    if (filters.embeddableOnly) {
      result = result.filter((subject) =>
        subject.resources.some((r) => r.embed !== false)
      );
    }
    if (filters.status === "explored") {
      result = result.filter((subject) => exploredIds.includes(subject.id));
    } else if (filters.status === "unexplored") {
      result = result.filter((subject) => !exploredIds.includes(subject.id));
    }

    // 5. Sorting
    if (sortOption === "name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "name-desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOption === "resources-desc") {
      result.sort((a, b) => b.resources.length - a.resources.length);
    }

    onFilterChange(result);
  }, [
    subjects,
    searchQuery,
    selectedCategory,
    selectedTag,
    filters,
    sortOption,
    exploredIds,
  ]);

  const isFilterActive =
    filters.provider !== "all" ||
    filters.embeddableOnly ||
    filters.status !== "all";

  const handlePickRandom = () => {
    if (subjects.length === 0) return;
    const randomIdx = Math.floor(Math.random() * subjects.length);
    const chosen = subjects[randomIdx];
    toast.success(`Opening random subject: ${chosen.title}`, {
      description: chosen.description,
    });
    onSelectSubject(chosen);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag(null);
    setSortOption("default");
    setFilters({ provider: "all", embeddableOnly: false, status: "all" });
  };

  const exploredCount = exploredIds.length;
  const totalCount = subjects.length;
  const progressPct = totalCount > 0 ? (exploredCount / totalCount) * 100 : 0;

  // SVG circular arc calculation
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="space-y-3.5">
      {/* ── ROW 1: TOPIC PILLS (LeetCode Style) ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {visibleTags.map(([tag, count]) => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(isActive ? null : tag)}
              className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/40"
                  : "bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              <span>{tag}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-black/5 dark:bg-white/10 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {sortedTags.length > 7 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[var(--text-tertiary)] hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* ── ROW 2: CATEGORY TABS (LeetCode Capsule Buttons) ─────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedTag(null); // Reset tag if switching categories
              }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-md dark:bg-white dark:text-zinc-900"
                  : "bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              <Icon
                size={14}
                className={isActive ? (cat.id === "all" ? "" : cat.iconColor) : cat.iconColor}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── ROW 3: SEARCH BAR & CONTROLS (LeetCode Problemset Bar) ─────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search input, Sort button, Filter button */}
        <div className="flex flex-1 items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, topics, roadmaps…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-9 pr-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Button & Popover */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => {
                setShowSortMenu((prev) => !prev);
                setShowFilterMenu(false);
              }}
              title="Sort Subjects"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                sortOption !== "default"
                  ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ArrowUpDown size={15} />
            </button>

            {showSortMenu && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 shadow-xl z-30 text-xs">
                <div className="px-2 py-1 font-semibold text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider">
                  Sort by
                </div>
                {[
                  { id: "default", label: "Default (Curated)" },
                  { id: "name-asc", label: "Name: A → Z" },
                  { id: "name-desc", label: "Name: Z → A" },
                  { id: "resources-desc", label: "Most Resources" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortOption(opt.id as SortOption);
                      setShowSortMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                      sortOption === opt.id
                        ? "bg-purple-500/10 font-medium text-purple-600 dark:text-purple-400"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortOption === opt.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button & Popover */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => {
                setShowFilterMenu((prev) => !prev);
                setShowSortMenu(false);
              }}
              title="Filter by Provider / Type"
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                isFilterActive
                  ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <SlidersHorizontal size={15} />
              {isFilterActive && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[var(--bg-surface)]" />
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-xl z-30 text-xs space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                  <span className="font-semibold text-[var(--text-primary)]">Filters</span>
                  {isFilterActive && (
                    <button
                      onClick={() =>
                        setFilters({ provider: "all", embeddableOnly: false, status: "all" })
                      }
                      className="text-[11px] text-purple-600 hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                </div>

                {/* Provider select */}
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-tertiary)] block mb-1">
                    Resource Provider
                  </label>
                  <select
                    value={filters.provider}
                    onChange={(e) => setFilters((prev) => ({ ...prev, provider: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="all">All Providers</option>
                    {providers.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status select */}
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-tertiary)] block mb-1">
                    Exploration Status
                  </label>
                  <div className="flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--bg-surface-elevated)]">
                    {[
                      { id: "all", label: "All" },
                      { id: "explored", label: "Explored" },
                      { id: "unexplored", label: "Unexplored" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            status: st.id as FilterState["status"],
                          }))
                        }
                        className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          filters.status === st.id
                            ? "bg-[var(--bg-surface)] text-purple-600 shadow-xs"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Embeddable only checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={filters.embeddableOnly}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, embeddableOnly: e.target.checked }))
                    }
                    className="rounded border-[var(--border)] text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Has Embeddable Reader
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Reset all button if any active filter */}
          {(searchQuery || selectedCategory !== "all" || selectedTag || isFilterActive || sortOption !== "default") && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-purple-600 hover:underline font-medium ml-1 hidden sm:inline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Explored progress ring & Pick Random Button (LeetCode Right Bar) */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          {/* Circular Progress Ring (LeetCode 256/4042 Solved) */}
          <div
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 shadow-xs"
            title={`${exploredCount} of ${totalCount} subjects explored (${Math.round(progressPct)}%)`}
          >
            <div className="relative flex h-5 w-5 items-center justify-center">
              <svg className="h-5 w-5 -rotate-90 transform" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-500"
                />
              </svg>
            </div>
            <div className="text-xs font-medium">
              <span className="font-bold text-[var(--text-primary)]">
                {exploredCount}/{totalCount}
              </span>{" "}
              <span className="text-[var(--text-muted)]">Explored</span>
            </div>
          </div>

          {/* Shuffle / Random Subject Button (LeetCode Shuffle Icon) */}
          <button
            onClick={handlePickRandom}
            title="Pick a random subject (Shuffle)"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-xs"
          >
            <Shuffle size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
