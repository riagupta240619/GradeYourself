import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, X, Plus, Sliders, CheckCircle2, AlertTriangle, Save, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AssessmentType } from "@/types";
import { toast } from "sonner";

const defaultAssessmentScheme: AssessmentType[] = [
  { id: "a1", name: "Assignments & Quizzes", weightPct: 20, maxMarks: 20 },
  { id: "m1", name: "Midterm Examination", weightPct: 30, maxMarks: 50 },
  { id: "f1", name: "Final Examination", weightPct: 50, maxMarks: 100 },
];

export function AssessmentBuilderPage() {
  const [rows, setRows] = useState<AssessmentType[]>(defaultAssessmentScheme);
  const total = rows.reduce((sum, r) => sum + r.weightPct, 0);

  function update(id: string, field: "weightPct" | "maxMarks", value: number) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), name: "New Assessment Type", weightPct: 0, maxMarks: 100 }]);
  }

  function handleSave() {
    if (total !== 100) return;
    toast.success("Assessment Scheme saved successfully!");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Sliders size={12} className="text-purple-400" /> Scheme Architect
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Assessment Scheme Builder</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Configure weightages, maximum marks, and evaluation rules for your courses.</p>
        </div>

        <Badge tone={total === 100 ? "success" : "danger"}>
          Total: {total}% {total === 100 ? "✓ Ready" : "(Must equal 100%)"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <CardTitle>Evaluation Components</CardTitle>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">{rows.length} Components</span>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-xs">
              <GripVertical size={16} className="cursor-grab text-zinc-500 hover:text-zinc-300" />
              
              <input
                className="flex-1 bg-transparent font-bold text-white placeholder-zinc-500 focus:outline-none text-sm"
                value={row.name}
                onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))}
              />

              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Weight</span>
                <input
                  type="number"
                  className="w-16 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-center font-mono font-bold text-purple-400 focus:border-purple-500 outline-none"
                  value={row.weightPct}
                  onChange={(e) => update(row.id, "weightPct", Number(e.target.value))}
                />
                <span className="font-mono text-zinc-400">%</span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Max</span>
                <input
                  type="number"
                  className="w-16 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-center font-mono font-bold text-white focus:border-purple-500 outline-none"
                  value={row.maxMarks}
                  onChange={(e) => update(row.id, "maxMarks", Number(e.target.value))}
                />
              </div>

              <button onClick={() => remove(row.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                <X size={16} />
              </button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="mt-2 w-fit gap-1.5" onClick={addRow}>
            <Plus size={14} /> Add Component
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Evaluation Rules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2.5">
          <Button variant="outline" size="sm">+ Best N of M Quizzes</Button>
          <Button variant="outline" size="sm">+ Grace Marks Allocation</Button>
          <Button variant="outline" size="sm">+ Drop Lowest Assignment</Button>
        </CardContent>
      </Card>

      {total !== 100 && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 font-semibold">
          <AlertTriangle size={16} />
          <span>Total weightage must equal exactly 100% before saving (Current: {total}%).</span>
        </div>
      )}

      <Button variant="primary" disabled={total !== 100} className="w-fit gap-2" onClick={handleSave}>
        <Save size={16} /> Save Scheme Specification
      </Button>
    </div>
  );
}
