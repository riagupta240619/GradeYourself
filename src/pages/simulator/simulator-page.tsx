import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/shared/count-up";
import {
  subjectCurrentPct,
  pctToLetter,
  normalizeScheme,
  calculateHierarchicalRequiredMarks,
  evaluateComponentScore,
} from "@/utils/grading-engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link, useSearchParams } from "react-router-dom";
import {
  Wand2,
  Plus,
  Sparkles,
  BookmarkCheck,
  Target,
  Calculator,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Layers,
  Sliders,
  Check,
  Info,
  HelpCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { EditSchemeModal } from "@/components/subjects/edit-scheme-modal";
import { toast } from "sonner";

export function SimulatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(searchParams.get("subjectId"));
  const [editSchemeModalOpen, setEditSchemeModalOpen] = useState(false);

  // Simulator Mode: "target" (Goal-Seeker) or "what-if" (Score Slider)
  const [simMode, setSimMode] = useState<"target" | "what-if">("target");

  // Target Mode State
  const [targetGrade, setTargetGrade] = useState<string>("O");
  const [targetPct, setTargetPct] = useState<number>(80);
  const [oGradeThreshold, setOGradeThreshold] = useState<number>(80); // Default to 80% user target for O grade

  // Target Mode - Interactive "What If I Get..." Quick Tester
  const [interactiveTestMark, setInteractiveTestMark] = useState<number | null>(null);

  // What-If Mode State
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [simulatedMarks, setSimulatedMarks] = useState<number>(0);
  const [scenarios, setScenarios] = useState<{ id: string; label: string; pct: number; grade: string }[]>([]);

  const fetchSubjects = async () => {
    try {
      const data = await SubjectService.getCurrentSubjects();
      const list = Array.isArray(data) && data.length > 0 ? data : [];
      setSubjects(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch subjects for simulator:", err);
      setSubjects([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects().then((list) => {
      if (list && list.length > 0) {
        const paramId = searchParams.get("subjectId");
        const found = list.find((s) => s.id === paramId || s._id === paramId);
        const activeId = found ? (found.id || found._id || "") : (list[0].id || list[0]._id || "");
        setSubjectId(activeId);
      }
    });
  }, [searchParams]);

  // Selected subject
  const subject = useMemo(() => {
    if (!subjectId) return subjects[0] || null;
    return subjects.find((s) => s.id === subjectId || s._id === subjectId) || subjects[0] || null;
  }, [subjects, subjectId]);

  // Normalized scheme components
  const normScheme = useMemo(() => {
    if (!subject) return { components: [] };
    return normalizeScheme(subject.scheme);
  }, [subject]);

  // Flattened assessments list with component context
  const assessmentList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      maxMarks: number;
      compName: string;
      weightPct: number;
      isGraded: boolean;
      enteredMark: number | null;
    }> = [];

    const marks = subject?.marks || {};

    normScheme.components.forEach((comp) => {
      (comp.assessments || []).forEach((ast) => {
        const raw = marks[ast.id];
        const isGraded = raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw));
        list.push({
          id: ast.id,
          name: ast.name,
          maxMarks: ast.maxMarks,
          compName: comp.name,
          weightPct: comp.weightPct,
          isGraded,
          enteredMark: isGraded ? Number(raw) : null,
        });
      });
    });

    return list;
  }, [normScheme, subject]);

  // Find remaining (ungraded) assessments; default target assessment is the End Term / last assessment
  const remainingAssessments = useMemo(() => {
    return assessmentList.filter((a) => !a.isGraded);
  }, [assessmentList]);

  // Target assessment being simulated (e.g. End Term / Personal Interview)
  const targetAssessment = useMemo(() => {
    if (selectedAssessmentId) {
      const found = assessmentList.find((a) => a.id === selectedAssessmentId);
      if (found) return found;
    }
    // Default to last remaining assessment or last assessment overall
    if (remainingAssessments.length > 0) {
      return remainingAssessments[remainingAssessments.length - 1];
    }
    return assessmentList[assessmentList.length - 1] || null;
  }, [assessmentList, remainingAssessments, selectedAssessmentId]);

  // Set default slider values when targetAssessment changes
  useEffect(() => {
    if (targetAssessment) {
      setSelectedAssessmentId(targetAssessment.id);
      if (targetAssessment.enteredMark !== null) {
        setSimulatedMarks(targetAssessment.enteredMark);
      } else {
        setSimulatedMarks(Math.round(targetAssessment.maxMarks * 0.75));
      }
    }
  }, [targetAssessment?.id]);

  // Current performance percentage in evaluated components
  const currentPct = useMemo(() => {
    if (!subject) return 0;
    return subjectCurrentPct(subject);
  }, [subject]);

  // Goal-Seeker calculations for target grade
  const targetPlan = useMemo(() => {
    if (!subject) return null;
    return calculateHierarchicalRequiredMarks(subject, targetPct);
  }, [subject, targetPct]);

  // Required mark for the target assessment specifically
  const targetAssessmentReq = useMemo(() => {
    if (!targetPlan || !targetAssessment) return null;
    for (const comp of targetPlan.components) {
      const ast = comp.assessments.find((a) => a.id === targetAssessment.id);
      if (ast) return ast;
    }
    return null;
  }, [targetPlan, targetAssessment]);

  // Sync interactive test mark to required mark when target changes
  useEffect(() => {
    if (targetAssessmentReq && targetAssessmentReq.clampedRequiredMark !== null) {
      setInteractiveTestMark(targetAssessmentReq.clampedRequiredMark);
    } else if (targetAssessment) {
      setInteractiveTestMark(Math.round(targetAssessment.maxMarks * 0.75));
    }
  }, [targetAssessmentReq?.clampedRequiredMark, targetAssessment?.id]);

  // Forward What-If Simulated Percentage (Full What-If Mode)
  const simulatedPct = useMemo(() => {
    if (!subject || !targetAssessment) return 0;
    const testMarks = {
      ...(subject.marks || {}),
      [targetAssessment.id]: simulatedMarks,
    };
    const scenarioSubject = { ...subject, marks: testMarks };
    return subjectCurrentPct(scenarioSubject);
  }, [subject, targetAssessment, simulatedMarks]);

  // Forward Quick Tester Percentage (in Target Mode)
  const quickTestPct = useMemo(() => {
    if (!subject || !targetAssessment || interactiveTestMark === null) return 0;
    const testMarks = {
      ...(subject.marks || {}),
      [targetAssessment.id]: interactiveTestMark,
    };
    const scenarioSubject = { ...subject, marks: testMarks };
    return subjectCurrentPct(scenarioSubject);
  }, [subject, targetAssessment, interactiveTestMark]);

  const delta = simulatedPct - currentPct;

  // Grade helper based on O threshold
  const getLetterGrade = (p: number) => {
    return pctToLetter(p, oGradeThreshold);
  };

  // Quick target grade presets
  const handleSelectPreset = (grade: string, pct: number) => {
    setTargetGrade(grade);
    setTargetPct(pct);
    if (grade === "O" && pct <= 85) {
      setOGradeThreshold(pct);
    }
  };

  const handleSelectSubject = (id: string) => {
    setSubjectId(id);
    setSearchParams({ subjectId: id });
  };

  function saveScenario() {
    if (!targetAssessment || !subject) return;
    const label = `${subject.name} — ${targetAssessment.name}: ${simulatedMarks}/${targetAssessment.maxMarks} Marks`;
    const finalGrade = getLetterGrade(simulatedPct);
    setScenarios((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        pct: simulatedPct,
        grade: finalGrade,
      },
    ]);
    toast.success("Simulation scenario saved!");
  }

  if (loading) {
    return (
      <div className="flex max-w-6xl mx-auto flex-col gap-6 py-6 px-3">
        <h1 className="text-2xl font-bold tracking-tight">Grade Simulator</h1>
        <Card className="p-16 text-center text-xs text-slate-500 dark:text-zinc-400 animate-pulse border-dashed">
          Loading subjects and hierarchical schemes...
        </Card>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex max-w-6xl mx-auto flex-col gap-6 py-6 px-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
            <Wand2 size={13} className="text-purple-400" /> Grade Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Grade Simulator
          </h1>
        </div>
        <Card className="p-12 text-center border-slate-200 dark:border-white/10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <BookOpen size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Active Subjects Found</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5 max-w-md mx-auto">
            Add active semester courses in the Subjects tab to run target score and what-if grade simulations.
          </p>
          <Link to="/app/subjects" className="mx-auto flex w-fit items-center gap-1.5">
            <Button variant="primary" size="sm">
              <Plus size={14} /> Add Active Subjects
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Visual math values for the journey progress bar
  const earnedContribution = targetPlan?.earnedContribution ?? 0;
  const neededContribution = Math.max(0, targetPct - earnedContribution);
  const remainingWeight = targetPlan?.remainingWeight ?? 0;
  const earnedProgressPct = Math.min(100, earnedContribution);
  const neededProgressPct = Math.min(100 - earnedProgressPct, neededContribution);

  // Completed component details for clear human-readable explanations
  const completedComponents = normScheme.components
    .map((c) => {
      const res = evaluateComponentScore(c, subject.marks || {});
      return { ...c, evalRes: res };
    })
    .filter((c) => c.evalRes.hasEntered);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20 px-2 sm:px-4">
      {/* ── 1. Page Header & Mode Switcher ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5 pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Wand2 size={13} className="text-purple-400" /> Grade Simulation Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Grade &amp; End-Term Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            See exactly how many marks you need in your End Term to secure your desired grade, or simulate hypothetical scores.
          </p>
        </div>

        {/* Interactive Mode Switcher with responsive full-width on mobile */}
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shrink-0 w-full sm:w-auto shadow-inner">
          <button
            onClick={() => setSimMode("target")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              simMode === "target"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Target size={15} />
            <span>Target Goal-Seeker</span>
          </button>
          <button
            onClick={() => setSimMode("what-if")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              simMode === "what-if"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders size={15} />
            <span>What-If Score Slider</span>
          </button>
        </div>
      </div>

      {/* ── 2. Course Selection Carousel ──────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <BookOpen size={13} /> Select Enrolled Course
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
            {subjects.length} Course{subjects.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
          {subjects.map((s) => {
            const sId = s.id || s._id || "";
            const active = sId === (subject.id || subject._id);
            return (
              <button
                key={sId}
                onClick={() => handleSelectSubject(sId)}
                className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all shrink-0 select-none ${
                  active
                    ? "border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-600/25 scale-[1.02]"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-sm shrink-0"
                  style={{ backgroundColor: active ? "#ffffff" : s.colorTag || "#8b5cf6" }}
                />
                <span className="truncate max-w-[160px]">{s.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {s.credits || 3}C
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Active Course Snapshot & Schema Control Bar ─────────────────── */}
      <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/90 shadow-sm overflow-hidden rounded-2xl">
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-300 font-black text-base">
              {subject.name ? subject.name.slice(0, 3).toUpperCase() : "SUB"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  {subject.name}
                </h2>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 shrink-0">
                  {subject.code || "Course"} • {subject.credits || 3} Credits
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                <span>
                  Evaluated Standing:{" "}
                  <strong className="text-purple-600 dark:text-purple-400 font-mono text-xs sm:text-sm">
                    {currentPct.toFixed(1)}%
                  </strong>{" "}
                  <span className="text-[11px] font-bold text-slate-400">({getLetterGrade(currentPct)} pace)</span>
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">•</span>
                <span>
                  Secured Contribution:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs sm:text-sm">
                    {earnedContribution.toFixed(1)}%
                  </strong>{" "}
                  of 100% course total
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar: Simulating Picker + Edit Scheme Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/15 px-3 py-1.5 rounded-xl text-xs flex-1 sm:flex-initial">
              <span className="text-slate-500 dark:text-zinc-400 font-bold shrink-0">
                Simulating:
              </span>
              <select
                value={targetAssessment?.id || ""}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {assessmentList.map((a) => (
                  <option key={a.id} value={a.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                    {a.name} (Max {a.maxMarks}) {a.isGraded ? `[Scored: ${a.enteredMark}]` : "[Pending]"}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditSchemeModalOpen(true)}
              className="gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:border-purple-500 hover:bg-purple-500/10 font-bold text-xs rounded-xl py-2 shrink-0"
              title="Edit Assessment Schema, Components and Max Marks"
            >
              <Layers size={14} />
              <span>Edit Scheme</span>
            </Button>
          </div>
        </div>

        {/* ── 4. Visual 3-Step "Grade Pathway" Journey Bar ─────────────────── */}
        <div className="p-5 bg-gradient-to-r from-purple-50/40 via-slate-50/50 to-purple-50/30 dark:from-purple-950/20 dark:via-zinc-900/50 dark:to-purple-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={15} className="text-purple-500" />
              Target Achievement Pathway &rarr; {targetPct}% ({targetGrade} Grade)
            </span>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {earnedContribution.toFixed(1)}% Secured
              </span>
              <span className="text-slate-400">+</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                {neededContribution.toFixed(1)}% Needed
              </span>
              <span className="text-slate-400">=</span>
              <span className="font-black text-slate-900 dark:text-white">
                {targetPct}% Target
              </span>
            </div>
          </div>

          {/* Segmented Visual Bar */}
          <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex p-0.5 shadow-inner">
            <div
              style={{ width: `${earnedProgressPct}%` }}
              className="h-full rounded-l-full bg-emerald-500 transition-all duration-500 relative group"
              title={`Secured: ${earnedContribution.toFixed(1)}%`}
            />
            <div
              style={{ width: `${neededProgressPct}%` }}
              className="h-full bg-purple-500 transition-all duration-500 relative group"
              title={`Needed from End Term: ${neededContribution.toFixed(1)}%`}
            />
          </div>

          {/* 3 Step Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Step 1: Secured */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                1
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 uppercase font-bold tracking-wider block truncate">
                  Secured In Internals
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {earnedContribution.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    of 100%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate font-medium">
                  {completedComponents.length > 0
                    ? `From ${completedComponents[0].name}: ${completedComponents[0].evalRes.entered[0]?.num ?? 29}/${completedComponents[0].evalRes.entered[0]?.maxMarks ?? 30} marks`
                    : "From completed assessments"}
                </span>
              </div>
            </div>

            {/* Step 2: Needed */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border-2 border-purple-500/40 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black text-sm">
                2
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider block truncate">
                  Needed In End Term
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                    +{neededContribution.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold font-mono">
                    ({targetAssessmentReq?.clampedRequiredMark ?? "40.8"} / {targetAssessment?.maxMarks} M)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate font-medium">
                  In {targetAssessment?.name || "End Term"} ({remainingWeight.toFixed(0)}% weight)
                </span>
              </div>
            </div>

            {/* Step 3: Target Grade */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-sm">
                3
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 uppercase font-bold tracking-wider block truncate">
                  Final Standing Goal
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {targetPct}%
                  </span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                    ({targetGrade} Grade)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate font-medium">
                  Max possible: {targetPlan?.maxPossiblePct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5. Main Simulation Area: Responsive 2-Column Layout ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-5 space-y-6">
          {simMode === "target" ? (
            /* Target Mode Controls Card */
            <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/90 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-purple-500" />
                  <CardTitle className="text-base font-extrabold">
                    Set Target Grade
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Select your desired grade benchmark or fine-tune percentage
                </p>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Grade Presets Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quick Grade Benchmarks
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset("O", 80)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        targetPct === 80 && targetGrade === "O"
                          ? "border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                          <Award size={15} /> O Grade
                        </span>
                        {targetPct === 80 && targetGrade === "O" && (
                          <Check size={15} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 block mt-1">
                        &gt; 80% (Custom Target)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset("O", 90)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        targetPct === 90 && targetGrade === "O"
                          ? "border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-purple-600 dark:text-purple-400">
                          O Grade
                        </span>
                        {targetPct === 90 && targetGrade === "O" && (
                          <Check size={15} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 block mt-1">
                        90% (Standard 10-Scale)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset("A+", 75)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        targetPct === 75
                          ? "border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          A+ Grade
                        </span>
                        {targetPct === 75 && (
                          <Check size={15} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 block mt-1">
                        75% (Distinction)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset("A", 70)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        targetPct === 70
                          ? "border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          A Grade
                        </span>
                        {targetPct === 70 && (
                          <Check size={15} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 block mt-1">
                        70% (First Class)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Fine-Tune Target Slider */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">
                      Fine-Tune Target Percentage:
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-lg">
                      {targetPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={1}
                    value={targetPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTargetPct(val);
                      if (val >= oGradeThreshold) setTargetGrade("O");
                      else if (val >= 75) setTargetGrade("A+");
                      else if (val >= 70) setTargetGrade("A");
                      else if (val >= 60) setTargetGrade("B+");
                      else setTargetGrade("B");
                    }}
                    className="w-full h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
                    <span>40% (Pass)</span>
                    <span>70% (A)</span>
                    <span className="text-purple-600 font-black">80% (O)</span>
                    <span>100% (Max)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* What-If Slider Controls Card */
            <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/90 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-purple-500" />
                  <CardTitle className="text-base font-extrabold">
                    Interactive Score Slider
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Simulating: <strong>{targetAssessment?.name || "End Term"}</strong> (Max {targetAssessment?.maxMarks || 100})
                </p>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">
                      Hypothetical Exam Mark:
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-xl">
                      {simulatedMarks} / {targetAssessment?.maxMarks || 100}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={targetAssessment?.maxMarks || 100}
                    value={simulatedMarks}
                    onChange={(e) => setSimulatedMarks(Number(e.target.value))}
                    className="w-full h-3 rounded-lg bg-slate-200 dark:bg-zinc-800 appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
                    <span>0</span>
                    <span>{Math.round((targetAssessment?.maxMarks || 100) * 0.5)} (50%)</span>
                    <span>{Math.round((targetAssessment?.maxMarks || 100) * 0.75)} (75%)</span>
                    <span>{targetAssessment?.maxMarks || 100} (100%)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-zinc-400">Exam Percentage:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {targetAssessment?.maxMarks ? ((simulatedMarks / targetAssessment.maxMarks) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-zinc-400">Weightage in Course:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {targetAssessment?.weightPct}%
                    </span>
                  </div>
                </div>

                <Button className="w-full gap-2 bg-purple-600 text-white hover:bg-purple-700 py-2.5 font-bold" variant="primary" onClick={saveScenario}>
                  <BookmarkCheck size={16} /> Save This Scenario
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Schema Editing Helper Banner */}
          <div className="p-4 rounded-2xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/20 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
              <Layers size={18} />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Need to change the evaluation schema?
              </h4>
              <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
                You can alter Max Marks, split Internals, or adjust component weight percentages anytime directly here.
              </p>
              <button
                type="button"
                onClick={() => setEditSchemeModalOpen(true)}
                className="font-black text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 pt-1.5 text-xs"
              >
                Open Schema Editor <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Key Results Card + Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {simMode === "target" ? (
            /* Target Mode: The Core Result Hero Card */
            <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-white via-purple-50/20 to-white dark:from-zinc-950 dark:via-zinc-900/90 dark:to-purple-950/30 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Result Header with Feasibility Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                      <Award size={15} /> Required End-Term Score Calculation
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {targetAssessment?.name || "End Term Assessment"}
                    </h3>
                  </div>

                  <div>
                    {targetPlan?.isAchieved ? (
                      <Badge tone="accent" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs px-3 py-1 font-bold">
                        <CheckCircle2 size={14} className="mr-1.5 inline" /> Target Already Achieved
                      </Badge>
                    ) : !targetPlan?.possible ? (
                      <Badge tone="warning" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs px-3 py-1 font-bold">
                        <ShieldAlert size={14} className="mr-1.5 inline" /> Unattainable (Max {targetPlan?.maxPossiblePct}%)
                      </Badge>
                    ) : (
                      <Badge tone="accent" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs px-3 py-1 font-bold">
                        <CheckCircle2 size={14} className="mr-1.5 inline" /> Highly Achievable ({targetAssessmentReq?.requiredPct}% Needed)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Big Number Presentation */}
                <div className="rounded-3xl p-6 sm:p-7 bg-purple-500/10 border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">
                      Required Marks to Score:
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-6xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                        {targetAssessmentReq?.clampedRequiredMark ?? "—"}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-500 dark:text-zinc-400 font-mono">
                        / {targetAssessment?.maxMarks} Marks
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 block pt-1">
                      Equals <strong>{targetAssessmentReq?.requiredPct}%</strong> in this specific examination
                    </span>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-purple-500/20 pt-4 sm:pt-0 sm:pl-6 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400 block">
                      Target Outcome
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono block">
                      {targetGrade} Grade
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 block">
                      {targetPct}% Target Percentage
                    </span>
                  </div>
                </div>

                {/* Plain English Takeaway Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 text-xs sm:text-sm space-y-2 leading-relaxed text-slate-700 dark:text-zinc-300">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        Clear Takeaway:
                      </span>{" "}
                      You have already locked in <strong>{earnedContribution.toFixed(1)}%</strong> from your completed assessments. To reach your overall course target of <strong>{targetPct}% ({targetGrade} Grade)</strong>, you only need to score{" "}
                      <strong className="text-purple-600 dark:text-purple-400 underline decoration-purple-400 underline-offset-2">
                        {targetAssessmentReq?.clampedRequiredMark ?? "40.8"} out of {targetAssessment?.maxMarks} marks
                      </strong>{" "}
                      (~{targetAssessmentReq?.requiredPct}%) in your {targetAssessment?.name}.
                    </div>
                  </div>
                </div>

                {/* ── Mini Interactive Test Simulator ("What If I Score...") ── */}
                <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" />
                      Quick Test: What if I score differently?
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                      {interactiveTestMark ?? 41} / {targetAssessment?.maxMarks} Marks
                    </span>
                  </div>

                  {/* Preset quick test chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mr-1">
                      Quick test:
                    </span>
                    {[
                      { label: "Target (41 M)", val: Math.ceil(targetAssessmentReq?.clampedRequiredMark ?? 40.8) },
                      { label: "45 M", val: 45 },
                      { label: "50 M", val: 50 },
                      { label: "56 M (Full)", val: targetAssessment?.maxMarks ?? 56 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setInteractiveTestMark(Math.min(targetAssessment?.maxMarks ?? 56, chip.val))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                          interactiveTestMark === chip.val
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-purple-400 border border-slate-200 dark:border-white/10"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Mini Slider */}
                  <input
                    type="range"
                    min={0}
                    max={targetAssessment?.maxMarks || 100}
                    step={1}
                    value={interactiveTestMark ?? Math.round((targetAssessment?.maxMarks || 100) * 0.75)}
                    onChange={(e) => setInteractiveTestMark(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />

                  {/* Quick Outcome Readout */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-slate-600 dark:text-zinc-400">
                      If you score <strong>{interactiveTestMark} Marks</strong> ({targetAssessment?.maxMarks ? ((interactiveTestMark! / targetAssessment.maxMarks) * 100).toFixed(1) : 0}%):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        Final: {quickTestPct.toFixed(1)}%
                      </span>
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-sm ${
                          quickTestPct >= targetPct
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {getLetterGrade(quickTestPct)} Grade
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            /* What-If Mode: Result Preview Card */
            <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-white via-slate-50 to-purple-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950/20 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-200 dark:border-white/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    Simulation Output Preview
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    Projected Final Performance
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/80 space-y-2">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase">
                      Resulting Final Grade
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400">
                        {getLetterGrade(simulatedPct)}
                      </span>
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {simulatedPct.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block pt-1">
                      {simulatedPct >= oGradeThreshold ? "Qualifies for O Grade!" : "Passing grade secured"}
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/80 space-y-2">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase">
                      Change From Evaluated Standing
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-4xl sm:text-5xl font-black font-mono flex items-center ${
                          delta >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        <CountUp value={delta} decimals={1} />%
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block pt-1">
                      Current evaluated standing: {currentPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ── 6. Component Breakdown List ─────────────────────────────────── */}
          <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/90 shadow-sm rounded-2xl">
            <CardHeader className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Assessment Structure &amp; Mark Breakdown
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Hierarchical components and weight contributions for this course
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditSchemeModalOpen(true)}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <Layers size={14} /> Edit Scheme
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              {normScheme.components.map((comp) => {
                const evalRes = evaluateComponentScore(comp, subject.marks || {});
                return (
                  <div
                    key={comp.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-purple-500" />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {comp.name}
                        </span>
                        <Badge tone="accent" className="font-mono text-[10px]">
                          {comp.weightPct}% Weight
                        </Badge>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                        {evalRes.hasEntered ? `${evalRes.contribution.toFixed(1)}%` : "0.0%"} / {comp.weightPct}% Earned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                      {comp.assessments.map((ast) => {
                        const raw = subject.marks ? subject.marks[ast.id] : null;
                        const hasVal = raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw));
                        const isSimulatedTarget = ast.id === targetAssessment?.id;

                        return (
                          <div
                            key={ast.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                              hasVal
                                ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                                : isSimulatedTarget
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/20"
                                  : "bg-white dark:bg-zinc-950/70 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {hasVal ? (
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              ) : isSimulatedTarget ? (
                                <Target size={13} className="text-purple-500 shrink-0" />
                              ) : null}
                              <span className="font-sans font-bold truncate">
                                {ast.name}
                              </span>
                            </div>
                            <span className="font-bold shrink-0 text-right">
                              {hasVal ? (
                                `${raw} / ${ast.maxMarks} (${((Number(raw) / ast.maxMarks) * 100).toFixed(1)}%)`
                              ) : isSimulatedTarget ? (
                                <span className="text-purple-600 dark:text-purple-300 font-bold">
                                  Need {targetAssessmentReq?.clampedRequiredMark ?? "40.8"} / {ast.maxMarks}
                                </span>
                              ) : (
                                `Pending (${ast.maxMarks} max)`
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Scenarios Tag List */}
      {scenarios.length > 0 && (
        <Card className="border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950/90 rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <CardTitle className="text-sm sm:text-base">
                Saved Simulation Scenarios ({scenarios.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200"
              >
                <span>{s.label}</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-200/50 dark:bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-400/30">
                  {s.pct.toFixed(1)}% ({s.grade})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Evaluation Scheme Modal */}
      <EditSchemeModal
        isOpen={editSchemeModalOpen}
        onClose={() => setEditSchemeModalOpen(false)}
        subject={subject}
        onSchemeUpdated={async () => {
          await fetchSubjects();
          window.dispatchEvent(new CustomEvent("academic-data-updated"));
          toast.success("Subject scheme updated successfully!");
        }}
      />
    </div>
  );
}
