import { useState, useMemo, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Target, Sparkles, CheckCircle2, AlertTriangle, BookOpen, Calculator, Layers, TrendingUp } from "lucide-react";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { requiredMarksForTarget } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import { DashboardService, type DashboardSummary } from "@/services/dashboard-service";
import type { Subject } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicStore } from "@/lib/store/use-academic-store";

export function TargetPlannerPage() {
  const { user, updateProfile } = useAuth();
  const setStoreTargetCgpa = useAcademicStore((state) => state.setTargetCgpa);

  const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
  const initialTargetPct = typeof user?.targetCgpa === "number" ? Math.round(user.targetCgpa * 10) : (scale === "4.0" ? 85 : 90);
  const [target, setTarget] = useState(initialTargetPct);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize target state from user profile if updated remotely
  useEffect(() => {
    if (typeof user?.targetCgpa === "number") {
      setTarget(Math.round(user.targetCgpa * 10));
    }
  }, [user?.targetCgpa]);

  const loadCurrentData = async () => {
    setLoading(true);
    try {
      const [curSubjects, dash] = await Promise.all([
        SubjectService.getCurrentSubjects(),
        DashboardService.getDashboardSummary(),
      ]);
      setSubjects(curSubjects || []);
      setDashboardData(dash || null);
    } catch (err) {
      console.error("Failed to load current semester data for Target Planner:", err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentData();
    const handleUpdate = () => loadCurrentData();
    window.addEventListener("academic-data-updated", handleUpdate);
    return () => window.removeEventListener("academic-data-updated", handleUpdate);
  }, []);

  // Planning metrics calculations
  const targetCgpa = useMemo(() => parseFloat((target / 10).toFixed(2)), [target]);

  // Requirement 3: Total Degree Credits from user profile (default 160)
  const totalDegreeCredits = user?.totalDegreeCredits || 160;

  // Requirement 1: Completed Credits strictly from CompletedSemesters only
  const completedCredits = useMemo(() => {
    if (typeof dashboardData?.completedCredits === "number") {
      return dashboardData.completedCredits;
    }
    if (!dashboardData?.completedSemesters) return 0;
    return dashboardData.completedSemesters.reduce((acc, sem) => acc + (sem.credits || 0), 0);
  }, [dashboardData]);

  // Requirement 4: Current Semester Credits displayed separately
  const currentSemesterCredits = useMemo(() => {
    return subjects.reduce((sum, s) => sum + (s.credits || 3), 0);
  }, [subjects]);

  const currentCgpa = useMemo(() => {
    return dashboardData?.cgpa ?? 0;
  }, [dashboardData]);

  // Requirement 2: Remaining Credits = Total Degree Credits - Completed Credits
  const remainingCredits = useMemo(() => {
    return Math.max(0, totalDegreeCredits - completedCredits);
  }, [totalDegreeCredits, completedCredits]);

  // Requirement 5: Required SGPA for active current semester
  const requiredSgpaThisSemester = useMemo(() => {
    if (currentSemesterCredits === 0) return 0;
    if (completedCredits === 0) return targetCgpa;

    const totalTargetPointsForPacedProgress = targetCgpa * (completedCredits + currentSemesterCredits);
    const completedGradePoints = currentCgpa * completedCredits;
    const requiredPointsInCurrentSem = totalTargetPointsForPacedProgress - completedGradePoints;
    const reqSgpa = requiredPointsInCurrentSem / currentSemesterCredits;
    return Math.max(0, parseFloat(reqSgpa.toFixed(2)));
  }, [targetCgpa, completedCredits, currentCgpa, currentSemesterCredits]);

  // Per-subject predictions
  const subjectPredictions = useMemo(() => {
    return subjects.map((subj) => {
      const req = requiredMarksForTarget(subj, target);
      const scheme = subj.scheme || {
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      };

      const marksMap = subj.marks || {};
      const assessmentTypes = scheme.assessmentTypes || [];

      // Calculate evaluated & remaining assessments
      let evaluatedMarks = 0;
      let evaluatedMax = 0;
      const remainingTypes: string[] = [];

      assessmentTypes.forEach((type: any) => {
        const val = marksMap[type.id];
        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          evaluatedMarks += Number(val);
          evaluatedMax += Number(type.maxMarks || 100);
        } else {
          remainingTypes.push(type.name);
        }
      });

      // Probability assessment
      let probability: "High" | "Moderate" | "Low" | "Impossible" = "High";
      if (!req.possible || req.requiredAvgPct > 100) {
        probability = "Impossible";
      } else if (req.requiredAvgPct > 88) {
        probability = "Low";
      } else if (req.requiredAvgPct > 75) {
        probability = "Moderate";
      }

      const isAchieved = req.requiredAvgPct <= 0;
      const isAtRisk = probability === "Low" || probability === "Impossible";

      return {
        subject: subj,
        req,
        evaluatedMarks,
        evaluatedMax,
        remainingTypes,
        probability,
        isAchieved,
        isAtRisk,
      };
    });
  }, [subjects, target]);

  const ambitious = subjectPredictions.some((p) => p.req.requiredAvgPct > 85 && p.req.requiredAvgPct <= 100);
  const unlikely = subjectPredictions.some((p) => !p.req.possible || requiredSgpaThisSemester > (scale === "4.0" ? 4.0 : 10.0));
  const feasibility = unlikely ? "Unlikely" : ambitious ? "Ambitious" : "Achievable";
  const tone = unlikely ? "danger" : ambitious ? "warning" : "success";

  // Save target CGPA slider change
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = (newTargetPct: number) => {
    setTarget(newTargetPct);
    const newTargetCgpa = parseFloat((newTargetPct / 10).toFixed(2));

    setStoreTargetCgpa(newTargetCgpa);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateProfile({ targetCgpa: newTargetCgpa }).catch((err) => {
        console.error("Failed to persist target CGPA:", err);
      });
    }, 400);

    if (newTargetPct >= 80 && !unlikely && Math.random() > 0.6) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#7c3aed", "#3b82f6", "#22c55e"],
      });
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Target size={12} className="text-purple-400" /> Current Semester AI Target Planner
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Active Semester Target Planner</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Real-time predictions for your current active semester subjects.
        </p>
      </div>

      {/* Target Setting & Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Target Slider Card */}
        <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/30 md:col-span-2 p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Calculator size={14} className="text-purple-400" /> Target CGPA Goal
            </label>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
              {targetCgpa.toFixed(2)} CGPA Goal
            </span>
          </div>

          <input
            type="range"
            min={scale === "4.0" ? 50 : 50}
            max={100}
            value={target}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-purple-500 my-4"
          />

          <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-tabular text-white tracking-tight">{target}%</span>
              <span className="text-xs text-zinc-400">Required Benchmark</span>
            </div>
            <Badge tone={tone as any}>{feasibility}</Badge>
          </div>
        </Card>

        {/* Current & Required SGPA Overview Card */}
        <Card className="border border-white/10 bg-zinc-950/60 p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Planning Metrics</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Official CGPA:</span>
                <span className="font-bold text-white font-mono">{currentCgpa ? currentCgpa.toFixed(2) : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Sem Credits:</span>
                <span className="font-bold text-amber-400 font-mono">{currentSemesterCredits}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Required SGPA This Semester</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">
              {requiredSgpaThisSemester > (scale === "4.0" ? 4.0 : 10.0) ? (
                <span className="text-rose-400 text-lg">Impossible (&gt;{scale === "4.0" ? "4.0" : "10.0"})</span>
              ) : (
                requiredSgpaThisSemester.toFixed(2)
              )}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Subjects Predictions List */}
      {loading ? (
        <Card className="p-8 text-center text-xs text-zinc-400 animate-pulse">
          Loading current semester subjects...
        </Card>
      ) : subjects.length === 0 ? (
        /* Requirement 8: Empty state when CurrentSemester has no subjects */
        <Card className="p-12 text-center bg-zinc-950/60 border border-white/10 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No current semester subjects available.</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Add active subjects for the current semester on the Dashboard or click below to begin target planning.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddSubjectModalOpen(true)}
            className="mx-auto flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
          >
            <Plus size={14} /> Add Subjects
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <CardTitle>Current Semester Subject Targets ({subjects.length})</CardTitle>
            </div>
            <Badge tone={tone as any}>{feasibility} Goal</Badge>
          </CardHeader>

          <CardContent className="flex flex-col gap-3.5">
            {subjectPredictions.map(({ subject, req, evaluatedMarks, remainingTypes, probability, isAchieved, isAtRisk }) => (
              <motion.div
                key={subject.id || subject._id}
                whileHover={{ x: 2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-xs gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="h-3 w-3 rounded-full mt-1 shrink-0 shadow-sm" style={{ backgroundColor: subject.colorTag || "#3b82f6" }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{subject.name}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">({subject.code || "No Code"})</span>
                      <Badge tone="accent" className="text-[10px]">{subject.credits} Credits</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span>Obtained Marks: <strong className="text-zinc-200">{evaluatedMarks > 0 ? evaluatedMarks : "—"}</strong></span>
                      <span>•</span>
                      <span>Remaining Exams: <strong className="text-purple-300">{remainingTypes.length > 0 ? remainingTypes.join(", ") : "All Completed"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                  {isAchieved ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs">
                      <CheckCircle2 size={13} /> Target Achieved ✓
                    </span>
                  ) : (
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">Need</span>
                        <span className="text-purple-400 font-extrabold text-sm font-mono">{req.requiredAvgPct}%</span>
                        <span className="text-zinc-400">on remaining</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-500">Probability:</span>
                        <Badge
                          tone={
                            probability === "High"
                              ? "success"
                              : probability === "Moderate"
                              ? "warning"
                              : "danger"
                          }
                          className="text-[10px]"
                        >
                          {probability}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {isAtRisk && !isAchieved && (
                    <Badge tone="danger" className="text-[10px] flex items-center gap-1">
                      <AlertTriangle size={11} /> At Risk
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={addSubjectModalOpen}
        onClose={() => {
          setAddSubjectModalOpen(false);
          loadCurrentData();
        }}
      />
    </div>
  );
}
