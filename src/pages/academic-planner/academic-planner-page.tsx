import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Calculator,
  Layers,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
  Award,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { SubjectService } from "@/services/subject-service";
import {
  DashboardService,
  type DashboardSummary,
} from "@/services/dashboard-service";
import type { Subject } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import {
  calculateHierarchicalRequiredMarks,
  subjectCurrentPct,
} from "@/utils/grading-engine";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "sonner";

export type GoalMode = "cgpa" | "sgpa" | "maintain" | "honors";

export function AcademicPlannerPage() {
  return (
    <ErrorBoundary fallbackTitle="Academic Planner Component Error">
      <AcademicPlannerContent />
    </ErrorBoundary>
  );
}

function AcademicPlannerContent() {
  const { user, updateProfile } = useAuth();
  const setStoreTargetCgpa = useAcademicStore((state) => state.setTargetCgpa);

  const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
  const initialTargetCgpa =
    typeof user?.targetCgpa === "number"
      ? user.targetCgpa
      : scale === "4.0"
        ? 3.6
        : 9.0;

  const [goalMode, setGoalMode] = useState<GoalMode>("cgpa");
  const [targetVal, setTargetVal] = useState<number>(initialTargetCgpa);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(
    new Set(),
  );

  // Section Collapsible States
  const [sec1Open, setSec1Open] = useState(true);
  const [sec2Open, setSec2Open] = useState(true);
  const [sec3Open, setSec3Open] = useState(true);
  const [sec4Open, setSec4Open] = useState(true);

  // Sync state if user profile target updates remotely
  useEffect(() => {
    if (typeof user?.targetCgpa === "number") {
      setTargetVal(user.targetCgpa);
    }
  }, [user?.targetCgpa]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [curSubjects, dash] = await Promise.all([
        SubjectService.getCurrentSubjects(),
        DashboardService.getDashboardSummary(),
      ]);
      const validSubjects = Array.isArray(curSubjects) ? curSubjects : [];
      setSubjects(validSubjects);
      setDashboardData(dash || null);

      if (validSubjects.length > 0) {
        setExpandedSubjectIds(
          new Set(validSubjects.map((s) => s.id || s._id || "")),
        );
      }
    } catch (err) {
      console.error("Failed to load academic planner data:", err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("academic-data-updated", handleUpdate);
    return () =>
      window.removeEventListener("academic-data-updated", handleUpdate);
  }, []);

  // Section 2: Current Position Metrics
  const currentCgpa = dashboardData?.cgpa ?? 0;
  const completedCredits = dashboardData?.completedCredits ?? 0;
  const currentSemesterCredits = useMemo(() => {
    const validSubs = Array.isArray(subjects) ? subjects : [];
    return validSubs.reduce((sum, s) => sum + (s?.credits || 3), 0);
  }, [subjects]);

  const assessmentCounts = useMemo(() => {
    let completed = 0;
    let remaining = 0;
    const validSubs = Array.isArray(subjects) ? subjects : [];

    validSubs.forEach((subj) => {
      if (!subj) return;
      const scheme = subj.scheme;
      const marks = subj.marks || {};
      if (scheme?.components && Array.isArray(scheme.components)) {
        scheme.components.forEach((c: any) => {
          (c?.assessments || []).forEach((ast: any) => {
            const val = marks[ast?.id];
            if (
              val !== undefined &&
              val !== null &&
              (val as any) !== "" &&
              !isNaN(Number(val))
            ) {
              completed++;
            } else {
              remaining++;
            }
          });
        });
      } else if (
        scheme?.assessmentTypes &&
        Array.isArray(scheme.assessmentTypes)
      ) {
        scheme.assessmentTypes.forEach((t: any) => {
          const val = marks[t?.id];
          if (
            val !== undefined &&
            val !== null &&
            (val as any) !== "" &&
            !isNaN(Number(val))
          ) {
            completed++;
          } else {
            remaining++;
          }
        });
      } else {
        remaining += 3;
      }
    });
    return { completed, remaining };
  }, [subjects]);

  // Handle Goal Mode Switches
  useEffect(() => {
    if (goalMode === "maintain") {
      setTargetVal(currentCgpa > 0 ? currentCgpa : scale === "4.0" ? 3.5 : 8.5);
    } else if (goalMode === "honors") {
      setTargetVal(scale === "4.0" ? 3.8 : 9.5);
    }
  }, [goalMode, currentCgpa, scale]);

  // Save Target to Profile
  const handleSaveTarget = async (newVal: number) => {
    setTargetVal(newVal);
    if (typeof setStoreTargetCgpa === "function") {
      setStoreTargetCgpa(newVal);
    }
    try {
      if (typeof updateProfile === "function") {
        await updateProfile({ targetCgpa: newVal });
      }
      toast.success(`Target CGPA updated to ${newVal.toFixed(2)}`, {
        id: "target-update-toast",
      });
    } catch {
      // Ignore sync error
    }
  };

  // Target Required SGPA Calculation
  const targetRequiredSgpa = useMemo(() => {
    if (goalMode === "sgpa") return targetVal;
    if (currentSemesterCredits === 0) return 0;
    if (completedCredits === 0) return targetVal;

    const totalTargetPoints =
      targetVal * (completedCredits + currentSemesterCredits);
    const completedPoints = currentCgpa * completedCredits;
    const requiredPointsInCurrentSem = totalTargetPoints - completedPoints;
    const reqSgpa = requiredPointsInCurrentSem / currentSemesterCredits;
    return Math.max(0, parseFloat(reqSgpa.toFixed(2)));
  }, [
    goalMode,
    targetVal,
    currentSemesterCredits,
    completedCredits,
    currentCgpa,
  ]);

  // Convert Required SGPA to Target Subject Percentage
  const targetSubjectPct = useMemo(() => {
    if (scale === "4.0")
      return Math.min(100, Math.round(targetRequiredSgpa * 25));
    return Math.min(100, Math.round(targetRequiredSgpa * 10));
  }, [targetRequiredSgpa, scale]);

  // Per-Subject Hierarchical Calculations
  const subjectPlanningData = useMemo(() => {
    const validSubs = Array.isArray(subjects) ? subjects : [];
    return validSubs.map((subj) => {
      const plan = calculateHierarchicalRequiredMarks(subj, targetSubjectPct);
      const currentPct = subjectCurrentPct(subj);
      return {
        subject: subj,
        plan,
        currentPct:
          typeof currentPct === "number" && !isNaN(currentPct) ? currentPct : 0,
      };
    });
  }, [subjects, targetSubjectPct]);

  // Max Achievable SGPA and CGPA
  const maxPossibleMetrics = useMemo(() => {
    const validSubs = Array.isArray(subjects) ? subjects : [];
    if (!validSubs.length)
      return {
        maxSgpa: scale === "4.0" ? 4.0 : 10.0,
        maxCgpa: scale === "4.0" ? 4.0 : 10.0,
      };
    let totalMaxWeightedPct = 0;
    let totalCredits = 0;

    subjectPlanningData.forEach(({ subject, plan }) => {
      const credits = subject?.credits || 3;
      totalCredits += credits;
      totalMaxWeightedPct += (plan?.maxPossiblePct || 0) * credits;
    });

    const maxSemPct = totalCredits > 0 ? totalMaxWeightedPct / totalCredits : 0;
    const maxSgpa =
      scale === "4.0"
        ? Math.min(4.0, maxSemPct / 25)
        : Math.min(10.0, maxSemPct / 10);
    const maxSgpaClamped = Number(maxSgpa.toFixed(2));

    let maxCgpaClamped = maxSgpaClamped;
    if (completedCredits > 0) {
      const totalPoints =
        currentCgpa * completedCredits +
        maxSgpaClamped * currentSemesterCredits;
      maxCgpaClamped = Number(
        (totalPoints / (completedCredits + currentSemesterCredits)).toFixed(2),
      );
    }

    return { maxSgpa: maxSgpaClamped, maxCgpa: maxCgpaClamped };
  }, [
    subjectPlanningData,
    subjects,
    scale,
    completedCredits,
    currentCgpa,
    currentSemesterCredits,
  ]);

  // Check Feasibility & Shortfall
  const feasibilityStatus = useMemo(() => {
    if (targetVal > maxPossibleMetrics.maxCgpa && goalMode === "cgpa") {
      return "unattainable";
    }
    if (targetRequiredSgpa > maxPossibleMetrics.maxSgpa) {
      return "unattainable";
    }
    if (targetRequiredSgpa > (scale === "4.0" ? 4.0 : 10.0)) {
      return "unattainable";
    }
    if (targetRequiredSgpa > (scale === "4.0" ? 3.7 : 9.0)) {
      return "high_effort";
    }
    if (targetRequiredSgpa > (scale === "4.0" ? 3.2 : 8.0)) {
      return "moderate";
    }
    return "achievable";
  }, [
    targetVal,
    maxPossibleMetrics.maxCgpa,
    maxPossibleMetrics.maxSgpa,
    goalMode,
    targetRequiredSgpa,
    scale,
  ]);

  // Aggregate Shortfall Assessments
  const allShortfallAssessments = useMemo(() => {
    const list: Array<{
      subjectName: string;
      name: string;
      mark: number;
      maxMarks: number;
    }> = [];
    subjectPlanningData.forEach(({ subject, plan }) => {
      (plan?.shortfallAssessments || []).forEach((ast) => {
        list.push({
          subjectName: subject?.name || "Subject",
          name: ast.name,
          mark: ast.mark,
          maxMarks: ast.maxMarks,
        });
      });
    });
    return list;
  }, [subjectPlanningData]);

  // Live Mark Entry Update
  const handleMarkChange = (
    subjectId: string,
    assessmentId: string,
    value: string,
  ) => {
    const val = value.trim() === "" ? null : Number(value);
    setSubjects((prev) =>
      prev.map((s) => {
        const sId = s.id || s._id || "";
        if (sId !== subjectId) return s;
        const newMarks = { ...(s.marks || {}) };
        if (val === null || isNaN(val)) {
          delete newMarks[assessmentId];
        } else {
          newMarks[assessmentId] = val;
        }
        const updated = { ...s, marks: newMarks };
        if (sId) {
          SubjectService.updateMarks(sId, newMarks).catch((err) =>
            console.error("Failed live mark save:", err),
          );
        }
        return updated;
      }),
    );
  };

  const toggleSubjectExpand = (id: string) => {
    setExpandedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Title & Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Target size={16} /> Central Academic Decision Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Set your target, track live position, and calculate exact required
            scores for every remaining assessment
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center text-xs text-zinc-400 animate-pulse border-dashed">
          Loading academic planner data and hierarchical evaluation schemes...
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Section 1: Academic Goal Selection */}
          <Card className="border border-slate-200 bg-white dark:border-purple-500/30 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm overflow-hidden transition-all">
            <div
              onClick={() => setSec1Open(!sec1Open)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Section 1: Academic Goal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Choose how you want to define your target for this term
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!sec1Open && (
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1 rounded-full">
                    Target: {targetVal.toFixed(2)} {goalMode.toUpperCase()}
                  </span>
                )}
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-transform"
                >
                  <motion.div
                    animate={{ rotate: sec1Open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {sec1Open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-200 dark:border-white/10 p-6 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Target Definition Mode
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Select a mode to set your GPA targets automatically
                      </p>
                    </div>

                    {/* Goal Mode Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-zinc-950/80 p-1.5 border border-slate-200 dark:border-white/10">
                      <button
                        onClick={() => setGoalMode("cgpa")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          goalMode === "cgpa"
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Target CGPA
                      </button>
                      <button
                        onClick={() => setGoalMode("sgpa")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          goalMode === "sgpa"
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Target SGPA
                      </button>
                      <button
                        onClick={() => setGoalMode("maintain")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          goalMode === "maintain"
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Maintain Current
                      </button>
                      <button
                        onClick={() => setGoalMode("honors")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          goalMode === "honors"
                            ? "bg-amber-600 text-white shadow-md"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Award size={13} /> Honors Track
                      </button>
                    </div>
                  </div>

                  {/* Target Slider & Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2 border-t border-slate-200 dark:border-white/10">
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 dark:text-zinc-300 font-semibold uppercase tracking-wider">
                          {goalMode === "sgpa"
                            ? "Target Semester SGPA Target"
                            : "Cumulative Target CGPA Target"}
                        </span>
                        <span className="font-mono text-purple-400 font-extrabold text-lg">
                          {targetVal.toFixed(2)} /{" "}
                          {scale === "4.0" ? "4.0" : "10.0"}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={scale === "4.0" ? "2.0" : "5.0"}
                        max={scale === "4.0" ? "4.0" : "10.0"}
                        step="0.05"
                        value={targetVal}
                        onChange={(e) =>
                          handleSaveTarget(parseFloat(e.target.value))
                        }
                        className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>
                          {scale === "4.0" ? "2.00 (Pass)" : "5.00 (Pass)"}
                        </span>
                        <span>
                          {scale === "4.0"
                            ? "3.50 (First Class)"
                            : "8.50 (First Class)"}
                        </span>
                        <span>
                          {scale === "4.0" ? "4.00 (Max)" : "10.00 (Max)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                      <span className="text-[11px] text-zinc-400 uppercase font-bold">
                        Quick Target Input
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={scale === "4.0" ? 4 : 10}
                          step="0.01"
                          value={targetVal}
                          onChange={(e) =>
                            handleSaveTarget(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:border-purple-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveTarget(targetVal)}
                          className="shrink-0 gap-1 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 border-transparent"
                        >
                          <Save size={14} /> Sync
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Section 2: Course & Assessment Configuration */}
          <Card className="border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950/80 shadow-sm overflow-hidden transition-all">
            <div
              onClick={() => setSec2Open(!sec2Open)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Section 2: Course & Assessment Configuration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Current academic standing, enrolled subjects, and assessment progress
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!sec2Open && (
                  <div className="flex items-center gap-2">
                    <Badge tone="accent" className="font-mono text-xs">
                      {subjects.length} Subjects
                    </Badge>
                    <Badge tone="blue" className="font-mono text-xs">
                      {currentSemesterCredits} Credits Assigned
                    </Badge>
                    <Badge tone="success" className="font-mono text-xs">
                      {assessmentCounts.completed} Graded
                    </Badge>
                  </div>
                )}
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-transform"
                >
                  <motion.div
                    animate={{ rotate: sec2Open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {sec2Open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-200 dark:border-white/10 p-5"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Current CGPA
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white text-xl font-mono mt-1">
                        {currentCgpa > 0 ? currentCgpa.toFixed(2) : "—"}
                      </p>
                      <span className="text-[11px] text-purple-400 font-medium">
                        Completed Terms
                      </span>
                    </Card>

                    <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Completed Credits
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white text-xl font-mono mt-1">
                        {completedCredits}
                      </p>
                      <span className="text-[11px] text-zinc-400">Past Semesters</span>
                    </Card>

                    <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-purple-500/30 bg-purple-500/5">
                      <span className="text-[10px] text-purple-600 dark:text-purple-300 uppercase font-bold tracking-wider">
                        Current Sem Credits
                      </span>
                      <p className="font-extrabold text-purple-400 text-xl font-mono mt-1">
                        {currentSemesterCredits}
                      </p>
                      <span className="text-[11px] text-purple-600 dark:text-purple-300 font-medium">
                        {subjects.length} Active Courses
                      </span>
                    </Card>

                    <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Graded Assessments
                      </span>
                      <p className="font-extrabold text-emerald-400 text-xl font-mono mt-1">
                        {assessmentCounts.completed}
                      </p>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Marks Entered
                      </span>
                    </Card>

                    <Card className="p-4 bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-white/10 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Remaining Ungraded
                      </span>
                      <p className="font-extrabold text-amber-400 text-xl font-mono mt-1">
                        {assessmentCounts.remaining}
                      </p>
                      <span className="text-[11px] text-amber-400 font-medium">
                        To Be Scored
                      </span>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Section 3: Target Calculation & Feasibility Banner */}
          <Card
            className={`border shadow-sm overflow-hidden transition-all ${
              feasibilityStatus === "unattainable"
                ? "border-rose-200 bg-rose-50/60 dark:border-rose-500/40 dark:bg-gradient-to-r dark:from-rose-950/40 dark:via-zinc-900 dark:to-rose-950/20"
                : "border-slate-200 bg-white dark:border-purple-500/40 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-zinc-900 dark:to-blue-950/30"
            }`}
          >
            <div
              onClick={() => setSec3Open(!sec3Open)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/60 transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Section 3: Target Feasibility Analysis
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Real-time mathematical evaluation of target achievability and required SGPA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!sec3Open && (
                  <div className="flex items-center gap-2">
                    {feasibilityStatus === "unattainable" ? (
                      <Badge
                        tone="warning"
                        className="bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold text-xs"
                      >
                        Status: Impossible
                      </Badge>
                    ) : feasibilityStatus === "high_effort" ? (
                      <Badge
                        tone="accent"
                        className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold text-xs"
                      >
                        Status: High Effort
                      </Badge>
                    ) : (
                      <Badge
                        tone="accent"
                        className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold text-xs"
                      >
                        Status: Achievable
                      </Badge>
                    )}
                    <span className="text-xs font-mono font-bold text-purple-400">
                      Req SGPA: {targetRequiredSgpa.toFixed(2)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-transform"
                >
                  <motion.div
                    animate={{ rotate: sec3Open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {sec3Open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-200 dark:border-white/10 p-6"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Target Achievability Status
                        </h3>
                        {feasibilityStatus === "unattainable" ? (
                          <Badge
                            tone="warning"
                            className="bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold px-3 py-1"
                          >
                            <ShieldAlert size={14} className="mr-1 inline" /> Target
                            No Longer Achievable
                          </Badge>
                        ) : feasibilityStatus === "high_effort" ? (
                          <Badge
                            tone="accent"
                            className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold px-3 py-1"
                          >
                            High Effort Stretch Target
                          </Badge>
                        ) : (
                          <Badge
                            tone="accent"
                            className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold px-3 py-1"
                          >
                            Target Fully Achievable
                          </Badge>
                        )}
                      </div>

                      {feasibilityStatus === "unattainable" ? (
                        <div className="space-y-2 text-xs text-rose-200 mt-1">
                          <p>
                            Based on marks already obtained in completed assessments,
                            achieving your target of{" "}
                            <strong>{targetVal.toFixed(2)} CGPA</strong> is
                            mathematically impossible.
                          </p>
                          {allShortfallAssessments.length > 0 && (
                            <div className="p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-rose-500/30">
                              <span className="font-bold text-rose-300 block mb-1">
                                Assessments contributing to shortfall:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                                {allShortfallAssessments
                                  .slice(0, 3)
                                  .map((item, idx) => (
                                    <li key={idx}>
                                      {item.subjectName}: {item.name} ({item.mark} /{" "}
                                      {item.maxMarks})
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 dark:text-zinc-300">
                          To reach your target CGPA of{" "}
                          <strong>{targetVal.toFixed(2)}</strong>, you need a semester
                          SGPA of <strong>{targetRequiredSgpa.toFixed(2)}</strong>{" "}
                          across your active subjects.
                        </p>
                      )}
                    </div>

                    {/* Required SGPA & Max Achievable Metrics */}
                    <div className="flex flex-wrap items-center gap-4 shrink-0 font-mono">
                      <div className="p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-white/10 text-center min-w-[120px]">
                        <span className="text-[10px] text-zinc-400 font-sans font-bold block uppercase">
                          Required SGPA
                        </span>
                        <span
                          className={`text-xl font-extrabold ${targetRequiredSgpa > (scale === "4.0" ? 4 : 10) ? "text-rose-400" : "text-purple-400"}`}
                        >
                          {targetRequiredSgpa.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-white/10 text-center min-w-[120px]">
                        <span className="text-[10px] text-zinc-400 font-sans font-bold block uppercase">
                          Max Possible SGPA
                        </span>
                        <span className="text-xl font-extrabold text-emerald-400">
                          {maxPossibleMetrics.maxSgpa.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-white/10 text-center min-w-[120px]">
                        <span className="text-[10px] text-zinc-400 font-sans font-bold block uppercase">
                          Max Possible CGPA
                        </span>
                        <span className="text-xl font-extrabold text-emerald-400">
                          {maxPossibleMetrics.maxCgpa.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Section 4: Dynamic Assessment Planner (Core Feature) */}
          <Card className="border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950/80 shadow-sm overflow-hidden transition-all">
            <div
              onClick={() => setSec4Open(!sec4Open)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Section 4: Dynamic Assessment Planner
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Hierarchical evaluation scheme breakdown. Enter actual or test marks to see required scores update live.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!sec4Open && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge tone="accent" className="font-mono text-xs">
                      {subjects.length} Courses
                    </Badge>
                    <Badge tone="success" className="font-mono text-xs">
                      {assessmentCounts.completed} Completed
                    </Badge>
                    <Badge tone="warning" className="font-mono text-xs">
                      {assessmentCounts.remaining} Remaining
                    </Badge>
                  </div>
                )}
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-transform"
                >
                  <motion.div
                    animate={{ rotate: sec4Open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {sec4Open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-200 dark:border-white/10 p-6 space-y-6"
                >
                  {subjects.length === 0 ? (
                    <Card className="p-12 text-center bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        No current semester subjects found.
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto">
                        Add active semester subjects in the Subjects tab to start
                        planning assessment scores.
                      </p>
                    </Card>
                  ) : (
                    subjectPlanningData.map(({ subject, plan, currentPct }) => {
                      if (!subject) return null;
                      const subjId = subject.id || subject._id || "";
                      const isExpanded = expandedSubjectIds.has(subjId);

                      return (
                        <Card
                          key={subjId}
                          className="border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950/80 overflow-hidden shadow-xl"
                        >
                          {/* Subject Header */}
                          <div
                            onClick={() => toggleSubjectExpand(subjId)}
                            className="p-5 bg-white/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-white/10 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/80 dark:bg-zinc-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold border border-purple-500/30">
                                <BookOpen size={20} />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                  {subject.name || "Untitled Course"}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                  {subject.code || "Course"} • {subject.credits || 3}{" "}
                                  Credits • Current Score:{" "}
                                  <strong className="text-purple-600 dark:text-purple-300 font-mono">
                                    {currentPct.toFixed(1)}%
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {plan?.isAchieved ? (
                                <Badge
                                  tone="accent"
                                  className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold"
                                >
                                  Target Met ({currentPct.toFixed(1)}%)
                                </Badge>
                              ) : !plan?.possible ? (
                                <Badge
                                  tone="warning"
                                  className="bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold"
                                >
                                  Max Achievable: {plan?.maxPossiblePct || 0}%
                                </Badge>
                              ) : (
                                <Badge
                                  tone="accent"
                                  className="bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30 font-bold"
                                >
                                  Req Avg: {plan?.requiredAvgPct || 0}%
                                </Badge>
                              )}

                              <button className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 p-1 rounded-lg">
                                {isExpanded ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Hierarchical Components & Assessments List */}
                          {isExpanded && (
                            <CardContent className="p-5 space-y-6 bg-slate-50 dark:bg-zinc-950/60">
                              {(plan?.components || []).map((comp) => (
                                <div
                                  key={comp.id}
                                  className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/50 p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-white/10 pb-2">
                                    <span className="font-extrabold text-purple-600 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <Layers size={14} /> {comp.name} (
                                      {comp.weightPct}% Weight)
                                    </span>
                                    <span className="text-[11px] text-zinc-400 font-mono capitalize">
                                      Rule:{" "}
                                      <strong>
                                        {(comp?.rule || "average").replace("_", " ")}
                                      </strong>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {(comp?.assessments || []).map((ast) => (
                                      <div
                                        key={ast.id}
                                        className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                                          ast.isGraded
                                            ? "border-emerald-500/30 bg-emerald-500/5"
                                            : ast.effortLevel === "Unattainable"
                                              ? "border-rose-500/30 bg-rose-500/5"
                                              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/80"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                                            {ast.name}
                                          </span>
                                          {ast.isGraded ? (
                                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                              <CheckCircle2 size={12} /> Graded
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-amber-400">
                                              Remaining (Max {ast.maxMarks})
                                            </span>
                                          )}
                                        </div>

                                        {/* Mark Entry Input or Required Score Indicator */}
                                        <div className="flex items-center justify-between gap-3 pt-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 dark:text-zinc-400">
                                              Mark:
                                            </span>
                                            <input
                                              type="number"
                                              min={0}
                                              max={ast.maxMarks}
                                              placeholder="—"
                                              value={
                                                ast.enteredMark !== null
                                                  ? ast.enteredMark
                                                  : ""
                                              }
                                              onChange={(e) =>
                                                handleMarkChange(
                                                  subjId,
                                                  ast.id,
                                                  e.target.value,
                                                )
                                              }
                                              className="w-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/20 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500"
                                            />
                                            <span className="text-xs text-zinc-500 font-mono">
                                              / {ast.maxMarks}
                                            </span>
                                          </div>

                                          {!ast.isGraded && (
                                            <div className="text-right font-mono">
                                              <span className="text-[10px] text-zinc-400 block font-sans">
                                                Required Score:
                                              </span>
                                              {ast.effortLevel === "Unattainable" ? (
                                                <span className="text-xs font-bold text-rose-400">
                                                  Unattainable
                                                </span>
                                              ) : (
                                                <span className="text-sm font-extrabold text-purple-400">
                                                  {ast.clampedRequiredMark} /{" "}
                                                  {ast.maxMarks} ({ast.requiredPct}%)
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Visual Effort Progress Bar for Remaining Assessment */}
                                        {!ast.isGraded && (
                                          <div className="space-y-1 pt-1">
                                            <div className="h-1.5 w-full bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                  ast.effortLevel === "Unattainable"
                                                    ? "bg-rose-500"
                                                    : ast.effortLevel === "High"
                                                      ? "bg-purple-500"
                                                      : ast.effortLevel === "Moderate"
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-500"
                                                }`}
                                                style={{
                                                  width: `${Math.min(100, ast.requiredPct)}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      )}
    </div>
  );
}
