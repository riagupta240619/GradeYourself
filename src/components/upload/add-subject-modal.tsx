import { useState, useRef, type ChangeEvent } from "react";
import { Plus, X, Upload, FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { parseNewSubjectsCsv, generateNewSubjectsCsvTemplate, type ParsedSubjectInput } from "@/lib/utils/upload-parser";

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6"];

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
  const { semesters, addSubject, uploadNewSubjects } = useAcademicStore();
  const [activeTab, setActiveTab] = useState<"form" | "bulk">("form");
  
  // Default to current semester or first semester
  const currentSem = semesters.find((s) => s.isCurrent) || semesters[0];
  const [targetSemId, setTargetSemId] = useState<string>(currentSem?.id || "current");

  // Single Form State
  const [name, setName] = useState("");
  const [credits, setCredits] = useState<number>(4);
  const [colorTag, setColorTag] = useState<string>(PALETTE[0]);
  const [a1Mark, setA1Mark] = useState<string>("");
  const [a2Mark, setA2Mark] = useState<string>("");
  const [a3Mark, setA3Mark] = useState<string>("");

  // Bulk Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedSubjects, setParsedSubjects] = useState<ParsedSubjectInput[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
  }

  function handleSingleAdd() {
    if (!name.trim()) {
      setErrorMsg("Subject name is required.");
      return;
    }

    const defaultScheme = {
      id: crypto.randomUUID(),
      name: `${name} Scheme`,
      university: "General",
      isTemplate: false,
      verified: true,
      usedBy: 1,
      assessmentTypes: [
        { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
        { id: "a2", name: "Midterm", weightPct: 30, maxMarks: 50 },
        { id: "a3", name: "Final", weightPct: 50, maxMarks: 100 },
      ],
    };

    addSubject(targetSemId, {
      name: name.trim(),
      credits,
      colorTag,
      scheme: defaultScheme,
      marks: {
        a1: a1Mark !== "" ? parseFloat(a1Mark) : null,
        a2: a2Mark !== "" ? parseFloat(a2Mark) : null,
        a3: a3Mark !== "" ? parseFloat(a3Mark) : null,
      },
    });

    setSuccessMsg(`Subject "${name}" added successfully!`);
    setTimeout(() => {
      resetForm();
      onClose();
    }, 1000);
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
              json.map((s, idx) => ({
                name: s.name || `Subject ${idx + 1}`,
                credits: parseFloat(s.credits || 4),
                colorTag: s.colorTag || PALETTE[idx % PALETTE.length],
                marks: s.marks || { a1: null, a2: null, a3: null },
                scheme: s.scheme || {
                  id: crypto.randomUUID(),
                  name: `${s.name || "Subject"} Scheme`,
                  university: "General",
                  isTemplate: false,
                  verified: true,
                  usedBy: 1,
                  assessmentTypes: [
                    { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
                    { id: "a2", name: "Midterm", weightPct: 30, maxMarks: 50 },
                    { id: "a3", name: "Final", weightPct: 50, maxMarks: 100 },
                  ],
                },
              }))
            );
          } else {
            throw new Error("Expected JSON array of subjects.");
          }
        } else {
          const parsed = parseNewSubjectsCsv(text);
          if (parsed.length === 0) {
            setErrorMsg("No valid subject rows found in CSV.");
          } else {
            setParsedSubjects(parsed);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to read subject file.");
      }
    };
    reader.readAsText(file);
  }

  function handleBulkSave() {
    if (parsedSubjects.length === 0) {
      setErrorMsg("Please upload or parse a file containing subjects.");
      return;
    }

    uploadNewSubjects(targetSemId, parsedSubjects);
    setSuccessMsg(`Successfully imported ${parsedSubjects.length} subject(s)!`);
    setTimeout(() => {
      resetForm();
      onClose();
    }, 1000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className="w-full max-w-lg rounded-xl border bg-[var(--bg-card)] p-6 shadow-2xl animate-scale-up"
        style={{ borderColor: "var(--border-hairline)" }}
      >
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: "var(--border-hairline)" }}>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus size={20} className="text-[var(--color-accent)]" />
              Add or Upload New Subjects
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Add new subjects manually or bulk import them from CSV/JSON.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Semester Picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Target Semester
          </label>
          <select
            value={targetSemId}
            onChange={(e) => setTargetSemId(e.target.value)}
            className="w-full rounded-lg border bg-[var(--bg-base)] px-3 py-2 text-xs font-medium"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {semesters.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.name} {sem.isCurrent ? "(Current)" : ""}
              </option>
            ))}
          </select>
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
                  Credits
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
                  <span className="text-[10px] text-[var(--text-tertiary)]">Midterm (/50)</span>
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
                  <span className="text-[10px] text-[var(--text-tertiary)]">Final (/100)</span>
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
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          {activeTab === "form" ? (
            <Button variant="primary" size="sm" onClick={handleSingleAdd}>
              Add Subject
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleBulkSave} disabled={parsedSubjects.length === 0}>
              Import {parsedSubjects.length} Subjects
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
