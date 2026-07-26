import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/shared/count-up";
import { subjectCurrentPct, pctToLetter } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link } from "react-router-dom";
import { Wand2, Plus, Sparkles, BookmarkCheck, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export function SimulatorPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [finalMarks, setFinalMarks] = useState<number>(0);
  const [scenarios, setScenarios] = useState<{ id: string; label: string; pct: number }[]>([]);

  useEffect(() => {
    SubjectService.getSubjects()
      .then((data) => {
        setSubjects(data || []);
        if (data && data.length > 0) {
          const firstId = data[0].id || data[0]._id || null;
          setSubjectId(firstId);
          const firstFinalType = data[0].scheme?.assessmentTypes?.[data[0].scheme.assessmentTypes.length - 1];
          if (firstFinalType) {
            setFinalMarks(Math.round(firstFinalType.maxMarks * 0.75));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch subjects for simulator:", err);
        setSubjects([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const subject = useMemo(() => {
    if (!subjectId) return subjects[0] || null;
    return subjects.find((s) => (s.id === subjectId || s._id === subjectId)) || subjects[0] || null;
  }, [subjects, subjectId]);

  const finalType = useMemo(() => {
    if (!subject?.scheme?.assessmentTypes?.length) return null;
    return subject.scheme.assessmentTypes[subject.scheme.assessmentTypes.length - 1];
  }, [subject]);

  // Update slider default value when subject selection changes
  useEffect(() => {
    if (finalType) {
      const rawCurrent = subject?.marks?.[finalType.id];
      setFinalMarks(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : Math.round(finalType.maxMarks * 0.75));
    }
  }, [finalType, subject]);

  const simulatedPct = useMemo(() => {
    if (!subject || !finalType) return 0;
    const scenarioSubject = { ...subject, marks: { ...(subject.marks || {}), [finalType.id]: finalMarks } };
    return subjectCurrentPct(scenarioSubject);
  }, [subject, finalMarks, finalType]);

  const currentPct = useMemo(() => {
    if (!subject) return 0;
    return subjectCurrentPct(subject);
  }, [subject]);

  const delta = simulatedPct - currentPct;

  function saveScenario() {
    if (!finalType) return;
    const label = `${subject?.name || "Subject"} - ${finalType.name}: ${finalMarks}/${finalType.maxMarks}`;
    setScenarios((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        pct: simulatedPct,
      },
    ]);
    toast.success("Scenario saved successfully!");
  }

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">What-if Simulator</h1>
        <Card className="p-8 text-center text-xs text-zinc-400">
          Loading subjects for simulation...
        </Card>
      </div>
    );
  }

  if (!subject || !finalType) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Wand2 size={12} className="text-purple-400" /> Grade Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What-if Grade Simulator</h1>
        </div>
        <Card className="p-10 text-center">
          <h2 className="text-lg font-bold mb-2">No Active Subjects Available</h2>
          <p className="text-xs text-zinc-400 mb-5">Add your subjects and assessment mark weightages to run live what-if simulations.</p>
          <Link to="/app/subjects" className="mx-auto flex w-fit items-center gap-1.5">
            <Button variant="primary" size="sm">
              <Plus size={14} /> Add Active Subjects
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Wand2 size={12} className="text-purple-400" /> Grade Simulator
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What-if Grade Simulator</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Adjust marks on upcoming exams to see immediate impact on overall course grade.</p>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const sId = s.id || s._id || "";
          const active = sId === (subject.id || subject._id);
          return (
            <button
              key={sId}
              onClick={() => setSubjectId(sId)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  : "border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Simulation Controls Card */}
      <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{finalType.name} Simulation — {subject.name}</CardTitle>
          <Badge tone="accent">Weightage: {finalType.weightPct || 50}%</Badge>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-300">Simulated Score</span>
            <span className="text-sm font-bold font-mono text-purple-400">
              {finalMarks} / {finalType.maxMarks} Marks
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={finalType.maxMarks}
            value={finalMarks}
            onChange={(e) => setFinalMarks(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-purple-500 my-4"
          />

          {/* Results Comparison Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-400 font-medium">Resulting Grade</p>
              <p className="text-3xl font-extrabold text-white mt-1">{pctToLetter(simulatedPct)}</p>
              <p className="font-tabular text-xs text-purple-400 font-semibold mt-1">{simulatedPct.toFixed(1)}% Overall</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-400 font-medium">Change from Current</p>
              <p className={`text-3xl font-extrabold font-tabular mt-1 flex items-center gap-1 ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {delta >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {delta >= 0 ? "+" : ""}
                <CountUp value={delta} decimals={1} />%
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Live simulation delta</p>
            </div>
          </div>

          <Button className="mt-6 w-full gap-2" variant="primary" onClick={saveScenario}>
            <BookmarkCheck size={16} /> Save This Scenario
          </Button>
        </CardContent>
      </Card>

      {/* Saved Scenarios Tag List */}
      {scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <CardTitle>Saved Simulation Scenarios ({scenarios.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-zinc-200"
              >
                <span>{s.label}</span>
                <span className="font-mono text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30">
                  {s.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
