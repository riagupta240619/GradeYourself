import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Wand2, Check, Plus, Trash2, BookOpen, Award, Sparkles, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddSubjectModal } from "@/components/upload/add-subject-modal";
import { subjectCurrentPct, predictSubject, pctToLetter, hasSubjectMarks, normalizeScheme, evaluateComponentScore } from "@/utils/grading-engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EditSchemeModal } from "@/components/subjects/edit-scheme-modal";

export function SubjectDetailsPage() {
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [editSchemeModalOpen, setEditSchemeModalOpen] = useState(false);
  const [backendSubjects, setBackendSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Version counter to reject out-of-order or stale HTTP responses during rapid typing
  const latestSaveVersionRef = useRef(0);

  // Fetch subjects from backend API (with loading spinner)
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

  // Silent background refresh — does NOT set loading=true so the UI never flickers.
  const refreshSubjectsSilently = async () => {
    try {
      const data = await SubjectService.getSubjects();
      setBackendSubjects(data || []);
    } catch (err) {
      console.error("Background refresh failed:", err);
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
    return subjects.find((s) => s.id === selectedId || s._id === selectedId) || subjects[0] || null;
  }, [subjects, selectedId]);

  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  async function handleMarkChange(assessmentId: string, raw: string) {
    if (!subject) return;
    const value = raw === "" ? null : Number(raw);
    const newMarks = { ...(subject.marks || {}), [assessmentId]: value };
    const targetId = subject.id || subject._id;

    if (!targetId) return;

    // Sequence versioning to prevent out-of-order response overwrites
    const currentVersion = ++latestSaveVersionRef.current;
    const timestamp = new Date().toISOString().slice(11, 23);

    console.log(`[${timestamp}] [Mark Edit Init] Version: ${currentVersion}, Assessment: ${assessmentId}, Value: ${value}`);

    try {
      // Step 1: Immediate optimistic state update in React local state
      setBackendSubjects((prev) =>
        prev.map((s) => {
          const sId = s.id || s._id;
          if (sId !== targetId) return s;
          return { ...s, marks: newMarks };
        })
      );

      // Step 2: Persist to backend API
      const updatedSubject = await SubjectService.updateSubject(targetId, { marks: newMarks });

      // Stale Response Guard: if a newer edit occurred while this HTTP call was in flight, reject this response!
      if (currentVersion < latestSaveVersionRef.current) {
        console.log(`[${new Date().toISOString().slice(11, 23)}] [Stale Response Ignored] Version ${currentVersion} < ${latestSaveVersionRef.current}`);
        return;
      }

      console.log(`[${new Date().toISOString().slice(11, 23)}] [Mutation Success] Version: ${currentVersion}`);

      // Step 3: Update local state with authoritative response
      setBackendSubjects((prev) =>
        prev.map((s) => {
          const sId = s.id || s._id;
          if (sId !== targetId) return s;
          return updatedSubject;
        })
      );

      // Step 4: UI feedback
      setSavedFlash(assessmentId);
      toast.success("Marks saved!", { id: "marks-saved-toast" });
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      setTimeout(() => setSavedFlash(null), 900);

      // Step 5: Silent background sync (also version-guarded)
      const freshSubjects = await SubjectService.getSubjects();
      if (currentVersion === latestSaveVersionRef.current) {
        console.log(`[${new Date().toISOString().slice(11, 23)}] [Silent Sync Applied] Version: ${currentVersion}`);
        setBackendSubjects(freshSubjects || []);
      } else {
        console.log(`[${new Date().toISOString().slice(11, 23)}] [Silent Sync Ignored] Version ${currentVersion} < ${latestSaveVersionRef.current}`);
      }
    } catch (err) {
      if (currentVersion === latestSaveVersionRef.current) {
        console.error("Failed to update mark on backend:", err);
        toast.error("Failed to save mark. Please try again.", { id: "marks-saved-toast" });
      }
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
        <Card className="p-8 text-center text-xs text-zinc-400">Loading course details...</Card>
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
          <p className="text-xs text-zinc-400 mb-5">Add your subjects to start tracking course performance.</p>
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

  const hasMarks = hasSubjectMarks(subject);
  const pct = subject.calculatedPct ?? subjectCurrentPct(subject);
  const prediction = predictSubject(subject);

  // Normalized Hierarchical Scheme
  const normScheme = normalizeScheme(subject.scheme);

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
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${active
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Section: Meta & Details */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Row 1: Color Tag, Truncated Subject Name, Credits Badge, Status Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="h-4 w-4 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: subject.colorTag || "#3b82f6" }} />
                <h1
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate max-w-full"
                  title={subject.name}
                >
                  {subject.name}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone="accent" className="font-mono text-xs">
                    {subject.credits} {subject.credits === 1 ? "Credit" : "Credits"}
                  </Badge>
                  <Badge tone={hasMarks ? "success" : "warning"} className="text-xs">
                    {hasMarks ? "Status: Completed" : "Status: In Progress"}
                  </Badge>
                </div>
              </div>

              {/* Row 2: Current Score & Prediction */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>Current Score:</span>
                  {hasMarks ? (
                    <span className="font-mono font-bold text-white text-sm">
                      {pct.toFixed(1)}% <span className="text-xs font-semibold text-purple-300">({pctToLetter(pct)})</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-zinc-400">Unavailable</span>
                  )}
                </div>

                <span className="text-zinc-600 font-bold">•</span>

                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>Prediction:</span>
                  {hasMarks ? (
                    <span className="font-mono font-semibold text-purple-400">{prediction.low}–{prediction.high}%</span>
                  ) : (
                    <span className="font-semibold text-purple-400/80">Unavailable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Grouped Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSchemeModalOpen(true)}
                className="gap-1.5 border-purple-500/30 text-purple-300 hover:border-purple-500"
                title="Edit Evaluation Scheme"
              >
                <Layers size={15} /> Edit Scheme
              </Button>
              <Link to="/app/simulator">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Wand2 size={15} /> Open Simulator
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={handleDeleteSubject} className="gap-1.5">
                <Trash2 size={15} /> Delete Course
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Component & Assessment Breakdown */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">Hierarchical Assessment Breakdown</h2>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">Live Weightage Math</span>
        </div>

        {normScheme.components.map((comp) => {
          const evalRes = evaluateComponentScore(comp, subject.marks || {});
          const ruleLabel = comp.rule ? comp.rule.toUpperCase().replace("_", " ") : "AVERAGE";

          return (
            <Card key={comp.id} className="border border-white/10 bg-zinc-900/90 overflow-hidden shadow-lg">
              {/* Component Header */}
              <CardHeader className="bg-zinc-950/70 border-b border-white/5 py-3 px-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-purple-400" />
                  <span className="font-bold text-white text-sm">{comp.name}</span>
                  <Badge tone="accent" className="text-[10px] uppercase font-mono tracking-wider">
                    Weight: {comp.weightPct}%
                  </Badge>
                  <span className="text-[11px] font-mono text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    Rule: {ruleLabel} {comp.rule === "best_n" ? `(${comp.bestN || 1})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-zinc-400">
                    Component Score:{" "}
                    {evalRes.hasEntered ? (
                      <span className="font-bold text-white">{evalRes.compPct}%</span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-emerald-400 font-bold">
                    Contribution: {evalRes.hasEntered ? `${evalRes.contribution}%` : "—"}
                  </span>
                </div>
              </CardHeader>

              {/* Nested Assessments Table */}
              <CardContent className="p-0 overflow-x-auto min-w-full">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950/40 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-2.5">Assessment Name</th>
                      <th className="px-6 py-2.5">Marks Obtained</th>
                      <th className="px-6 py-2.5">Score %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comp.assessments.map((ast) => {
                      const raw = subject.marks ? subject.marks[ast.id] : null;
                      const hasVal = raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw));
                      const astPct = hasVal ? (((Number(raw) / ast.maxMarks) * 100).toFixed(1)) : "—";

                      return (
                        <tr key={ast.id} className="hover:bg-purple-500/5 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-white">{ast.name}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-24 rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 font-mono text-sm font-bold text-white placeholder-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                placeholder="—"
                                value={raw ?? ""}
                                max={ast.maxMarks}
                                onChange={(e) => handleMarkChange(ast.id, e.target.value)}
                              />
                              <span className="text-zinc-500 font-mono">/ {ast.maxMarks}</span>
                              {savedFlash === ast.id && <Check size={16} className="text-emerald-400 animate-pulse" />}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-bold text-purple-300">
                            {hasVal ? `${astPct}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Upload Subject Modal */}
      <AddSubjectModal
        isOpen={addSubjectModalOpen}
        onClose={() => {
          setAddSubjectModalOpen(false);
          fetchSubjects();
        }}
      />

      {/* Edit Evaluation Scheme Modal */}
      <EditSchemeModal
        isOpen={editSchemeModalOpen}
        onClose={() => setEditSchemeModalOpen(false)}
        subject={subject}
        onSchemeUpdated={() => {
          refreshSubjectsSilently();
          window.dispatchEvent(new CustomEvent("academic-data-updated"));
        }}
      />
    </div>
  );
}
