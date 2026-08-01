import { useState, useRef, type ChangeEvent } from "react";
import {
  Upload, X, FileText, Download, Plus, Trash2, CheckCircle2, AlertCircle,
  Loader2, Sparkles, Eye, ShieldCheck, Cpu, RefreshCw, Layers, Edit3, AlertTriangle, Info, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SemesterService } from "@/services/semester-service";
import { OcrEngine } from "@/services/ocr-engine";
import { AiDocumentParser, type ExtractedAcademicDocument } from "@/services/ai-document-parser";
import {
  validateTranscriptDocument,
  type ValidatedTranscriptDocument,
  type ValidatedSemester,
} from "@/lib/utils/transcript-validator";

interface UploadResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadResultsModal({ isOpen, onClose, onSuccess }: UploadResultsModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preprocessedUrl, setPreprocessedUrl] = useState<string | null>(null);

  // Pipeline Status & Progress
  const [pipelineStep, setPipelineStep] = useState<
    "idle" | "preprocessing" | "ocr" | "llm" | "validating" | "review" | "saving"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [ocrProgressPct, setOcrProgressPct] = useState<number>(0);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [showRawDrawer, setShowRawDrawer] = useState<boolean>(false);
  const [showDocPreview, setShowDocPreview] = useState<boolean>(false);

  // Extracted Document State (User Editable)
  const [validatedDoc, setValidatedDoc] = useState<ValidatedTranscriptDocument | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function resetState() {
    setFileName(null);
    setPreprocessedUrl(null);
    setPipelineStep("idle");
    setStatusMessage("");
    setOcrProgressPct(0);
    setRawOcrText("");
    setShowRawDrawer(false);
    setShowDocPreview(false);
    setValidatedDoc(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  /**
   * Executes the 7-Step Academic Document Understanding Pipeline:
   * Upload -> Preprocess -> OCR -> LLM Understanding -> Semantic Parsing -> Validation -> User Review Studio
   */
  async function executeParsingPipeline(file: File) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    try {
      // Step 1: Preprocessing & OCR Extraction (OCR is ONLY responsible for raw text)
      setPipelineStep("ocr");
      setStatusMessage("Preprocessing image/PDF & extracting raw text token stream...");

      const ocrResult = await OcrEngine.extractRawText(file, (info) => {
        setStatusMessage(info.status);
        setOcrProgressPct(Math.round(info.progress * 100));
      });

      setRawOcrText(ocrResult.rawText);
      if (ocrResult.preprocessedImageUrl) {
        setPreprocessedUrl(ocrResult.preprocessedImageUrl);
      } else {
        // Data URL fallback for preview
        const reader = new FileReader();
        reader.onload = (e) => setPreprocessedUrl(e.target?.result as string);
        if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      }

      // Step 2: LLM Document Understanding & Zero-Shot Semantic Parsing
      setPipelineStep("llm");
      setStatusMessage("AI Reasoning Engine: Dynamically determining university, semesters, & tables...");

      const extractedDoc: ExtractedAcademicDocument = await AiDocumentParser.parseTranscript(ocrResult.rawText);

      // Step 3: Validation Layer
      setPipelineStep("validating");
      setStatusMessage("Running deterministic validation & integrity verification...");

      const validated = validateTranscriptDocument(extractedDoc);
      setValidatedDoc(validated);

      // Step 4: Ready for User Review Studio
      setPipelineStep("review");
      setStatusMessage("Ready for verification");
    } catch (err: any) {
      console.error("Pipeline Failure:", err);
      setErrorMsg(err.message || "Failed to parse transcript with AI. Please check file readability.");
      setPipelineStep("idle");
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      executeParsingPipeline(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      executeParsingPipeline(e.target.files[0]);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // User Verification Studio Edit Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  function revalidateDoc(updatedDoc: ExtractedAcademicDocument) {
    const validated = validateTranscriptDocument(updatedDoc);
    setValidatedDoc(validated);
  }

  function updateMetadata(field: keyof ExtractedAcademicDocument, value: string) {
    if (!validatedDoc) return;
    const updated = { ...validatedDoc, [field]: value };
    revalidateDoc(updated);
  }

  function updateSemesterField(sIdx: number, field: "semesterName" | "sgpa" | "cgpa", val: any) {
    if (!validatedDoc) return;
    const sems = [...validatedDoc.semesters];
    const sem = { ...sems[sIdx] };

    if (field === "sgpa" || field === "cgpa") {
      const num = parseFloat(val);
      sem[field] = isNaN(num) ? null : num;
    } else {
      sem[field] = val;
    }

    sems[sIdx] = sem;
    revalidateDoc({ ...validatedDoc, semesters: sems });
  }

  function updateSubject(sIdx: number, subIdx: number, field: string, val: any) {
    if (!validatedDoc) return;
    const sems = [...validatedDoc.semesters];
    const sem = { ...sems[sIdx] };
    const subjects = [...sem.subjects];
    const sub = { ...subjects[subIdx] };

    if (field === "credits") {
      const num = parseFloat(val);
      sub.credits = isNaN(num) ? 0 : num;
    } else if (field === "code") {
      sub.code = val.toUpperCase();
    } else if (field === "grade") {
      sub.grade = val.toUpperCase();
      sub.status = sub.grade === "F" || sub.grade === "FAIL" ? "Fail" : "Pass";
    } else if (field === "name") {
      sub.name = val;
    } else if (field === "status") {
      sub.status = val;
    }

    subjects[subIdx] = sub;
    sem.subjects = subjects;
    sems[sIdx] = sem;
    revalidateDoc({ ...validatedDoc, semesters: sems });
  }

  function addSubject(sIdx: number) {
    if (!validatedDoc) return;
    const sems = [...validatedDoc.semesters];
    const sem = { ...sems[sIdx] };
    const subjects = [
      ...sem.subjects,
      {
        code: `SUB0${sem.subjects.length + 1}`,
        name: "New Subject",
        credits: 3,
        grade: "A",
        status: "Pass" as const,
      },
    ];
    sem.subjects = subjects;
    sems[sIdx] = sem;
    revalidateDoc({ ...validatedDoc, semesters: sems });
  }

  function deleteSubject(sIdx: number, subIdx: number) {
    if (!validatedDoc) return;
    const sems = [...validatedDoc.semesters];
    const sem = { ...sems[sIdx] };
    sem.subjects = sem.subjects.filter((_, i) => i !== subIdx);
    sems[sIdx] = sem;
    revalidateDoc({ ...validatedDoc, semesters: sems });
  }

  function addSemesterCard() {
    if (!validatedDoc) return;
    const nextSemNum = validatedDoc.semesters.length + 1;
    const newSem: ValidatedSemester = {
      semester: nextSemNum,
      semesterName: `Semester ${nextSemNum}`,
      sgpa: 8.0,
      cgpa: 8.0,
      credits: 20,
      subjects: [
        { code: "CS101", name: "Core Course I", credits: 4, grade: "A", status: "Pass" },
        { code: "CS102", name: "Core Course II", credits: 4, grade: "A", status: "Pass" },
      ],
      isValid: true,
      isMismatch: false,
      issues: [],
      calculatedCredits: 8,
    };
    revalidateDoc({
      ...validatedDoc,
      semesters: [...validatedDoc.semesters, newSem],
    });
  }

  function deleteSemesterCard(sIdx: number) {
    if (!validatedDoc) return;
    const filtered = validatedDoc.semesters.filter((_, i) => i !== sIdx);
    revalidateDoc({ ...validatedDoc, semesters: filtered });
  }

  /**
   * Save verified records to MongoDB database
   */
  async function handleSaveToDatabase() {
    if (!validatedDoc || validatedDoc.semesters.length === 0) return;

    try {
      setPipelineStep("saving");
      setStatusMessage("Persisting structured academic record to database...");

      await SemesterService.bulkSaveTranscript({
        university: validatedDoc.university,
        program: validatedDoc.program,
        semesters: validatedDoc.semesters.map((s) => ({
          semester: s.semester,
          semesterName: s.semesterName,
          sgpa: s.sgpa,
          cgpa: s.cgpa,
          credits: s.calculatedCredits || s.credits,
          subjects: s.subjects.map((sub: any) => ({
            code: sub.code,
            name: sub.name,
            credits: sub.credits,
            grade: sub.grade,
            status: sub.status,
            gradePoint: sub.gradePoint ?? (sub as any).points ?? null,
            marksObtained: sub.marksObtained ?? (sub as any).marks ?? null,
            maxMarks: sub.maxMarks ?? 100,
            finalPercentage: sub.finalPercentage ?? (sub as any).pct ?? null,
            assessments: Array.isArray((sub as any).assessments) ? (sub as any).assessments : [],
          })),
        })),
      });

      setSuccessMsg("Academic transcript parsed and saved to database successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        resetState();
      }, 1200);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save transcript records to database.");
      setPipelineStep("review");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                AI Academic Document Understanding Studio
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Zero-Template Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Universal layout-agnostic transcript parsing for any university
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Global Alert Messages */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Notice</p>
                <p className="text-slate-300">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Upload Dropzone (When idle) */}
          {pipelineStep === "idle" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                    : "border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950/70"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,image/*"
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">
                  Upload University Mark Sheet / Transcript
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Supports PDFs, PNG, JPG, mobile photographs, screenshots & cropped documents. Works for Chitkara, VTU, Anna Univ, IPU, AKTU, Mumbai Univ, SRM, VIT, NITs, IITs & international universities.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20">
                  <FileText className="w-4 h-4" /> Select Document
                </div>
              </div>

              {/* Supported Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-1">
                    <Sparkles className="w-4 h-4" /> Zero-Template Parsing
                  </div>
                  <p className="text-xs text-slate-400">
                    Document structure is inferred using AI semantic reasoning rather than hardcoded positional templates.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
                    <ShieldCheck className="w-4 h-4" /> Multi-Step Validation
                  </div>
                  <p className="text-xs text-slate-400">
                    Automatic verification of SGPA/CGPA ranges, sequential semester logic, and grade scale checks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
                    <Edit3 className="w-4 h-4" /> Verification Studio
                  </div>
                  <p className="text-xs text-slate-400">
                    Review and edit extracted subjects, credits, and SGPAs before saving records to the database.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Processing Progress Indicator (preprocessing, ocr, llm, validating, saving) */}
          {(pipelineStep === "ocr" || pipelineStep === "llm" || pipelineStep === "validating" || pipelineStep === "saving") && (
            <div className="py-12 px-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping opacity-25"></div>
                <div className="relative w-20 h-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Processing Academic Transcript
                </h3>
                <p className="text-sm text-indigo-300 animate-pulse font-mono">
                  {statusMessage}
                </p>
              </div>

              {/* Step indicator pills */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
                <div className={`p-2 rounded-lg border ${pipelineStep === "ocr" ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold" : "border-slate-800 text-slate-500"}`}>
                  1. Preprocess & OCR
                </div>
                <div className={`p-2 rounded-lg border ${pipelineStep === "llm" ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold" : "border-slate-800 text-slate-500"}`}>
                  2. LLM AI Reasoning
                </div>
                <div className={`p-2 rounded-lg border ${pipelineStep === "validating" ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold" : "border-slate-800 text-slate-500"}`}>
                  3. Validation Layer
                </div>
                <div className={`p-2 rounded-lg border ${pipelineStep === "saving" ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold" : "border-slate-800 text-slate-500"}`}>
                  4. Save to Database
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: User Verification Studio & Interactive Semester Cards */}
          {pipelineStep === "review" && validatedDoc && (
            <div className="space-y-6">
              {/* Document Overview Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={validatedDoc.university}
                      onChange={(e) => updateMetadata("university", e.target.value)}
                      placeholder="University Name"
                      className="bg-transparent text-base font-semibold text-slate-900 dark:text-white border-b border-dashed border-slate-700 hover:border-indigo-400 focus:outline-none focus:border-indigo-500 transition px-1"
                    />
                    <span className="text-xs text-slate-500">(Click to edit name)</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <input
                      type="text"
                      value={validatedDoc.program}
                      onChange={(e) => updateMetadata("program", e.target.value)}
                      placeholder="Program / Course"
                      className="bg-transparent border-b border-slate-800 focus:outline-none focus:border-indigo-500 px-1"
                    />
                    <span>•</span>
                    <span>{validatedDoc.semesters.length} Semesters Detected</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <div className="text-xs text-slate-400">AI Confidence</div>
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-4 h-4" /> {validatedDoc.overallConfidence}%
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDocPreview(!showDocPreview)}
                    className={`text-xs ${
                      showDocPreview
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    {showDocPreview ? "Hide Diff Mode" : "Diff View Mode"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawDrawer(!showRawDrawer)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    {showRawDrawer ? "Hide Raw Text" : "View OCR Text"}
                  </Button>
                </div>
              </div>

              {/* Validation Issues Alert Banner */}
              {validatedDoc.allIssues.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    Validation Layer Summary ({validatedDoc.allIssues.length} items flagged for user review):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {validatedDoc.allIssues.slice(0, 4).map((issue) => (
                      <li key={issue.id}>{issue.message}</li>
                    ))}
                    {validatedDoc.allIssues.length > 4 && (
                      <li className="font-medium text-amber-400">
                        + {validatedDoc.allIssues.length - 4} more items highlighted in semester cards below.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Raw OCR Text Reference Drawer */}
              {showRawDrawer && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Raw Unstructured OCR Output</span>
                    <span>{rawOcrText.length} characters</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap border border-slate-800/80">
                    {rawOcrText || "No raw text available."}
                  </pre>
                </div>
              )}

              {/* Diff View Comparison & Debug Inspector Panel */}
              {showDocPreview && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-semibold text-amber-300 font-mono flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" /> Diff View Comparison Mode (Original OCR → Parsed Values)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Overall Confidence: <span className="text-emerald-400 font-bold">{validatedDoc.overallConfidence}%</span>
                    </span>
                  </div>

                  {/* Diff Table Grid */}
                  <div className="overflow-x-auto max-h-64 overflow-y-auto space-y-3 pr-1">
                    {validatedDoc.semesters.map((sem, sIdx) => (
                      <div key={`diff-sem-${sIdx}`} className="space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-indigo-400">
                          {sem.semesterName} (SGPA: {sem.sgpa ?? "Unparsed"} | CGPA: {sem.cgpa ?? "Unparsed"})
                        </div>
                        <table className="w-full text-left text-[11px] font-mono border border-slate-800 rounded-lg">
                          <thead className="bg-slate-900 text-slate-400 uppercase">
                            <tr>
                              <th className="p-1.5">Code</th>
                              <th className="p-1.5">Parsed Name</th>
                              <th className="p-1.5 text-center">Credits</th>
                              <th className="p-1.5 text-center">Grade</th>
                              <th className="p-1.5 text-center">Validation Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-950/90">
                            {sem.subjects.map((sub, subIdx) => {
                              const issue = sem.issues.find((i) => i.subjectIndex === subIdx);
                              const hasCreditIssue = sub.credits === null || sub.credits === undefined;
                              return (
                                <tr
                                  key={`diff-row-${sIdx}-${subIdx}`}
                                  className={issue ? "bg-amber-500/10" : "hover:bg-slate-900/50"}
                                >
                                  <td className="p-1.5 text-indigo-300 font-bold">{sub.code}</td>
                                  <td className="p-1.5 text-slate-900 dark:text-white">{sub.name}</td>
                                  <td className={`p-1.5 text-center ${hasCreditIssue ? "text-amber-400 font-bold bg-amber-500/20" : "text-slate-300"}`}>
                                    {sub.credits ?? "Req"}
                                  </td>
                                  <td className="p-1.5 text-center text-emerald-400 font-bold">{sub.grade}</td>
                                  <td className="p-1.5 text-center">
                                    {issue ? (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                                        {issue.message}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                                        Verified
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  {/* Debug Pipeline & 11-Pass Trace Details */}
                  {validatedDoc.debugLog && (
                    <div className="pt-3 border-t border-slate-800 text-[11px] font-mono space-y-3">
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span className="flex items-center gap-1.5 text-indigo-400">
                          <Cpu className="w-4 h-4" /> 11-Pass Extraction Pipeline Execution Trace:
                        </span>
                        <span className="text-amber-400 font-bold">
                          {validatedDoc.debugLog.repairLogs?.length || 0} Fields Auto-Repaired (Pass 9)
                        </span>
                      </div>

                      {/* 9-Stage Stage-by-Stage Debugger Report */}
                      {validatedDoc.debugLog.nineStageReport && (
                        <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-slate-800 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-indigo-400" /> 9-Stage Explanatory Debug Pipeline Report
                            </span>
                            <span className={validatedDoc.debugLog.nineStageReport.stage5.detectedRowsCount > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              Stage 5 Rows Detected: {validatedDoc.debugLog.nineStageReport.stage5.detectedRowsCount}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
                            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                              <div className="text-slate-400 font-semibold">STAGE 1: Preprocessing</div>
                              <div>Res: {validatedDoc.debugLog.nineStageReport.stage1.resolution}</div>
                              <div>DPI: {validatedDoc.debugLog.nineStageReport.stage1.dpi} | Contrast: {validatedDoc.debugLog.nineStageReport.stage1.contrastScore}%</div>
                            </div>
                            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                              <div className="text-slate-400 font-semibold">STAGE 2: Raw OCR</div>
                              <div>Chars: {validatedDoc.debugLog.nineStageReport.stage2.charCount}</div>
                              <div>Lines: {validatedDoc.debugLog.nineStageReport.stage2.lineCount}</div>
                            </div>
                            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                              <div className="text-slate-400 font-semibold">STAGE 5: Row Detection</div>
                              <div className="text-emerald-400">Accepted: {validatedDoc.debugLog.nineStageReport.stage5.detectedRowsCount}</div>
                              <div className="text-rose-400">Rejected: {validatedDoc.debugLog.nineStageReport.stage5.rejectedRows.length}</div>
                            </div>
                          </div>

                          {/* Rejected Rows Log with explicit reasons */}
                          {validatedDoc.debugLog.nineStageReport.stage5.rejectedRows.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="text-rose-400 font-semibold">Stage 5 Rejected Row Reasons:</div>
                              <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-400">
                                {validatedDoc.debugLog.nineStageReport.stage5.rejectedRows.slice(0, 4).map((rej, rIdx) => (
                                  <div key={`s5-rej-${rIdx}`} className="truncate">
                                    <span className="text-rose-400 font-bold">[{rej.reason}]</span>: <span className="text-slate-300">{rej.rawLine}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Consensus Engine Decision Traces */}
                      {validatedDoc.debugLog.consensusResult && validatedDoc.debugLog.consensusResult.decisionTraces?.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono">
                          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Consensus Engine Decision Log ({validatedDoc.debugLog.consensusResult.resolvedDisagreementsCount} Discrepancies Resolved)
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Agreement: {validatedDoc.debugLog.consensusResult.overallAgreementScore}%
                            </span>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[10px]">
                            {validatedDoc.debugLog.consensusResult.decisionTraces.map((trace: any, tIdx: number) => (
                              <div key={`trace-${tIdx}`} className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 space-y-0.5">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-indigo-300">[{trace.subjectCode}] Field '{trace.field}'</span>
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px]">
                                    Source: {trace.resolutionSource}
                                  </span>
                                </div>
                                <div className="text-slate-300 flex items-center gap-2">
                                  <span>System 1: <strong className="text-rose-400">{String(trace.system1Value)}</strong></span>
                                  <span>vs</span>
                                  <span>System 2: <strong className="text-indigo-400">{String(trace.system2Value)}</strong></span>
                                  <span>→ Resolved: <strong className="text-emerald-400 font-bold">{String(trace.resolvedValue)}</strong></span>
                                </div>
                                <div className="text-slate-500 text-[9px] truncate">{trace.reason}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Semester Completeness Audit Dashboard */}
                      {validatedDoc.debugLog.completenessAudits && validatedDoc.debugLog.completenessAudits.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 font-mono">
                          <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Semester Completeness Audit (Target: 100% Coverage)
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Avg Coverage: {Math.round(validatedDoc.debugLog.completenessAudits.reduce((s: number, a: any) => s + a.coveragePct, 0) / validatedDoc.debugLog.completenessAudits.length)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            {validatedDoc.debugLog.completenessAudits.map((audit: any) => (
                              <div key={`audit-sem-${audit.semesterNum}`} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-200">
                                  <span>Semester {audit.semesterNum}</span>
                                  <span className={audit.coveragePct >= 100 ? "text-emerald-400" : "text-amber-400"}>
                                    {audit.coveragePct}% Coverage
                                  </span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>Expected: <strong className="text-slate-200">{audit.expectedRows}</strong></span>
                                  <span>Detected: <strong className="text-indigo-300">{audit.detectedRows}</strong></span>
                                  <span>Recovered: <strong className="text-amber-300">{audit.recoveredRows}</strong></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 11 Passes List */}
                      {validatedDoc.debugLog.passExecutionTrace && validatedDoc.debugLog.passExecutionTrace.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {validatedDoc.debugLog.passExecutionTrace.map((step: any) => (
                            <div
                              key={`pass-trace-${step.pass}`}
                              className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start gap-2"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold shrink-0">
                                P{step.pass}
                              </span>
                              <div className="overflow-hidden">
                                <div className="text-slate-200 font-medium truncate">{step.name}</div>
                                <div className="text-slate-400 text-[10px] truncate">{step.details}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Auto-Repaired Fields Log */}
                      {validatedDoc.debugLog.repairLogs && validatedDoc.debugLog.repairLogs.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-amber-300 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Pass 9 Auto-Repaired Fields Log:
                          </div>
                          <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-900/90 p-2 rounded border border-slate-800">
                            {validatedDoc.debugLog.repairLogs.map((log: any, lIdx: number) => (
                              <div key={`repair-${lIdx}`} className="text-slate-300 flex items-center gap-2">
                                <span className="text-indigo-300 font-bold">[{log.subjectCode}]</span>
                                <span className="text-amber-400 font-semibold">{log.field}:</span>
                                <span className="text-slate-500 line-through">{String(log.originalValue ?? "null")}</span>
                                <span className="text-emerald-400 font-bold">→ {String(log.repairedValue)}</span>
                                <span className="text-slate-500 text-[10px]">({log.reason})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejected Lines Log */}
                      {validatedDoc.debugLog.rejectedLines && validatedDoc.debugLog.rejectedLines.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-slate-400 font-semibold">Non-Academic Line Rejections ({validatedDoc.debugLog.rejectedLines.length}):</div>
                          <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-900/50 p-2 rounded border border-slate-800 text-[10px] text-slate-400">
                            {validatedDoc.debugLog.rejectedLines.slice(0, 5).map((rej: any, rIdx: number) => (
                              <div key={`rej-${rIdx}`} className="truncate">
                                <span className="text-rose-400">[{rej.reason}]</span>: <span className="text-slate-300">{rej.line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Render Semester Cards */}
              <div className="space-y-6">
                {validatedDoc.semesters.map((sem, sIdx) => (
                  <div
                    key={`sem-card-${sIdx}`}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 shadow-xl"
                  >
                    {/* Semester Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                          S{sem.semester}
                        </div>
                        <input
                          type="text"
                          value={sem.semesterName}
                          onChange={(e) => updateSemesterField(sIdx, "semesterName", e.target.value)}
                          className="bg-transparent font-semibold text-slate-900 dark:text-white text-base focus:outline-none border-b border-slate-700 focus:border-indigo-500 px-1"
                        />
                      </div>

                      {/* SGPA & CGPA Inputs */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">SGPA:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={sem.sgpa ?? ""}
                            onChange={(e) => updateSemesterField(sIdx, "sgpa", e.target.value)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white font-mono text-sm text-center focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">CGPA:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={sem.cgpa ?? ""}
                            onChange={(e) => updateSemesterField(sIdx, "cgpa", e.target.value)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-900 dark:text-white font-mono text-sm text-center focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="text-xs text-slate-400">
                          Credits: <span className="font-semibold text-indigo-400">{sem.calculatedCredits}</span>
                        </div>

                        <button
                          onClick={() => deleteSemesterCard(sIdx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="Delete Semester"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subject Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Subject Code</th>
                            <th className="py-2.5 px-3">Subject Name</th>
                            <th className="py-2.5 px-3 w-20 text-center">Credits</th>
                            <th className="py-2.5 px-3 w-24 text-center">Grade</th>
                            <th className="py-2.5 px-3 w-24 text-center">Status</th>
                            <th className="py-2.5 px-3 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {sem.subjects.map((sub, subIdx) => {
                            const subIssue = sem.issues.find((i) => i.subjectIndex === subIdx);
                            return (
                              <tr
                                key={`sub-${sIdx}-${subIdx}`}
                                className={`hover:bg-slate-900/40 transition ${
                                  subIssue ? "bg-amber-500/5" : ""
                                }`}
                              >
                                {/* Code */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={sub.code}
                                    onChange={(e) => updateSubject(sIdx, subIdx, "code", e.target.value)}
                                    className="w-full bg-transparent font-mono text-indigo-300 focus:outline-none focus:border-b focus:border-indigo-500 uppercase"
                                    placeholder="CODE"
                                  />
                                </td>

                                {/* Name */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={sub.name}
                                    onChange={(e) => updateSubject(sIdx, subIdx, "name", e.target.value)}
                                    className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none focus:border-b focus:border-indigo-500"
                                    placeholder="Subject Title"
                                  />
                                </td>

                                {/* Credits */}
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={sub.credits ?? ""}
                                    onChange={(e) => updateSubject(sIdx, subIdx, "credits", e.target.value)}
                                    placeholder="Req"
                                    className={`w-14 px-1.5 py-0.5 text-center font-mono rounded text-xs focus:outline-none ${
                                      sub.credits === null || sub.credits === undefined
                                        ? "bg-amber-500/10 border border-amber-500/50 text-amber-300 font-bold"
                                        : "bg-slate-900 border border-slate-700 text-white"
                                    }`}
                                  />
                                </td>

                                {/* Grade */}
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="text"
                                    value={sub.grade}
                                    onChange={(e) => updateSubject(sIdx, subIdx, "grade", e.target.value)}
                                    className="w-16 px-1.5 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-emerald-400 font-bold font-mono uppercase focus:outline-none"
                                  />
                                </td>

                                {/* Status */}
                                <td className="py-2 px-3 text-center">
                                  {sub.status ? (
                                    <button
                                      onClick={() =>
                                        updateSubject(
                                          sIdx,
                                          subIdx,
                                          "status",
                                          sub.status === "Pass" ? "Fail" : "Pass"
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        sub.status === "Fail"
                                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                      }`}
                                    >
                                      {sub.status}
                                    </button>
                                  ) : (
                                    <span className="text-slate-600 text-xs">-</span>
                                  )}
                                </td>

                                {/* Delete Sub */}
                                <td className="py-2 px-3 text-right">
                                  <button
                                    onClick={() => deleteSubject(sIdx, subIdx)}
                                    className="text-slate-500 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSubject(sIdx)}
                      className="border-slate-800 text-indigo-400 hover:bg-indigo-500/10 text-xs w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject to {sem.semesterName}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Semester Card Action */}
              <Button
                variant="outline"
                onClick={addSemesterCard}
                className="w-full border-dashed border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700 py-3"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Additional Semester Block
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {pipelineStep === "review" ? (
            <Button
              variant="outline"
              onClick={() => {
                resetState();
              }}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Start New Document Scan
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
            >
              Cancel
            </Button>

            {pipelineStep === "review" && (
              <Button
                onClick={handleSaveToDatabase}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium text-xs px-5 shadow-lg shadow-indigo-600/25"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Academic Record to Database
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
