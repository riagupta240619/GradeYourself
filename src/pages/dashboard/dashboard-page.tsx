import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Upload,
  Plus,
  Sparkles,
  BookOpen,
  Target,
  Award,
  GraduationCap,
  Layers,
  Calendar,
  Wand2,
  Calculator,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/states";
import { CountUp } from "@/components/shared/count-up";
import { TrendChart, type TrendChartPoint } from "@/components/charts/trend-chart";
import { UploadResultsModal } from "@/components/upload/upload-results-modal";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { DashboardService, type DashboardSummary } from "@/services/dashboard-service";
import { SemesterService } from "@/services/semester-service";
import { toast } from "sonner";
import type { CgpaViewMode } from "@/types";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicStore } from "@/lib/store/use-academic-store";

export function DashboardPage() {
  const { user } = useAuth();
  const storeTargetCgpa = useAcademicStore((state) => state.targetCgpa);
  const [searchParams] = useSearchParams();

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
        setSummaryData(data);
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

    // Listen for live academic data update events across components
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
    if (summaryData?.currentSemester && "activeSubjects" in summaryData.currentSemester) {
      return (summaryData.currentSemester as any).activeSubjects || [];
    }
    return summaryData?.subjects || [];
  }, [summaryData]);

  // 1. Calculated CGPA & SGPA from completed semester records
  const rawCalculatedCgpa = summaryData?.cgpa;
  const calculatedCgpa = typeof rawCalculatedCgpa === "number" && !isNaN(rawCalculatedCgpa) && rawCalculatedCgpa > 0 ? rawCalculatedCgpa : null;
  const calculatedSgpa = typeof summaryData?.sgpa === "number" && !isNaN(summaryData.sgpa) ? summaryData.sgpa : null;

  // 2. User profile CGPA
  const profileCgpa = typeof user?.currentCgpa === "number" && !isNaN(user.currentCgpa) ? user.currentCgpa : null;
  const activeCgpa = calculatedCgpa ?? profileCgpa;
  const isBaselineCgpa = calculatedCgpa === null && profileCgpa !== null;

  const headline = view === "cgpa" ? activeCgpa : calculatedSgpa;

  // Target CGPA Goal
  const targetCgpa = typeof user?.targetCgpa === "number"
    ? user.targetCgpa
    : storeTargetCgpa || summaryData?.targetCgpa || 9.0;

  const targetProgress = useMemo(() => {
    if (headline === null || !targetCgpa) return 0;
    const progress = Math.min(100, Math.max(0, Math.round((headline / targetCgpa) * 100)));
    return isNaN(progress) ? 0 : progress;
  }, [headline, targetCgpa]);

  // Confidence % calculation for prediction mode
  const confidencePct = useMemo(() => {
    if (!currentSemesterSubjects || currentSemesterSubjects.length === 0) return 75;
    let totalWeight = 0;
    let evaluatedWeight = 0;
    currentSemesterSubjects.forEach((s: any) => {
      const types = s.scheme?.assessmentTypes || [];
      const marksMap = s.marks || {};
      types.forEach((t: any) => {
        const w = t.weightPct || 25;
        totalWeight += w;
        if (marksMap[t.id] !== undefined && marksMap[t.id] !== null && marksMap[t.id] !== "") {
          evaluatedWeight += w;
        }
      });
    });
    if (totalWeight === 0) return 70;
    const ratio = Math.round((evaluatedWeight / totalWeight) * 100);
    return Math.max(45, Math.min(95, ratio));
  }, [currentSemesterSubjects]);

  // Requirement: Progression Graph trend data
  // Official mode: Completed semesters ONLY
  // Predicted mode: Includes active current semester projected CGPA as a dotted point
  const cgpaTrend: TrendChartPoint[] = useMemo(() => {
    if (!summaryData?.cgpaTrend) return [];

    const baseTrend: TrendChartPoint[] = summaryData.cgpaTrend.map((item) => ({
      label: item.semester,
      value: item.sgpa,
      projectedValue: item.sgpa,
      isProjected: false,
    }));

    if (summaryData?.currentSemester) {
      const projVal = summaryData.projectedCgpa ?? summaryData.sgpa ?? activeCgpa;
      baseTrend.push({
        label: `${summaryData.currentSemester.name || "Current Sem"} (Projected)`,
        value: null,
        projectedValue: projVal,
        confidencePct,
        note: "Based on current semester assessment predictions",
        isProjected: true,
      });
    }

    return baseTrend;
  }, [summaryData, confidencePct, activeCgpa]);

  // Requirement: At-Risk subjects analyzes ONLY Current Semester subjects
  const activeAtRiskSubjects = useMemo(() => {
    if (!currentSemesterSubjects || currentSemesterSubjects.length === 0) return [];

    return currentSemesterSubjects.map((s: any) => {
      const pct = typeof s.calculatedPct === "number" ? s.calculatedPct : null;
      const isInProgress = s.isInProgress || s.calculatedPct === null || s.letterGrade === "In Progress" || s.status === "In Progress";
      
      const types = s.scheme?.assessmentTypes || [];
      const marksMap = s.marks || {};
      const missingAssessments: string[] = [];

      types.forEach((t: any) => {
        const val = marksMap[t.id];
        if (val === undefined || val === null || val === "") {
          missingAssessments.push(t.name);
        }
      });

      const isBelowTarget = pct !== null && pct < 75;
      const isCritical = pct !== null && pct < 60;
      const isAtRisk = isBelowTarget || (isInProgress && missingAssessments.length > 1);

      const riskLevel: "Critical" | "Moderate" | "Low" = isCritical ? "Critical" : pct !== null && pct < 70 ? "Moderate" : "Low";
      const requiredScore = pct !== null ? Math.min(100, Math.round(pct + 12)) : 80;

      return {
        subject: s,
        subjectId: s._id || s.id,
        subjectName: s.name,
        credits: s.credits,
        currentScore: pct !== null ? `${pct.toFixed(1)}%` : "In Progress",
        missingAssessments: missingAssessments.slice(0, 3),
        requiredScore: `${requiredScore}%`,
        riskLevel,
        isAtRisk,
        reason: s.reason || (isCritical ? "Performing significantly below target grade" : "Low internal score trend"),
      };
    }).filter((item: any) => item.isAtRisk);
  }, [currentSemesterSubjects]);

  // Finalize current semester action
  const handleFinalizeCurrentSemester = async () => {
    const semId = current?._id || current?.id;
    if (!semId) return;
    const semName = current?.name || "the current semester";
    const confirmMsg = `Are you sure you want to finalize ${semName}?\n\nThis will lock its SGPA, move it to Completed Semesters, and update your official CGPA, progression graph, and past results.`;

    if (confirm(confirmMsg)) {
      setIsFinalizing(true);
      try {
        const res = await SemesterService.finalizeSemester(semId);
        toast.success(res.message || "Semester finalized successfully!");
        window.dispatchEvent(new CustomEvent("academic-data-updated"));
        fetchDashboardData();
      } catch (err: any) {
        console.error("Failed to finalize semester:", err);
        toast.error("Failed to finalize semester.");
      } finally {
        setIsFinalizing(false);
      }
    }
  };

  const hasAcademicData = Boolean(
    (summaryData?.semesters && summaryData.semesters.length > 0) || currentSemesterSubjects.length > 0
  );
  const showOnboardingCard = Boolean(user?.profileCompleted) && !hasAcademicData;

  const atRiskCount = activeAtRiskSubjects.length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header & Mode Switches */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Sparkles size={12} className="text-purple-400" /> Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Academic Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time standing, CGPA progression, active courses, and performance targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="flex-1 sm:flex-initial border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50"
          >
            <Upload size={15} /> Upload Results PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddSubjectModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus size={15} /> Add New Subject
          </Button>

          {/* SGPA / CGPA View Switcher */}
          <div className="flex rounded-xl border border-white/10 bg-zinc-900/90 p-1 text-xs font-semibold">
            {(["sgpa", "cgpa"] as CgpaViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`rounded-lg px-3 py-1 transition-all ${
                  view === mode
                    ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)] font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding Welcome Prompt Card (if no academic records added yet) */}
      {showOnboardingCard && (
        <Card className="glow-purple border border-purple-500/40 bg-gradient-to-r from-purple-900/40 via-zinc-900 to-blue-950/40 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs mb-1">
                  <Sparkles size={13} className="text-purple-400" /> Profile Setup Complete
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Your academic profile is ready.</h2>
                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">Start by adding your current subjects or uploading your transcript PDF.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button variant="primary" size="md" onClick={() => setAddSubjectModalOpen(true)} className="gap-2 flex-1 sm:flex-initial shadow-lg shadow-purple-600/25">
                <Plus size={16} /> Add Subjects
              </Button>
              <Button variant="outline" size="md" onClick={() => setUploadModalOpen(true)} className="gap-2 flex-1 sm:flex-initial border-purple-500/30 text-purple-200 hover:bg-purple-500/10">
                <Upload size={16} /> Upload Transcript
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-400">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. UNIVERSITY INFORMATION CARD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Card className="border border-white/10 bg-zinc-900/90 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 text-purple-300 border border-purple-500/30 shadow-md">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base tracking-tight">{user?.college || "University"}</h3>
                {user?.academicStatus && (
                  <Badge tone={user.academicStatus.includes("First") ? "warning" : "success"} className="text-[11px]">
                    {user.academicStatus}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{user?.course || "Degree Program"}</span>
                <span>•</span>
                <span>{user?.branch || "Department"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-zinc-300">
              <Layers size={14} className="text-purple-400" />
              <span>Active Semester: <strong className="text-white">{user?.currentSemester || user?.semesterSystem || "Semester 1"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-zinc-300">
              <Calendar size={14} className="text-blue-400" />
              <span>Batch: <strong className="text-white">{user?.academicSession || "N/A"}</strong></span>
            </div>

            {typeof user?.currentCgpa === "number" && (
              <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-purple-300">
                <Award size={14} className="text-purple-400" />
                <span>Baseline CGPA: <strong className="font-mono text-white">{user.currentCgpa.toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. CURRENT CGPA / TARGET CGPA / GOAL COMPLETION STAT CARDS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card A: CGPA / SGPA Summary */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="glow-purple border-purple-500/20 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{view === "cgpa" ? "Current Overall CGPA" : `${current?.name || "Current Semester"} SGPA`}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Award size={16} />
              </div>
            </CardHeader>
            <CardContent>
              {headline !== null ? (
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold font-tabular text-white tracking-tight">
                    <CountUp value={headline} decimals={2} />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                    <TrendingUp size={13} /> {isBaselineCgpa ? "Baseline" : "On Track"}
                  </span>
                </div>
              ) : (
                <div className="text-lg sm:text-xl font-bold text-zinc-400 mt-2">No CGPA Available</div>
              )}
              <p className="mt-2 text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                <span>Completed Credits: <strong className="text-emerald-400 font-mono">{summaryData?.completedCredits ?? 0}</strong></span>
                {summaryData?.currentSemesterCredits ? (
                  <>
                    <span>•</span>
                    <span>Current Sem Credits: <strong className="text-amber-400 font-mono">{summaryData.currentSemesterCredits}</strong></span>
                  </>
                ) : null}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card B: Target CGPA Goal */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="border-white/10 bg-zinc-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Target CGPA Goal</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Target size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl sm:text-5xl font-extrabold font-tabular text-purple-400 mt-1 tracking-tight">
                {targetCgpa.toFixed(2)}
              </div>
              <p className="mt-2 text-xs text-zinc-400">Graduation Target Benchmark</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card C: Goal Completion Progress */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="border-white/10 bg-zinc-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Goal Completion</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-extrabold font-tabular text-white tracking-tight">{targetProgress}%</div>
              <ProgressBar value={targetProgress} tone="accent" />
              <p className="mt-2 text-xs text-zinc-400">Progress toward target CGPA</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. CGPA PROGRESSION GRAPH (Moved directly below summary cards) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Card className="border border-white/10 bg-zinc-900/90 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            <CardTitle>CGPA Progression Trend</CardTitle>
          </div>

          {/* Viewing Mode Pills: Official Progress (default) vs Predicted Progress */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-zinc-950 p-1 text-xs font-semibold">
              <button
                onClick={() => setGraphMode("official")}
                className={`rounded-lg px-3 py-1 transition-all ${
                  graphMode === "official"
                    ? "bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Official Progress
              </button>
              <button
                onClick={() => setGraphMode("predicted")}
                className={`rounded-lg px-3 py-1 transition-all flex items-center gap-1.5 ${
                  graphMode === "predicted"
                    ? "bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Predicted Progress
                <span className="h-1.5 w-1.5 rounded-full bg-purple-300 animate-pulse" />
              </button>
            </div>

            <span className="text-xs text-zinc-500 font-semibold hidden md:inline">
              {summaryData?.completedSemesters?.length || 0} Completed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {cgpaTrend.length > 0 ? (
            <TrendChart data={cgpaTrend} mode={graphMode} />
          ) : (
            <p className="text-xs text-zinc-500 text-center py-8">No historical semester trend data recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. CURRENT SEMESTER COURSES (Moved ABOVE At-Risk Subjects section) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Current Semester Courses ({currentSemesterSubjects.length})
            </h2>
            <Badge tone="warning" className="text-[10px]">In Progress</Badge>
          </div>

          <div className="flex items-center gap-2.5">
            {current && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFinalizeCurrentSemester}
                disabled={isFinalizing}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1.5"
              >
                <CheckCircle2 size={14} /> Finalize Current Semester
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="text-xs">
              <Plus size={14} className="mr-1" /> Add Subject
            </Button>
          </div>
        </div>

        {currentSemesterSubjects.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-lg">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No subjects added for the active semester.</h3>
            <p className="text-xs text-zinc-400 mb-6 max-w-sm">
              Add subjects for your active semester to start tracking your grades and performance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="gap-1.5">
                <Plus size={14} /> Add Subject
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {currentSemesterSubjects.map((subject: any, idx: number) => {
              const isInProgress = subject.isInProgress || subject.calculatedPct === null || subject.calculatedPct === undefined || subject.letterGrade === "In Progress" || subject.status === "In Progress";
              const pct = typeof subject.calculatedPct === "number" ? subject.calculatedPct : 0;
              const letter = isInProgress ? "In Progress" : (subject.letterGrade || "N/A");
              const idKey = subject._id || subject.id || `subj-${idx}`;
              return (
                <Link key={idKey} to={`/app/subjects`}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card className="group cursor-pointer border border-white/10 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all">
                      <CardContent className="pt-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 rounded-full shadow-sm"
                              style={{ backgroundColor: subject.colorTag || "#3b82f6" }}
                            />
                            <span className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                              {subject.name}
                            </span>
                          </div>
                          <Badge tone={isInProgress ? "warning" : "accent"}>{letter}</Badge>
                        </div>

                        <div className="mb-1.5 flex items-baseline justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Current Status</span>
                          <span className="font-tabular font-bold text-amber-400 text-sm">
                            {isInProgress ? "In Progress" : `${pct.toFixed(1)}%`}
                          </span>
                        </div>
                        <ProgressBar value={isInProgress ? 0 : pct} tone={isInProgress ? "warning" : "accent"} />

                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-3">
                          <span className="font-medium text-zinc-300">Credits: {subject.credits}</span>
                          <span className="font-semibold text-purple-400 flex items-center gap-1 group-hover:text-purple-300">
                            Details <ChevronRight size={13} />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. AT-RISK SUBJECTS (Analyzes ONLY Current Semester subjects) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentSemesterSubjects.length > 0 && (
        <div>
          {atRiskCount === 0 ? (
            /* State 2: Healthy state when 0 subjects are at risk */
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-xs text-emerald-400 font-semibold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold text-emerald-300 text-sm">✓ No At-Risk Subjects</p>
                  <p className="text-emerald-400/80 text-xs mt-0.5">All current semester subjects are currently on track.</p>
                </div>
              </div>
            </div>
          ) : atRiskCount >= 3 ? (
            /* State 4: Expanded Priority Alert for 3+ subjects at risk */
            <Card className="border-2 border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-zinc-900 to-rose-950/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-rose-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-rose-300 font-extrabold text-base tracking-tight">
                      Critical Academic Alert: {atRiskCount} Subjects At-Risk
                    </CardTitle>
                    <p className="text-xs text-rose-300/70 mt-0.5">Urgent attention required for current semester subjects.</p>
                  </div>
                </div>
                <Badge tone="danger" className="text-xs font-bold px-3 py-1">URGENT PRIORITY</Badge>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3.5">
                {activeAtRiskSubjects.map((r: any, i: number) => (
                  <div
                    key={r.subjectId || `risk-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-rose-500/30 bg-zinc-950/80 p-4 text-xs gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white text-sm">{r.subjectName}</p>
                        <Badge tone={r.riskLevel === "Critical" ? "danger" : "warning"}>{r.riskLevel}</Badge>
                      </div>
                      <p className="text-zinc-300 text-xs">{r.reason}</p>
                      {r.missingAssessments && r.missingAssessments.length > 0 && (
                        <p className="text-rose-300 text-[11px] mt-1 font-medium">
                          Missing: {r.missingAssessments.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right sm:block text-xs">
                        <span className="text-zinc-400 block text-[10px]">Required Target</span>
                        <span className="font-bold text-emerald-400 font-mono">{r.requiredScore}</span>
                      </div>
                      <Link to="/app/subjects" className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-3 py-1.5 font-bold text-rose-200 transition-colors">
                        View Subject <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            /* State 3: Standard warning section for 1–2 subjects at risk */
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
                <AlertTriangle size={18} className="text-amber-400" />
                <CardTitle className="text-amber-300 font-bold text-sm uppercase tracking-wide">
                  At-Risk Subjects ({atRiskCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {activeAtRiskSubjects.map((r: any, i: number) => (
                  <div
                    key={r.subjectId || `risk-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-amber-500/20 bg-zinc-900/90 px-4 py-3 text-xs gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white text-sm">{r.subjectName}</p>
                        <Badge tone={r.riskLevel === "Critical" ? "danger" : "warning"}>{r.riskLevel}</Badge>
                      </div>
                      <p className="text-zinc-300 text-xs">{r.reason}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1">
                        <span>Current Score: <strong className="text-amber-400 font-mono">{r.currentScore}</strong></span>
                        {r.missingAssessments && r.missingAssessments.length > 0 && (
                          <span>• Missing: <strong className="text-zinc-300">{r.missingAssessments.join(", ")}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="text-zinc-400 block text-[10px]">Required Target</span>
                        <span className="font-bold text-emerald-400 font-mono">{r.requiredScore}</span>
                      </div>
                      <Link to="/app/subjects" className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 font-bold text-amber-200 transition-colors">
                        View Subject <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. QUICK ACTIONS SECTION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Card className="border border-white/10 bg-zinc-900/70 p-5">
        <CardHeader className="pb-3 px-0 pt-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Quick Academic Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/app/simulator">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center group cursor-pointer">
              <Wand2 size={20} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white group-hover:text-purple-300">Grade Simulator</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">What-if marks test</span>
            </div>
          </Link>

          <Link to="/app/planner">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center group cursor-pointer">
              <Calculator size={20} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white group-hover:text-purple-300">Target Planner</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Goal CGPA calculator</span>
            </div>
          </Link>

          <Link to="/app/subjects">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center group cursor-pointer">
              <BookOpen size={20} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white group-hover:text-purple-300">Subject Details</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Manage marks & scheme</span>
            </div>
          </Link>

          <div
            onClick={() => setUploadModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center group cursor-pointer"
          >
            <Upload size={20} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white group-hover:text-purple-300">Upload PDF</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Import transcript</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Past Results Modal */}
      <UploadResultsModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          fetchDashboardData();
        }}
      />

      {/* Add / Upload Subject Modal */}
      <AddSubjectModal
        isOpen={addSubjectModalOpen}
        onClose={() => {
          setAddSubjectModalOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}
