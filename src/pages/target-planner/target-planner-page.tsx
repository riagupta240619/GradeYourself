import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { requiredMarksForTarget } from "@/lib/grading/engine";

export function TargetPlannerPage() {
  const [target, setTarget] = useState(85);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);

  const { semesters } = useAcademicStore();
  const currentSem = useMemo(() => {
    return semesters.find((s) => s.isCurrent) || semesters[semesters.length - 1] || { subjects: [] };
  }, [semesters]);

  const currentSemesterSubjects = currentSem.subjects || [];

  const results = useMemo(
    () => currentSemesterSubjects.map((s) => ({ subject: s, req: requiredMarksForTarget(s, target) })),
    [currentSemesterSubjects, target]
  );

  const ambitious = results.some((r) => r.req.requiredAvgPct > 85 && r.req.requiredAvgPct <= 100);
  const unlikely = results.some((r) => !r.req.possible);
  const feasibility = unlikely ? "Unlikely" : ambitious ? "Ambitious" : "Achievable";
  const tone = unlikely ? "danger" : ambitious ? "warning" : "success";

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Target CGPA & Grade Planner</h1>
          <p className="text-sm text-[var(--text-secondary)]">Simulate required marks on remaining assessments to reach your goal.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">I want to target a overall score of</label>
          <input
            type="range"
            min={50}
            max={100}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-semibold font-tabular text-[var(--color-accent)]">{target}%</p>
            <span className="text-xs text-[var(--text-tertiary)]">Equivalent to ~{(target / 10).toFixed(2)} CGPA</span>
          </div>
        </CardContent>
      </Card>

      {currentSemesterSubjects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-3">No active subjects to plan for.</p>
          <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mx-auto flex items-center gap-1">
            <Plus size={14} /> Add your subjects
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[var(--text-primary)]">To hit {target}%, here's what you need</CardTitle>
            <Badge tone={tone as "danger" | "warning" | "success"}>{feasibility}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {results.map(({ subject, req }) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.colorTag }} />
                  <span className="font-medium">{subject.name}</span>
                </div>
                {req.requiredAvgPct <= 0 ? (
                  <span className="text-[var(--color-success)] font-medium">Target already reached ✓</span>
                ) : (
                  <span className="font-tabular font-medium">
                    Need {req.requiredAvgPct}% on remaining {!req.possible && <span className="text-[var(--color-danger)] font-normal">(Exceeds 100%)</span>}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={addSubjectModalOpen}
        onClose={() => setAddSubjectModalOpen(false)}
      />
    </div>
  );
}
