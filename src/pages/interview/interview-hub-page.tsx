import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Award,
  CheckCircle2,
  BookOpen,
  Code2,
  Building2,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Star,
  ExternalLink,
  ChevronDown,
  Search,
  Filter,
  CheckSquare,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  X,
  Target,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

export interface InterviewQuestionItem {
  _id: string;
  question: string;
  answer?: string;
  explanation?: string;
  category: string;
  topic?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  company: string;
  role: string;
  type: "technical" | "behavioral" | "coding" | "project";
  starResponse?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
  source?: string;
  sourceUrl?: string;
  problemUrl?: string;
  status: "not_started" | "practicing" | "confident";
  isPracticed: boolean;
  isConfident: boolean;
  isFavorite: boolean;
  notes?: string;
  isPersonal?: boolean;
}

const CATEGORIES = [
  "All",
  "Data Structures",
  "Algorithms",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "OOP",
  "System Design",
  "Projects",
];

const BEHAVIORAL_TOPICS = [
  "All",
  "Leadership",
  "Teamwork",
  "Conflict Resolution",
  "Failure & Accountability",
  "Navigating Ambiguity & Googleyness",
  "Customer Obsession (STAR)",
  "Growth Mindset & Collaboration",
];

const COMPANIES = ["All", "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Atlassian"];

export function InterviewHubPage() {
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project");

  const [activeTab, setActiveTab] = useState<
    "overview" | "technical" | "behavioral" | "company" | "coding" | "my_questions"
  >(projectParam ? "technical" : "overview");

  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Company Prep Discovery State
  const [discoverCompany, setDiscoverCompany] = useState("Google");
  const [discoverRole, setDiscoverRole] = useState("Software Engineer");
  const [discoveredData, setDiscoveredData] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Modals & Expanded accordions
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    answer: "",
    explanation: "",
    category: "Data Structures",
    topic: "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    company: "Google",
    role: "Software Engineer",
    type: "technical" as "technical" | "behavioral" | "coding" | "project",
    status: "not_started" as "not_started" | "practicing" | "confident",
    notes: "",
    source: "Personal",
    sourceUrl: "",
    problemUrl: "",
  });

  // STAR Edit State for Behavioral
  const [starEditingId, setStarEditingId] = useState<string | null>(null);
  const [starForm, setStarForm] = useState({ situation: "", task: "", action: "", result: "" });

  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qRes, pRes] = await Promise.all([
        api.get("/career/interview-prep"),
        api.get("/career/interview-prep/progress"),
      ]);
      setQuestions(qRes.data.questions || []);
      setProgress(pRes.data);
    } catch (err) {
      console.error("Interview load error:", err);
      toast.error("Failed to load interview hub");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCatalog = async () => {
    try {
      setSyncing(true);
      const res = await api.post("/career/interview-prep/sync");
      toast.success(
        res.data.message ||
          "Curated questions synchronized from Cracking the Coding Interview & CS curriculum!"
      );
      await loadData();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("Failed to sync questions: " + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const loadCompanyDiscovery = async (company: string, role: string) => {
    try {
      setLoadingCompany(true);
      const res = await api.get("/career/interview-prep/discover", {
        params: { company, role },
      });
      setDiscoveredData(res.data.data);
    } catch (err) {
      console.error("Failed to discover company questions:", err);
    } finally {
      setLoadingCompany(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    void loadCompanyDiscovery(discoverCompany, discoverRole);
  }, [discoverCompany, discoverRole]);

  // Handle status update
  const handleUpdateStatus = async (
    id: string,
    status: "not_started" | "practicing" | "confident"
  ) => {
    try {
      await api.patch(`/career/interview-prep/${id}`, { status });
      toast.success(`Status marked as ${status.replace("_", " ")}`);
      await loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (q: InterviewQuestionItem) => {
    try {
      await api.patch(`/career/interview-prep/${q._id}`, {
        isFavorite: !q.isFavorite,
      });
      toast.success(!q.isFavorite ? "Saved to Favorites" : "Removed from Favorites");
      await loadData();
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  // Save STAR response
  const handleSaveStar = async (id: string) => {
    try {
      await api.patch(`/career/interview-prep/${id}`, {
        starResponse: starForm,
        status: "practicing",
      });
      toast.success("STAR response saved");
      setStarEditingId(null);
      await loadData();
    } catch (err) {
      toast.error("Failed to save STAR response");
    }
  };

  // Save custom question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    try {
      if (editingQuestion) {
        await api.patch(`/career/interview-prep/${editingQuestion._id}`, questionForm);
        toast.success("Question updated");
      } else {
        await api.post("/career/interview-prep", questionForm);
        toast.success("Question added to personal bank");
      }
      setShowQuestionModal(false);
      setEditingQuestion(null);
      await loadData();
    } catch (err) {
      toast.error("Failed to save question");
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/career/interview-prep/${id}`);
      toast.success("Question deleted");
      await loadData();
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  // Filtered lists
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (activeTab === "technical" && q.type !== "technical" && q.type !== "project") return false;
      if (activeTab === "behavioral" && q.type !== "behavioral") return false;
      if (activeTab === "coding" && q.type !== "coding") return false;
      if (activeTab === "my_questions" && !q.isPersonal) return false;

      if (selectedCategory !== "All" && q.category !== selectedCategory) return false;
      if (selectedCompany !== "All" && q.company !== selectedCompany) return false;
      if (selectedDifficulty !== "All" && q.difficulty !== selectedDifficulty) return false;
      if (selectedStatus !== "All" && q.status !== selectedStatus) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(query) ||
          (q.topic && q.topic.toLowerCase().includes(query)) ||
          (q.company && q.company.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [questions, activeTab, selectedCategory, selectedCompany, selectedDifficulty, selectedStatus, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Interview Preparation Hub
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Structured placement intelligence: Technical topics, Behavioral STAR responses, Company-specific discovery & Coding progress.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={handleSyncCatalog}
            className="border-purple-500/30 text-xs font-semibold text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
          >
            <Sparkles size={14} className={cn("mr-1.5", syncing && "animate-spin")} />
            {syncing ? "Syncing Books & Web..." : "Sync CTCI & Books"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingQuestion(null);
              setQuestionForm({
                question: "",
                answer: "",
                explanation: "",
                category: "Data Structures",
                topic: "",
                difficulty: "Medium",
                company: "Google",
                role: "Software Engineer",
                type: "technical",
                status: "not_started",
                notes: "",
                source: "Personal",
                sourceUrl: "",
                problemUrl: "",
              });
              setShowQuestionModal(true);
            }}
            className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
          >
            <Plus size={14} className="mr-1" />
            Add Custom Question
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {[
          { id: "overview", label: "Progress Dashboard", icon: Target },
          { id: "technical", label: "Technical Interview", icon: BookOpen },
          { id: "behavioral", label: "Behavioral Interview (STAR)", icon: UserCheck },
          { id: "company", label: "Company Preparation", icon: Building2 },
          { id: "coding", label: "Coding Questions Tracker", icon: Code2 },
          { id: "my_questions", label: "My Question Bank", icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150",
              activeTab === tab.id
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & PROGRESS DASHBOARD (4.7 Requirement) */}
      {activeTab === "overview" && progress && (
        <div className="space-y-6">
          {/* Top Progress Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall Progress */}
            <div className="surface-card rounded-2xl p-5 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Overall Placement Readiness
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {progress.overallProgress}%
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  ({progress.totalSolved} / {progress.totalQuestions} ready)
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-700"
                  style={{ width: `${progress.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Technical */}
            <div className="surface-card rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Technical Interview
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-600">
                  {progress.technical.completed} / {progress.technical.total}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  ({progress.technical.percentage}%)
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${progress.technical.percentage}%` }}
                />
              </div>
            </div>

            {/* Behavioral */}
            <div className="surface-card rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Behavioral (STAR)
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {progress.behavioral.completed} / {progress.behavioral.total}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  ({progress.behavioral.percentage}%)
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${progress.behavioral.percentage}%` }}
                />
              </div>
            </div>

            {/* Coding */}
            <div className="surface-card rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Coding Problems Solved
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600">
                  {progress.coding.completed} / {progress.coding.total}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  ({progress.coding.percentage}%)
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${progress.coding.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-bold text-base text-[var(--text-primary)] mb-2">
              Recommended Placement Prep Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-surface-elevated)]">
                <span className="rounded bg-blue-500/10 text-blue-600 px-2 py-0.5 font-bold">1. Technical Core</span>
                <h4 className="font-bold text-sm text-[var(--text-primary)] mt-2">Master Core Subjects</h4>
                <p className="text-[var(--text-secondary)] mt-1">
                  Revise OS deadlocks, DBMS transactions (ACID/isolation levels), and system design blueprints.
                </p>
                <button
                  onClick={() => setActiveTab("technical")}
                  className="mt-3 text-purple-600 font-semibold hover:underline"
                >
                  Start Technical Prep →
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-surface-elevated)]">
                <span className="rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-bold">2. Behavioral</span>
                <h4 className="font-bold text-sm text-[var(--text-primary)] mt-2">Structure Your STAR Stories</h4>
                <p className="text-[var(--text-secondary)] mt-1">
                  Draft 4 key stories covering Conflict, Failure, Leadership, and Customer Obsession.
                </p>
                <button
                  onClick={() => setActiveTab("behavioral")}
                  className="mt-3 text-purple-600 font-semibold hover:underline"
                >
                  Write STAR Responses →
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-surface-elevated)]">
                <span className="rounded bg-purple-500/10 text-purple-600 px-2 py-0.5 font-bold">3. Target Company</span>
                <h4 className="font-bold text-sm text-[var(--text-primary)] mt-2">Discover Past Questions</h4>
                <p className="text-[var(--text-secondary)] mt-1">
                  Analyze Google, Microsoft, and Amazon question archives and official hiring guides.
                </p>
                <button
                  onClick={() => setActiveTab("company")}
                  className="mt-3 text-purple-600 font-semibold hover:underline"
                >
                  Explore Company Questions →
                </button>
              </div>
            </div>
          </div>

          {/* Authoritative Literature Reference Card */}
          <div className="surface-card rounded-2xl p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Authoritative Curriculum & Book Citations
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              All question models in this hub are curated directly from industry standard literature rather than synthetic or placeholder data:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">📖 Cracking the Coding Interview</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Gayle Laakmann McDowell (6th Edition) — Core Chapters 1-8 (Arrays, Lists, Stacks, Trees, Bit Manipulation).</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-blue-600 block mb-1">📚 Operating System Concepts</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Silberschatz, Galvin & Gagne — Deadlock prevention (Coffman conditions), Virtual Memory, and Spinlocks.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-emerald-600 block mb-1">📘 Database Management Systems</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Ramakrishnan & Gehrke — B+ Trees vs Hash Indexing, ACID isolation levels, and BCNF normalization.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-cyan-600 block mb-1">🌐 Computer Networking</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Kurose & Ross — TCP congestion control, DNS hierarchical resolution, and HTTP/3 QUIC transport.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-indigo-600 block mb-1">🏗️ Designing Data-Intensive Applications</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Martin Kleppmann — CAP/PACELC trade-offs, Distributed Consensus, and Leaky Bucket rate limiters.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
                <span className="font-bold text-amber-600 block mb-1">🎯 FAANG Rubrics & LeetCode Blind 75</span>
                <p className="text-[11px] text-[var(--text-tertiary)]">Amazon Leadership Principles, Google Hiring Guidelines, and canonical LeetCode interview challenges.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY PREPARATION (4.1 & 4.5 Requirements) */}
      {activeTab === "company" && (
        <div className="space-y-6">
          <div className="surface-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Company & Role Intelligence
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Discover publicly available past interview questions, official preparation guides, and resource links.
                </p>
              </div>

              {/* Company & Role Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={discoverCompany}
                  onChange={(e) => setDiscoverCompany(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  {COMPANIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={discoverRole}
                  onChange={(e) => setDiscoverRole(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>
            </div>

            {loadingCompany ? (
              <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
                Loading verified company resources...
              </div>
            ) : discoveredData ? (
              <div className="space-y-6">
                {/* Company overview box */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                    <Building2 size={16} className="text-purple-600" />
                    <span>{discoverCompany} Hiring Focus ({discoverRole})</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                    {discoveredData.description}
                  </p>
                </div>

                {/* Official Resources & Guides with attribution */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                    Official Guides & Resources
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {discoveredData.resources?.map((res: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition"
                      >
                        <div>
                          <span className="rounded bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-bold">
                            {res.type}
                          </span>
                          <h4 className="mt-2 font-semibold text-xs text-[var(--text-primary)]">
                            {res.title}
                          </h4>
                          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                            Source: {res.source}
                          </p>
                        </div>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 text-[11px] font-semibold text-purple-600 hover:underline inline-flex items-center gap-1"
                        >
                          Visit Resource <ExternalLink size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Public Past Questions */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                    Publicly Available Past Interview Questions
                  </h3>
                  <div className="space-y-3">
                    {discoveredData.pastQuestions?.map((pq: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text-primary)]">
                              {pq.question}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                                pq.difficulty === "Easy"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : pq.difficulty === "Medium"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-red-500/10 text-red-600"
                              )}
                            >
                              {pq.difficulty}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                            <span>Topic: {pq.topic}</span>
                            <span>•</span>
                            <span>Category: {pq.category}</span>
                            <span>•</span>
                            <span>Source: {pq.source}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {pq.sourceUrl && (
                            <a
                              href={pq.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] inline-flex items-center gap-1"
                            >
                              Original Link <ExternalLink size={12} />
                            </a>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setQuestionForm({
                                question: pq.question,
                                answer: "",
                                explanation: `From ${discoverCompany} interview questions pool.`,
                                category: pq.category || "Data Structures",
                                topic: pq.topic || "",
                                difficulty: pq.difficulty || "Medium",
                                company: discoverCompany,
                                role: discoverRole,
                                type: pq.category === "Behavioral" ? "behavioral" : "technical",
                                status: "not_started",
                                notes: "",
                                source: pq.source || "Public Catalog",
                                sourceUrl: pq.sourceUrl || "",
                                problemUrl: pq.sourceUrl || "",
                              });
                              setShowQuestionModal(true);
                            }}
                            className="bg-purple-600 text-xs text-white"
                          >
                            + Save to My Bank
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TABS: Technical, Behavioral (STAR), Coding, My Questions */}
      {activeTab !== "overview" && activeTab !== "company" && (
        <div className="space-y-6">
          {/* Authoritative Sources Banner for Technical */}
          {activeTab === "technical" && (
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-[var(--text-primary)]">
                    Authentic Questions from Authoritative Books & Standard CS Curricula
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Sourced directly from verified literature: Gayle Laakmann McDowell's <span className="font-semibold text-purple-600 dark:text-purple-400">Cracking the Coding Interview (6th Ed.)</span>, Silberschatz's <span className="font-semibold">Operating System Concepts</span>, Ramakrishnan's <span className="font-semibold">Database Management Systems</span>, Kurose & Ross's <span className="font-semibold">Computer Networking</span>, and Martin Kleppmann's <span className="font-semibold">Designing Data-Intensive Applications</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Banner for Coding */}
          {activeTab === "coding" && (
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 shrink-0">
                  <Code2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-[var(--text-primary)]">
                    Vetted Placement Coding Tracker (Blind 75 & NeetCode 150)
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Canonical algorithmic challenges frequently asked at Google, Amazon, Microsoft, and Meta with direct links to practice platforms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter for Technical */}
              {activeTab === "technical" && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <option value="All">Status: All</option>
                <option value="not_started">Not Started</option>
                <option value="practicing">Practicing</option>
                <option value="confident">Confident</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <option value="All">Difficulty: All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search questions or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600 w-52 sm:w-64"
              />
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="surface-card rounded-2xl p-12 text-center text-xs text-[var(--text-tertiary)]">
              <HelpCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
              No questions found matching your filter criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q._id}
                  className="surface-card rounded-2xl p-5 hover:border-purple-500/30 transition-all border-[var(--border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="rounded-md bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-bold">
                          {q.category}
                        </span>
                        {q.topic && (
                          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                            {q.topic}
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[10px] font-bold",
                            q.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : q.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-red-500/10 text-red-600"
                          )}
                        >
                          {q.difficulty}
                        </span>
                        {q.company && q.company !== "General" && (
                          <span className="rounded bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] px-1.5 py-0.2 text-[10px]">
                            🏢 {q.company}
                          </span>
                        )}
                        {q.source && (
                          <span className="rounded-md border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 inline-flex items-center gap-1">
                            {q.source.includes("Cracking")
                              ? "📖 "
                              : q.source.includes("OS") || q.source.includes("Silberschatz")
                              ? "📚 "
                              : q.source.includes("DBMS") || q.source.includes("Ramakrishnan")
                              ? "📘 "
                              : q.source.includes("Networking") || q.source.includes("Kurose")
                              ? "🌐 "
                              : q.source.includes("Data-Intensive") || q.source.includes("Kleppmann")
                              ? "🏗️ "
                              : q.source.includes("Amazon")
                              ? "🎯 "
                              : q.source.includes("Google")
                              ? "🔍 "
                              : "💻 "}
                            <span>{q.source}</span>
                            {q.sourceUrl && (
                              <a
                                href={q.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-500 hover:text-purple-700 ml-0.5"
                                title="Open Original Reference"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        {q.question}
                      </h3>
                    </div>

                    {/* Right action badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Selector Pill */}
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateStatus(q._id, e.target.value as any)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-bold border-none outline-hidden cursor-pointer",
                          q.status === "confident"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : q.status === "practicing"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)]"
                        )}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="practicing">Practicing</option>
                        <option value="confident">Confident</option>
                      </select>

                      <button
                        onClick={() => handleToggleFavorite(q)}
                        className="text-[var(--text-tertiary)] hover:text-amber-500 p-1"
                        title={q.isFavorite ? "Favorited" : "Favorite"}
                      >
                        <Star
                          size={16}
                          className={q.isFavorite ? "text-amber-500 fill-amber-500" : ""}
                        />
                      </button>

                      {q.isPersonal && (
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="text-[var(--text-tertiary)] hover:text-red-500 p-1"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4.3 BEHAVIORAL: STAR Response Editor */}
                  {q.type === "behavioral" && (
                    <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-700 dark:text-purple-300">
                          STAR Method Answer (Situation, Task, Action, Result)
                        </span>
                        {starEditingId !== q._id && (
                          <button
                            onClick={() => {
                              setStarEditingId(q._id);
                              setStarForm({
                                situation: q.starResponse?.situation || "",
                                task: q.starResponse?.task || "",
                                action: q.starResponse?.action || "",
                                result: q.starResponse?.result || "",
                              });
                            }}
                            className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <Edit3 size={12} /> {q.starResponse?.situation ? "Edit STAR" : "Write STAR"}
                          </button>
                        )}
                      </div>

                      {starEditingId === q._id ? (
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="font-bold text-[11px] text-[var(--text-primary)]">
                              Situation (What context did you face?)
                            </label>
                            <textarea
                              rows={2}
                              value={starForm.situation}
                              onChange={(e) => setStarForm({ ...starForm, situation: e.target.value })}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-[11px] text-[var(--text-primary)]">
                              Task (What was your specific responsibility?)
                            </label>
                            <textarea
                              rows={2}
                              value={starForm.task}
                              onChange={(e) => setStarForm({ ...starForm, task: e.target.value })}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-[11px] text-[var(--text-primary)]">
                              Action (What specific steps did you execute?)
                            </label>
                            <textarea
                              rows={2}
                              value={starForm.action}
                              onChange={(e) => setStarForm({ ...starForm, action: e.target.value })}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-[11px] text-[var(--text-primary)]">
                              Result (What was the measurable outcome or learning?)
                            </label>
                            <textarea
                              rows={2}
                              value={starForm.result}
                              onChange={(e) => setStarForm({ ...starForm, result: e.target.value })}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-primary)]"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStarEditingId(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveStar(q._id)}
                              className="bg-purple-600 text-xs text-white"
                            >
                              Save STAR Response
                            </Button>
                          </div>
                        </div>
                      ) : q.starResponse?.situation ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-[var(--bg-surface)] p-2.5 border border-[var(--border)]">
                            <span className="font-bold text-[10px] text-purple-600 block">SITUATION</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{q.starResponse.situation}</p>
                          </div>
                          <div className="rounded-lg bg-[var(--bg-surface)] p-2.5 border border-[var(--border)]">
                            <span className="font-bold text-[10px] text-purple-600 block">TASK</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{q.starResponse.task}</p>
                          </div>
                          <div className="rounded-lg bg-[var(--bg-surface)] p-2.5 border border-[var(--border)]">
                            <span className="font-bold text-[10px] text-purple-600 block">ACTION</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{q.starResponse.action}</p>
                          </div>
                          <div className="rounded-lg bg-[var(--bg-surface)] p-2.5 border border-[var(--border)]">
                            <span className="font-bold text-[10px] text-purple-600 block">RESULT</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{q.starResponse.result}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--text-secondary)] italic">
                          No STAR response written yet. Click "Write STAR" to prepare your story.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Expand Answer for Technical */}
                  {q.type !== "behavioral" && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--border)]">
                      <button
                        onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{expandedId === q._id ? "Hide Explanation" : "Reveal Answer & Explanation"}</span>
                        <ChevronDown
                          size={14}
                          className={cn("transition-transform", expandedId === q._id && "rotate-180")}
                        />
                      </button>

                      {expandedId === q._id && (
                        <div className="mt-3 space-y-2 rounded-xl bg-[var(--bg-surface-elevated)] p-4 text-xs">
                          {q.answer && (
                            <div>
                              <span className="font-bold text-[11px] text-[var(--text-primary)] block">Answer:</span>
                              <p className="text-[var(--text-secondary)] mt-0.5">{q.answer}</p>
                            </div>
                          )}
                          {q.explanation && (
                            <div>
                              <span className="font-bold text-[11px] text-[var(--text-primary)] block">
                                Technical Deep Dive:
                              </span>
                              <p className="text-[var(--text-secondary)] mt-0.5">{q.explanation}</p>
                            </div>
                          )}
                          {q.problemUrl && (
                            <div className="pt-2">
                              <a
                                href={q.problemUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:underline"
                              >
                                Solve Problem on {q.source || "Platform"} <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Custom Question */}
      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editingQuestion ? "Edit Question" : "Add Interview Question"}
                </h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Question *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. How do B-Trees optimize disk I/O in databases?"
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">Type</label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as any })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-xs text-[var(--text-primary)]"
                    >
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral (STAR)</option>
                      <option value="coding">Coding Problem</option>
                      <option value="project">Project Architecture</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">Category</label>
                    <select
                      value={questionForm.category}
                      onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-xs text-[var(--text-primary)]"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">Difficulty</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-xs text-[var(--text-primary)]"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Google"
                      value={questionForm.company}
                      onChange={(e) => setQuestionForm({ ...questionForm, company: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">Topic</label>
                    <input
                      type="text"
                      placeholder="Indexing"
                      value={questionForm.topic}
                      onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Answer Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short answer..."
                    value={questionForm.answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Explanation / Technical Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detailed explanation..."
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuestionModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white">
                    Save Question
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
