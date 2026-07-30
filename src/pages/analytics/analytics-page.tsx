import { useState, useEffect, useMemo, Fragment } from "react";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle, TrendingUp, BookOpen, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Edit3, Award, BarChart3, PieChart, Download, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalyticsService, type AnalyticsSummary, type AnalyticsSubject } from "@/services/analytics-service";
import { EditSemesterModal } from "@/components/upload/edit-semester-modal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "sonner";

export function AnalyticsPage() {
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    AnalyticsService.getAnalyticsSummary()
      .then((data) => {
        setAnalytics(data);
        if (data?.completedSemesters && data.completedSemesters.length > 0) {
          if (!selectedSemesterId) {
            setSelectedSemesterId(data.completedSemesters[0].id || data.completedSemesters[0]._id || null);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics summary from backend:", err);
        setAnalytics(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
    const handleUpdate = () => fetchAnalytics();
    window.addEventListener("academic-data-updated", handleUpdate);
    return () => window.removeEventListener("academic-data-updated", handleUpdate);
  }, []);

  const completedSemesters = useMemo(() => {
    return analytics?.completedSemesters || [];
  }, [analytics]);

  const selectedSem = useMemo(() => {
    if (!completedSemesters.length) return null;
    return (
      completedSemesters.find((s) => (s.id || s._id) === selectedSemesterId) || completedSemesters[0]
    );
  }, [completedSemesters, selectedSemesterId]);

  // Performance Summary Calculations
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

  const consistencyScore = useMemo(() => {
    if (!completedSemesters.length) return { score: 100, label: "Optimal Consistency" };
    const sgpas = completedSemesters.map((s) => s.sgpa).filter((v): v is number => typeof v === "number");
    if (sgpas.length <= 1) return { score: 98, label: "Very High Consistency" };

    const mean = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
    const variance = sgpas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sgpas.length;
    const stdDev = Math.sqrt(variance);

    // Consistency score starts at 100 and decreases as stdDev increases
    const score = Math.max(60, Math.min(100, Math.round(100 - stdDev * 25)));
    const label = score >= 90 ? "High Consistency" : score >= 75 ? "Moderate Consistency" : "Variable Consistency";

    return { score, label };
  }, [completedSemesters]);

  // All Evaluated Subjects Sorted
  const sortedAllSubjects = useMemo(() => {
    if (!completedSemesters.length) return [];
    const list: Array<AnalyticsSubject & { semesterName: string }> = [];
    for (const sem of completedSemesters) {
      for (const subj of sem.subjects || []) {
        list.push({
          name: subj.name || subj.subjectName,
          code: subj.code || subj.subjectCode || "",
          credits: subj.credits || 3,
          pct: subj.finalPercentage ?? subj.pct ?? 0,
          letterGrade: subj.grade || subj.letterGrade || "—",
          gradePoint: subj.gradePoint || 0,
          semester: sem.name,
          semesterName: sem.name,
        });
      }
    }
    return list.sort((a, b) => b.pct - a.pct);
  }, [completedSemesters]);

  // Grade Distribution Histogram
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { "A+": 0, A: 0, "A-": 0, "B+": 0, B: 0, "B-": 0, "C+": 0, C: 0, D: 0, F: 0 };
    for (const subj of sortedAllSubjects) {
      const g = (subj.letterGrade || "B").trim();
      if (g in dist) {
        dist[g]++;
      } else if (g.startsWith("A")) {
        dist["A"]++;
      } else if (g.startsWith("B")) {
        dist["B"]++;
      } else {
        dist["C"]++;
      }
    }
    return Object.entries(dist).filter(([_, count]) => count > 0);
  }, [sortedAllSubjects]);

  // Credit Analysis
  const creditAnalysis = useMemo(() => {
    const completedCredits = completedSemesters.reduce((sum, sem) => sum + (sem.creditsEarned || 20), 0);
    const degreeTotal = 160; // Standard 4-year degree credit target
    const progressPct = Math.min(100, Math.round((completedCredits / degreeTotal) * 100));

    return {
      completedCredits,
      remainingCredits: Math.max(0, degreeTotal - completedCredits),
      degreeTotal,
      progressPct,
    };
  }, [completedSemesters]);

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
    if (typeof val === "string" && val.trim() !== "") return val.includes("%") ? val : `${val}%`;
    return "—";
  }

  function safeFormatNumber(val: any, decimals = 1): string {
    if (typeof val === "number" && !isNaN(val)) return val.toFixed(decimals);
    if (typeof val === "string" && val.trim() !== "") return val;
    return "—";
  }

  function handleExportTranscript() {
    toast.success("Academic Transcript prepared for export!", { id: "export-transcript-toast" });
    window.print();
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Academic Analytics & Insights</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Deep performance analysis, grade distributions, credit progress, and semester transcripts
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-zinc-900/80 p-1.5 border border-white/10 shadow-lg">
          <button
            onClick={() => setTab("overview")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={14} /> Analytics Overview
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "history"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-white"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Best Semester */}
                <Card className="p-4 bg-gradient-to-br from-zinc-900 to-purple-950/30 border border-purple-500/30">
                  <div className="flex items-center justify-between text-xs text-purple-300 font-bold uppercase tracking-wider mb-2">
                    <span>Best Semester</span>
                    <Trophy size={16} className="text-amber-400" />
                  </div>
                  {bestSemester ? (
                    <div>
                      <p className="font-extrabold text-white text-lg">{bestSemester.name}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-purple-300 font-bold text-sm">
                          SGPA {bestSemester.sgpa ? bestSemester.sgpa.toFixed(2) : "N/A"}
                        </span>
                        <span className="text-zinc-400 font-mono">{bestSemester.creditsEarned} Credits</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2">No completed terms</p>
                  )}
                </Card>

                {/* 2. Lowest Semester */}
                <Card className="p-4 bg-zinc-950/70 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
                    <span>Lowest Semester</span>
                    <AlertTriangle size={16} className="text-rose-400" />
                  </div>
                  {lowestSemester ? (
                    <div>
                      <p className="font-extrabold text-white text-lg">{lowestSemester.name}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-amber-400 font-bold text-sm">
                          SGPA {lowestSemester.sgpa ? lowestSemester.sgpa.toFixed(2) : "N/A"}
                        </span>
                        <span className="text-zinc-400 font-mono">{lowestSemester.creditsEarned} Credits</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-2">No completed terms</p>
                  )}
                </Card>

                {/* 3. Most Improved Semester */}
                <Card className="p-4 bg-zinc-950/70 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
                    <span>Most Improved</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  {mostImprovedSemester ? (
                    <div>
                      <p className="font-extrabold text-white text-lg">{mostImprovedSemester.name}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          +{mostImprovedSemester.delta.toFixed(2)} SGPA
                        </span>
                        <span className="text-zinc-400 font-mono">Gain</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-extrabold text-white text-lg">Steady Pace</p>
                      <p className="text-xs text-zinc-400 mt-2 font-mono">Requires 2+ terms</p>
                    </div>
                  )}
                </Card>

                {/* 4. Academic Consistency Score */}
                <Card className="p-4 bg-zinc-950/70 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
                    <span>Consistency Score</span>
                    <ShieldCheck size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-white text-xl font-mono">{consistencyScore.score}%</span>
                      <span className="text-xs text-emerald-400 font-semibold">{consistencyScore.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2">Based on SGPA stability across terms</p>
                  </div>
                </Card>
              </div>

              {/* Section 2: Subject Analysis & Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Highest & Lowest Highlight Cards */}
                <div className="flex flex-col gap-4">
                  <Card className="p-5 bg-zinc-950/70 border border-purple-500/30">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                      <span>Highest Scoring Subject</span>
                      <Award size={16} className="text-amber-400" />
                    </div>
                    {analytics?.highestSubject ? (
                      <div>
                        <h3 className="font-extrabold text-white text-lg">{analytics.highestSubject.name}</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{analytics.highestSubject.code || "Course"} • {analytics.highestSubject.credits} Credits</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                          <Badge tone="accent">{analytics.highestSubject.letterGrade || "A+"}</Badge>
                          <span className="font-mono font-extrabold text-white text-lg">{safeFormatPct(analytics.highestSubject.pct)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No subjects evaluated</p>
                    )}
                  </Card>

                  <Card className="p-5 bg-zinc-950/70 border border-rose-500/20">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                      <span>Lowest Scoring Subject</span>
                      <AlertTriangle size={16} className="text-rose-400" />
                    </div>
                    {analytics?.lowestSubject ? (
                      <div>
                        <h3 className="font-extrabold text-white text-lg">{analytics.lowestSubject.name}</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{analytics.lowestSubject.code || "Course"} • {analytics.lowestSubject.credits} Credits</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                          <Badge tone="warning">{analytics.lowestSubject.letterGrade || "B"}</Badge>
                          <span className="font-mono font-extrabold text-amber-400 text-lg">{safeFormatPct(analytics.lowestSubject.pct)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No subjects evaluated</p>
                    )}
                  </Card>
                </div>

                {/* Sorted Subject Performance Ranking Table */}
                <Card className="lg:col-span-2 border border-white/10 bg-zinc-900/90 shadow-xl overflow-hidden flex flex-col justify-between">
                  <CardHeader className="bg-zinc-950 py-3.5 px-5 border-b border-white/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy size={16} className="text-purple-400" /> Subject Performance Ranking ({sortedAllSubjects.length})
                    </CardTitle>
                    <span className="text-xs text-zinc-400">Top to Bottom Score</span>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto max-h-[320px] overflow-y-auto">
                    {sortedAllSubjects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">No subject records available.</div>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-white/10">
                          <tr>
                            <th className="px-5 py-2.5">Rank</th>
                            <th className="px-5 py-2.5">Subject</th>
                            <th className="px-5 py-2.5">Semester</th>
                            <th className="px-5 py-2.5">Credits</th>
                            <th className="px-5 py-2.5">Score %</th>
                            <th className="px-5 py-2.5 pr-5 text-right">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {sortedAllSubjects.map((subj, idx) => (
                            <tr key={idx} className="hover:bg-purple-500/5 transition-colors">
                              <td className="px-5 py-3 font-bold text-purple-400">#{idx + 1}</td>
                              <td className="px-5 py-3 font-sans font-extrabold text-white">{subj.name}</td>
                              <td className="px-5 py-3 text-zinc-400 font-sans text-[11px]">{subj.semesterName}</td>
                              <td className="px-5 py-3 text-zinc-300">{subj.credits}</td>
                              <td className="px-5 py-3 font-bold text-white text-sm">{safeFormatPct(subj.pct)}</td>
                              <td className="px-5 py-3 pr-5 text-right font-sans">
                                <Badge tone="accent">{subj.letterGrade}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: Grade Distribution Histogram & Credit Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution Bar Chart */}
                <Card className="p-5 bg-zinc-950/70 border border-white/10">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChart size={16} className="text-purple-400" /> Grade Distribution Histogram
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {gradeDistribution.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">No grade data available.</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {gradeDistribution.map(([grade, count]) => {
                          const maxCount = Math.max(...gradeDistribution.map(([_, c]) => c));
                          const widthPct = Math.max(8, Math.round((count / maxCount) * 100));

                          return (
                            <div key={grade} className="flex items-center gap-3 text-xs font-mono">
                              <span className="w-8 font-bold text-purple-300 text-right">{grade}</span>
                              <div className="flex-1 h-5 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span className="w-12 text-zinc-400 font-bold">{count} {count === 1 ? "course" : "courses"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Credit Analysis & Progress Indicator */}
                <Card className="p-5 bg-zinc-950/70 border border-white/10 flex flex-col justify-between">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap size={16} className="text-emerald-400" /> Degree Credit Progress
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{creditAnalysis.progressPct}% Complete</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-5">
                    {/* Visual Progress Bar */}
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          style={{ width: `${creditAnalysis.progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>0 Credits</span>
                        <span className="text-white font-bold">{creditAnalysis.completedCredits} Earned</span>
                        <span>{creditAnalysis.degreeTotal} Total Target</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                      <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                        <span className="text-[10px] text-zinc-400 block font-sans font-semibold uppercase">Completed</span>
                        <span className="font-extrabold text-white text-base mt-1 block">{creditAnalysis.completedCredits}</span>
                      </div>
                      <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                        <span className="text-[10px] text-purple-300 block font-sans font-semibold uppercase">Remaining</span>
                        <span className="font-extrabold text-purple-400 text-base mt-1 block">{creditAnalysis.remainingCredits}</span>
                      </div>
                      <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                        <span className="text-[10px] text-emerald-400 block font-sans font-semibold uppercase">Total Target</span>
                        <span className="font-extrabold text-emerald-400 text-base mt-1 block">{creditAnalysis.degreeTotal}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 4: AI Academic Insights */}
              <Card className="glow-purple border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-blue-950/40 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-extrabold text-purple-200 uppercase tracking-wider">
                      AI Academic Trend & Consistency Observations
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                      {completedSemesters.length > 0
                        ? `Across your evaluated semesters, your academic standing maintains a ${consistencyScore.label.toLowerCase()} (${consistencyScore.score}%). Your peak performance was recorded in ${bestSemester?.name || "earlier terms"} with an SGPA of ${bestSemester?.sgpa ? bestSemester.sgpa.toFixed(2) : "N/A"}. Maintaining focused effort on core subjects will optimize your cumulative CGPA trajectory.`
                        : "Upload transcripts or record your semester subjects to unlock personalized AI academic trend observations and consistency analysis."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* Past Results Tab (Semester-wise Academic Transcript) */
            <ErrorBoundary fallbackTitle="Past Results Component Error">
              {!completedSemesters || completedSemesters.length === 0 ? (
                <Card className="p-12 text-center bg-zinc-950/60 border border-white/10 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white">No historical semester data available.</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Upload an academic transcript or add semester records to inspect past performance.
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Clickable Semester Cards List */}
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Select Semester Record to Inspect Transcript
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedSemesters.map((s) => {
                        const sId = s.id || s._id || "";
                        const isSelected = selectedSem ? (selectedSem.id || selectedSem._id) === sId : false;
                        return (
                          <div
                            key={sId}
                            onClick={() => setSelectedSemesterId(sId)}
                            className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(124,58,237,0.2)] ring-1 ring-purple-500/40"
                                : "border-white/10 bg-zinc-950/60 hover:border-purple-500/30 hover:bg-zinc-900/80"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-white text-base">{s.name || `Semester ${s.semesterNumber}`}</p>
                                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 size={13} /> {s.verificationStatus || "Official Record Verified"}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge tone="accent" className="text-xs font-mono font-bold">
                                  SGPA {typeof s.sgpa === "number" ? s.sgpa.toFixed(2) : "N/A"}
                                </Badge>
                                <p className="text-[11px] text-zinc-400 mt-1">
                                  {s.creditsEarned ?? "—"} Credits • {s.totalSubjects ?? 0} Subjects
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Semester Results View */}
                  {selectedSem ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
                      {/* Header Card with Export Action */}
                      <Card className="border border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedSem.name} Academic Transcript</h2>
                              <Badge tone="accent">Semester {selectedSem.semesterNumber}</Badge>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">Official verified transcript record</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 font-mono">
                              <span className="text-zinc-400 block text-[10px] uppercase font-bold">SGPA</span>
                              <span className="text-base font-extrabold text-purple-400">{typeof selectedSem.sgpa === "number" ? selectedSem.sgpa.toFixed(2) : "N/A"}</span>
                            </div>

                            <Button variant="outline" size="sm" onClick={handleExportTranscript} className="gap-1.5">
                              <Download size={14} /> Export Transcript
                            </Button>

                            <button
                              onClick={() => setIsEditModalOpen(true)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                            >
                              <Edit3 size={14} /> Edit Semester
                            </button>
                          </div>
                        </div>
                      </Card>

                      {/* Detailed Subjects Table with Expandable Rows */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center justify-between">
                            <span>Subject Breakdown Table ({selectedSem.subjects?.length || 0})</span>
                            <span className="text-xs text-zinc-400 font-normal">Click a subject row to view stored assessment components</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-white/10 font-semibold uppercase text-[11px] tracking-wider">
                                <tr>
                                  <th className="p-3.5 pl-5">Subject Name</th>
                                  <th className="p-3.5">Subject Code</th>
                                  <th className="p-3.5">Credits</th>
                                  <th className="p-3.5">Marks Obtained</th>
                                  <th className="p-3.5">Max Marks</th>
                                  <th className="p-3.5">Final Percentage</th>
                                  <th className="p-3.5">Grade</th>
                                  <th className="p-3.5">Grade Point</th>
                                  <th className="p-3.5 pr-5 text-right">Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono">
                                {Array.isArray(selectedSem.subjects) && selectedSem.subjects.map((subj) => {
                                  const subjId = subj?.id || subj?._id || subj?.name || Math.random().toString();
                                  const isExpanded = expandedSubjectIds.has(subjId);
                                  const displayName = subj?.subjectName || subj?.name || "Untitled Subject";
                                  const displayCode = subj?.subjectCode || subj?.code || "—";
                                  const displayMarksObtained = subj?.marksObtained !== null && subj?.marksObtained !== undefined ? subj.marksObtained : "—";
                                  const displayMaxMarks = subj?.maxMarks !== null && subj?.maxMarks !== undefined ? subj.maxMarks : "—";
                                  const displayPercentage = safeFormatPct(subj?.finalPercentage ?? subj?.pct);
                                  const displayGrade = subj?.grade || subj?.letterGrade || "—";
                                  const displayGradePoint = safeFormatNumber(subj?.gradePoint, 1);

                                  return (
                                    <Fragment key={subjId}>
                                      <tr
                                        onClick={() => toggleSubjectExpand(subjId)}
                                        className="cursor-pointer hover:bg-white/5 transition-colors"
                                      >
                                        <td className="p-3.5 pl-5 font-sans font-bold text-white">{displayName}</td>
                                        <td className="p-3.5 text-zinc-400">{displayCode}</td>
                                        <td className="p-3.5">{subj?.credits ?? "—"}</td>
                                        <td className="p-3.5 text-zinc-200">{displayMarksObtained}</td>
                                        <td className="p-3.5 text-zinc-400">{displayMaxMarks}</td>
                                        <td className="p-3.5 font-bold text-purple-300">{displayPercentage}</td>
                                        <td className="p-3.5 font-sans"><Badge tone="accent">{displayGrade}</Badge></td>
                                        <td className="p-3.5 font-semibold">{displayGradePoint}</td>
                                        <td className="p-3.5 pr-5 text-right">
                                          <button className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                          </button>
                                        </td>
                                      </tr>

                                      {isExpanded && (
                                        <tr className="bg-purple-950/20 border-t border-purple-500/20">
                                          <td colSpan={9} className="p-4 pl-8">
                                            <div className="rounded-xl border border-purple-500/20 bg-zinc-950/80 p-4">
                                              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-1.5 font-sans">
                                                <BookOpen size={13} /> Stored Assessment Components — {displayName}
                                              </p>
                                              {Array.isArray(subj?.assessments) && subj.assessments.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                  {subj.assessments.map((item, aIdx) => (
                                                    <div key={aIdx} className="rounded-lg border border-white/10 bg-zinc-900/60 p-2.5">
                                                      <span className="text-[10px] text-zinc-400 block font-sans font-semibold">{item?.name || `Component ${aIdx + 1}`}</span>
                                                      <span className="font-mono font-bold text-white mt-0.5 block">
                                                        {item?.marksObtained !== null && item?.marksObtained !== undefined
                                                          ? `${item.marksObtained} / ${item.maxMarks || 100}`
                                                          : "Left Blank"}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-zinc-400 font-sans">
                                                  No individual assessment components were recorded for this subject in the database.
                                                </p>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <Card className="p-8 text-center text-xs text-zinc-400">
                      Select a semester card above to view detailed results.
                    </Card>
                  )}
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
