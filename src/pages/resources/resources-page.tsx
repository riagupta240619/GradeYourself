import { useEffect, useState, useMemo } from "react";
import {
  GraduationCap,
  BookOpen,
  RefreshCw,
  Layers,
  Bookmark,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Video,
  Globe,
  FileCheck2,
  Compass,
  Code2,
  Sparkles,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  resourceApi,
  type AcademicSubject,
  type AcademicResourceItem,
  type ResourceTreeResponse,
  type ResourceBookmark,
} from "@/services/resourceApi";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { ResourceSourceBadge } from "@/components/resources/ResourceSourceBadge";
import { AcademicItemCard } from "@/components/resources/AcademicItemCard";
import {
  SubjectSearchBar,
  type SubjectNode,
} from "@/components/resources/subject-search-bar";

export function ResourcesPage() {
  const [data, setData] = useState<ResourceTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Year filter: "all" | 1 | 2 | 3 | "saved"
  const [yearFilter, setYearFilter] = useState<"all" | 1 | 2 | 3 | "saved">("all");

  // Active selected subject (drill-down view)
  const [selectedSubject, setSelectedSubject] = useState<AcademicSubject | null>(null);

  // Active category tab inside subject view: "all" | "notes" | "books" | "youtube" | "gfg" | "website" | "exams" | "roadmap"
  const [activeCategory, setActiveCategory] = useState<
    "all" | "notes" | "books" | "youtube" | "gfg" | "website" | "exams" | "roadmap"
  >("all");

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<ResourceBookmark[]>([]);

  // Explored Subject IDs (persisted locally)
  const [exploredIds, setExploredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gradewise_explored_subjects") || "[]");
    } catch {
      return [];
    }
  });

  const markExplored = (id: string) => {
    setExploredIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem("gradewise_explored_subjects", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Load resources from backend
  const loadResources = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [resData, savedList] = await Promise.all([
        resourceApi.getTree(force),
        resourceApi.getBookmarks(),
      ]);

      setData(resData);
      setBookmarks(savedList);

      if (force) {
        toast.success("Resources refreshed successfully!", {
          description: `Fetched ${resData.totalSubjects} subjects and ${resData.totalResources} resources from live sources.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load study resources.";
      setError("Unable to connect to study resource service. Please try refreshing.");
      toast.error("Failed to load resources", { description: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadResources(false);
  }, []);

  // Sync selected subject if tree data updates
  useEffect(() => {
    if (selectedSubject && data?.subjects) {
      const updated = data.subjects.find((s) => s.id === selectedSubject.id);
      if (updated) setSelectedSubject(updated);
    }
  }, [data]);

  // Bookmarking handlers
  const handleToggleBookmark = async (item: AcademicResourceItem) => {
    const existing = bookmarks.find((b) => b.url === item.link);

    if (existing) {
      try {
        await resourceApi.deleteBookmark(existing._id);
        setBookmarks((prev) => prev.filter((b) => b._id !== existing._id));
        toast.info("Removed from saved resources");
      } catch {
        toast.error("Could not remove bookmark.");
      }
    } else {
      try {
        const created = await resourceApi.saveBookmark({
          title: item.title,
          url: item.link,
          category: item.subject,
          source: item.source,
          description: item.description,
          resourceId: item.id,
        });
        setBookmarks((prev) => [created, ...prev]);
        toast.success("Saved to bookmarks!");
      } catch {
        toast.error("Could not save bookmark.");
      }
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      await resourceApi.deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      toast.info("Bookmark removed");
    } catch {
      toast.error("Could not remove bookmark.");
    }
  };

  // Convert academic subjects to SubjectNode for the LeetCode SubjectSearchBar
  const subjectsForYear = useMemo(() => {
    if (!data?.subjects) return [];
    if (yearFilter === "all" || yearFilter === "saved") return data.subjects;
    return data.subjects.filter((s) => s.year === yearFilter);
  }, [data, yearFilter]);

  const searchBarSubjects: SubjectNode[] = useMemo(() => {
    return subjectsForYear.map((s) => {
      const allCategoryItems: AcademicResourceItem[] = [
        ...(s.notes || []),
        ...(s.books || []),
        ...(s.youtube || []),
        ...(s.gfg || []),
        ...(s.website || []),
        ...(s.exams || []),
        ...(s.roadmap || []),
      ];

      return {
        id: s.id,
        title: s.name,
        description: s.description || `${s.name} study materials for Year ${s.year}`,
        resources: allCategoryItems.map((r) => ({
          id: r.id,
          title: r.title,
          provider: r.source,
          url: r.link,
          description: r.description,
          embed: false,
        })),
      };
    });
  }, [subjectsForYear]);

  const [filteredSubjects, setFilteredSubjects] = useState<SubjectNode[]>([]);

  useEffect(() => {
    setFilteredSubjects(searchBarSubjects);
  }, [searchBarSubjects]);

  const handleSelectSubjectNode = (node: SubjectNode) => {
    markExplored(node.id);
    const full = data?.subjects.find((s) => s.id === node.id);
    if (full) {
      setSelectedSubject(full);
      setActiveCategory("all");
    }
  };

  // Filtered resources for the active subject view
  const activeSubjectItems = useMemo(() => {
    if (!selectedSubject) return [];
    const notes = selectedSubject.notes || [];
    const books = selectedSubject.books || [];
    const youtube = selectedSubject.youtube || [];
    const gfg = selectedSubject.gfg || [];
    const website = selectedSubject.website || [];
    const exams = selectedSubject.exams || [];
    const roadmap = selectedSubject.roadmap || [];

    if (activeCategory === "all") {
      return [...notes, ...books, ...youtube, ...gfg, ...website, ...exams, ...roadmap];
    }
    if (activeCategory === "notes") return notes;
    if (activeCategory === "books") return books;
    if (activeCategory === "youtube") return youtube;
    if (activeCategory === "gfg") return gfg;
    if (activeCategory === "website") return website;
    if (activeCategory === "exams") return exams;
    if (activeCategory === "roadmap") return roadmap;
    return [];
  }, [selectedSubject, activeCategory]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Academic Resources
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-300">
              <Sparkles size={12} />
              <span>Live Synced</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Handwritten notes, reference books, playlists, and tutorials fetched live from{" "}
            <span className="font-semibold text-[var(--text-primary)]">Let&apos;s Help Everyone</span> &{" "}
            <span className="font-semibold text-[var(--text-primary)]">GeeksforGeeks</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Resources Button */}
          <Button
            variant="outline"
            onClick={() => void loadResources(true)}
            disabled={refreshing || loading}
            className="gap-2 text-xs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-purple-600" : ""} />
            <span>{refreshing ? "Fetching Live Data..." : "Refresh Resources"}</span>
          </Button>
        </div>
      </div>

      {/* Provider Status Indicators */}
      {data?.providers && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-tertiary)] border-b border-[var(--border)] pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-[var(--text-secondary)]">Live Sources:</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span>Let&apos;s Help Everyone ({data.providers.letsHelp.count || 0} links)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
              <CheckCircle2 size={13} />
              <span>GeeksforGeeks ({data.providers.gfg.count || 0} tutorials)</span>
            </span>
          </div>

          {data.lastUpdated && (
            <span className="text-[var(--text-muted)] text-[11px]">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* ── ACADEMIC YEAR NAVIGATION BAR ───────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-1">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* All Years */}
          <button
            onClick={() => {
              setYearFilter("all");
              setSelectedSubject(null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              yearFilter === "all"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GraduationCap size={15} />
            <span>All Years</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                yearFilter === "all" ? "bg-white/20 text-white" : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)]"
              }`}
            >
              {data?.totalSubjects || 27}
            </span>
          </button>

          {/* 1st Year */}
          <button
            onClick={() => {
              setYearFilter(1);
              setSelectedSubject(null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              yearFilter === 1
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>1st Year</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                yearFilter === 1 ? "bg-white/20 text-white" : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)]"
              }`}
            >
              {data?.years.find((y) => y.year === 1)?.count || 9}
            </span>
          </button>

          {/* 2nd Year */}
          <button
            onClick={() => {
              setYearFilter(2);
              setSelectedSubject(null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              yearFilter === 2
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>2nd Year</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                yearFilter === 2 ? "bg-white/20 text-white" : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)]"
              }`}
            >
              {data?.years.find((y) => y.year === 2)?.count || 11}
            </span>
          </button>

          {/* 3rd Year */}
          <button
            onClick={() => {
              setYearFilter(3);
              setSelectedSubject(null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              yearFilter === 3
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>3rd Year</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                yearFilter === 3 ? "bg-white/20 text-white" : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)]"
              }`}
            >
              {data?.years.find((y) => y.year === 3)?.count || 7}
            </span>
          </button>

          {/* Saved Bookmarks Tab */}
          <button
            onClick={() => {
              setYearFilter("saved");
              setSelectedSubject(null);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              yearFilter === "saved"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Bookmark size={14} />
            <span>Saved ({bookmarks.length})</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && <ResourceSkeleton />}

      {/* Error state */}
      {error && !loading && (
        <div className="surface-card flex flex-col items-center justify-center rounded-2xl border border-red-500/20 p-8 text-center bg-red-500/5">
          <AlertCircle size={36} className="text-red-500 mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Unable to connect</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-md">{error}</p>
          <Button onClick={() => void loadResources(true)} className="mt-4 gap-2 text-xs">
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </Button>
        </div>
      )}

      {/* ── 1. DRILL-DOWN SUBJECT STUDY HUB VIEW ────────────────────────── */}
      {!loading && !error && selectedSubject && (
        <div className="space-y-6">
          {/* Back button & Subject Title banner */}
          <div className="surface-card rounded-2xl border border-[var(--border)] p-5 sm:p-6 bg-[var(--bg-surface)]">
            <button
              onClick={() => setSelectedSubject(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline mb-3"
            >
              <ArrowLeft size={14} />
              <span>Back to all subjects</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Year {selectedSubject.year} • {selectedSubject.branch || "CSE"}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {selectedSubject.totalResources} total items
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-1.5">
                  {selectedSubject.name}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                  {selectedSubject.description || `Comprehensive notes, books, videos, and exams for ${selectedSubject.name}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <ResourceSourceBadge source="Let's Help Everyone" size="sm" />
                {(selectedSubject.gfg?.length || 0) > 0 && (
                  <ResourceSourceBadge source="GeeksforGeeks" size="sm" />
                )}
              </div>
            </div>

            {/* Category Tabs for Subject */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>All Materials</span>
                <span className="text-[10px] opacity-80">({selectedSubject.totalResources})</span>
              </button>

              <button
                onClick={() => setActiveCategory("notes")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === "notes"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <FileText size={13} />
                <span>Notes</span>
                <span className="text-[10px] opacity-80">({selectedSubject.notes?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategory("books")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === "books"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <BookOpen size={13} />
                <span>Books</span>
                <span className="text-[10px] opacity-80">({selectedSubject.books?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveCategory("youtube")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === "youtube"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Video size={13} />
                <span>YouTube Playlists</span>
                <span className="text-[10px] opacity-80">({selectedSubject.youtube?.length || 0})</span>
              </button>

              {(selectedSubject.gfg?.length || 0) > 0 && (
                <button
                  onClick={() => setActiveCategory("gfg")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === "gfg"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  <Code2 size={13} />
                  <span>GFG Tutorials</span>
                  <span className="text-[10px] opacity-80">({selectedSubject.gfg?.length || 0})</span>
                </button>
              )}

              {(selectedSubject.website?.length || 0) > 0 && (
                <button
                  onClick={() => setActiveCategory("website")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === "website"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Globe size={13} />
                  <span>Websites & Docs</span>
                  <span className="text-[10px] opacity-80">({selectedSubject.website?.length || 0})</span>
                </button>
              )}

              <button
                onClick={() => setActiveCategory("exams")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === "exams"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <FileCheck2 size={13} />
                <span>Exams & Practice</span>
                <span className="text-[10px] opacity-80">({selectedSubject.exams?.length || 0})</span>
              </button>

              {(selectedSubject.roadmap?.length || 0) > 0 && (
                <button
                  onClick={() => setActiveCategory("roadmap")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === "roadmap"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Compass size={13} />
                  <span>Roadmaps</span>
                  <span className="text-[10px] opacity-80">({selectedSubject.roadmap?.length || 0})</span>
                </button>
              )}
            </div>
          </div>

          {/* Resources Grid for the Subject */}
          {activeSubjectItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubjectItems.map((item) => {
                const isBookmarked = bookmarks.some((b) => b.url === item.link);
                return (
                  <AcademicItemCard
                    key={item.id}
                    item={item}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={handleToggleBookmark}
                  />
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-2xl border border-[var(--border)] p-12 text-center">
              <FileText size={32} className="mx-auto text-[var(--text-tertiary)] mb-2" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No items in this category yet
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Study resources for this category are being updated from the academic community.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 2. SAVED BOOKMARKS VIEW ────────────────────────────────────── */}
      {!loading && !error && !selectedSubject && yearFilter === "saved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Saved Resources ({bookmarks.length})
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Quickly jump back to your saved study materials, Drive folders, and tutorials.
              </p>
            </div>
          </div>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bm) => (
                <div
                  key={bm._id}
                  className="surface-card relative flex flex-col justify-between rounded-xl border border-[var(--border)] p-4 hover:border-purple-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        {bm.category || "Study Resource"}
                      </span>
                      <button
                        onClick={() => void handleRemoveBookmark(bm._id)}
                        className="p-1 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h4 className="mt-2.5 text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                      {bm.title}
                    </h4>

                    {bm.description && (
                      <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                        {bm.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {bm.source || "Academic Network"}
                    </span>
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <span>Open Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl border border-[var(--border)] p-12 text-center">
              <Bookmark size={32} className="mx-auto text-[var(--text-tertiary)] mb-2" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No saved resources yet
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Click the bookmark icon on any note, book, video, or tutorial to save it here for quick access during exam prep.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 3. SUBJECTS CATALOG VIEW WITH LEETCODE SEARCH BAR ──────────── */}
      {!loading && !error && !selectedSubject && yearFilter !== "saved" && (
        <div className="space-y-6">
          {/* LeetCode Style Subject Search and Filter */}
          <SubjectSearchBar
            subjects={searchBarSubjects}
            onFilterChange={setFilteredSubjects}
            onSelectSubject={handleSelectSubjectNode}
            exploredIds={exploredIds}
          />

          {/* Subjects Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>
                Showing {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""}
                {yearFilter !== "all" && ` for ${yearFilter === 1 ? "1st" : yearFilter === 2 ? "2nd" : "3rd"} Year`}
              </span>
            </div>

            {filteredSubjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((node) => {
                  const full = data?.subjects.find((s) => s.id === node.id);
                  const isExplored = exploredIds.includes(node.id);

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleSelectSubjectNode(node)}
                      className="group surface-card relative flex flex-col justify-between rounded-xl border border-[var(--border)] p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-lg bg-[var(--bg-surface)]"
                    >
                      <div>
                        {/* Header Pills */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-purple-500/10 dark:bg-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                            Year {full?.year || 1} • {full?.branch || "CSE"}
                          </span>

                          <span className="rounded-full bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                            {full?.totalResources || node.resources.length} resources
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-3 text-base font-bold text-[var(--text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {node.title}
                        </h3>

                        {/* Description */}
                        <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {node.description}
                        </p>

                        {/* Category breakdown pills */}
                        {full && (
                          <div className="mt-3.5 flex flex-wrap gap-1.5">
                            {(full.notes?.length || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                                <FileText size={10} />
                                <span>{full.notes.length} Notes</span>
                              </span>
                            )}
                            {(full.books?.length || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                                <BookOpen size={10} />
                                <span>{full.books.length} Books</span>
                              </span>
                            )}
                            {(full.youtube?.length || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                                <Video size={10} />
                                <span>{full.youtube.length} Videos</span>
                              </span>
                            )}
                            {(full.gfg?.length || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <Code2 size={10} />
                                <span>{full.gfg.length} GFG</span>
                              </span>
                            )}
                            {(full.exams?.length || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                                <FileCheck2 size={10} />
                                <span>{full.exams.length} Exams</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Action */}
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                          {isExplored ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 size={12} /> Explored
                            </span>
                          ) : (
                            <span>Tap to browse material</span>
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Explore</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="surface-card rounded-2xl border border-[var(--border)] p-12 text-center">
                <Search size={32} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  No subjects match your search
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Try adjusting keywords or selecting &ldquo;All Topics&rdquo; in the filters above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
