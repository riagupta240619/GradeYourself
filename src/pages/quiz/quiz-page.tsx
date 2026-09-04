import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  History,
  HelpCircle,
  Award,
  ChevronRight,
  Layers,
  X,
  Check,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface QuizQuestion {
  _id?: string;
  question: string;
  type: "mcq" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
  difficulty?: string;
}

interface QuizDocument {
  _id: string;
  title: string;
  sourceFileName?: string;
  numQuestions: number;
  difficulty: string;
  topics: string[];
  questions: QuizQuestion[];
}

interface QuizAttempt {
  _id: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  strongTopics: string[];
  weakTopics: string[];
  completedAt: string;
  answers: {
    questionIndex: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
    topic?: string;
  }[];
}

interface StorageFile {
  _id: string;
  name: string;
  size: number;
  mimeType: string;
}

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedFileId = searchParams.get("fileId");
  const preselectedTitle = searchParams.get("title");

  // Step Mode: "setup" | "generating" | "active" | "results" | "history"
  const [mode, setMode] = useState<"setup" | "generating" | "active" | "results" | "history">("setup");

  // Setup Config
  const [sourceType, setSourceType] = useState<"upload" | "storage">(preselectedFileId ? "storage" : "upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStorageFileId, setSelectedStorageFileId] = useState<string>(preselectedFileId || "");
  const [quizTitle, setQuizTitle] = useState(preselectedTitle || "");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["mcq", "true_false"]);
  const [saveToStorage, setSaveToStorage] = useState(true);

  // Storage Files List
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizDocument | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results State
  const [lastAttempt, setLastAttempt] = useState<any>(null);

  // History State
  const [historyAttempts, setHistoryAttempts] = useState<QuizAttempt[]>([]);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] = useState<QuizAttempt | null>(null);

  // Load storage files if picking from storage
  useEffect(() => {
    if (sourceType === "storage") {
      setLoadingStorage(true);
      api
        .get("/storage/files")
        .then((res) => {
          const pdfs = (res.data.files || []).filter(
            (f: any) => f.mimeType?.includes("pdf") || f.name?.endsWith(".pdf")
          );
          setStorageFiles(pdfs);
        })
        .catch(() => {
          setStorageFiles([]);
        })
        .finally(() => setLoadingStorage(false));
    }
  }, [sourceType]);

  // Load History
  const loadHistory = async () => {
    try {
      const res = await api.get("/quizzes/history");
      setHistoryAttempts(res.data.attempts || []);
    } catch (err) {
      console.error("Failed to load quiz history:", err);
    }
  };

  useEffect(() => {
    if (mode === "history") {
      void loadHistory();
    }
  }, [mode]);

  // Generate Quiz
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === "upload" && !selectedFile) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (sourceType === "storage" && !selectedStorageFileId) {
      toast.error("Please select a PDF file from your storage");
      return;
    }

    try {
      setMode("generating");
      const formData = new FormData();
      if (sourceType === "upload" && selectedFile) {
        formData.append("file", selectedFile);
        formData.append("saveToStorage", String(saveToStorage));
      } else {
        formData.append("fileId", selectedStorageFileId);
      }

      formData.append("title", quizTitle.trim() || selectedFile?.name || "Generated Quiz");
      formData.append("numQuestions", String(numQuestions));
      formData.append("difficulty", difficulty);
      formData.append("questionTypes", questionTypes.join(","));

      const res = await api.post("/quizzes/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setActiveQuiz(res.data.quiz);
      setCurrentIndex(0);
      setUserAnswers({});
      setMode("active");
      toast.success(res.data.message || "Quiz generated successfully!");
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to generate quiz from PDF");
      setMode("setup");
    }
  };

  // Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (
      answeredCount < activeQuiz.questions.length &&
      !confirm(`You have answered ${answeredCount} of ${activeQuiz.questions.length} questions. Submit anyway?`)
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/quizzes/${activeQuiz._id}/submit`, { userAnswers });
      setLastAttempt(res.data);
      setMode("results");
      toast.success(`Quiz completed! Score: ${res.data.score}/${res.data.totalQuestions}`);
    } catch (err) {
      toast.error("Failed to submit quiz attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleType = (t: string) => {
    if (questionTypes.includes(t)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((x) => x !== t));
      }
    } else {
      setQuestionTypes([...questionTypes, t]);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Brain size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                AI PDF to Quiz Generator
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Transform any lecture note, textbook chapter, or study PDF into interactive quizzes with automated weak-topic analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode !== "setup" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveQuiz(null);
                setMode("setup");
              }}
              className="text-xs"
            >
              <RotateCcw size={13} className="mr-1" /> New Quiz
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode(mode === "history" ? "setup" : "history")}
            className="text-xs"
          >
            <History size={14} className="mr-1.5" />
            {mode === "history" ? "Quiz Workspace" : "Past Quizzes"}
          </Button>
        </div>
      </div>

      {/* STEP 1: SETUP VIEW */}
      {mode === "setup" && (
        <form onSubmit={handleGenerateQuiz} className="space-y-6">
          <div className="surface-card rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Step 1: Choose Your Study PDF
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Upload a document or select an existing study file directly from your Personal Storage.
              </p>
            </div>

            {/* Source Tab Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType("upload")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition",
                  sourceType === "upload"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 shadow-xs"
                    : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                )}
              >
                <Upload size={16} />
                <span>Upload PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("storage")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition",
                  sourceType === "storage"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 shadow-xs"
                    : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                )}
              >
                <HardDrive size={16} />
                <span>Select from My Storage</span>
              </button>
            </div>

            {/* Upload or Storage Selection */}
            {sourceType === "upload" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center bg-[var(--bg-surface-elevated)]">
                  <Upload className="mx-auto h-8 w-8 text-purple-600 mb-2 opacity-80" />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    required={!selectedFile}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!quizTitle) setQuizTitle(file.name.replace(/\.pdf$/i, ""));
                      }
                    }}
                    className="block w-full text-xs text-[var(--text-secondary)] file:mr-4 file:rounded-xl file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-purple-700"
                  />
                  <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                    Text-based PDF documents work best. Max 25 MB.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveStorage"
                    checked={saveToStorage}
                    onChange={(e) => setSaveToStorage(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <label htmlFor="saveStorage" className="text-xs text-[var(--text-secondary)] font-medium">
                    Save uploaded PDF into My Storage for future review
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {loadingStorage ? (
                  <p className="text-xs text-[var(--text-secondary)]">Loading storage PDFs...</p>
                ) : storageFiles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--text-tertiary)]">
                    No PDF files found in My Storage. Upload a PDF above or add files in My Storage.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                    {storageFiles.map((file) => (
                      <button
                        key={file._id}
                        type="button"
                        onClick={() => {
                          setSelectedStorageFileId(file._id);
                          setQuizTitle(file.name.replace(/\.pdf$/i, ""));
                        }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3 text-left transition",
                          selectedStorageFileId === file._id
                            ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 font-semibold"
                            : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-purple-400"
                        )}
                      >
                        <FileText size={18} className="text-red-500 shrink-0" />
                        <span className="truncate text-xs">{file.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Quiz Configuration (5.2 Requirement) */}
            <div className="pt-4 border-t border-[var(--border)] space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Step 2: Quiz Settings
              </h3>

              <div>
                <label className="font-semibold text-xs text-[var(--text-secondary)] block mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems - CPU Scheduling & Deadlocks"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Number of questions */}
                <div>
                  <label className="font-semibold text-xs text-[var(--text-secondary)] block mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value={5}>5 Questions (Quick Check)</option>
                    <option value={10}>10 Questions (Standard Quiz)</option>
                    <option value={15}>15 Questions (Thorough)</option>
                    <option value={20}>20 Questions (Comprehensive)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="font-semibold text-xs text-[var(--text-secondary)] block mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="easy">Easy (Definitions & Syntax)</option>
                    <option value="medium">Medium (Concepts & Logic)</option>
                    <option value="hard">Hard (Analysis & Edge Cases)</option>
                  </select>
                </div>

                {/* Question Types */}
                <div>
                  <label className="font-semibold text-xs text-[var(--text-secondary)] block mb-1">
                    Question Types
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      { id: "mcq", label: "MCQ" },
                      { id: "true_false", label: "True / False" },
                      { id: "short_answer", label: "Short Answer" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleType(type.id)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                          questionTypes.includes(type.id)
                            ? "bg-purple-600 text-white"
                            : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 px-6"
              >
                <Sparkles size={15} className="mr-1.5" />
                Extract Text & Generate Quiz
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: GENERATING STATE (5.3 Feedback Requirement) */}
      {mode === "generating" && (
        <div className="surface-card rounded-2xl p-16 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-600" />
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Extracting Content & Synthesizing Quiz...
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Extracting textual hierarchy from PDF, identifying core conceptual topics, and formulating verified question pairs.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: ACTIVE QUIZ RUNNER (5.5 Requirement) */}
      {mode === "active" && activeQuiz && (
        <div className="space-y-6">
          {/* Top Info Bar */}
          <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-md bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-bold">
                {activeQuiz.difficulty.toUpperCase()}
              </span>
              <h2 className="font-bold text-sm text-[var(--text-primary)] mt-1">{activeQuiz.title}</h2>
            </div>

            {/* Question Progress Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                Question {currentIndex + 1} of {activeQuiz.questions.length}
              </span>
              <Button
                size="sm"
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} className="mr-1" />
                Finish & Submit
              </Button>
            </div>
          </div>

          {/* Question Nav Pills */}
          <div className="flex flex-wrap gap-1.5 surface-card rounded-xl p-3">
            {activeQuiz.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-bold transition",
                  currentIndex === idx
                    ? "bg-purple-600 text-white shadow-xs"
                    : userAnswers[idx]
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-strong)]"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Current Question Card */}
          {(() => {
            const currentQ = activeQuiz.questions[currentIndex];
            if (!currentQ) return null;

            return (
              <div className="surface-card rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] border-b border-[var(--border)] pb-3">
                  <span>Topic: {currentQ.topic || "Core Concept"}</span>
                  <span className="capitalize">Type: {currentQ.type.replace("_", " ")}</span>
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Question Type Renderer */}
                {currentQ.type === "mcq" && currentQ.options && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[currentIndex] === opt;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => setUserAnswers({ ...userAnswers, [currentIndex]: opt })}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-4 text-left text-xs transition",
                            isSelected
                              ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 font-semibold shadow-xs"
                              : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-purple-400"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                              isSelected
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-[var(--border)] text-[var(--text-tertiary)]"
                            )}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === "true_false" && (
                  <div className="grid grid-cols-2 gap-3">
                    {["True", "False"].map((choice) => {
                      const isSelected = userAnswers[currentIndex]?.toLowerCase() === choice.toLowerCase();
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setUserAnswers({ ...userAnswers, [currentIndex]: choice })}
                          className={cn(
                            "rounded-xl border p-4 text-center font-bold text-sm transition",
                            isSelected
                              ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 shadow-xs"
                              : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-purple-400"
                          )}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === "short_answer" && (
                  <div>
                    <label className="font-semibold text-xs text-[var(--text-secondary)] block mb-1">
                      Your Answer:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Type your response here..."
                      value={userAnswers[currentIndex] || ""}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="text-xs"
                  >
                    <ArrowLeft size={14} className="mr-1" /> Previous
                  </Button>

                  {currentIndex < activeQuiz.questions.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                      className="bg-purple-600 text-xs text-white"
                    >
                      Next Question <ArrowRight size={14} className="ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="bg-emerald-600 text-xs text-white"
                    >
                      Submit Quiz <CheckCircle2 size={14} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STEP 4: RESULTS & PERFORMANCE ANALYSIS (5.6 & 5.7 Requirements) */}
      {mode === "results" && lastAttempt && (
        <div className="space-y-6">
          {/* Score Banner */}
          <div className="surface-card rounded-2xl p-8 text-center bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
            <Award className="mx-auto h-12 w-12 text-purple-600 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Quiz Completed
            </span>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">
                {lastAttempt.score} / {lastAttempt.totalQuestions}
              </span>
              <span className="text-lg font-bold text-purple-600">
                ({lastAttempt.percentage}%)
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {lastAttempt.percentage >= 80
                ? "Excellent mastery of the material!"
                : lastAttempt.percentage >= 60
                ? "Good effort! Review the weak topics below to solidify your understanding."
                : "Needs revision. Focus on the identified topics below."}
            </p>
          </div>

          {/* 5.7 Performance Analysis: Strong vs Weak Topics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Strong Topics */}
            <div className="surface-card rounded-2xl p-5 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-300 mb-3">
                <CheckCircle2 size={16} />
                <span>Strong Topics (Mastered)</span>
              </div>
              {lastAttempt.strongTopics?.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] italic">
                  Keep practicing to establish high-confidence topics.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lastAttempt.strongTopics?.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold"
                    >
                      ✓ {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weak Topics */}
            <div className="surface-card rounded-2xl p-5 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300 mb-3">
                <AlertTriangle size={16} />
                <span>Needs Improvement</span>
              </div>
              {lastAttempt.weakTopics?.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">
                  Zero weak topics detected! Outstanding performance across all concepts.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lastAttempt.weakTopics?.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 text-xs font-bold"
                    >
                      ⚠ {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-4">
              Detailed Answer Evaluation
            </h3>
            <div className="space-y-4">
              {lastAttempt.attempt?.answers?.map((ans: any, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-4 text-xs",
                    ans.isCorrect
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)]">
                      {idx + 1}. {ans.questionText}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold shrink-0",
                        ans.isCorrect
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-500/20 text-red-700 dark:text-red-300"
                      )}
                    >
                      {ans.isCorrect ? "Correct (+1)" : "Incorrect (0)"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-[var(--text-secondary)]">
                      Your answer:{" "}
                      <strong className={ans.isCorrect ? "text-emerald-600" : "text-red-600"}>
                        {ans.userAnswer || "(No answer entered)"}
                      </strong>
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-[var(--text-secondary)]">
                        Correct answer: <strong className="text-emerald-600">{ans.correctAnswer}</strong>
                      </p>
                    )}
                    {ans.explanation && (
                      <p className="mt-2 text-[11px] text-[var(--text-tertiary)] italic bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border)]">
                        {ans.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: QUIZ HISTORY (5.8 Requirement) */}
      {mode === "history" && (
        <div className="surface-card rounded-2xl p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
            Quiz History & Past Attempts
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Review your scores, timestamps, and diagnosed topic proficiencies over time.
          </p>

          {historyAttempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--text-tertiary)]">
              <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
              No previous quizzes recorded. Upload a PDF to generate your first quiz!
            </div>
          ) : (
            <div className="space-y-3">
              {historyAttempts.map((attempt) => (
                <div
                  key={attempt._id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 transition"
                >
                  <div>
                    <h3 className="font-bold text-xs text-[var(--text-primary)]">
                      {attempt.quizTitle}
                    </h3>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      Completed on {new Date(attempt.completedAt).toLocaleDateString()} at{" "}
                      {new Date(attempt.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                        {attempt.score} / {attempt.totalQuestions}
                      </span>
                      <span className="text-[11px] text-purple-600 block font-semibold">
                        {attempt.percentage}%
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLastAttempt({
                          attempt,
                          score: attempt.score,
                          totalQuestions: attempt.totalQuestions,
                          percentage: attempt.percentage,
                          strongTopics: attempt.strongTopics,
                          weakTopics: attempt.weakTopics,
                        });
                        setMode("results");
                      }}
                      className="text-xs"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
