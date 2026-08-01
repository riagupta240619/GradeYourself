import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  BookOpen,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SemesterService } from "@/services/semester-service";
import type {
  CompletedSemesterDetail,
  DetailedSemesterSubject,
  AssessmentItem,
} from "@/services/analytics-service";

interface EditSemesterModalProps {
  isOpen: boolean;
  semester: CompletedSemesterDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSemesterModal({
  isOpen,
  semester,
  onClose,
  onSuccess,
}: EditSemesterModalProps) {
  const [semesterName, setSemesterName] = useState("");
  const [credits, setCredits] = useState<number>(20);
  const [sgpa, setSgpa] = useState<number | null>(null);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<DetailedSemesterSubject[]>([]);

  // Pre-save Confirmation Dialog State
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (semester) {
      setSemesterName(semester.name || `Semester ${semester.semesterNumber}`);
      setCredits(semester.creditsEarned || 20);
      setSgpa(typeof semester.sgpa === "number" ? semester.sgpa : null);
      setCgpa(typeof semester.cgpa === "number" ? semester.cgpa : null);
      setSubjects(
        (semester.subjects || []).map((s) => ({
          ...s,
          subjectName: s.subjectName || s.name || "",
          subjectCode: s.subjectCode || s.code || "",
          credits: s.credits || 3,
          marksObtained: s.marksObtained !== undefined ? s.marksObtained : null,
          maxMarks: s.maxMarks !== undefined ? s.maxMarks : null,
          finalPercentage:
            s.finalPercentage !== undefined ? s.finalPercentage : s.pct,
          grade: s.grade || s.letterGrade || "",
          gradePoint: s.gradePoint !== undefined ? s.gradePoint : null,
          assessments: Array.isArray(s.assessments) ? [...s.assessments] : [],
        })),
      );
      setShowConfirmation(false);
      setErrorMsg(null);
    }
  }, [semester]);

  if (!isOpen || !semester) return null;

  function handleUpdateSubjectField(
    index: number,
    field: keyof DetailedSemesterSubject,
    value: any,
  ) {
    const updated = [...subjects];
    const item = { ...updated[index], [field]: value };
    if (field === "subjectName") item.name = value;
    if (field === "subjectCode") item.code = value;
    if (field === "finalPercentage") item.pct = Number(value) || 0;
    if (field === "grade") item.letterGrade = value;
    updated[index] = item;
    setSubjects(updated);
  }

  function handleUpdateAssessment(
    sIdx: number,
    aIdx: number,
    field: keyof AssessmentItem,
    value: any,
  ) {
    const updated = [...subjects];
    const sub = { ...updated[sIdx] };
    const assessments = [...(sub.assessments || [])];
    assessments[aIdx] = { ...assessments[aIdx], [field]: value };
    sub.assessments = assessments;
    updated[sIdx] = sub;
    setSubjects(updated);
  }

  function handleAddAssessment(sIdx: number) {
    const updated = [...subjects];
    const sub = { ...updated[sIdx] };
    const assessments = [...(sub.assessments || [])];
    assessments.push({
      name: `Assessment ${assessments.length + 1}`,
      marksObtained: 0,
      maxMarks: 100,
    });
    sub.assessments = assessments;
    updated[sIdx] = sub;
    setSubjects(updated);
  }

  function handleDeleteAssessment(sIdx: number, aIdx: number) {
    const updated = [...subjects];
    const sub = { ...updated[sIdx] };
    sub.assessments = (sub.assessments || []).filter((_, idx) => idx !== aIdx);
    updated[sIdx] = sub;
    setSubjects(updated);
  }

  function handleAddSubject() {
    setSubjects([
      ...subjects,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        subjectName: "New Subject",
        name: "New Subject",
        subjectCode: "CODE101",
        code: "CODE101",
        credits: 3,
        marksObtained: null,
        maxMarks: null,
        finalPercentage: 80,
        pct: 80,
        grade: "A",
        letterGrade: "A",
        gradePoint: 8.0,
        assessments: [],
      },
    ]);
  }

  function handleDeleteSubject(index: number) {
    setSubjects(subjects.filter((_, i) => i !== index));
  }

  async function handleConfirmSave() {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await SemesterService.updateFullSemester(semester!.id || semester!._id!, {
        name: semesterName,
        credits: credits,
        finalizedSgpa: sgpa,
        cgpa: cgpa,
        subjects: subjects.map((sub) => ({
          subjectName: sub.subjectName || sub.name,
          subjectCode: sub.subjectCode || sub.code,
          credits: Number(sub.credits) || 3,
          marksObtained:
            sub.marksObtained !== null &&
            sub.marksObtained !== undefined &&
            sub.marksObtained !== ("" as any)
              ? Number(sub.marksObtained)
              : null,
          maxMarks:
            sub.maxMarks !== null &&
            sub.maxMarks !== undefined &&
            sub.maxMarks !== ("" as any)
              ? Number(sub.maxMarks)
              : null,
          finalPercentage:
            sub.finalPercentage !== null &&
            sub.finalPercentage !== undefined &&
            sub.finalPercentage !== ("" as any)
              ? Number(sub.finalPercentage)
              : null,
          grade: sub.grade || sub.letterGrade || null,
          gradePoint:
            sub.gradePoint !== null &&
            sub.gradePoint !== undefined &&
            sub.gradePoint !== ("" as any)
              ? Number(sub.gradePoint)
              : null,
          assessments: (sub.assessments || []).map((a) => ({
            name: a.name,
            marksObtained:
              a.marksObtained !== null && a.marksObtained !== undefined
                ? Number(a.marksObtained)
                : null,
            maxMarks:
              a.maxMarks !== null && a.maxMarks !== undefined
                ? Number(a.maxMarks)
                : null,
          })),
        })),
      });

      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update semester:", err);
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Failed to update semester snapshot.",
      );
      setShowConfirmation(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Edit Completed Semester Snapshot
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-full border border-purple-500/30">
                Semester {semester.semesterNumber}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Update stored subjects, grades, credits & assessment components
              for this historical record.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Semester Overview Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Semester Name
              </label>
              <input
                type="text"
                value={semesterName}
                onChange={(e) => setSemesterName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Semester 1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Total Credits
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value) || 20)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Semester SGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={sgpa ?? ""}
                onChange={(e) =>
                  setSgpa(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cumulative CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa ?? ""}
                onChange={(e) =>
                  setCgpa(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Subject List & Assessment Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Subjects ({subjects.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSubject}
                className="border-slate-800 text-indigo-400 hover:bg-indigo-500/10 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
              </Button>
            </div>

            {subjects.map((sub, sIdx) => (
              <div
                key={`edit-sub-${sIdx}`}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
                  {/* Subject Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-semibold">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={sub.subjectName || sub.name}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          sIdx,
                          "subjectName",
                          e.target.value,
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Subject Code */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-semibold">
                      Code
                    </label>
                    <input
                      type="text"
                      value={sub.subjectCode || sub.code}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          sIdx,
                          "subjectCode",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 font-mono focus:outline-none uppercase"
                    />
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-semibold">
                      Credits
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sub.credits}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          sIdx,
                          "credits",
                          Number(e.target.value) || 3,
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-900 dark:text-white font-mono text-center focus:outline-none"
                    />
                  </div>

                  {/* Final Percentage */}
                  <div>
                    <label className="block text-[10px] text-purple-600 dark:text-purple-300 mb-0.5 font-bold">
                      Final Pct (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={sub.finalPercentage ?? sub.pct ?? ""}
                      onChange={(e) =>
                        handleUpdateSubjectField(
                          sIdx,
                          "finalPercentage",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      placeholder="85.0"
                      className="w-full px-2.5 py-1.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-600 dark:text-purple-300 font-mono text-center font-bold focus:outline-none"
                    />
                  </div>

                  {/* Grade & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 mb-0.5 font-semibold">
                        Grade
                      </label>
                      <input
                        type="text"
                        value={sub.grade || sub.letterGrade}
                        onChange={(e) =>
                          handleUpdateSubjectField(
                            sIdx,
                            "grade",
                            e.target.value.toUpperCase(),
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-center font-bold uppercase focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(sIdx)}
                      className="mt-4 p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Remove Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stored Assessment Components Sub-section */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />{" "}
                      Stored Assessment Components (
                      {sub.assessments?.length || 0})
                    </span>
                    <button
                      onClick={() => handleAddAssessment(sIdx)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Assessment Component
                    </button>
                  </div>

                  {sub.assessments && sub.assessments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {sub.assessments.map((ast, aIdx) => (
                        <div
                          key={`ast-${sIdx}-${aIdx}`}
                          className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={ast.name}
                            onChange={(e) =>
                              handleUpdateAssessment(
                                sIdx,
                                aIdx,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Component Name"
                            className="w-28 bg-transparent text-[11px] font-medium text-slate-900 dark:text-white border-b border-slate-700 focus:outline-none"
                          />
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <input
                              type="number"
                              value={ast.marksObtained ?? ""}
                              onChange={(e) =>
                                handleUpdateAssessment(
                                  sIdx,
                                  aIdx,
                                  "marksObtained",
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="Marks"
                              className="w-12 px-1 py-0.5 rounded bg-slate-950 text-center text-slate-900 dark:text-white border border-slate-800"
                            />
                            <span className="text-slate-500">/</span>
                            <input
                              type="number"
                              value={ast.maxMarks ?? 100}
                              onChange={(e) =>
                                handleUpdateAssessment(
                                  sIdx,
                                  aIdx,
                                  "maxMarks",
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="Max"
                              className="w-12 px-1 py-0.5 rounded bg-slate-950 text-center text-slate-400 border border-slate-800"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteAssessment(sIdx, aIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400 text-xs ml-auto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      No breakdown components stored for this subject.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
          >
            Cancel
          </Button>

          <Button
            onClick={() => setShowConfirmation(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium text-xs px-5 shadow-lg shadow-indigo-600/25"
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Completed Semester
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog Overlay (Prevents Accidental Edits) */}
      {showConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm Snapshot Update
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to save these edits to{" "}
              <strong className="text-slate-900 dark:text-white">
                {semesterName}
              </strong>
              ? This action will update your stored historical record,
              recalculate your **Semester SGPA**, **Overall CGPA**, and update
              your **Analytics Graphs**.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSaving}
                className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
              >
                Back to Editing
              </Button>

              <Button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white text-xs font-semibold px-4 shadow-lg shadow-amber-600/25 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm & Recalculate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
