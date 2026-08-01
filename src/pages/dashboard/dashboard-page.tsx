import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Sparkles,
  BookOpen,
  Target,
  Award,
  GraduationCap,
  Layers,
  Calendar,
  Calculator,
  ChevronRight,
  ShieldAlert,
  Upload,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/states";
import { CountUp } from "@/components/shared/count-up";
import { TrendChart, type TrendChartPoint } from "@/components/charts/trend-chart";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { UploadResultsModal } from "@/components/upload/upload-results-modal";
import { DashboardService, type DashboardSummary } from "@/services/dashboard-service";
import { SemesterService } from "@/services/semester-service";
import { toast } from "sonner";
import type { CgpaViewMode } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicStore } from "@/lib/store/use-academic-store";

export function DashboardPage() {
  const { user } = useAuth();
  const storeTargetCgpa = useAcademicStore((state) => state.targetCgpa);

  const [view, setView] = useState<CgpaViewMode>("cgpa");
  const [graphMode, setGraphMode] = useState<"official" | "predicted">("official");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    DashboardService.getDashboardSummary()
      .then((data) => {
        setSummaryData(data || null);
      })
      .catch((err) => {
        console.error("Failed to load backend dashboard data:", err);
        setError("Failed to load dashboard data from backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();

    const handleAcademicUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener("academic-data-updated", handleAcademicUpdate);
    return () => {
      window.removeEventListener("academic-data-updated", handleAcademicUpdate);
    };
  }, []);

  const current = useMemo(() => {
    return summaryData?.currentSemester || null;
  }, [summaryData]);

  const currentSemesterSubjects = useMemo(() => {
    if (!summaryData) return [];
    if (summaryData.currentSemester && typeof summaryData.currentSemester === "object" && "activeSubjects" in summaryData.currentSemester) {
      const active = (summaryData.currentSemester as any).activeSubjects;
      return Array.isArray(active) ? active : [];
    }
    return Array.isArray(summaryData.subjects) ? summaryData.subjects : [];
  }, [summaryData]);

  const rawCalculatedCgpa = summaryData?.cgpa;
  const calculatedCgpa = typeof rawCalculatedCgpa === "number" && !isNaN(rawCalculatedCgpa) && rawCalculatedCgpa > 0 ? rawCalculatedCgpa : null;
  const calculatedSgpa = typeof summaryData?.sgpa === "number" && !isNaN(summaryData.sgpa) ? summaryData.sgpa : null;

  const profileCgpa = typeof user?.currentCgpa === "number" && !isNaN(user.currentCgpa) ? user.currentCgpa : null;
  const activeCgpa = calculatedCgpa ?? profileCgpa;
  const isBaselineCgpa = calculatedCgpa === null && profileCgpa !== null;

  const headline = view === "cgpa" ? activeCgpa : calculatedSgpa;

  const targetCgpa = typeof user?.targetCgpa === "number"
    ? user.targetCgpa
    : storeTargetCgpa || summaryData?.targetCgpa || 9.0;

  const targetProgress = useMemo(() => {
    if (headline === null || !targetCgpa) return 0;
    const progress = Math.min(100, Math.max(0, Math.round((headline / targetCgpa) * 100)));
    return isNaN(progress) ? 0 : progress;
  }, [headline, targetCgpa]);

  const confidencePct = useMemo(() => {
    if (!Array.isArray(currentSemesterSubjects) || currentSemesterSubjects.length === 0) return 75;
    let totalWeight = 0;
    let evaluatedWeight = 0;
    currentSemesterSubjects.forEach((s: any) => {
      if (!s) return;
      const types = Array.isArray(s.scheme?.assessmentTypes) ? s.scheme.assessmentTypes : [];
      const marksMap = s.marks && typeof s.marks === "object" ? s.marks : {};
      types.forEach((t: any) => {
        if (!t) return;
        const w = typeof t.weightPct === "number" ? t.weightPct : 25;
        totalWeight += w;
        if (t.id && marksMap[t.id] !== undefined && marksMap[t.id] !== null && marksMap[t.id] !== "") {
          evaluatedWeight += w;
        }
      });
    });
    if (totalWeight === 0) return 70;
    const ratio = Math.round((evaluatedWeight / totalWeight) * 100);
    return Math.max(45, Math.min(95, ratio));
  }, [currentSemesterSubjects]);

  const cgpaTrend: TrendChartPoint[] = useMemo(() => {
    const rawTrend = summaryData?.cgpaTrend;
    const baseTrend: TrendChartPoint[] = [];

    if (Array.isArray(rawTrend)) {
      const completedCount = rawTrend.length;
      rawTrend.forEach((item: any, idx: number) => {
        if (!item) return;
        const isLastCompleted = idx === completedCount - 1;
        const sgpaVal = item.sgpa !== undefined && item.sgpa !== null && !isNaN(Number(item.sgpa)) ? Number(item.sgpa) : null;
        const cgpaVal = item.cgpa !== undefined && item.cgpa !== null && !isNaN(Number(item.cgpa)) ? Number(item.cgpa) : null;

        baseTrend.push({
          label: item.semester || `Sem ${idx + 1}`,
          isProjected: false,
          officialSgpa: sgpaVal,
          officialCgpa: cgpaVal,
          projectedSgpa: isLastCompleted ? sgpaVal : null,
          projectedCgpa: isLastCompleted ? cgpaVal : null,
          credits: typeof item.credits === "number" ? item.credits : 20,
          status: "Completed",
        });
      });
    }

    if (summaryData?.currentSemester) {
      const currentSemSgpa = summaryData.sgpa !== undefined && summaryData.sgpa !== null && !isNaN(Number(summaryData.sgpa)) ? Number(summaryData.sgpa) : (calculatedSgpa ?? null);
      const currentSemCgpa = summaryData.projectedCgpa !== undefined && summaryData.projectedCgpa !== null && !isNaN(Number(summaryData.projectedCgpa)) ? Number(summaryData.projectedCgpa) : (activeCgpa ?? null);

      baseTrend.push({
        label: `${summaryData.currentSemester.name || "Current Sem"} (Projected)`,
        isProjected: true,
        officialSgpa: null,
        officialCgpa: null,
        projectedSgpa: currentSemSgpa,
        projectedCgpa: currentSemCgpa,
        confidencePct,
        note: "Based on entered assessments",
      });
    }

    return baseTrend;
  }, [summaryData, confidencePct, calculatedSgpa, activeCgpa]);

  const activeAtRiskSubjects = useMemo(() => {
    if (!Array.isArray(currentSemesterSubjects) || currentSemesterSubjects.length === 0) return [];

    return currentSemesterSubjects
      .filter(Boolean)
      .map((s: any) => {
        const pct = typeof s.calculatedPct === "number" && !isNaN(s.calculatedPct) ? s.calculatedPct : (typeof s.currentScore === "number" ? s.currentScore : null);
        const isInProgress = s.isInProgress || pct === null || s.letterGrade === "In Progress" || s.status === "In Progress";

        const types = Array.isArray(s.scheme?.assessmentTypes) ? s.scheme.assessmentTypes : [];
        const marksMap = s.marks && typeof s.marks === "object" ? s.marks : {};
        const missingAssessments: string[] = [];

        types.forEach((t: any) => {
          if (!t) return;
          const val = t.id ? marksMap[t.id] : undefined;
          if (val === undefined || val === null || val === "") {
            missingAssessments.push(t.name || "Assessment");
          }
        });

        const isBelowTarget = pct !== null && pct < 75;
        const isCritical = pct !== null && pct < 60;
        const isAtRisk = isBelowTarget || (isInProgress && missingAssessments.length > 1);

        const riskLevel: "Critical" | "Moderate" | "Low" = isCritical ? "Critical" : pct !== null && pct < 70 ? "Moderate" : "Low";
        const requiredScore = pct !== null ? Math.min(100, Math.round(pct + 12)) : 80;

        return {
          subject: s,
          subjectId: s._id || s.id || `risk-${s.name || Math.random()}`,
          subjectName: s.name || "Unnamed Subject",
          credits: s.credits ?? 0,
          currentScore: pct !== null ? `${pct.toFixed(1)}%` : "In Progress",
          missingAssessments: missingAssessments.slice(0, 3),
          requiredScore: `${requiredScore}%`,
          riskLevel,
          isAtRisk,
          reason: s.reason || (isCritical ? "Performing significantly below target grade" : "Low internal score trend"),
        };
      })
      .filter((item: any) => item && item.isAtRisk);
  }, [currentSemesterSubjects]);

  const showOnboardingCard = false;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header & Segmented Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
            <Sparkles size={13} className="text-purple-600 dark:text-purple-400" /> Command Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Academic Overview</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Real-time standing, CGPA progression, active courses, and performance targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={() => setAddSubjectModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus size={16} /> Add New Subject
          </Button>

          {/* SGPA / CGPA View Segmented Switcher */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-zinc-950 p-1 text-xs font-semibold shadow-sm">
            {(["sgpa", "cgpa"] as CgpaViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  view === mode
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold dark:bg-purple-600 dark:text-white dark:border-purple-500"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. UNIVERSITY HERO INFORMATION CARD (Enhanced Padding & Distinct Chips) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/90 p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-600/30 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 shadow-sm">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">{user?.college || "University"}</h3>
                {user?.academicStatus && (
                  <Badge tone={user.academicStatus.includes("First") ? "warning" : "success"} className="text-[11px]">
                    {user.academicStatus}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2 font-medium">
                <span>{user?.course || "Degree Program"}</span>
                <span>•</span>
                <span>{user?.branch || "Department"}</span>
              </p>
            </div>
          </div>

          {/* Distinct Visual Chips with Color Hierarchies */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10 px-3 py-1.5 text-purple-700 dark:text-purple-300 font-semibold">
              <Layers size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Active: <strong>{user?.currentSemester || user?.semesterSystem || "Semester 1"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 px-3 py-1.5 text-blue-700 dark:text-blue-300 font-semibold">
              <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Batch: <strong>{user?.academicSession || "N/A"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Credits: <strong className="font-mono">{summaryData?.completedCredits ?? 0} Cr</strong></span>
            </div>

            {typeof user?.currentCgpa === "number" && (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <Award size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Baseline: <strong className="font-mono">{user.currentCgpa.toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. METRIC CARDS (High Typographic Hierarchy) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card A: Current CGPA */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/90">
            <div className="flex flex-row items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                {view === "cgpa" ? "Current Overall CGPA" : `${current?.name || "Current Semester"} SGPA`}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
                <Award size={18} />
              </div>
            </div>
            <div>
              {headline !== null ? (
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold font-tabular text-slate-900 dark:text-white tracking-tight">
                    <CountUp value={headline} decimals={2} />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <TrendingUp size={12} /> {isBaselineCgpa ? "Baseline" : "On Track"}
                  </span>
                </div>
              ) : (
                <div className="text-xl font-bold text-slate-400 dark:text-zinc-400 mt-2">No CGPA Available</div>
              )}
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                Completed Credits: <strong className="text-slate-900 dark:text-white font-mono">{summaryData?.completedCredits ?? 0}</strong>
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Card B: Target CGPA Goal */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/90">
            <div className="flex flex-row items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Target CGPA Goal</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                <Target size={18} />
              </div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-tabular text-purple-600 dark:text-purple-400 mt-1 tracking-tight">
                {typeof targetCgpa === "number" ? targetCgpa.toFixed(2) : "9.00"}
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">Graduation Target Benchmark</p>
            </div>
          </Card>
        </motion.div>

        {/* Card C: Goal Completion Progress */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/90">
            <div className="flex flex-row items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Goal Completion</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-extrabold font-tabular text-slate-900 dark:text-white tracking-tight">{targetProgress}%</div>
              <ProgressBar value={targetProgress} tone="accent" />
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">Progress toward target CGPA</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. CGPA PROGRESSION GRAPH (Taller Graph & Axis Contrast) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">CGPA Progression Trend</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-zinc-950 p-1 text-xs font-semibold">
              <button
                onClick={() => setGraphMode("official")}
                className={`rounded-lg px-3 py-1 transition-all ${
                  graphMode === "official"
                    ? "bg-white text-slate-900 font-bold shadow-sm border border-slate-200 dark:bg-purple-600 dark:text-white"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Official Progress
              </button>
              <button
                onClick={() => setGraphMode("predicted")}
                className={`rounded-lg px-3 py-1 transition-all flex items-center gap-1.5 ${
                  graphMode === "predicted"
                    ? "bg-white text-slate-900 font-bold shadow-sm border border-slate-200 dark:bg-purple-600 dark:text-white"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Predicted Progress
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-300 animate-pulse" />
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-zinc-500 font-semibold hidden md:inline">
              {(summaryData?.completedSemesters ?? []).length} Completed
            </span>
          </div>
        </div>

        <div>
          {cgpaTrend.length > 0 ? (
            <TrendChart data={cgpaTrend} mode={graphMode} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-zinc-500 text-center py-10 italic">No historical semester trend data recorded yet.</p>
          )}
        </div>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. AT-RISK SUBJECTS WARNING SECTION (Color-Coded Left Borders) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeAtRiskSubjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Academic Warning & Risk Alerts ({activeAtRiskSubjects.length})
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {activeAtRiskSubjects.map((r: any) => {
              const borderClass =
                r.riskLevel === "Critical"
                  ? "border-l-4 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20"
                  : r.riskLevel === "Moderate"
                  ? "border-l-4 border-orange-500 bg-orange-50/40 dark:bg-orange-950/20"
                  : "border-l-4 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20";

              return (
                <Card
                  key={r.subjectId}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-white/10 ${borderClass}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 dark:bg-zinc-800 shadow-sm">
                      <AlertTriangle size={18} className={r.riskLevel === "Critical" ? "text-rose-600" : "text-amber-600"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{r.subjectName}</h4>
                        <Badge tone={r.riskLevel === "Critical" ? "danger" : "warning"}>{r.riskLevel} Risk</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">{r.reason}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-2 font-medium">
                        <span>Current Score: <strong className="text-slate-900 dark:text-white font-mono">{r.currentScore}</strong></span>
                        <span>• Required Target: <strong className="text-purple-600 dark:text-purple-400 font-mono">{r.requiredScore}</strong></span>
                        {r.missingAssessments && r.missingAssessments.length > 0 && (
                          <span>• Missing: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{r.missingAssessments.join(", ")}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link to="/app/academic-planner" className="shrink-0">
                    <Button variant="primary" size="sm" className="gap-1.5 w-full sm:w-auto">
                      Simulate Score <ChevronRight size={14} />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. ACTIVE CURRENT SEMESTER COURSES GRID */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Active Current Semester Courses ({currentSemesterSubjects.length})
            </h2>
            <Badge tone="warning" className="text-[10px]">In Progress</Badge>
          </div>

          <Link to="/app/subjects">
            <Button variant="ghost" size="sm" className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 gap-1 font-semibold">
              View All Subjects <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {currentSemesterSubjects.length === 0 ? (
          <Card className="border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
            <BookOpen size={36} className="mx-auto mb-3 text-slate-400 dark:text-zinc-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No active subjects for this semester</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 max-w-md mx-auto font-medium">
              Add your current semester subjects and assessment schemes to start tracking your targets.
            </p>
            <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mt-4 gap-2">
              <Plus size={16} /> Add Current Subject
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {currentSemesterSubjects.map((subject: any, idx: number) => {
              const idKey = subject.id || subject._id || `subj-${idx}`;
              const pct = typeof subject.currentScore === "number" ? subject.currentScore : (typeof subject.calculatedPct === "number" ? subject.calculatedPct : 0);
              const isInProgress = subject.currentScore === null || subject.currentScore === undefined;
              const letter = isInProgress ? "In Progress" : (subject.letterGrade || "N/A");

              return (
                <Link key={idKey} to={`/app/subjects`}>
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
                    <Card className="group cursor-pointer border border-slate-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/90 dark:hover:border-purple-500/40 transition-all">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 rounded-full shadow-sm"
                            style={{ backgroundColor: subject.colorTag || "#7c3aed" }}
                          />
                          <span className="font-bold text-slate-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                            {subject.name || "Subject"}
                          </span>
                        </div>
                        <Badge tone={isInProgress ? "warning" : "accent"}>{letter}</Badge>
                      </div>

                      <div className="mb-2 flex items-baseline justify-between text-xs">
                        <span className="text-slate-600 dark:text-zinc-400 font-medium">Current Performance</span>
                        <span className="font-tabular font-bold text-purple-600 dark:text-purple-400 text-sm">
                          {isInProgress ? "In Progress" : `${pct.toFixed(1)}%`}
                        </span>
                      </div>
                      <ProgressBar value={isInProgress ? 0 : pct} tone={isInProgress ? "warning" : "accent"} />

                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-white/10 pt-3">
                        <span className="font-medium text-slate-600 dark:text-zinc-400">Credits: <strong className="text-slate-900 dark:text-white">{subject.credits ?? 0}</strong></span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                          Subject Details <ChevronRight size={14} />
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSubjectModal isOpen={addSubjectModalOpen} onClose={() => setAddSubjectModalOpen(false)} onSuccess={fetchDashboardData} />
      <UploadResultsModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={fetchDashboardData} />
    </div>
  );
}
