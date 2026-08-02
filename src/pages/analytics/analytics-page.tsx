import { useState, useEffect, useMemo, Fragment } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit3,
  Award,
  BarChart3,
  Download,
  Zap,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  AnalyticsService,
  type AnalyticsSummary,
  type AnalyticsSubject,
  type CompletedSemesterDetail,
  type SubjectStatus,
  resolveSubjectStatus,
  getSubjectEffectiveScore,
  SUBJECT_STATUS_CONFIG,
} from "@/services/analytics-service";
import { DashboardService } from "@/services/dashboard-service";
import { EditSemesterModal } from "@/components/upload/edit-semester-modal";
import {
  ColumnSettingsService,
  type ColumnConfig,
} from "@/services/column-settings-service";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "sonner";

export function AnalyticsPage() {
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    null,
  );
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() =>
    ColumnSettingsService.getTranscriptColumnSettings(),
  );

  useEffect(() => {
    const handleColumnsUpdate = (e: any) => {
      if (e.detail) {
        setColumnConfigs(e.detail);
      } else {
        setColumnConfigs(ColumnSettingsService.getTranscriptColumnSettings());
      }
    };
    window.addEventListener("transcript-columns-updated", handleColumnsUpdate);
    return () => {
      window.removeEventListener(
        "transcript-columns-updated",
        handleColumnsUpdate,
      );
    };
  }, []);

  const visibleColumns = useMemo(() => {
    return columnConfigs.filter((col) => col.visible);
  }, [columnConfigs]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await AnalyticsService.getAnalyticsSummary();
      let semList: CompletedSemesterDetail[] = (
        data?.completedSemesters || []
      ).filter((sem) => !sem.isCurrent);

      // Fallback: If analytics API returns no completed semesters, check Dashboard summary
      if (semList.length === 0) {
        try {
          const dashData = await DashboardService.getDashboardSummary();
          if (
            dashData?.completedSemesters &&
            dashData.completedSemesters.length > 0
          ) {
            semList = dashData.completedSemesters.map(
              (ds: any, idx: number) => {
                const semCredits = ds.credits || 20;

                const semSubjects = (ds.subjects || []).map((subj: any) => ({
                  id: subj._id || subj.id || `subj-${idx}`,
                  _id: subj._id || subj.id || `subj-${idx}`,
                  subjectName: subj.name || "Subject",
                  name: subj.name || "Subject",
                  subjectCode: subj.code || "",
                  code: subj.code || "",
                  credits: subj.credits || 3,
                  marksObtained: subj.marksObtained ?? null,
                  maxMarks: subj.maxMarks ?? null,
                  finalPercentage:
                    typeof subj.calculatedPct === "number"
                      ? subj.calculatedPct
                      : (subj.finalPercentage ?? 0),
                  pct:
                    typeof subj.calculatedPct === "number"
                      ? subj.calculatedPct
                      : (subj.finalPercentage ?? 0),
                  grade: subj.letterGrade || subj.grade || "N/A",
                  letterGrade: subj.letterGrade || subj.grade || "N/A",
                  gradePoint: subj.gradePoint ?? 0,
                  assessments: subj.assessments || [],
                }));

                const highest =
                  semSubjects.length > 0
                    ? [...semSubjects].sort(
                        (a, b) => b.finalPercentage - a.finalPercentage,
                      )[0]
                    : null;
                const lowest =
                  semSubjects.length > 0
                    ? [...semSubjects].sort(
                        (a, b) => a.finalPercentage - b.finalPercentage,
                      )[0]
                    : null;

                return {
                  id: ds._id || ds.id || `sem-${idx}`,
                  _id: ds._id || ds.id || `sem-${idx}`,
                  name: ds.name || `Semester ${idx + 1}`,
                  semesterNumber: ds.semesterNumber || idx + 1,
                  isCurrent: false,
                  sgpa: typeof ds.sgpa === "number" ? ds.sgpa : null,
                  cgpa:
                    typeof dashData.cgpa === "number"
                      ? dashData.cgpa
                      : typeof ds.sgpa === "number"
                        ? ds.sgpa
                        : null,
                  creditsEarned: semCredits,
                  totalCredits: semCredits,
                  totalSubjects: semSubjects.length,
                  verificationStatus: "Official Record Verified",
                  updatedAt: new Date().toISOString(),
                  subjects: semSubjects,
                  summary: {
                    highestSubject: highest
                      ? {
                          name: highest.name,
                          code: highest.code,
                          pct: highest.finalPercentage,
                        }
                      : null,
                    lowestSubject: lowest
                      ? {
                          name: lowest.name,
                          code: lowest.code,
                          pct: lowest.finalPercentage,
                        }
                      : null,
                    averageMarks:
                      semSubjects.length > 0
                        ? Number(
                            (
                              semSubjects.reduce(
                                (a: number, b: any) => a + b.finalPercentage,
                                0,
                              ) / semSubjects.length
                            ).toFixed(1),
                          )
                        : 0,
                    totalCredits: semCredits,
                    sgpa: typeof ds.sgpa === "number" ? ds.sgpa : null,
                    cgpa:
                      typeof dashData.cgpa === "number" ? dashData.cgpa : null,
                  },
                };
              },
            );
          }
        } catch (dashErr) {
          console.error("Dashboard fallback failed:", dashErr);
        }
      }

      // Ensure chronological order (Semester 1 -> Semester 2 -> Semester 3 -> Semester 4)
      semList.sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0));

      console.log("Transcript Data", semList);

      // Ensure analytics summary excludes current semester data for computed fields
      setAnalytics({
        ...(data || {
          semesterTrend: [],
          cgpaHistory: [],
          creditDistribution: [],
          highestSubject: null as any,
          lowestSubject: null as any,
          totalSubjectsEvaluated: 0,
        }),
        // Override any precomputed highest/lowest subject to use our filtered data
        highestSubject: null as any,
        lowestSubject: null as any,
        completedSemesters: semList,
      });

      if (semList.length > 0 && !selectedSemesterId) {
        setSelectedSemesterId(semList[0].id || semList[0]._id || null);
      }
    } catch (err) {
      console.error("Failed to load analytics summary from backend:", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const handleUpdate = () => fetchAnalytics();
    window.addEventListener("academic-data-updated", handleUpdate);
    return () =>
      window.removeEventListener("academic-data-updated", handleUpdate);
  }, []);

  const completedSemesters = useMemo(() => {
    return analytics?.completedSemesters || [];
  }, [analytics]);

  const selectedSem = useMemo(() => {
    if (!completedSemesters.length) return null;
    return (
      completedSemesters.find((s) => (s.id || s._id) === selectedSemesterId) ||
      completedSemesters[0]
    );
  }, [completedSemesters, selectedSemesterId]);

  // Performance Summary Calculations (Unchanged for Overview)
  const bestSemester = useMemo(() => {
    if (!completedSemesters.length) return null;
    let best = completedSemesters[0];
    for (const sem of completedSemesters) {
      if ((sem.sgpa || 0) > (best.sgpa || 0)) {
        best = sem;
      }
    }
    return best;
  }, [completedSemesters]);

  const lowestSemester = useMemo(() => {
    if (!completedSemesters.length) return null;
    let lowest = completedSemesters[0];
    for (const sem of completedSemesters) {
      if ((sem.sgpa || 0) < (lowest.sgpa || 0)) {
        lowest = sem;
      }
    }
    return lowest;
  }, [completedSemesters]);

  const mostImprovedSemester = useMemo(() => {
    if (completedSemesters.length < 2) return null;
    let maxDelta = -Infinity;
    let bestSem: any = null;

    for (let i = 1; i < completedSemesters.length; i++) {
      const prevSgpa = completedSemesters[i - 1].sgpa || 0;
      const currSgpa = completedSemesters[i].sgpa || 0;
      const delta = currSgpa - prevSgpa;
      if (delta > maxDelta) {
        maxDelta = delta;
        bestSem = { ...completedSemesters[i], delta };
      }
    }

    return maxDelta > 0 ? bestSem : null;
  }, [completedSemesters]);

  const { user } = useAuth();
  const totalDegreeCreditsConfigured =
    user?.totalDegreeCredits && user.totalDegreeCredits > 0
      ? user.totalDegreeCredits
      : null;

  const evaluatedCompletedSubjects = useMemo(() => {
    if (!completedSemesters.length) return [];
    const list: Array<{
      name: string;
      code: string;
      credits: number;
      pct: number;
      letterGrade: string;
      gradePoint: number;
      semesterName: string;
      effectiveScore: number;
      tier: "Excellent" | "Good" | "Average" | "Needs Improvement";
      status: SubjectStatus;
    }> = [];

    for (const sem of completedSemesters) {
      for (const subj of sem.subjects || []) {
        const status = resolveSubjectStatus(subj);
        if (status === "completed") {
          const score = getSubjectEffectiveScore(subj);
          if (score !== null && !isNaN(score)) {
            let tier: "Excellent" | "Good" | "Average" | "Needs Improvement" = "Good";
            if (score >= 90) tier = "Excellent";
            else if (score >= 75) tier = "Good";
            else if (score >= 60) tier = "Average";
            else tier = "Needs Improvement";

            list.push({
              name: subj.name || subj.subjectName || "Subject",
              code: subj.code || subj.subjectCode || "",
              credits: Number(subj.credits) || 3,
              pct: score,
              letterGrade: subj.grade || subj.letterGrade || "—",
              gradePoint: subj.gradePoint || 0,
              semesterName: sem.name,
              effectiveScore: score,
              tier,
              status,
            });
          }
        }
      }
    }

    return list;
  }, [completedSemesters]);

  const highestSubjectResult = useMemo(() => {
    if (!evaluatedCompletedSubjects.length) return null;
    let maxScore = -Infinity;
    for (const s of evaluatedCompletedSubjects) {
      if (s.effectiveScore > maxScore) maxScore = s.effectiveScore;
    }
    const topSubjects = evaluatedCompletedSubjects.filter(
      (s) => Math.abs(s.effectiveScore - maxScore) < 0.05,
    );
    return {
      score: maxScore,
      subjects: topSubjects,
      isTie: topSubjects.length > 1,
      primary: topSubjects[0],
    };
  }, [evaluatedCompletedSubjects]);

  const lowestSubjectResult = useMemo(() => {
    if (!evaluatedCompletedSubjects.length) return null;
    let minScore = Infinity;
    for (const s of evaluatedCompletedSubjects) {
      if (s.effectiveScore < minScore) minScore = s.effectiveScore;
    }
    const lowSubjects = evaluatedCompletedSubjects.filter(
      (s) => Math.abs(s.effectiveScore - minScore) < 0.05,
    );
    return {
      score: minScore,
      subjects: lowSubjects,
      isTie: lowSubjects.length > 1,
      primary: lowSubjects[0],
    };
  }, [evaluatedCompletedSubjects]);

  const rankedSubjects = useMemo(() => {
    if (!evaluatedCompletedSubjects.length) return [];
    const sorted = [...evaluatedCompletedSubjects].sort(
      (a, b) => b.effectiveScore - a.effectiveScore,
    );

    let currentRank = 1;
    return sorted.map((item, idx, arr) => {
      if (
        idx > 0 &&
        Math.abs(item.effectiveScore - arr[idx - 1].effectiveScore) >= 0.05
      ) {
        currentRank = idx + 1;
      }
      return { ...item, rank: currentRank };
    });
  }, [evaluatedCompletedSubjects]);

  const creditAnalysis = useMemo(() => {
    const completedCredits = completedSemesters.reduce((sum, sem) => {
      if (Array.isArray(sem.subjects) && sem.subjects.length > 0) {
        return (
          sum +
          sem.subjects.reduce((sSum, subj) => {
            const status = resolveSubjectStatus(subj);
            return status === "completed"
              ? sSum + (Number(subj.credits) || 3)
              : sSum;
          }, 0)
        );
      }
      return sum + (sem.creditsEarned || sem.credits || 20);
    }, 0);

    const degreeTotal = totalDegreeCreditsConfigured;
    const progressPct =
      degreeTotal && degreeTotal > 0
        ? Math.min(100, Math.round((completedCredits / degreeTotal) * 100))
        : null;

    return {
      completedCredits,
      remainingCredits:
        degreeTotal && degreeTotal > 0
          ? Math.max(0, degreeTotal - completedCredits)
          : null,
      degreeTotal,
      progressPct,
      isConfigured: degreeTotal !== null && degreeTotal > 0,
    };
  }, [completedSemesters, totalDegreeCreditsConfigured]);

  const aiAcademicInsights = useMemo(() => {
    if (!completedSemesters.length || !evaluatedCompletedSubjects.length) {
      return [
        "Complete at least one semester with evaluated subjects to unlock personalized AI academic trend observations.",
      ];
    }

    const insights: string[] = [];

    if (bestSemester && bestSemester.sgpa) {
      insights.push(
        `${bestSemester.name} is your highest performing semester with an SGPA of ${bestSemester.sgpa.toFixed(2)}.`,
      );
    }

    if (mostImprovedSemester && mostImprovedSemester.delta > 0) {
      insights.push(
        `Your average SGPA improved by +${mostImprovedSemester.delta.toFixed(2)} between consecutive terms (${mostImprovedSemester.name}).`,
      );
    }

    const highSgpaSems = completedSemesters.filter(
      (s) => typeof s.sgpa === "number" && s.sgpa >= 9.0,
    );
    if (highSgpaSems.length >= 2) {
      insights.push(
        `You maintained an SGPA above 9.0 across ${highSgpaSems.length} completed semesters.`,
      );
    }

    const totalEarned = creditAnalysis.completedCredits;
    insights.push(
      `You have earned ${totalEarned} completed credits across ${completedSemesters.length} semester${completedSemesters.length > 1 ? "s" : ""}.`,
    );

    if (highestSubjectResult) {
      const nameStr = highestSubjectResult.isTie
        ? `${highestSubjectResult.subjects.length} subjects (including ${highestSubjectResult.primary.name})`
        : highestSubjectResult.primary.name;
      insights.push(
        `Peak academic score recorded in ${nameStr} (${safeFormatPct(highestSubjectResult.score)}).`,
      );
    }

    return insights;
  }, [
    completedSemesters,
    evaluatedCompletedSubjects,
    bestSemester,
    mostImprovedSemester,
    creditAnalysis,
    highestSubjectResult,
  ]);

  const toggleSubjectExpand = (id: string) => {
    const next = new Set(expandedSubjectIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSubjectIds(next);
  };

  function safeFormatPct(val: any): string {
    if (typeof val === "number" && !isNaN(val)) return `${val.toFixed(1)}%`;
    if (typeof val === "string" && val.trim() !== "")
      return val.includes("%") ? val : `${val}%`;
    return "—";
  }

  function safeFormatNumber(val: any, decimals = 1): string {
    if (typeof val === "number" && !isNaN(val)) return val.toFixed(decimals);
    if (typeof val === "string" && val.trim() !== "") return val;
    return "—";
  }

  function handleExportTranscript() {
    if (tab !== "history") {
      setTab("history");
    }
    setTimeout(() => {
      window.print();
    }, 50);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Deep performance analysis, grade distributions, credit progress, and
            semester transcripts
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-white/90 dark:bg-zinc-900/80 p-1.5 border border-slate-200 dark:border-white/10 shadow-lg">
          <button
            onClick={() => setTab("overview")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 size={14} /> Analytics Overview
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "history"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen size={14} /> Past Results Transcript
          </button>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center text-xs text-zinc-400 animate-pulse border-dashed">
          Loading comprehensive academic analysis...
        </Card>
      ) : (
        <>
          {tab === "overview" ? (
            /* Analytics Overview Tab */
            <div className="flex flex-col gap-8">
              {/* Section 1: Performance Summary Grid (4 Cards) */}
              {/* Section 1: Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Best Semester */}
                <Card className="p-4 bg-gradient-to-br from-zinc-900 to-purple-950/30 border border-purple-500/30">
                  <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider mb-2">
                    <span>Peak Performance</span>
                    <Trophy size={16} className="text-amber-400" />
                  </div>
                  {bestSemester ? (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {bestSemester.name}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-purple-600 dark:text-purple-300 font-bold text-sm">
                          SGPA{" "}
                          {bestSemester.sgpa
                            ? bestSemester.sgpa.toFixed(2)
                            : "N/A"}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {bestSemester.creditsEarned} Credits
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2">
                      No completed terms
                    </p>
                  )}
                </Card>

                {/* 2. Lowest Semester */}
                <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
                    <span>Lowest Semester</span>
                    <AlertTriangle size={16} className="text-rose-400" />
                  </div>
                  {lowestSemester ? (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {lowestSemester.name}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-amber-400 font-bold text-sm">
                          SGPA{" "}
                          {lowestSemester.sgpa
                            ? lowestSemester.sgpa.toFixed(2)
                            : "N/A"}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {lowestSemester.creditsEarned} Credits
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2">
                      No completed terms
                    </p>
                  )}
                </Card>

                {/* 3. Most Improved Semester */}
                <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
                    <span>Most Improved</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  {mostImprovedSemester ? (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {mostImprovedSemester.name}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          +{mostImprovedSemester.delta.toFixed(2)} SGPA
                        </span>
                        <span className="text-zinc-400 font-mono">Gain</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                        Steady Pace
                      </p>
                      <p className="text-xs text-zinc-400 mt-2 font-mono">
                        Requires 2+ terms
                      </p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Section 2: Subject Highlights & Performance Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Highest & Lowest Highlight Cards */}
                <div className="flex flex-col gap-4">
                  {/* Highest Scoring Subject Card */}
                  <Card className="p-5 bg-white dark:bg-zinc-950/70 border border-emerald-200 dark:border-emerald-500/30 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                        <span>
                          Highest Scoring Subject
                          {highestSubjectResult?.isTie
                            ? `s (${highestSubjectResult.subjects.length})`
                            : ""}
                        </span>
                        <Award
                          size={18}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      {highestSubjectResult ? (
                        highestSubjectResult.isTie ? (
                          <div className="flex flex-col gap-1.5 my-2">
                            {highestSubjectResult.subjects.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white"
                              >
                                <span className="text-emerald-500">•</span>
                                <span>{s.name}</span>
                                {s.code && (
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    ({s.code})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                              {highestSubjectResult.primary.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                              {highestSubjectResult.primary.semesterName} •{" "}
                              {highestSubjectResult.primary.credits} Credits
                              {highestSubjectResult.primary.code
                                ? ` • ${highestSubjectResult.primary.code}`
                                : ""}
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 italic py-2">
                          Complete at least one semester to determine the
                          highest scoring subject.
                        </p>
                      )}
                    </div>
                    {highestSubjectResult && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                        <Badge tone="accent" className="font-bold">
                          Grade{" "}
                          {highestSubjectResult.primary.letterGrade || "O"}
                        </Badge>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xl">
                          {safeFormatPct(highestSubjectResult.score)}
                        </span>
                      </div>
                    )}
                  </Card>

                  {/* Lowest Scoring Subject Card */}
                  <Card className="p-5 bg-white dark:bg-zinc-950/70 border border-rose-200 dark:border-rose-500/30 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-3">
                        <span>
                          Lowest Scoring Subject
                          {lowestSubjectResult?.isTie
                            ? `s (${lowestSubjectResult.subjects.length})`
                            : ""}
                        </span>
                        <AlertTriangle
                          size={18}
                          className="text-rose-600 dark:text-rose-400"
                        />
                      </div>
                      {lowestSubjectResult ? (
                        lowestSubjectResult.isTie ? (
                          <div className="flex flex-col gap-1.5 my-2">
                            {lowestSubjectResult.subjects.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white"
                              >
                                <span className="text-rose-500">•</span>
                                <span>{s.name}</span>
                                {s.code && (
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    ({s.code})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                              {lowestSubjectResult.primary.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                              {lowestSubjectResult.primary.semesterName} •{" "}
                              {lowestSubjectResult.primary.credits} Credits
                              {lowestSubjectResult.primary.code
                                ? ` • ${lowestSubjectResult.primary.code}`
                                : ""}
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 italic py-2">
                          Complete at least one semester to determine the lowest
                          scoring subject.
                        </p>
                      )}
                    </div>
                    {lowestSubjectResult && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                        <Badge tone="warning" className="font-bold">
                          Grade {lowestSubjectResult.primary.letterGrade || "B"}
                        </Badge>
                        <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xl">
                          {safeFormatPct(lowestSubjectResult.score)}
                        </span>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Sorted Subject Performance Ranking Table */}
                <Card className="lg:col-span-2 border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/90 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="bg-slate-50 dark:bg-zinc-950 py-3.5 px-5 border-b border-slate-200 dark:border-white/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy
                        size={18}
                        className="text-purple-600 dark:text-purple-400"
                      />{" "}
                      Subject Performance Ranking ({rankedSubjects.length})
                    </CardTitle>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      Completed Subjects Only
                    </span>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto max-h-[380px] overflow-y-auto">
                    {rankedSubjects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-500 italic">
                        Complete at least one semester with completed subjects
                        to view rankings.
                      </div>
                    ) : (
                      <table className="w-full min-w-full border-separate border-spacing-0 text-xs text-left table-fixed">
                        <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 dark:border-white/10 z-10">
                          <tr>
                            <th className="px-4 py-3.5 w-16">Rank</th>
                            <th className="px-4 py-3.5">Subject Name</th>
                            <th className="px-4 py-3.5">Semester</th>
                            <th className="px-4 py-3.5 text-right w-16">
                              Credits
                            </th>
                            <th className="px-4 py-3.5 text-right w-24">
                              Score %
                            </th>
                            <th className="px-4 py-3.5 text-center w-20">
                              Grade
                            </th>
                            <th className="px-4 py-3.5 pr-5 text-center w-24">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                          {rankedSubjects.map((subj, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="px-4 py-4 font-bold font-mono text-purple-700 dark:text-purple-400">
                                #{subj.rank}
                              </td>
                              <td className="px-4 py-4 font-sans font-bold text-slate-900 dark:text-white">
                                <div className="flex flex-col gap-0.5">
                                  <span>{subj.name}</span>
                                  {subj.code && (
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 font-normal">
                                      {subj.code}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-slate-600 dark:text-zinc-400 font-sans text-xs">
                                {subj.semesterName}
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-slate-700 dark:text-zinc-300 font-mono">
                                {subj.credits}
                              </td>
                              <td className="px-4 py-4 text-right font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                                {safeFormatPct(subj.effectiveScore)}
                              </td>
                              <td className="px-4 py-4 text-center font-sans">
                                <Badge tone="accent" className="font-bold">
                                  {subj.letterGrade}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 pr-5 text-center font-sans">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: Degree Credit Progress */}
              <Card className="p-6 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap size={18} className="text-emerald-400" /> Degree Credit
                      Progress
                    </span>
                    {creditAnalysis.isConfigured && (
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {creditAnalysis.progressPct}% Complete
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col gap-5">
                  {creditAnalysis.isConfigured ? (
                    /* Scenario 1: Total Degree Credits Configured */
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-full bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            style={{ width: `${creditAnalysis.progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>0 Credits</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {creditAnalysis.completedCredits} /{" "}
                            {creditAnalysis.degreeTotal} Credits (
                            {creditAnalysis.progressPct}%)
                          </span>
                          <span>
                            {creditAnalysis.degreeTotal} Total Target
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                        <div className="p-3 bg-white/80 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-zinc-400 block font-sans font-semibold uppercase">
                            Completed
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-base mt-1 block">
                            {creditAnalysis.completedCredits}
                          </span>
                        </div>
                        <div className="p-3 bg-white/80 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-purple-600 dark:text-purple-300 block font-sans font-semibold uppercase">
                            Remaining
                          </span>
                          <span className="font-extrabold text-purple-400 text-base mt-1 block">
                            {creditAnalysis.remainingCredits}
                          </span>
                        </div>
                        <div className="p-3 bg-white/80 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-emerald-400 block font-sans font-semibold uppercase">
                            Total Target
                          </span>
                          <span className="font-extrabold text-emerald-400 text-base mt-1 block">
                            {creditAnalysis.degreeTotal}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Scenario 2: Total Credits Unknown / Unconfigured */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/10 gap-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                            {creditAnalysis.completedCredits}
                          </span>
                          <span className="text-sm font-semibold text-emerald-400">
                            Credits Earned
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                          Configure your total graduation credits to enable
                          degree progress tracking.
                        </p>
                      </div>
                      <Link to="/app/settings">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs whitespace-nowrap"
                        >
                          Set Total Credits
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 4: AI Academic Insights */}
              <Card className="glow-purple border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-blue-950/40 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-sm font-extrabold text-purple-200 uppercase tracking-wider">
                      AI Academic Insights & Trend Observations
                    </h3>
                    <div className="flex flex-col gap-2">
                      {aiAcademicInsights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200 leading-relaxed"
                        >
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* Past Results Transcript Tab (Live Digital Academic Transcript) */
            <ErrorBoundary fallbackTitle="Past Results Component Error">
              {completedSemesters.length === 0 ? (
                <Card className="p-12 text-center bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No historical semester data available.
                  </h3>
                </Card>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Print-Only Official Academic Transcript Document Header */}
                  <div className="hidden print:block mb-6 p-6 border border-slate-300 rounded-2xl bg-white text-slate-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                          OFFICIAL ACADEMIC TRANSCRIPT
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          GradeWise AI — Comprehensive Academic Record & Performance Overview
                        </p>
                      </div>
                      <div className="text-right text-xs font-mono text-slate-500">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          Status: Verified Official Record
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-xs font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans font-semibold uppercase">
                          Semesters Evaluated
                        </span>
                        <span className="font-extrabold text-slate-900 text-lg mt-0.5 block">
                          {completedSemesters.length}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans font-semibold uppercase">
                          Total Credits Earned
                        </span>
                        <span className="font-extrabold text-purple-700 text-lg mt-0.5 block">
                          {creditAnalysis.completedCredits}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans font-semibold uppercase">
                          Cumulative CGPA
                        </span>
                        <span className="font-extrabold text-emerald-700 text-lg mt-0.5 block">
                          {completedSemesters.length > 0 &&
                          typeof completedSemesters[completedSemesters.length - 1].cgpa === "number"
                            ? completedSemesters[completedSemesters.length - 1].cgpa?.toFixed(2)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Digital Academic Transcript Header Bar */}
                  <div className="flex items-center justify-between no-print">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                      <GraduationCap size={16} className="text-purple-400" />{" "}
                      Chronological Academic Transcript (
                      {completedSemesters.length} Completed{" "}
                      {completedSemesters.length === 1
                        ? "Semester"
                        : "Semesters"}
                      )
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportTranscript}
                      className="gap-1.5 text-xs no-print"
                    >
                      <Download size={14} /> Export Transcript
                    </Button>
                  </div>

                  {/* Vertical Chronological Transcript Cards */}
                  <div className="flex flex-col gap-6">
                    {completedSemesters.map((sem, sIdx) => {
                      const semId = sem.id || sem._id || `sem-${sIdx}`;
                      const isSelected = selectedSem
                        ? (selectedSem.id || selectedSem._id) === semId
                        : false;
                      const semSgpaFormatted =
                        typeof sem.sgpa === "number"
                          ? sem.sgpa.toFixed(2)
                          : "N/A";
                      const semCgpaFormatted =
                        typeof sem.cgpa === "number"
                          ? sem.cgpa.toFixed(2)
                          : typeof sem.sgpa === "number"
                            ? sem.sgpa.toFixed(2)
                            : "N/A";
                      const semCredits = sem.creditsEarned || sem.credits || 20;

                      return (
                        <Card
                          key={semId}
                          className={`overflow-hidden transition-all duration-200 border print-break-inside-avoid ${
                            isSelected
                              ? "border-purple-500/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20 shadow-[0_0_25px_rgba(124,58,237,0.15)]"
                              : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 hover:border-purple-500/30"
                          }`}
                        >
                          {/* Semester Transcript Header */}
                          <div
                            onClick={() => setSelectedSemesterId(semId)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-zinc-950/90 border-b border-slate-200 dark:border-white/10 gap-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold text-sm font-mono">
                                #{sem.semesterNumber || sIdx + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                                    {sem.name ||
                                      `Semester ${sem.semesterNumber}`}
                                  </h3>
                                  <Badge tone="success" className="text-[10px]">
                                    <CheckCircle2
                                      size={11}
                                      className="mr-1 inline"
                                    />{" "}
                                    Completed
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                  Verified Official Academic Transcript Record
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                              <div className="flex flex-col">
                                <span className="text-zinc-400 text-[10px] uppercase font-bold font-sans">
                                  SGPA
                                </span>
                                <span className="text-purple-600 dark:text-purple-300 font-extrabold text-base">
                                  {semSgpaFormatted}
                                </span>
                              </div>
                              <div className="h-6 w-px bg-white/10 hidden sm:block" />
                              <div className="flex flex-col">
                                <span className="text-zinc-400 text-[10px] uppercase font-bold font-sans">
                                  CGPA
                                </span>
                                <span className="text-slate-900 dark:text-white font-extrabold text-base">
                                  {semCgpaFormatted}
                                </span>
                              </div>
                              <div className="h-6 w-px bg-white/10 hidden sm:block" />
                              <div className="flex flex-col">
                                <span className="text-zinc-400 text-[10px] uppercase font-bold font-sans">
                                  Credits Earned
                                </span>
                                <span className="text-emerald-400 font-extrabold text-base">
                                  {semCredits}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSemesterId(semId);
                                  setIsEditModalOpen(true);
                                }}
                                className="ml-2 p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-600 dark:text-purple-300 hover:text-slate-900 dark:text-white transition border border-purple-500/30 no-print"
                                title="Edit Semester"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Semester Subjects Breakdown Table */}
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 dark:bg-zinc-950/60 text-zinc-400 border-b border-slate-200 dark:border-white/10 font-semibold uppercase text-[10px] tracking-wider">
                                  <tr>
                                    {visibleColumns.map((col, cIdx) => (
                                      <th
                                        key={col.key}
                                        className={`p-3.5 ${
                                          cIdx === 0 ? "pl-6" : ""
                                        } ${
                                          cIdx === visibleColumns.length - 1
                                            ? "pr-6"
                                            : ""
                                        } ${
                                          col.align === "right"
                                            ? "text-right"
                                            : "text-left"
                                        }`}
                                      >
                                        {col.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  {Array.isArray(sem.subjects) &&
                                  sem.subjects.length > 0 ? (
                                    sem.subjects.map((subj, subIdx) => {
                                      const subjId =
                                        subj?.id ||
                                        subj?._id ||
                                        `subj-${semId}-${subIdx}`;

                                      return (
                                        <tr
                                          key={subjId}
                                          className="hover:bg-purple-500/5 transition-colors"
                                        >
                                          {visibleColumns.map((col, cIdx) => {
                                            const isFirst = cIdx === 0;
                                            const isLast =
                                              cIdx === visibleColumns.length - 1;
                                            const alignClass =
                                              col.align === "right"
                                                ? "text-right"
                                                : "text-left";
                                            const paddingClass = `p-3.5 ${
                                              isFirst ? "pl-6" : ""
                                            } ${isLast ? "pr-6" : ""}`;

                                            switch (col.key) {
                                              case "subjectName":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-sans font-bold text-slate-900 dark:text-white`}
                                                  >
                                                    {subj?.subjectName ||
                                                      subj?.name ||
                                                      "Subject"}
                                                  </td>
                                                );
                                              case "subjectCode":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} text-zinc-400`}
                                                  >
                                                    {subj?.subjectCode ||
                                                      subj?.code ||
                                                      "—"}
                                                  </td>
                                                );
                                              case "credits":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} text-slate-700 dark:text-zinc-300`}
                                                  >
                                                    {subj?.credits ?? 3}
                                                  </td>
                                                );
                                              case "marksObtained":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} text-zinc-200`}
                                                  >
                                                    {subj?.marksObtained !==
                                                      null &&
                                                    subj?.marksObtained !==
                                                      undefined
                                                      ? subj.marksObtained
                                                      : "—"}
                                                  </td>
                                                );
                                              case "maxMarks":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} text-zinc-400`}
                                                  >
                                                    {subj?.maxMarks !== null &&
                                                    subj?.maxMarks !== undefined
                                                      ? subj.maxMarks
                                                      : "—"}
                                                  </td>
                                                );
                                              case "scorePct":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-bold text-purple-600 dark:text-purple-300`}
                                                  >
                                                    {safeFormatPct(
                                                      subj?.finalPercentage ??
                                                        subj?.pct,
                                                    )}
                                                  </td>
                                                );
                                              case "letterGrade":
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-sans`}
                                                  >
                                                    <Badge tone="accent">
                                                      {subj?.grade ||
                                                        subj?.letterGrade ||
                                                        "—"}
                                                    </Badge>
                                                  </td>
                                                );
                                              case "status": {
                                                const statusKey = resolveSubjectStatus(subj);
                                                const statusCfg =
                                                  SUBJECT_STATUS_CONFIG[statusKey] ||
                                                  SUBJECT_STATUS_CONFIG.in_progress;
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-sans`}
                                                  >
                                                    <span
                                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.className}`}
                                                    >
                                                      {statusCfg.label}
                                                    </span>
                                                  </td>
                                                );
                                              }
                                              case "gradePoint": {
                                                const gpVal =
                                                  subj?.gradePoint !== null &&
                                                  subj?.gradePoint !== undefined
                                                    ? subj.gradePoint
                                                    : typeof subj?.finalPercentage ===
                                                      "number"
                                                    ? (
                                                        subj.finalPercentage /
                                                        10
                                                      ).toFixed(1)
                                                    : "—";
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-bold text-slate-700 dark:text-zinc-300`}
                                                  >
                                                    {gpVal}
                                                  </td>
                                                );
                                              }
                                              case "remarks": {
                                                const isFail =
                                                  subj?.grade === "F" ||
                                                  subj?.letterGrade === "F";
                                                const remarkText =
                                                  (subj as any)?.remarks ||
                                                  (isFail ? "Fail" : "Pass");
                                                return (
                                                  <td
                                                    key={col.key}
                                                    className={`${paddingClass} ${alignClass} font-sans`}
                                                  >
                                                    <span
                                                      className={`text-[11px] font-bold ${
                                                        isFail
                                                          ? "text-rose-600 dark:text-rose-400"
                                                          : "text-emerald-600 dark:text-emerald-400"
                                                      }`}
                                                    >
                                                      {remarkText}
                                                    </span>
                                                  </td>
                                                );
                                              }
                                              default:
                                                return null;
                                            }
                                          })}
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={visibleColumns.length || 1}
                                        className="p-6 text-center text-zinc-500 font-sans text-xs italic"
                                      >
                                        No detailed subject records stored for
                                        this semester.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </ErrorBoundary>
          )}
        </>
      )}

      {/* Edit Semester Modal */}
      <EditSemesterModal
        isOpen={isEditModalOpen}
        semester={selectedSem}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchAnalytics()}
      />
    </div>
  );
}
