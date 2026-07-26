import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Wand2, Check, Plus, Trash2, BookOpen, Award, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { subjectCurrentPct, predictSubject, pctToLetter } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
      toast.success("Marks saved!");
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
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
        toast.info(`Deleted ${subject.name}`);
        window.dispatchEvent(new CustomEvent("academic-data-updated"));
        fetchSubjects();
      } catch (err) {
        console.error("Failed to delete subject on backend:", err);
      }
    }
  }

  if (loading && subjects.length === 0) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <Card className="p-8 text-center text-xs text-zinc-400">
          Loading course details...
        </Card>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <Card className="p-10 text-center">
          <h2 className="text-xl font-bold mb-2">No Active Courses Found</h2>
          <p className="text-xs text-zinc-400 mb-5">Add your subjects or upload your syllabus to start tracking course performance.</p>
          <Button variant="primary" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="mx-auto flex items-center gap-1.5">
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
    <div className="flex max-w-4xl flex-col gap-8 pb-10">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <Link to="/app/dashboard" className="flex w-fit items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={() => setAddSubjectModalOpen(true)} className="gap-1.5">
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
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  : "border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: s.colorTag || "#3b82f6" }} />
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Main Course Header Card */}
      <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: subject.colorTag || "#3b82f6" }} />
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{subject.name}</h1>
                <Badge tone="accent">{subject.credits} Credits</Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-zinc-400">
                  Current Score: <span className="font-mono font-bold text-white text-sm">{pct.toFixed(1)}%</span> ({pctToLetter(pct)})
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  Predicted Range: <span className="font-mono font-semibold text-purple-400">{prediction.low}–{prediction.high}%</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button variant="danger" size="sm" onClick={handleDeleteSubject} className="gap-1.5">
                <Trash2 size={15} /> Delete Course
              </Button>
              <Link to="/app/simulator">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Wand2 size={15} /> Open Simulator
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Breakdown Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            <CardTitle>Assessment Breakdown & Marks Entry</CardTitle>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">Live Weightage Math</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto min-w-full">
          <table className="w-full min-w-[500px] text-xs text-left">
            <thead>
              <tr className="border-y border-white/10 bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Assessment Type</th>
                <th className="px-6 py-3">Weightage</th>
                <th className="px-6 py-3">Marks Obtained</th>
                <th className="px-6 py-3">Weighted Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(subject.scheme?.assessmentTypes || []).map((type) => {
                const raw = subject.marks ? subject.marks[type.id] : null;
                const contribution = raw !== null && raw !== undefined ? ((raw / type.maxMarks) * type.weightPct).toFixed(1) : "—";
                return (
                  <tr key={type.id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{type.name}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-purple-400">{type.weightPct}%</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-24 rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 font-mono text-sm font-bold text-white placeholder-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                          placeholder="—"
                          value={raw ?? ""}
                          max={type.maxMarks}
                          onChange={(e) => handleMarkChange(type.id, e.target.value)}
                        />
                        <span className="text-zinc-500 font-mono">/ {type.maxMarks}</span>
                        {savedFlash === type.id && <Check size={16} className="text-emerald-400 animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">{contribution}%</td>
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
