import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseNewSubjectsCsv, generateNewSubjectsCsvTemplate, type ParsedSubjectInput } from "@/lib/utils/upload-parser";
import { SubjectService } from "@/services/subject-service";
import { SemesterService, type SemesterWithTotalCredits } from "@/services/semester-service";

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6"];

export function AddSubjectModal({ isOpen, onClose, onSuccess }: AddSubjectModalProps) {
  const [semesters, setSemesters] = useState<SemesterWithTotalCredits[]>([]);
  const [activeTab, setActiveTab] = useState<"form" | "bulk">("form");
  const [targetSemId, setTargetSemId] = useState<string>("");

  // Single Form State
  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number>(4);
  const [colorTag, setColorTag] = useState<string>(PALETTE[0]);
  const [a1Mark, setA1Mark] = useState<string>("");
  const [a2Mark, setA2Mark] = useState<string>("");
  const [a3Mark, setA3Mark] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedSubjects, setParsedSubjects] = useState<ParsedSubjectInput[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const isSubmittingRef = useRef(false);
  isSubmittingRef.current = isSubmitting;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmittingRef.current) {
        event.preventDefault();
        resetForm();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  // Fetch semesters when modal opens
  useEffect(() => {
    if (isOpen) {
      SemesterService.getSemesters()
        .then((data) => {
          setSemesters(data || []);
          if (data && data.length > 0) {
            const currentSem = data.find((s) => s.isCurrent);
            if (currentSem) {
              setTargetSemId(currentSem.id || (currentSem as any)._id || "");
            } else {
              setTargetSemId("");
            }
          } else {
            setTargetSemId("");
          }
        })
        .catch((err) => {
          console.error("Failed to load semesters:", err);
          setErrorMsg("Failed to load semester list from backend.");
        });
    }
  }, [isOpen]);


  function resetForm() {
    setName("");
    setCredits(4);
    setA1Mark("");
    setA2Mark("");
    setA3Mark("");
    setParsedSubjects([]);
    setFileName(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
  }

  async function handleSingleAdd() {
    if (!name.trim()) {
      setErrorMsg("Subject name is required.");
      return;
    }

    if (credits < 1 || credits > 10) {
      setErrorMsg("Credits must be between 1 and 10.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let activeSemId = targetSemId;

      // If user has no semester created yet, create a default "Semester 1" first
      if (!activeSemId) {
        const createdSem = await SemesterService.createSemester({
          name: "Semester 1",
          isCurrent: true,
          credits: 20,
        });
        activeSemId = createdSem.id || (createdSem as any)._id;
      }

      const internalNum = a1Mark !== "" ? parseFloat(a1Mark) : 0;
      const externalNum = a3Mark !== "" ? parseFloat(a3Mark) : 0;

      await SubjectService.createSubject({
        name: name.trim(),
        credits,
        semesterId: activeSemId,
        internalMarks: internalNum,
        externalMarks: externalNum,
        colorTag,
        marks: {
          a1: a1Mark !== "" ? parseFloat(a1Mark) : null,
          m1: a2Mark !== "" ? parseFloat(a2Mark) : null,
          f1: a3Mark !== "" ? parseFloat(a3Mark) : null,
        },
      });

      setSuccessMsg(`Subject "${name}" added successfully!`);
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      onSuccess?.();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileRead(file: File) {
    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            setParsedSubjects(
              json.map((s: any, idx: number) => ({
                name: String(s.name || `Subject ${idx + 1}`),
                credits: Number(s.credits) || 4,
                colorTag: PALETTE[idx % PALETTE.length],
                marks: s.marks || {},
                scheme: s.scheme || {
                  id: "default-scheme",
                  name: `${s.name || "Subject"} Scheme`,
                  university: "General",
                  isTemplate: false,
                  verified: true,
                  usedBy: 1,
                  assessmentTypes: [
                    { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
                    { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 50 },
                    { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 100 },
                  ],
                },
              }))
            );
          }
        } else {
          setParsedSubjects(parseNewSubjectsCsv(text));
        }
      } catch (err) {
        console.error("Parse error:", err);
        setErrorMsg("Failed to parse document format. Please use standard CSV or JSON.");
      }
    };
    reader.readAsText(file);
  }

  async function handleBulkSave() {
    if (parsedSubjects.length === 0) {
      setErrorMsg("Please upload or parse a file containing subjects.");
      return;
    }

    setIsSubmitting(true);
    try {
      let activeSemId = targetSemId;
      if (!activeSemId) {
        const createdSem = await SemesterService.createSemester({
          name: "Semester 1",
          isCurrent: true,
          credits: 20,
        });
        activeSemId = createdSem.id || (createdSem as any)._id;
      }

      for (const subj of parsedSubjects) {
        await SubjectService.createSubject({
          name: subj.name,
          credits: subj.credits,
          semesterId: activeSemId,
          colorTag: subj.colorTag,
          marks: subj.marks as Record<string, number | null>,
        });
      }

      setSuccessMsg(`Successfully imported ${parsedSubjects.length} subject(s)!`);
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      onSuccess?.();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to bulk upload subjects");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDownloadTemplate() {
    const template = generateNewSubjectsCsvTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "new_subjects_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const closeModal = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={isSubmitting ? undefined : closeModal} className="fixed inset-0 bg-black/75 backdrop-blur-md" aria-hidden="true" />
          <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-subject-dialog-title" aria-describedby="add-subject-dialog-description" initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ type: "spring", damping: 25, stiffness: 350 }} className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-7" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-hairline)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: "var(--border-hairline)" }}>
          <div>
            <h2 id="add-subject-dialog-title" className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Plus size={20} className="text-[var(--color-accent)]" />
              Add or Upload New Subjects
            </h2>
            <p id="add-subject-dialog-description" className="text-xs text-[var(--text-secondary)] mt-0.5">
              Add new subjects manually or bulk import them from CSV/JSON.
            </p>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close add subject dialog"
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Semester Picker */}
        <div className="mb-4 space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Target Semester
          </label>
          <select
            value={targetSemId}
            onChange={(e) => setTargetSemId(e.target.value)}
            className="w-full rounded-lg border bg-[var(--bg-base)] px-3 py-2 text-xs font-semibold"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {semesters.length === 0 ? (
              <option value="">Active Current Semester (Will be created automatically)</option>
            ) : (
              semesters.map((sem) => {
                const sId = sem.id || (sem as any)._id;
                return (
                  <option key={sId} value={sId} disabled={!sem.isCurrent}>
                    {sem.name} {sem.isCurrent ? "★ (Active Current Semester)" : "🔒 (Completed - Read Only)"}
                  </option>
                );
              })
            )}
          </select>
          <p className="text-[11px] text-zinc-400">
            Note: New subjects are saved to your active Current Semester. Historical completed semesters are read-only and can be modified via Past Results.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-5 gap-4" style={{ borderColor: "var(--border-hairline)" }}>
          <button
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "form"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Single Subject Form
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "bulk"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Bulk File Upload (CSV)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-xs text-[var(--color-danger)]">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 p-3 text-xs text-[var(--color-success)]">
            <CheckCircle2 size={15} /> {successMsg}
          </div>
        )}

        {activeTab === "form" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Subject Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Artificial Intelligence"
                className="w-full rounded-lg border bg-[var(--bg-base)] px-3 py-2 text-xs"
                style={{ borderColor: "var(--border-hairline)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Credits (1-10) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={credits}
                  onChange={(e) => setCredits(parseInt(e.target.value) || 4)}
                  className="w-full rounded-lg border bg-[var(--bg-base)] px-3 py-2 text-xs font-tabular"
                  style={{ borderColor: "var(--border-hairline)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColorTag(hex)}
                      className={`h-6 w-6 rounded-full transition-transform ${colorTag === hex ? "scale-125 ring-2 ring-[var(--color-accent)] ring-offset-2" : ""}`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Initial / Current Marks (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Assignments (/20)</span>
                  <input
                    type="number"
                    placeholder="Marks"
                    value={a1Mark}
                    onChange={(e) => setA1Mark(e.target.value)}
                    className="w-full rounded-lg border bg-[var(--bg-base)] px-2 py-1.5 text-xs font-tabular"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Midterm (/30)</span>
                  <input
                    type="number"
                    placeholder="Marks"
                    value={a2Mark}
                    onChange={(e) => setA2Mark(e.target.value)}
                    className="w-full rounded-lg border bg-[var(--bg-base)] px-2 py-1.5 text-xs font-tabular"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Final (/50)</span>
                  <input
                    type="number"
                    placeholder="Marks"
                    value={a3Mark}
                    onChange={(e) => setA3Mark(e.target.value)}
                    className="w-full rounded-lg border bg-[var(--bg-base)] px-2 py-1.5 text-xs font-tabular"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) handleFileRead(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                dragOver
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--border-hairline)] hover:border-[var(--color-accent)] bg-[var(--bg-elevated)]/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={(e) => e.target.files?.length && handleFileRead(e.target.files[0])}
                className="hidden"
              />
              <Upload size={32} className="mb-2 text-[var(--color-accent)]" />
              <p className="text-sm font-medium">Click to select or drag & drop subjects file</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Supports CSV or JSON subjects format</p>

              {fileName && (
                <div className="mt-3 rounded-md bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-mono text-[var(--color-accent)]">
                  File: {fileName}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>CSV schema: Subject, Credits, Color, Marks...</span>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 text-[var(--color-accent)] hover:underline font-medium"
              >
                <Download size={13} /> Sample CSV Template
              </button>
            </div>

            {parsedSubjects.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                  Parsed Subjects ({parsedSubjects.length})
                </h4>
                <div className="max-h-36 overflow-y-auto rounded-lg border" style={{ borderColor: "var(--border-hairline)" }}>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-elevated)] sticky top-0 border-b" style={{ borderColor: "var(--border-hairline)" }}>
                      <tr>
                        <th className="p-2 font-medium">Subject</th>
                        <th className="p-2 font-medium">Credits</th>
                        <th className="p-2 font-medium">Color</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                      {parsedSubjects.map((s, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 font-tabular">{s.credits}</td>
                          <td className="p-2">
                            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.colorTag }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeModal}
          >
            Cancel
          </Button>
          {activeTab === "form" ? (
            <Button variant="primary" size="sm" onClick={handleSingleAdd} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Subject"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleBulkSave} disabled={parsedSubjects.length === 0 || isSubmitting}>
              {isSubmitting ? "Importing..." : `Import ${parsedSubjects.length} Subjects`}
            </Button>
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
