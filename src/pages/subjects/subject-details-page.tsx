import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, Wand2, Check, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { subjectCurrentPct, predictSubject, pctToLetter } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link } from "react-router-dom";

export function SubjectDetailsPage() {
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [backendSubjects, setBackendSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects from backend API
  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SubjectService.getSubjects();
      setBackendSubjects(data || []);
    } catch (err) {
      console.error("Failed to fetch subjects from backend:", err);
      setError("Failed to load subjects from backend API.");
      setBackendSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const subjects = backendSubjects;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to first subject when list loads
  useEffect(() => {
    if (subjects.length > 0 && !selectedId) {
      setSelectedId(subjects[0].id || subjects[0]._id || null);
    }
  }, [subjects, selectedId]);

  // Selected subject object
  const subject = useMemo(() => {
    if (!selectedId) return subjects[0] || null;
    return subjects.find((s) => (s.id === selectedId || s._id === selectedId)) || subjects[0] || null;
  }, [subjects, selectedId]);

  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  async function handleMarkChange(assessmentId: string, raw: string) {
    if (!subject) return;
    const value = raw === "" ? null : Number(raw);
    const newMarks = { ...(subject.marks || {}), [assessmentId]: value };
    const targetId = subject.id || subject._id;

    if (!targetId) return;

    try {
      await SubjectService.updateSubject(targetId, { marks: newMarks });
      setSavedFlash(assessmentId);
      setTimeout(() => setSavedFlash(null), 900);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to update mark on backend:", err);
    }
  }

  async function handleDeleteSubject() {
    if (!subject) return;
    const targetId = subject.id || subject._id;
    if (!targetId) return;

    if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      try {
        await SubjectService.deleteSubject(targetId);
        setSelectedId(null);
        fetchSubjects();
      } catch (err) {
        console.error("Failed to delete subject on backend:", err);
      }
    }
  }

  if (loading && subjects.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-up">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={15} /> Back to Dashboard
        </Link>
        <Card className="p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading subjects...
        </Card>
      </div>
    );
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
          onClose={() => {
            setAddSubjectModalOpen(false);
            fetchSubjects();
          }}
        />
      </div>
    );
  }

  const pct = subject.calculatedPct ?? subjectCurrentPct(subject);
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
        {subjects.map((s) => {
          const sId = s.id || s._id || "";
          const active = sId === (subject.id || subject._id);
          return (
            <button
              key={sId}
              onClick={() => setSelectedId(sId)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={{ borderColor: active ? undefined : "var(--border-hairline)" }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.colorTag || "#3b82f6" }} />
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.colorTag || "#3b82f6" }} />
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
              {(subject.scheme?.assessmentTypes || []).map((type) => {
                const raw = subject.marks ? subject.marks[type.id] : null;
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
        onClose={() => {
          setAddSubjectModalOpen(false);
          fetchSubjects();
        }}
      />
    </div>
  );
}
