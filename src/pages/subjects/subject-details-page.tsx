import { useState, useMemo } from "react";
import { ChevronLeft, Wand2, Check, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { subjectCurrentPct, predictSubject, pctToLetter } from "@/lib/grading/engine";
import { Link } from "react-router-dom";

export function SubjectDetailsPage() {
  const { semesters, updateSubjectMarks, deleteSubject } = useAcademicStore();
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);

  const currentSem = useMemo(() => {
    return semesters.find((s) => s.isCurrent) || semesters[semesters.length - 1] || { subjects: [] };
  }, [semesters]);

  const subjects = currentSem.subjects || [];

  const [selectedId, setSelectedId] = useState<string | null>(subjects[0]?.id || null);

  // Fallback to first available subject if selectedId not found
  const subject = useMemo(() => {
    return subjects.find((s) => s.id === selectedId) || subjects[0] || null;
  }, [subjects, selectedId]);

  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  function handleMarkChange(assessmentId: string, raw: string) {
    if (!subject) return;
    const value = raw === "" ? null : Number(raw);
    updateSubjectMarks(subject.id, assessmentId, value);
    setSavedFlash(assessmentId);
    setTimeout(() => setSavedFlash(null), 900);
  }

  function handleDeleteSubject() {
    if (!subject) return;
    if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      deleteSubject(subject.id);
      setSelectedId(null);
    }
  }

  if (!subject) {
    return (
      <div className="flex flex-col gap-6 animate-fade-up">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={15} /> Back to Dashboard
        </Link>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No subjects found</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Add your new subjects or upload them to view details.</p>
          <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mx-auto flex items-center gap-1">
            <Plus size={15} /> Add New Subject
          </Button>
        </Card>

        <AddSubjectModal
          isOpen={addSubjectModalOpen}
          onClose={() => setAddSubjectModalOpen(false)}
        />
      </div>
    );
  }

  const pct = subjectCurrentPct(subject);
  const prediction = predictSubject(subject);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={15} /> Back to Dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="flex items-center gap-1">
          <Plus size={14} /> Add Subject
        </Button>
      </div>

      {/* Subject selector pills */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              s.id === subject.id ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            style={{ borderColor: s.id === subject.id ? undefined : "var(--border-hairline)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.colorTag }} />
            {s.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.colorTag }} />
            {subject.name}
            <span className="text-xs font-normal text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
              {subject.credits} Credits
            </span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Current: <span className="font-tabular font-medium text-[var(--text-primary)]">{pct.toFixed(1)}%</span> ({pctToLetter(pct)}) &nbsp;·&nbsp;
            Predicted: <span className="font-tabular font-medium">{prediction.low}–{prediction.high}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDeleteSubject} className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
            <Trash2 size={15} /> Delete
          </Button>
          <Link to="/app/simulator">
            <Button variant="outline" size="sm">
              <Wand2 size={15} /> Open Simulator
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Breakdown & Marks Entry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-hairline)" }}>
                <th className="px-5 py-2 font-normal">Assessment</th>
                <th className="px-5 py-2 font-normal">Weight</th>
                <th className="px-5 py-2 font-normal">Marks Obtained</th>
                <th className="px-5 py-2 font-normal">Weighted Score</th>
              </tr>
            </thead>
            <tbody>
              {subject.scheme.assessmentTypes.map((type) => {
                const raw = subject.marks[type.id];
                const contribution = raw !== null && raw !== undefined ? ((raw / type.maxMarks) * type.weightPct).toFixed(1) : "—";
                return (
                  <tr key={type.id} className="border-b last:border-0 hover:bg-[var(--bg-elevated)]/30" style={{ borderColor: "var(--border-hairline)" }}>
                    <td className="px-5 py-3 font-medium">{type.name}</td>
                    <td className="px-5 py-3 font-tabular text-[var(--text-secondary)]">{type.weightPct}%</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-20 rounded-md border bg-[var(--bg-base)] px-2.5 py-1 font-tabular focus:border-[var(--color-accent)]"
                          style={{ borderColor: "var(--border-hairline)" }}
                          placeholder="—"
                          value={raw ?? ""}
                          max={type.maxMarks}
                          onChange={(e) => handleMarkChange(type.id, e.target.value)}
                        />
                        <span className="text-[var(--text-tertiary)]">/ {type.maxMarks}</span>
                        {savedFlash === type.id && <Check size={14} className="text-[var(--color-success)]" />}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-tabular text-[var(--text-secondary)]">{contribution}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Upload Subject Modal */}
      <AddSubjectModal
        isOpen={addSubjectModalOpen}
        onClose={() => setAddSubjectModalOpen(false)}
      />
    </div>
  );
}
