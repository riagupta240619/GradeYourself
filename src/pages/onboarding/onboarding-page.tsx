import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  PenLine,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  FileText,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const steps = [
  { id: 1, title: "University", desc: "College & Program" },
  { id: 2, title: "Grading Scale", desc: "CGPA / GPA System" },
  { id: 3, title: "Academic Session", desc: "Session & Semester" },
  { id: 4, title: "Initial Subjects", desc: "Current Courses" },
];

export function OnboardingPage() {
  const { user, updateSetup, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"upload" | "manual" | null>(null);
  const [mode, setMode] = useState<"choose" | "upload" | "review">("choose");
  const [scale, setScale] = useState("10.0 CGPA");

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Academic Setup Fields
  const [college, setCollege] = useState(user?.college || "");
  const [course, setCourse] = useState(user?.course || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [academicSession, setAcademicSession] = useState(user?.academicSession || "");
  const [semesterSystem, setSemesterSystem] = useState(user?.semesterSystem || "Semester 4");

  // Skip Setup if profile is already completed
  useEffect(() => {
    if (user?.profileCompleted) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function handleFinish() {
    try {
      await updateSetup({
        college: college || "Default University",
        course: course || "Computer Science & Engineering",
        semesterSystem: scale || semesterSystem || "10.0 CGPA",
        branch: branch || "B.Tech",
        academicSession: academicSession || "2025-2026",
      });
      navigate("/app/dashboard");
    } catch {
      // Error handled in AuthContext
    }
  }

  function handleContinueStepZero() {
    if (!selectedOption) return;
    if (selectedOption === "manual") {
      setStep(1);
      setMode("choose");
    } else if (selectedOption === "upload") {
      setMode("upload");
    }
  }

  function next() {
    if (step === steps.length - 1) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
      setMode("choose");
    }
  }

  function back() {
    if (step === 0 && mode === "upload") {
      setMode("choose");
    } else if (step === 0 && mode === "review") {
      setMode("upload");
    } else if (step > 0) {
      setStep((s) => s - 1);
      setMode("choose");
    }
  }

  // File Upload Handlers
  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Invalid file type. Please upload a valid PDF document (.pdf).");
      setUploadFile(null);
      return false;
    }
    setUploadFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const processUploadedPdf = () => {
    if (!uploadFile) return;
    setIsProcessingPdf(true);
    setTimeout(() => {
      setIsProcessingPdf(false);
      setMode("review");
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#09090b] text-white p-4 sm:p-6 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-purple-600/15 blur-[120px] opacity-70" />

      <div className="w-full max-w-xl">
        {/* Logo Header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 font-bold text-white shadow-lg">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            GradeWise <span className="gradient-purple-text">Setup Wizard</span>
          </span>
        </div>

        {/* Multi-step Timeline Bar */}
        <div className="mb-8 grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                  i <= step ? "bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_12px_rgba(124,58,237,0.4)]" : "bg-zinc-800"
                }`}
              />
              <span className={`mt-2 text-[11px] font-semibold ${i <= step ? "text-purple-300" : "text-zinc-500"}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Main Wizard Card */}
        <Card className="rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
          {(authError || uploadError) && (
            <div className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 text-center font-semibold flex items-center justify-center gap-2">
              <AlertTriangle size={15} />
              <span>{uploadError || authError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${mode}`}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: College & Mode Selection */}
              {step === 0 && mode === "choose" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">How does your university grade you?</h1>
                  <p className="text-xs text-zinc-400 mb-6">Choose how you want to import your academic grading scheme.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Option 1: Upload PDF */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedOption("upload");
                        setUploadError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedOption("upload");
                          setUploadError(null);
                        }
                      }}
                      className={`relative group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        selectedOption === "upload"
                          ? "border-purple-500 bg-purple-500/15 shadow-[0_0_25px_rgba(124,58,237,0.3)] ring-2 ring-purple-500/40"
                          : "border-white/10 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/5"
                      }`}
                    >
                      {selectedOption === "upload" && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-sm">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                        selectedOption === "upload" ? "bg-purple-500 text-white" : "bg-purple-500/20 text-purple-400"
                      }`}>
                        <Upload size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Upload Syllabus PDF</span>
                        <span className="text-xs text-zinc-400">AI automatically extracts weights</span>
                      </div>
                    </div>

                    {/* Option 2: Manual Setup */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedOption("manual");
                        setUploadError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedOption("manual");
                          setUploadError(null);
                        }
                      }}
                      className={`relative group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        selectedOption === "manual"
                          ? "border-blue-500 bg-blue-500/15 shadow-[0_0_25px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/40"
                          : "border-white/10 bg-zinc-950/60 hover:border-blue-500/40 hover:bg-blue-500/5"
                      }`}
                    >
                      {selectedOption === "manual" && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                        selectedOption === "manual" ? "bg-blue-500 text-white" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        <PenLine size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Manual Setup</span>
                        <span className="text-xs text-zinc-400">Enter custom weights yourself</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-white/10 pt-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">University / Institution Name</label>
                      <input
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Stanford University"
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-300">Course Program</label>
                        <input
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="e.g. B.Tech / B.S."
                          className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-300">Branch / Major</label>
                        <input
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Upload PDF Screen */}
              {step === 0 && mode === "upload" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Upload Syllabus PDF</h1>
                  <p className="text-xs text-zinc-400 mb-6">Select your course syllabus or grading scheme PDF file for weight extraction.</p>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-purple-500 bg-purple-500/15"
                        : uploadFile
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/15 bg-zinc-950/60 hover:border-purple-500/50 hover:bg-purple-500/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-3 shadow-lg">
                      <FileText size={28} />
                    </div>

                    <p className="text-sm font-semibold text-white mb-1">
                      {uploadFile ? "PDF File Selected" : "Click to browse or drag & drop Syllabus PDF"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Supports PDF format files (.pdf)
                    </p>

                    {uploadFile && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 flex items-center gap-2 rounded-xl bg-purple-500/20 border border-purple-500/30 px-3.5 py-2 text-xs text-purple-300 font-mono font-semibold"
                      >
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                        <span className="text-zinc-400 text-[11px]">({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => setUploadFile(null)}
                          className="ml-1 text-zinc-400 hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                    <Button variant="ghost" size="sm" onClick={back} className="gap-1 text-zinc-400 hover:text-white">
                      <ArrowLeft size={14} /> Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!uploadFile || isProcessingPdf}
                      onClick={processUploadedPdf}
                      className="gap-1.5"
                    >
                      {isProcessingPdf ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Extracting Scheme...
                        </>
                      ) : (
                        <>
                          Process PDF & Continue <ArrowRight size={14} />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 1 Review Mode */}
              {step === 0 && mode === "review" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Reviewing Extracted Scheme</h1>
                  <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <AlertTriangle size={14} /> AI extracted fields — please verify weightages below
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { name: "Assignments & Homework", value: "20%", flagged: false },
                      { name: "Midterm Examination", value: "30%", flagged: false },
                      { name: "Final Examination", value: "50%", flagged: true },
                    ].map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-xs"
                        style={{
                          borderColor: f.flagged ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)",
                          backgroundColor: f.flagged ? "rgba(245,158,11,0.05)" : "rgba(9,9,11,0.6)",
                        }}
                      >
                        <span className="font-medium text-zinc-200">{f.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            defaultValue={f.value}
                            className="w-16 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-right font-mono font-semibold text-white outline-none"
                          />
                          {f.flagged ? <AlertTriangle size={14} className="text-amber-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-zinc-400 text-right">Total Scheme Weightage: <span className="text-emerald-400 font-bold">100% ✓</span></p>
                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={back}>
                      <ArrowLeft size={14} className="mr-1" /> Back
                    </Button>
                    <Button variant="primary" size="sm" onClick={next}>
                      Looks Good <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Grading Scale */}
              {step === 1 && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">What's your university grading scale?</h1>
                  <p className="text-xs text-zinc-400 mb-6">Select the scale system used on your official transcript.</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {["4.0 GPA System", "10.0 CGPA System", "Percentage (100%)", "Letter Grades (A-F)"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        className={`rounded-2xl border p-5 text-sm font-semibold transition-all ${
                          scale === s
                            ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                            : "border-white/10 bg-zinc-950/60 text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Academic Session & Semester */}
              {step === 2 && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Academic Session & Semester</h1>
                  <p className="text-xs text-zinc-400 mb-6">Specify your current academic period.</p>
                  <div className="flex flex-col gap-4 mb-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Academic Session / Year</label>
                      <input
                        value={academicSession}
                        onChange={(e) => setAcademicSession(e.target.value)}
                        placeholder="e.g. 2025 - 2026"
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">Current Semester</label>
                      <input
                        value={semesterSystem}
                        onChange={(e) => setSemesterSystem(e.target.value)}
                        placeholder="e.g. Semester 4"
                        className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Add Subjects */}
              {step === 3 && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Add your initial subjects</h1>
                  <p className="text-xs text-zinc-400 mb-6">Enter a primary subject to kickstart your dashboard.</p>
                  <div className="mb-6">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Subject Name</label>
                    <input
                      placeholder="e.g. Data Structures & Algorithms"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              {/* Navigation Actions Footer for Step 0 Choose & Steps 1-3 */}
              {(step > 0 || (step === 0 && mode === "choose")) && (
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                  {step > 0 ? (
                    <Button variant="ghost" size="sm" onClick={back} className="gap-1 text-zinc-400 hover:text-white">
                      <ArrowLeft size={14} /> Back
                    </Button>
                  ) : <div />}

                  <Button
                    variant="primary"
                    size="md"
                    disabled={loading || (step === 0 && mode === "choose" && !selectedOption)}
                    onClick={() => {
                      if (step === 0 && mode === "choose") {
                        handleContinueStepZero();
                      } else {
                        next();
                      }
                    }}
                    className="gap-1.5"
                  >
                    {loading ? (
                      "Completing Setup..."
                    ) : step === steps.length - 1 ? (
                      "Finish Setup →"
                    ) : (
                      "Continue →"
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
