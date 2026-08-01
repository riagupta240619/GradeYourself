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
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const steps = [
  { id: 1, title: "Academic Info", desc: "College & Program" },
  { id: 2, title: "Academic Status", desc: "CGPA & History" },
  { id: 3, title: "Import Method", desc: "PDF or Manual" },
];

const PRESET_COLLEGES = [
  "Stanford University",
  "Massachusetts Institute of Technology (MIT)",
  "Harvard University",
  "Chitkara University",
  "Indian Institute of Technology (IIT Delhi)",
  "University of California, Berkeley",
  "University of Oxford",
  "Other Institution",
];

const PRESET_COURSES = [
  "B.Tech / B.E. (Bachelor of Technology)",
  "B.S. / B.Sc. (Bachelor of Science)",
  "B.C.A. (Bachelor of Computer Applications)",
  "M.Tech / M.E. (Master of Technology)",
  "M.S. / M.Sc. (Master of Science)",
  "M.B.A. (Master of Business Administration)",
  "M.C.A. (Master of Computer Applications)",
  "Other Degree",
];

const PRESET_BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Data Science & Artificial Intelligence",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Other Department",
];

const PRESET_SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const PRESET_SESSIONS = [
  "2025 - 2026",
  "2024 - 2025",
  "2023 - 2027",
  "2022 - 2026",
  "2021 - 2025",
];

export function OnboardingPage() {
  const { user, updateSetup, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Wizard Navigation State
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"choose" | "upload" | "review">("choose");

  // Step 1: Academic Profile Fields
  const [college, setCollege] = useState(user?.college || "Chitkara University");
  const [course, setCourse] = useState(user?.course || "B.Tech / B.E. (Bachelor of Technology)");
  const [branch, setBranch] = useState(user?.branch || "Computer Science & Engineering");
  const [semesterSystem, setSemesterSystem] = useState(user?.semesterSystem || "Semester 4");
  const [academicSession, setAcademicSession] = useState(user?.academicSession || "2025 - 2026");

  // Step 2: Academic Status Fields
  const [completedPrevious, setCompletedPrevious] = useState<"yes" | "no" | null>(null);
  const [cgpaInput, setCgpaInput] = useState("");
  const [cgpaError, setCgpaError] = useState<string | null>(null);

  // Step 3: Import Method State
  const [selectedImportMethod, setSelectedImportMethod] = useState<"upload" | "manual" | null>(null);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Skip setup if user already completed profile
  useEffect(() => {
    if (user?.profileCompleted) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Finish Onboarding and save profile
  async function handleFinishOnboarding(isManual = false) {
    try {
      const parsedCgpa = completedPrevious === "yes" && cgpaInput.trim() ? parseFloat(cgpaInput) : null;
      const statusText = completedPrevious === "yes"
        ? "Completed Past Semesters"
        : completedPrevious === "no"
        ? "First Semester Student"
        : "Active Student";

      await updateSetup({
        college: college.trim() || "University",
        course: course.trim() || "B.Tech / B.E.",
        branch: branch.trim() || "Computer Science & Engineering",
        semesterSystem: semesterSystem || "Semester 1",
        currentSemester: semesterSystem || "Semester 1",
        academicSession: academicSession.trim() || "2025 - 2026",
        currentCgpa: parsedCgpa && !isNaN(parsedCgpa) ? parsedCgpa : null,
        academicStatus: statusText,
      });
      if (isManual) {
        navigate("/app/dashboard?onboarding=manual");
      } else {
        navigate("/app/dashboard");
      }
    } catch {
      // Error handled in AuthContext
    }
  }

  // Handle CGPA Input Validation
  const handleCgpaChange = (val: string) => {
    setCgpaInput(val);
    if (!val.trim()) {
      setCgpaError(null);
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 10) {
      setCgpaError("CGPA must be a number between 0.00 and 10.00");
    } else {
      setCgpaError(null);
    }
  };

  // Step 1 Validation
  const isStep1Valid = Boolean(
    college.trim() && course.trim() && branch.trim() && semesterSystem && academicSession
  );

  // Step 2 Validation
  const isStep2Valid = Boolean(
    completedPrevious !== null && (!cgpaError)
  );

  // Step 3 Validation
  const isStep3Valid = Boolean(selectedImportMethod !== null);

  // Navigation Logic
  function handleNextStep() {
    if (step === 0) {
      if (!isStep1Valid) return;
      setStep(1);
    } else if (step === 1) {
      if (!isStep2Valid) return;
      handleFinishOnboarding(true);
    }
  }

  function handleBackStep() {
    if (mode === "upload") {
      setMode("choose");
    } else if (mode === "review") {
      setMode("upload");
    } else if (step > 0) {
      setStep((s) => s - 1);
      setMode("choose");
    }
  }

  // File Upload Handlers (Supports PDF, JPG, JPEG, PNG up to 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const isPdf = file.type === "application/pdf" || ext === "pdf";
    const isImg = file.type.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext);

    if (!isPdf && !isImg) {
      setUploadError("Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.");
      setUploadFile(null);
      setImagePreviewUrl(null);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size exceeds the 10MB limit. Please upload a smaller file.");
      setUploadFile(null);
      setImagePreviewUrl(null);
      return false;
    }

    setUploadFile(file);

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }

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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#09090b] text-slate-900 dark:text-white p-4 sm:p-6 overflow-hidden">
      {/* Radial Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-purple-600/15 blur-[120px] opacity-70" />

      <div className="w-full max-w-xl">
        {/* Header Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 font-bold text-slate-900 dark:text-white shadow-lg">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            GradeWise <span className="gradient-purple-text">Academic Onboarding</span>
          </span>
        </div>

        {/* Timeline Bar */}
        <div className="mb-8 grid grid-cols-3 gap-2">
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

        {/* Main Onboarding Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
          {(authError || uploadError || cgpaError) && (
            <div className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{uploadError || cgpaError || authError}</span>
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
              {/* STEP 1: ACADEMIC PROFILE */}
              {step === 0 && mode === "choose" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Academic Profile Setup</h1>
                  <p className="text-xs text-zinc-400 mb-6">Enter your university and degree details to personalize your academic dashboard.</p>

                  <div className="flex flex-col gap-4">
                    {/* College Input / Select */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-700 dark:text-zinc-300">University / Institution Name *</label>
                      <input
                        list="college-suggestions"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Stanford University or Chitkara University"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                      <datalist id="college-suggestions">
                        {PRESET_COLLEGES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Course / Degree */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-700 dark:text-zinc-300">Course / Degree *</label>
                        <input
                          list="course-suggestions"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="e.g. B.Tech / B.S."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />
                        <datalist id="course-suggestions">
                          {PRESET_COURSES.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>

                      {/* Branch / Department */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-700 dark:text-zinc-300">Branch / Department *</label>
                        <input
                          list="branch-suggestions"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />
                        <datalist id="branch-suggestions">
                          {PRESET_BRANCHES.map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Current Semester */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-700 dark:text-zinc-300">Current Semester *</label>
                        <select
                          value={semesterSystem}
                          onChange={(e) => setSemesterSystem(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer"
                        >
                          {PRESET_SEMESTERS.map((s) => (
                            <option key={s} value={s} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Academic Session */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-700 dark:text-zinc-300">Academic Session / Batch *</label>
                        <input
                          list="session-suggestions"
                          value={academicSession}
                          onChange={(e) => setAcademicSession(e.target.value)}
                          placeholder="e.g. 2025 - 2026"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />
                        <datalist id="session-suggestions">
                          {PRESET_SESSIONS.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: ACADEMIC STATUS */}
              {step === 1 && mode === "choose" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Current Academic Status</h1>
                  <p className="text-xs text-zinc-400 mb-6">Specify whether you have completed previous semesters.</p>

                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
                        Have you already completed previous semesters?
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option YES */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setCompletedPrevious("yes")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setCompletedPrevious("yes");
                            }
                          }}
                          className={`relative flex items-center justify-between rounded-2xl border p-5 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                            completedPrevious === "yes"
                              ? "border-purple-500 bg-purple-500/15 shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-2 ring-purple-500/40"
                              : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/5"
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Yes, I have completed past semesters</span>
                          {completedPrevious === "yes" && <CheckCircle2 size={18} className="text-purple-400 shrink-0" />}
                        </div>

                        {/* Option NO */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setCompletedPrevious("no");
                            setCgpaInput("");
                            setCgpaError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setCompletedPrevious("no");
                              setCgpaInput("");
                              setCgpaError(null);
                            }
                          }}
                          className={`relative flex items-center justify-between rounded-2xl border p-5 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                            completedPrevious === "no"
                              ? "border-purple-500 bg-purple-500/15 shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-2 ring-purple-500/40"
                              : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/5"
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-900 dark:text-white">No, this is my 1st semester</span>
                          {completedPrevious === "no" && <CheckCircle2 size={18} className="text-purple-400 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    {/* CGPA Input (Shown if Yes) */}
                    {completedPrevious === "yes" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 mt-2"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                            Current Cumulative CGPA (Optional)
                          </label>
                          <span className="text-[11px] font-mono text-purple-400">Scale: 0.00 – 10.00</span>
                        </div>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={cgpaInput}
                          onChange={(e) => handleCgpaChange(e.target.value)}
                          placeholder="e.g. 8.45"
                          className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-base font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />

                        <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                          <HelpCircle size={14} className="text-purple-400 shrink-0" />
                          <span>Entering your current CGPA improves target planning and prediction accuracy.</span>
                        </p>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 3: IMPORT METHOD */}
              {step === 2 && mode === "choose" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Import Method</h1>
                  <p className="text-xs text-zinc-400 mb-6">How would you like to add your academic data?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Option 1: Upload PDF */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedImportMethod("upload");
                        setUploadError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedImportMethod("upload");
                          setUploadError(null);
                        }
                      }}
                      className={`relative group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        selectedImportMethod === "upload"
                          ? "border-purple-500 bg-purple-500/15 shadow-[0_0_25px_rgba(124,58,237,0.3)] ring-2 ring-purple-500/40"
                          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 hover:border-purple-500/40 hover:bg-purple-500/5"
                      }`}
                    >
                      {selectedImportMethod === "upload" && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-slate-900 dark:text-white shadow-sm">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                        selectedImportMethod === "upload" ? "bg-purple-500 text-white" : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      }`}>
                        <Upload size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white block">Upload Academic Document</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">AI automatically extracts weights from PDF or images</span>
                      </div>
                    </div>

                    {/* Option 2: Manual Setup */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedImportMethod("manual");
                        setUploadError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedImportMethod("manual");
                          setUploadError(null);
                        }
                      }}
                      className={`relative group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        selectedImportMethod === "manual"
                          ? "border-blue-500 bg-blue-500/15 shadow-[0_0_25px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/40"
                          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 hover:border-blue-500/40 hover:bg-blue-500/5"
                      }`}
                    >
                      {selectedImportMethod === "manual" && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-slate-900 dark:text-white shadow-sm">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                        selectedImportMethod === "manual" ? "bg-blue-500 text-white" : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      }`}>
                        <PenLine size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white block">Enter Manually</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">Quick profile setup, add subjects anytime</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* UPLOAD FLOW SCREEN */}
              {step === 2 && mode === "upload" && (
                <>
                  <h1 className="text-xl font-bold tracking-tight mb-1">Upload Academic Document</h1>
                  <p className="text-xs text-zinc-400 mb-6">Select your course syllabus, academic transcript, or mark sheet document for automated extraction.</p>

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
                        : "border-white/15 bg-slate-50 dark:bg-zinc-950/60 hover:border-purple-500/50 hover:bg-purple-500/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Document thumbnail preview"
                        className="h-20 w-20 rounded-xl object-cover border border-purple-500/40 shadow-xl mb-3"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mb-3 shadow-lg">
                        <FileText size={28} />
                      </div>
                    )}

                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {uploadFile ? `${uploadFile.name}` : "Click to browse or drag & drop Academic Document"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Supported formats: PDF, JPG, JPEG, PNG • Maximum file size: 10MB
                    </p>

                    {uploadFile && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 flex items-center gap-2 rounded-xl bg-purple-500/20 border border-purple-500/30 px-3.5 py-2 text-xs text-purple-600 dark:text-purple-300 font-mono font-semibold"
                      >
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                        <span className="text-zinc-400 text-[11px]">({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                            setImagePreviewUrl(null);
                          }}
                          className="ml-1 text-zinc-400 hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-5">
                    <Button variant="ghost" size="sm" onClick={handleBackStep} className="gap-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white">
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
                          Process Document & Continue <ArrowRight size={14} />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* REVIEW EXTRACTED SCHEME SCREEN */}
              {step === 2 && mode === "review" && (
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
                            className="w-16 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900 px-2 py-1 text-right font-mono font-semibold text-slate-900 dark:text-white outline-none"
                          />
                          {f.flagged ? <AlertTriangle size={14} className="text-amber-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-zinc-400 text-right">Total Scheme Weightage: <span className="text-emerald-400 font-bold">100% ✓</span></p>
                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={handleBackStep}>
                      <ArrowLeft size={14} className="mr-1" /> Back
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleFinishOnboarding(false)}>
                      Finish Onboarding & Go to Dashboard <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </>
              )}

              {/* NAVIGATION FOOTER FOR STEPS 0-2 (in mode === "choose") */}
              {mode === "choose" && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-5">
                  {step > 0 ? (
                    <Button variant="ghost" size="sm" onClick={handleBackStep} className="gap-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white">
                      <ArrowLeft size={14} /> Back
                    </Button>
                  ) : <div />}

                  <Button
                    variant="primary"
                    size="md"
                    disabled={
                      loading ||
                      (step === 0 && !isStep1Valid) ||
                      (step === 1 && !isStep2Valid) ||
                      (step === 2 && !isStep3Valid)
                    }
                    onClick={handleNextStep}
                    className="gap-1.5"
                  >
                    {loading ? (
                      "Saving Profile..."
                    ) : step === 1 ? (
                      "Complete Setup & Go to Dashboard →"
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
