import { useState, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Target, Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { requiredMarksForTarget } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";

export function TargetPlannerPage() {
  const [target, setTarget] = useState(85);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await SubjectService.getSubjects();
      setSubjects(data || []);
    } catch (err) {
      console.error("Failed to fetch subjects for target planner:", err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const results = useMemo(
    () => subjects.map((s) => ({ subject: s, req: requiredMarksForTarget(s, target) })),
    [subjects, target]
  );

  const ambitious = results.some((r) => r.req.requiredAvgPct > 85 && r.req.requiredAvgPct <= 100);
  const unlikely = results.some((r) => !r.req.possible);
  const feasibility = unlikely ? "Unlikely" : ambitious ? "Ambitious" : "Achievable";
  const tone = unlikely ? "danger" : ambitious ? "warning" : "success";

  // Trigger celebration confetti when target is hit & achievable
  const handleSliderChange = (newTarget: number) => {
    setTarget(newTarget);
    if (newTarget >= 80 && !unlikely && Math.random() > 0.6) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#7c3aed", "#3b82f6", "#22c55e"],
      });
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Target size={12} className="text-purple-400" /> AI Target Planner
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Target CGPA & Grade Planner</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Simulate exact required marks on remaining assessments to reach your goal.</p>
      </div>

      {/* Target Setting Card */}
      <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Target Overall Score</label>
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              Equivalent to ~{(target / 10).toFixed(2)} CGPA
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={100}
            value={target}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-purple-500 my-4"
          />

          <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-tabular text-white tracking-tight">{target}%</span>
              <span className="text-xs text-zinc-400">Target Score Benchmark</span>
            </div>
            <Badge tone={tone as any}>{feasibility}</Badge>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-xs text-zinc-400">
          Loading active subject metrics...
        </Card>
      ) : subjects.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-zinc-400 mb-4">No active subjects recorded to plan targets for.</p>
          <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mx-auto flex items-center gap-1.5">
            <Plus size={14} /> Add Active Subjects
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <CardTitle>Required Scores To Hit {target}% Target</CardTitle>
            </div>
            <Badge tone={tone as any}>{feasibility} Goal</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {results.map(({ subject, req }) => (
              <motion.div
                key={subject.id || subject._id}
                whileHover={{ x: 2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3.5 text-xs gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: subject.colorTag || "#3b82f6" }} />
                  <span className="font-bold text-white text-sm">{subject.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {req.requiredAvgPct <= 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={13} /> Target already reached ✓
                    </span>
                  ) : (
                    <span className="font-tabular font-semibold text-zinc-200">
                      Need <span className="text-purple-400 font-bold text-sm">{req.requiredAvgPct}%</span> on remaining exams{" "}
                      {!req.possible && <span className="text-rose-400 font-normal ml-1">(Exceeds 100% max)</span>}
                    </span>
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
          fetchSubjects();
        }}
      />
    </div>
  );
}
