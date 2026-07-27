import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, Upload, Plus, Sparkles, BookOpen, Target, Award, GraduationCap, Building2, BookMarked, Layers, Calendar, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/states";
import { CountUp } from "@/components/shared/count-up";
import { TrendChart } from "@/components/charts/trend-chart";
import { UploadResultsModal } from "@/components/upload/upload-results-modal";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { DashboardService, type DashboardSummary } from "@/services/dashboard-service";
import type { CgpaViewMode } from "@/types";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicStore } from "@/lib/store/use-academic-store";

export function DashboardPage() {
  const { user } = useAuth();
  const storeTargetCgpa = useAcademicStore((state) => state.targetCgpa);
  const [searchParams] = useSearchParams();
  const isManualOnboarding = searchParams.get("onboarding") === "manual";

  const [view, setView] = useState<CgpaViewMode>("cgpa");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
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

  // 1. Semester records from backend summary
  const semesterRecords = summaryData?.semesters || [];

  // 2. Calculated CGPA & SGPA from semester records
  const rawCalculatedCgpa = summaryData?.cgpa;
  const calculatedCgpa = typeof rawCalculatedCgpa === "number" && !isNaN(rawCalculatedCgpa) && rawCalculatedCgpa > 1.0 ? rawCalculatedCgpa : null;
  const calculatedSgpa = typeof summaryData?.sgpa === "number" && !isNaN(summaryData.sgpa) ? summaryData.sgpa : null;
  
  // 3. User profile CGPA (stored in onboarding / settings)
  const profileCgpa = typeof user?.currentCgpa === "number" && !isNaN(user.currentCgpa) ? user.currentCgpa : null;

  // 4. Exact priority resolution for Current Overall CGPA card:
  // Priority 1: Valid calculated CGPA from semester records
  // Priority 2: Stored user profile CGPA (onboarding / settings)
  // Priority 3: null ("No CGPA Available")
  const activeCgpa = calculatedCgpa ?? profileCgpa;
  const isBaselineCgpa = calculatedCgpa === null && profileCgpa !== null;

  const headline = view === "cgpa" ? activeCgpa : calculatedSgpa;

  const atRisk = useMemo(() => {
    return summaryData?.atRiskSubjects || [];
  }, [summaryData]);

  // Dynamic target CGPA resolution: User profile > Zustand Store > Backend Summary > Default
  const targetCgpa = typeof user?.targetCgpa === "number"
    ? user.targetCgpa
    : storeTargetCgpa || summaryData?.targetCgpa || 9.0;

  const targetProgress = useMemo(() => {
    if (headline === null || !targetCgpa) return 0;
    const progress = Math.min(100, Math.max(0, Math.round((headline / targetCgpa) * 100)));
    return isNaN(progress) ? 0 : progress;
  }, [headline, targetCgpa]);

  // CGPA trend from backend
  const cgpaTrend = useMemo(() => {
    if (summaryData?.cgpaTrend) {
      return summaryData.cgpaTrend.map((item) => ({
        label: item.semester,
        value: item.sgpa,
      }));
    }
    return [];
  }, [summaryData]);

  // Show onboarding card ONLY if user completed onboarding AND no academic subjects or semester records exist
  const hasAcademicData = Boolean(
    (summaryData?.semesters && summaryData.semesters.length > 0) || currentSemesterSubjects.length > 0
  );
  const showOnboardingCard = Boolean(user?.profileCompleted) && !hasAcademicData;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Sparkles size={12} className="text-purple-400" /> Academic Dashboard Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Academic Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Track past performance, current semester subjects, and CGPA targets.</p>
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

          {/* SGPA / CGPA Mode Switcher Pill */}
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

      {/* Manual Entry Onboarding Card */}
      {showOnboardingCard && (
        <Card className="glow-purple border border-purple-500/40 bg-gradient-to-r from-purple-900/40 via-zinc-900 to-blue-950/40 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs mb-1">
                  <Sparkles size={13} className="text-purple-400" /> Academic Profile Created
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Your academic profile has been created.</h2>
                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">Now let's add your semester data.</p>
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

      {/* Real Academic Profile Card */}
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
                <span>{user?.course || "Degree"}</span>
                <span>•</span>
                <span>{user?.branch || "Department"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-zinc-300">
              <Layers size={14} className="text-purple-400" />
              <span>Semester: <strong className="text-white">{user?.currentSemester || user?.semesterSystem || "Semester 1"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-zinc-300">
              <Calendar size={14} className="text-blue-400" />
              <span>Batch: <strong className="text-white">{user?.academicSession || "N/A"}</strong></span>
            </div>

            {typeof user?.currentCgpa === "number" && (
              <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-purple-300">
                <Award size={14} className="text-purple-400" />
                <span>Onboarding CGPA: <strong className="font-mono text-white">{user.currentCgpa.toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-400">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
              <p className="mt-2 text-xs text-zinc-400">
                Recorded across <span className="font-semibold text-zinc-300">{summaryData?.semesters?.length || 0} semesters</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card>
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

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card>
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

      {/* At-Risk Subject Warnings */}
      {atRisk.length > 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle size={18} className="text-amber-400" />
            <CardTitle className="text-amber-300 font-bold text-sm uppercase tracking-wide">
              At-Risk Subjects ({atRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {atRisk.map((r, i) => (
              <div
                key={r.subjectId || `risk-${i}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-white text-sm">{r.subjectName}</p>
                  <p className="text-zinc-400">{r.reason}</p>
                </div>
                <Link to="/app/subjects" className="flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                  View Subject <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-xs text-emerald-400 font-semibold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} /> All active subjects are currently performing on target.
          </div>
        </div>
      )}

      {/* Progression Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            <CardTitle>CGPA Progression Trend</CardTitle>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">
            {summaryData?.semesters?.length || 0} Semesters Tracked
          </span>
        </CardHeader>
        <CardContent>
          {cgpaTrend.length > 0 ? (
            <TrendChart data={cgpaTrend} />
          ) : (
            <p className="text-xs text-zinc-500 text-center py-8">No historical semester trend data recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Current Semester Subjects Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Current Semester Courses ({currentSemesterSubjects.length})
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="text-xs">
            <Plus size={14} className="mr-1" /> Add Subject
          </Button>
        </div>

        {currentSemesterSubjects.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-lg">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No subjects added for the current semester.</h3>
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
            {currentSemesterSubjects.map((subject, idx) => {
              const pct = subject.calculatedPct ?? 0;
              const letter = subject.letterGrade || "N/A";
              const idKey = subject._id || subject.id || `subj-${idx}`;
              return (
                <Link key={idKey} to="/app/subjects">
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
                          <Badge tone="accent">{letter}</Badge>
                        </div>

                        <div className="mb-1.5 flex items-baseline justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Calculated Score</span>
                          <span className="font-tabular font-bold text-white text-sm">{pct.toFixed(1)}%</span>
                        </div>
                        <ProgressBar value={pct} />

                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 pt-3">
                          <span className="font-medium text-zinc-300">Credits: {subject.credits}</span>
                          <span className="font-semibold text-purple-400">Grade: {letter} ({pct.toFixed(1)}%)</span>
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
