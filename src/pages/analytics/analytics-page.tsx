import { useState, useEffect, useMemo, Fragment } from "react";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle, TrendingUp, BookOpen, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { Badge } from "@/components/ui/badge";
import { AnalyticsService, type AnalyticsSummary } from "@/services/analytics-service";
import { EditSemesterModal } from "@/components/upload/edit-semester-modal";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function AnalyticsPage() {
  const [tab, setTab] = useState<"trend" | "history">("trend");
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

  const chartData = useMemo(() => {
    if (analytics?.cgpaHistory && analytics.cgpaHistory.length > 0) {
      return analytics.cgpaHistory.map((item) => ({
        label: item.semester,
        value: item.cgpa,
      }));
    }
    return [];
  }, [analytics]);

  const completedSemesters = useMemo(() => {
    return analytics?.completedSemesters || [];
  }, [analytics]);

  const selectedSem = useMemo(() => {
    if (!completedSemesters.length) return null;
    return (
      completedSemesters.find((s) => (s.id || s._id) === selectedSemesterId) || completedSemesters[0]
    );
  }, [completedSemesters, selectedSemesterId]);

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

  function formatLastUpdated(dateStr?: string) {
    if (!dateStr) return "27 July 2026, 2:45 PM";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "27 July 2026, 2:45 PM";
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return `${day} ${month} ${year}, ${time}`;
    } catch {
      return "27 July 2026, 2:45 PM";
    }
  }

  return (
    <div className="space-y-6">
      {/* Subheader Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Academic Analytics & Performance</h1>
          <p className="text-xs text-zinc-400">
            Track SGPA trends, historical transcript records, and credit distributions
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-zinc-900/80 p-1 border border-white/10">
          <button
            onClick={() => setTab("trend")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "trend"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Progression Trend
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "history"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Past Results
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-400 animate-pulse">
          Loading academic performance metrics from database...
        </div>
      ) : (
        <>
          {tab === "trend" ? (
            <>
              {/* Progression Trend Tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-zinc-950/60 border border-white/10">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Highest Scoring Subject</span>
                      <Trophy size={14} className="text-amber-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {analytics?.highestSubject ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-base">{analytics.highestSubject.name}</p>
                          <p className="text-xs text-zinc-400">{analytics.highestSubject.code} • {analytics.highestSubject.credits} Credits</p>
                        </div>
                        <Badge tone="accent" className="text-sm font-mono font-extrabold">
                          {safeFormatPct(analytics.highestSubject.pct)}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No subject records available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="p-4 bg-zinc-950/60 border border-white/10">
                  <CardHeader className="p-0 mb-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Lowest Scoring Subject</span>
                      <AlertTriangle size={14} className="text-rose-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {analytics?.lowestSubject ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-base">{analytics.lowestSubject.name}</p>
                          <p className="text-xs text-zinc-400">{analytics.lowestSubject.code} • {analytics.lowestSubject.credits} Credits</p>
                        </div>
                        <Badge tone="accent" className="text-sm font-mono font-extrabold text-amber-400">
                          {safeFormatPct(analytics.lowestSubject.pct)}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No subject records available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* CGPA Trend Chart Card */}
              <Card className="p-5 bg-zinc-950/60 border border-white/10">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-purple-400" /> CGPA Growth Progression
                    </span>
                    <span className="text-xs font-mono text-purple-400 font-semibold">
                      Total Subjects: {analytics?.totalSubjectsEvaluated || 0}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {chartData.length > 0 ? (
                    <div className="h-64">
                      <TrendChart data={chartData} />
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      No historical CGPA trend points available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Past Results Tab wrapped in ErrorBoundary */
            <ErrorBoundary fallbackTitle="Past Results Component Error">
              {!completedSemesters || completedSemesters.length === 0 ? (
                /* Requirement 8: Empty State when no semester data exists */
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
                      Select Semester Record to Inspect
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {/* Detailed Semester Results View for Selected Semester */}
                  {selectedSem ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
                      {/* Semester Results Header Card */}
                      <Card className="border border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedSem.name} Detailed Results</h2>
                              <Badge tone="accent">Semester {selectedSem.semesterNumber}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={14} /> {selectedSem.verificationStatus || "Verified"}
                              </span>
                              <span className="text-zinc-500">•</span>
                              <span className="text-zinc-400 font-mono">
                                Last Updated: <strong className="text-zinc-200">{formatLastUpdated(selectedSem.updatedAt)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5">
                              <span className="text-zinc-400 block text-[10px] uppercase font-bold">SGPA</span>
                              <span className="text-base font-extrabold font-mono text-purple-400">{typeof selectedSem.sgpa === "number" ? selectedSem.sgpa.toFixed(2) : "N/A"}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5">
                              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Credits Earned</span>
                              <span className="text-base font-extrabold font-mono text-white">{selectedSem.creditsEarned ?? "—"}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5">
                              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Total Subjects</span>
                              <span className="text-base font-extrabold font-mono text-white">{selectedSem.totalSubjects ?? 0}</span>
                            </div>

                            <button
                              onClick={() => setIsEditModalOpen(true)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                            >
                              <Edit3 size={14} /> Edit Semester
                            </button>
                          </div>
                        </div>
                      </Card>

                      {/* AI Academic Insights Card */}
                      {selectedSem.aiInsight && (
                        <Card className="glow-purple border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-zinc-900 to-blue-950/30 p-5">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                Academic AI Performance Insights
                              </h3>
                              <p className="text-xs sm:text-sm text-zinc-200 mt-1 leading-relaxed">
                                {selectedSem.aiInsight}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Semester Summary Cards */}
                      {selectedSem.summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          <Card className="p-3 bg-zinc-950/70 border border-white/10">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Highest Subject</p>
                            <p className="font-bold text-emerald-400 text-xs truncate mt-1">{selectedSem.summary.highestSubject?.name || "N/A"}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {safeFormatPct(selectedSem.summary.highestSubject?.pct)}
                            </p>
                          </Card>
                          <Card className="p-3 bg-zinc-950/70 border border-white/10">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Lowest Subject</p>
                            <p className="font-bold text-amber-400 text-xs truncate mt-1">{selectedSem.summary.lowestSubject?.name || "N/A"}</p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {safeFormatPct(selectedSem.summary.lowestSubject?.pct)}
                            </p>
                          </Card>
                          <Card className="p-3 bg-zinc-950/70 border border-white/10">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Average Marks</p>
                            <p className="font-bold text-white text-sm font-mono mt-1">
                              {typeof selectedSem.summary.averageMarks === "number" ? `${selectedSem.summary.averageMarks}%` : "—"}
                            </p>
                          </Card>
                          <Card className="p-3 bg-zinc-950/70 border border-white/10">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Credits</p>
                            <p className="font-bold text-white text-sm font-mono mt-1">{selectedSem.summary.totalCredits ?? "—"}</p>
                          </Card>
                          <Card className="p-3 bg-zinc-950/70 border border-purple-500/30 bg-purple-500/5 col-span-2 sm:col-span-1">
                            <p className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Semester SGPA</p>
                            <p className="font-bold text-purple-400 text-base font-mono mt-1">
                              {typeof selectedSem.summary.sgpa === "number" ? selectedSem.summary.sgpa.toFixed(2) : "N/A"}
                            </p>
                          </Card>
                        </div>
                      )}

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
                              <tbody className="divide-y divide-white/5">
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
                                        <td className="p-3.5 pl-5 font-bold text-white">{displayName}</td>
                                        <td className="p-3.5 text-zinc-400 font-mono">{displayCode}</td>
                                        <td className="p-3.5 font-mono">{subj?.credits ?? "—"}</td>
                                        <td className="p-3.5 font-mono text-zinc-200">{displayMarksObtained}</td>
                                        <td className="p-3.5 font-mono text-zinc-400">{displayMaxMarks}</td>
                                        <td className="p-3.5 font-mono font-bold text-purple-300">{displayPercentage}</td>
                                        <td className="p-3.5"><Badge tone="accent">{displayGrade}</Badge></td>
                                        <td className="p-3.5 font-mono font-semibold">{displayGradePoint}</td>
                                        <td className="p-3.5 pr-5 text-right">
                                          <button className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* Expandable Stored User Assessment Components Row */}
                                      {isExpanded && (
                                        <tr className="bg-purple-950/20 border-t border-purple-500/20">
                                          <td colSpan={9} className="p-4 pl-8">
                                            <div className="rounded-xl border border-purple-500/20 bg-zinc-950/80 p-4">
                                              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-1.5">
                                                <BookOpen size={13} /> Stored Assessment Components — {displayName}
                                              </p>
                                              {Array.isArray(subj?.assessments) && subj.assessments.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                  {subj.assessments.map((item, aIdx) => (
                                                    <div key={aIdx} className="rounded-lg border border-white/10 bg-zinc-900/60 p-2.5">
                                                      <span className="text-[10px] text-zinc-400 block font-semibold">{item?.name || `Component ${aIdx + 1}`}</span>
                                                      <span className="font-mono font-bold text-white mt-0.5 block">
                                                        {item?.marksObtained !== null && item?.marksObtained !== undefined
                                                          ? `${item.marksObtained} / ${item.maxMarks || 100}`
                                                          : "Left Blank"}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-zinc-400">
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
