import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, Upload, Plus } from "lucide-react";
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
import { Link } from "react-router-dom";

export function DashboardPage() {
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
  }, []);

  const current = useMemo(() => {
    return summaryData?.currentSemester || null;
  }, [summaryData]);

  const currentSemesterSubjects = useMemo(() => {
    return summaryData?.subjects || [];
  }, [summaryData]);

  // Backend calculated headline CGPA / SGPA
  const cgpa = summaryData?.cgpa ?? null;
  const sgpa = summaryData?.sgpa ?? null;
  const headline = view === "cgpa" ? cgpa : sgpa;

  const atRisk = useMemo(() => {
    return summaryData?.atRiskSubjects || [];
  }, [summaryData]);

  // Target progress calculation against target CGPA
  const targetCgpa = summaryData?.targetCgpa || 9.0;
  const targetProgress = useMemo(() => {
    if (!cgpa || !targetCgpa) return 0;
    const progress = Math.min(100, Math.max(0, Math.round((cgpa / targetCgpa) * 100)));
    return isNaN(progress) ? 0 : progress;
  }, [cgpa, targetCgpa]);

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

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Academic Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track past performance, current subjects, and target CGPA.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          >
            <Upload size={15} /> Upload Past Results
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddSubjectModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={15} /> Add New Subject
          </Button>

          {/* SGPA / CGPA Toggle */}
          <div className="flex rounded-lg border p-0.5 text-xs font-medium ml-2" style={{ borderColor: "var(--border-hairline)" }}>
            {(["sgpa", "cgpa"] as CgpaViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  view === mode ? "bg-[var(--color-accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-xs text-[var(--color-danger)]">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{view === "cgpa" ? "Current CGPA" : `${current?.name || "Current Semester"} SGPA`}</CardTitle>
          </CardHeader>
          <CardContent>
            {headline !== null ? (
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold">
                  <CountUp value={headline} />
                </span>
                <span className="mb-1 flex items-center gap-0.5 text-sm text-[var(--color-success)] font-medium">
                  <TrendingUp size={14} /> On Track
                </span>
              </div>
            ) : (
              <div className="text-2xl font-semibold text-[var(--text-tertiary)]">N/A</div>
            )}
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Across {summaryData?.semesters?.length || 0} semester records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target CGPA Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold font-tabular text-[var(--color-accent)]">
              {targetCgpa.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Target set for graduation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-2xl font-semibold font-tabular">{targetProgress}%</div>
            <ProgressBar value={targetProgress} tone="accent" />
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Warning Card */}
      {atRisk.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            <CardTitle className="text-[var(--text-primary)]">At-Risk Subjects ({atRisk.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {atRisk.map((r, i) => (
              <div
                key={r.subjectId || `risk-${i}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div>
                  <p className="font-medium">{r.subjectName}</p>
                  <p className="text-[var(--text-secondary)]">{r.reason}</p>
                </div>
                <Link to="/app/subjects" className="flex items-center gap-1 text-[var(--color-accent)] font-medium">
                  View details <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm text-[var(--color-success)] bg-[var(--color-success)]/5"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} /> All current subjects are performing on track
          </div>
        </div>
      )}

      {/* CGPA Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>CGPA Progression Trend</CardTitle>
          <span className="text-xs text-[var(--text-tertiary)]">
            {summaryData?.semesters?.length || 0} Semesters Recorded
          </span>
        </CardHeader>
        <CardContent>
          {cgpaTrend.length > 0 ? (
            <TrendChart data={cgpaTrend} />
          ) : (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No trend data available yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Current Subjects Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Current Semester Subjects ({currentSemesterSubjects.length})
          </h2>
          <Button variant="outline" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="text-xs">
            <Plus size={13} className="mr-1" /> Add Subject
          </Button>
        </div>

        {currentSemesterSubjects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-3">No subjects found in the current semester.</p>
            <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mx-auto flex items-center gap-1">
              <Plus size={14} /> Add your first subject
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentSemesterSubjects.map((subject, idx) => {
              const pct = subject.calculatedPct ?? 0;
              const letter = subject.letterGrade || "N/A";
              const idKey = subject._id || subject.id || `subj-${idx}`;
              return (
                <Link key={idKey} to="/app/subjects">
                  <Card className="group cursor-pointer transition-transform hover:-translate-y-0.5">
                    <CardContent className="pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: subject.colorTag || "#3b82f6" }}
                          />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <Badge tone="accent">{letter}</Badge>
                      </div>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Current Score</span>
                        <span className="font-tabular font-medium">{pct.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={pct} />
                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                        <span>Credits: {subject.credits}</span>
                        <span>Grade: {letter} ({pct.toFixed(1)}%)</span>
                      </div>
                    </CardContent>
                  </Card>
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
