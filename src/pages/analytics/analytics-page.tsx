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
  getSubjectGradeNumericScore,
  getSubjectNormalizedGrade,
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

  const VALID_ACADEMIC_GRADES_SET = useMemo(
    () =>
      new Set([
        "O",
        "O+",
        "OUTSTANDING",
        "A+",
        "EXCELLENT",
        "A",
        "VERY GOOD",
        "B+",
        "GOOD",
        "B",
        "ABOVE AVERAGE",
        "C+",
        "C",
        "AVERAGE",
        "P",
        "D",
        "PASS",
        "F",
        "FAIL",
        "E",
      ]),
    [],
  );

  const allCompletedSubjects = useMemo(() => {
    if (!completedSemesters.length) return [];
    const list: Array<{
      id: string;
      name: string;
      code: string;
      credits: number;
      grade: string;
      gradeScore: number;
      pct: number | null;
      semesterName: string;
      semesterNumber: number;
    }> = [];

    for (const sem of completedSemesters) {
      const semName = sem.name || `Semester ${sem.semesterNumber}`;
      for (const subj of sem.subjects || []) {
        const gradeLabel = getSubjectNormalizedGrade(subj);
        const gradeScore = getSubjectGradeNumericScore(subj);

        // Filter out non-academic grade values (IN PROGRESS, COMPLETED, PENDING, etc.)
        const isAcademicGrade =
          gradeLabel !== "—" &&
          gradeLabel !== "N/A" &&
          gradeLabel !== "In Progress" &&
          gradeLabel !== "Completed" &&
          (VALID_ACADEMIC_GRADES_SET.has(gradeLabel.toUpperCase()) || gradeScore > 0);

        if (isAcademicGrade) {
          let realPct: number | null = null;
          if (
            typeof subj.finalPercentage === "number" &&
            subj.finalPercentage > 0
          ) {
            realPct = subj.finalPercentage;
          } else if (
            typeof subj.marksObtained === "number" &&
            typeof subj.maxMarks === "number" &&
            subj.maxMarks > 0
          ) {
            realPct = Math.round((subj.marksObtained / subj.maxMarks) * 1000) / 10;
          }

          list.push({
            id: subj.id || subj._id || `${semName}-${subj.code || subj.name}`,
            name: subj.name || subj.subjectName || "Subject",
            code: subj.code || subj.subjectCode || "",
            credits: Number(subj.credits) || 0,
            grade: gradeLabel,
            gradeScore,
            pct: realPct,
            semesterName: semName,
            semesterNumber: sem.semesterNumber || 1,
          });
        }
      }
    }
    return list;
  }, [completedSemesters, VALID_ACADEMIC_GRADES_SET]);

  const totalCompletedCredits = useMemo(() => {
    return completedSemesters.reduce(
      (sum, sem) => sum + (sem.creditsEarned || sem.credits || 0),
      0
    );
  }, [completedSemesters]);

  // Leaderboard: Subject Performance Ranking
  // Sorted by: 1. Grade score (desc), 2. Percentage if available (desc), 3. Credits (desc), 4. Name (asc)
  const leaderboardSubjects = useMemo(() => {
    const sorted = [...allCompletedSubjects].sort((a, b) => {
      if (b.gradeScore !== a.gradeScore) return b.gradeScore - a.gradeScore;
      if (a.pct !== null && b.pct !== null && b.pct !== a.pct) return b.pct - a.pct;
      if (b.credits !== a.credits) return b.credits - a.credits;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [allCompletedSubjects]);

  // Top 4 Highest Scoring Subjects
  const topHighestSubjects = useMemo(() => {
    return leaderboardSubjects.slice(0, 4);
  }, [leaderboardSubjects]);

  // Bottom 4 Lowest Scoring Subjects
  // Sorted by Grade Score (asc), Percentage (asc), Credits (asc), Name (asc)
  const bottomLowestSubjects = useMemo(() => {
    const sortedAsc = [...allCompletedSubjects].sort((a, b) => {
      if (a.gradeScore !== b.gradeScore) return a.gradeScore - b.gradeScore;
      if (a.pct !== null && b.pct !== null && a.pct !== b.pct) return a.pct - b.pct;
      if (a.credits !== b.credits) return a.credits - b.credits;
      return a.name.localeCompare(b.name);
    });
    return sortedAsc.slice(0, 4);
  }, [allCompletedSubjects]);

  // AI Academic Insights & Trend Observations
  const aiAcademicInsights = useMemo(() => {
    if (!completedSemesters.length || !allCompletedSubjects.length) {
      return [
        "Import your academic transcript to unlock personalized AI dynamic insights and trend analysis.",
      ];
    }

    const insights: string[] = [];

    // Highest scoring subject
    if (leaderboardSubjects.length > 0) {
      const topSubj = leaderboardSubjects[0];
      const highestCount = leaderboardSubjects.filter(
        (s) => s.gradeScore === topSubj.gradeScore
      ).length;
      if (highestCount > 1) {
        insights.push(
          `Highest scoring grade is '${topSubj.grade}' achieved in ${highestCount} subjects (including ${topSubj.name}).`
        );
      } else {
        insights.push(
          `Highest scoring subject is ${topSubj.name} (${topSubj.code}) with Grade '${topSubj.grade}' in ${topSubj.semesterName}.`
        );
      }
    }

    // Lowest scoring subject
    if (bottomLowestSubjects.length > 0) {
      const lowSubj = bottomLowestSubjects[0];
      insights.push(
        `Lowest scoring subject recorded is ${lowSubj.name} (${lowSubj.code}) with Grade '${lowSubj.grade}' in ${lowSubj.semesterName}.`
      );
    }

    // Strongest semester
    if (bestSemester && typeof bestSemester.sgpa === "number") {
      insights.push(
        `${bestSemester.name} is your highest performing term with an SGPA of ${bestSemester.sgpa.toFixed(2)} (${bestSemester.creditsEarned || bestSemester.credits || 0} credits).`
      );
    }

    // Semester with greatest improvement
    if (mostImprovedSemester && mostImprovedSemester.delta > 0) {
      insights.push(
        `Semester with the greatest improvement: ${mostImprovedSemester.name} (+${mostImprovedSemester.delta.toFixed(2)} SGPA increase over previous term).`
      );
    }

    // Average SGPA & Total Completed Subjects
    const totalSubjs = allCompletedSubjects.length;
    const ssemWithSgpa = completedSemesters.filter(
      (s) => typeof s.sgpa === "number"
    );
    const avgSgpa =
      ssemWithSgpa.length > 0
        ? (
            ssemWithSgpa.reduce((acc, s) => acc + (s.sgpa || 0), 0) /
            ssemWithSgpa.length
          ).toFixed(2)
        : null;

    if (avgSgpa) {
      insights.push(
        `Across ${completedSemesters.length} completed terms, your average SGPA is ${avgSgpa} across ${totalSubjs} total evaluated subjects.`
      );
    }

    // Average credits per semester
    const avgCreditsPerSem = (
      totalCompletedCredits / completedSemesters.length
    ).toFixed(1);
    insights.push(
      `Average workload: ${avgCreditsPerSem} credits per semester (${totalCompletedCredits} total earned credits).`
    );

    // Grade breakdown & Most common grade
    const gradeCounts: Record<string, number> = {};
    allCompletedSubjects.forEach((s) => {
      gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
    });

    let mostCommonGrade = "";
    let maxGradeCount = 0;
    Object.entries(gradeCounts).forEach(([g, count]) => {
      if (count > maxGradeCount) {
        maxGradeCount = count;
        mostCommonGrade = g;
      }
    });

    if (mostCommonGrade) {
      const pctOfTotal = Math.round((maxGradeCount / totalSubjs) * 100);
      insights.push(
        `Most common grade: '${mostCommonGrade}' (achieved in ${maxGradeCount} of ${totalSubjs} subjects — ${pctOfTotal}%).`
      );
    }

    const gradeBreakdownItems: string[] = [];
    if (gradeCounts["O"]) gradeBreakdownItems.push(`${gradeCounts["O"]} 'O' grades`);
    if (gradeCounts["A+"]) gradeBreakdownItems.push(`${gradeCounts["A+"]} 'A+' grades`);
    if (gradeCounts["A"]) gradeBreakdownItems.push(`${gradeCounts["A"]} 'A' grades`);
    if (gradeCounts["B+"]) gradeBreakdownItems.push(`${gradeCounts["B+"]} 'B+' grades`);
    if (gradeBreakdownItems.length > 0) {
      insights.push(`Grade distribution: ${gradeBreakdownItems.join(", ")}.`);
    }

    // Academic Trend
    if (completedSemesters.length >= 2) {
      const sgpas = completedSemesters
        .map((s) => s.sgpa)
        .filter((v): v is number => typeof v === "number");
      if (sgpas.length >= 2) {
        const first = sgpas[0];
        const last = sgpas[sgpas.length - 1];
        const diff = last - first;
        let trendLabel = "Stable";
        if (diff >= 0.2) trendLabel = "Improving";
        else if (diff <= -0.2) trendLabel = "Declining";

        insights.push(
          `Overall Academic Trend: ${trendLabel} (${diff >= 0 ? "+" : ""}${diff.toFixed(2)} SGPA change from ${completedSemesters[0].name} to ${completedSemesters[completedSemesters.length - 1].name}).`
        );
      }
    }

    return insights;
  }, [
    completedSemesters,
    allCompletedSubjects,
    leaderboardSubjects,
    bottomLowestSubjects,
    bestSemester,
    mostImprovedSemester,
    totalCompletedCredits,
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

              {/* Section 2: Subject Highlights & Performance Ranking Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Highest & Lowest Highlight Cards */}
                <div className="flex flex-col gap-4">
                  {/* Highest Scoring Subjects Card */}
                  <Card className="p-5 bg-white dark:bg-zinc-950/70 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                        <span className="flex items-center gap-1.5">
                          <Award size={16} className="text-emerald-500" />
                          Highest Scoring Subjects
                        </span>
                        <Badge tone="success" className="text-[10px] font-bold">
                          Top {topHighestSubjects.length}
                        </Badge>
                      </div>

                      {topHighestSubjects.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 italic py-4">
                          Import transcript to view highest scoring subjects.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 my-1">
                          {topHighestSubjects.map((subj) => (
                            <div
                              key={subj.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-colors"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {subj.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                                  {subj.code && <span>{subj.code}</span>}
                                  {subj.code && <span>•</span>}
                                  <span>{subj.semesterName}</span>
                                  <span>•</span>
                                  <span>{subj.credits} Cr</span>
                                </span>
                              </div>
                              <Badge tone="success" className="font-extrabold text-xs shrink-0 px-2 py-0.5">
                                {subj.grade}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Lowest Scoring Subjects Card */}
                  <Card className="p-5 bg-white dark:bg-zinc-950/70 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle size={16} className="text-amber-500" />
                          Lowest Scoring Subjects
                        </span>
                        <Badge tone="warning" className="text-[10px] font-bold">
                          Bottom {bottomLowestSubjects.length}
                        </Badge>
                      </div>

                      {bottomLowestSubjects.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 italic py-4">
                          Import transcript to view lowest scoring subjects.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 my-1">
                          {bottomLowestSubjects.map((subj) => (
                            <div
                              key={subj.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/5 hover:border-amber-500/30 transition-colors"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {subj.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                                  {subj.code && <span>{subj.code}</span>}
                                  {subj.code && <span>•</span>}
                                  <span>{subj.semesterName}</span>
                                  <span>•</span>
                                  <span>{subj.credits} Cr</span>
                                </span>
                              </div>
                              <Badge tone="warning" className="font-extrabold text-xs shrink-0 px-2 py-0.5">
                                {subj.grade}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Subject Performance Ranking Leaderboard Table */}
                <Card className="lg:col-span-2 border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/90 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[660px]">
                  <CardHeader className="bg-slate-50 dark:bg-zinc-950 py-3.5 px-5 border-b border-slate-200 dark:border-white/10 flex flex-row items-center justify-between shrink-0">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy
                        size={18}
                        className="text-purple-600 dark:text-purple-400"
                      />{" "}
                      Subject Performance Ranking
                    </CardTitle>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono font-medium">
                      {leaderboardSubjects.length} Ranked Subjects
                    </span>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 min-h-0 overflow-x-auto overflow-y-auto h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-zinc-950/50 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/50">
                    {leaderboardSubjects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-500 italic">
                        Complete at least one semester with academic grades to view rankings.
                      </div>
                    ) : (
                      <table className="w-full min-w-full border-separate border-spacing-0 text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 dark:border-white/10 z-10">
                          <tr>
                            <th className="px-4 py-3.5 w-16">Rank</th>
                            <th className="px-4 py-3.5">Subject</th>
                            <th className="px-4 py-3.5">Semester</th>
                            <th className="px-4 py-3.5 text-center w-20">Grade</th>
                            <th className="px-4 py-3.5 text-right w-20">Credits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-sans">
                          {leaderboardSubjects.map((subj) => (
                            <tr
                              key={subj.id}
                              className="hover:bg-purple-500/5 transition-colors"
                            >
                              <td className="px-4 py-3 font-bold font-mono">
                                <span
                                  className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold ${
                                    subj.rank === 1
                                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                      : subj.rank === 2
                                      ? "bg-slate-200 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                                      : subj.rank === 3
                                      ? "bg-amber-700/20 text-amber-600 dark:text-amber-500 border border-amber-700/30"
                                      : "text-purple-600 dark:text-purple-400 bg-purple-500/10"
                                  }`}
                                >
                                  #{subj.rank}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    {subj.name}
                                  </span>
                                  {subj.code && (
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                                      {subj.code}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 text-xs">
                                {subj.semesterName}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  tone={
                                    subj.grade === "O"
                                      ? "success"
                                      : subj.grade === "A+"
                                      ? "accent"
                                      : subj.grade === "A"
                                      ? "info"
                                      : "warning"
                                  }
                                  className="font-extrabold"
                                >
                                  {subj.grade}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-zinc-300 font-mono text-xs">
                                {subj.credits}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: AI Academic Insights
              <Card className="glow-purple border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-blue-950/40 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex flex-col gap-2.5 w-full">
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
              </Card> */}
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
                          {totalCompletedCredits}
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
