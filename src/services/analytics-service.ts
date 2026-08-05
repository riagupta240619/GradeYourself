import { api } from "./api";

export type SubjectStatus =
  | "completed"
  | "in_progress"
  | "reappear"
  | "backlog"
  | "incomplete"
  | "withheld_result";

export const SUBJECT_STATUS_CONFIG: Record<
  SubjectStatus,
  { label: string; tone: string; className: string }
> = {
  completed: {
    label: "Completed",
    tone: "success",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  in_progress: {
    label: "In Progress",
    tone: "accent",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  reappear: {
    label: "Reappear",
    tone: "warning",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  backlog: {
    label: "Backlog",
    tone: "danger",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  incomplete: {
    label: "Incomplete",
    tone: "warning",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  withheld_result: {
    label: "Withheld Result",
    tone: "muted",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

export function resolveSubjectStatus(subj: any): SubjectStatus {
  if (
    subj?.status &&
    [
      "completed",
      "in_progress",
      "reappear",
      "backlog",
      "incomplete",
      "withheld_result",
    ].includes(subj.status)
  ) {
    return subj.status as SubjectStatus;
  }

  const grade = (subj?.grade || subj?.letterGrade || "").trim();
  const hasValidGrade =
    grade !== "" && grade !== "N/A" && grade !== "—" && grade !== "-";
  const hasMarks =
    subj?.marksObtained !== null &&
    subj?.marksObtained !== undefined &&
    subj?.marksObtained !== ("" as any);
  const hasPct =
    (typeof subj?.finalPercentage === "number" && !isNaN(subj.finalPercentage)) ||
    (typeof subj?.pct === "number" && !isNaN(subj.pct) && subj.pct > 0);
  const hasPoints =
    typeof subj?.gradePoint === "number" &&
    !isNaN(subj.gradePoint) &&
    subj.gradePoint > 0;

  if (hasValidGrade || hasMarks || hasPct || hasPoints) {
    return "completed";
  }
  return "in_progress";
}

export const GRADE_RANK_MAP: Record<string, { rankValue: number; label: string }> = {
  "O": { rankValue: 10.0, label: "O" },
  "O+": { rankValue: 10.0, label: "O+" },
  "OUTSTANDING": { rankValue: 10.0, label: "O" },
  "A+": { rankValue: 9.0, label: "A+" },
  "EXCELLENT": { rankValue: 9.0, label: "A+" },
  "A": { rankValue: 8.0, label: "A" },
  "VERY GOOD": { rankValue: 8.0, label: "A" },
  "B+": { rankValue: 7.0, label: "B+" },
  "GOOD": { rankValue: 7.0, label: "B+" },
  "B": { rankValue: 6.0, label: "B" },
  "ABOVE AVERAGE": { rankValue: 6.0, label: "B" },
  "C+": { rankValue: 5.5, label: "C+" },
  "C": { rankValue: 5.0, label: "C" },
  "AVERAGE": { rankValue: 5.0, label: "C" },
  "P": { rankValue: 4.0, label: "P" },
  "D": { rankValue: 4.0, label: "D" },
  "PASS": { rankValue: 4.0, label: "P" },
  "F": { rankValue: 0.0, label: "F" },
  "FAIL": { rankValue: 0.0, label: "F" },
  "E": { rankValue: 0.0, label: "E" },
};

const INVALID_GRADE_STRINGS = new Set([
  "IN PROGRESS",
  "IN_PROGRESS",
  "COMPLETED",
  "PENDING",
  "NOT ATTEMPTED",
  "INCOMPLETE",
  "WITHHELD_RESULT",
  "WITHHELD",
  "N/A",
  "—",
  "-",
  "NULL",
  "UNDEFINED",
]);

export function getSubjectGradeNumericScore(subj: any): number {
  if (!subj) return 0;
  const rawGrade = (subj.grade || subj.letterGrade || "").toString().trim().toUpperCase();
  if (rawGrade && !INVALID_GRADE_STRINGS.has(rawGrade) && rawGrade in GRADE_RANK_MAP) {
    return GRADE_RANK_MAP[rawGrade].rankValue;
  }
  if (typeof subj.gradePoint === "number" && !isNaN(subj.gradePoint) && subj.gradePoint > 0) {
    return subj.gradePoint <= 10 ? subj.gradePoint : subj.gradePoint / 10;
  }
  if (
    typeof subj.marksObtained === "number" &&
    typeof subj.maxMarks === "number" &&
    subj.maxMarks > 0
  ) {
    return (subj.marksObtained / subj.maxMarks) * 10;
  }
  const pct = subj.finalPercentage ?? subj.pct;
  if (typeof pct === "number" && !isNaN(pct) && pct > 0 && pct <= 100) {
    return pct / 10;
  }
  return 0;
}

export function getSubjectNormalizedGrade(subj: any): string {
  if (!subj) return "—";
  const rawGrade = (subj.grade || subj.letterGrade || "").toString().trim().toUpperCase();
  if (rawGrade && !INVALID_GRADE_STRINGS.has(rawGrade) && rawGrade in GRADE_RANK_MAP) {
    return GRADE_RANK_MAP[rawGrade].label;
  }
  if (rawGrade && !INVALID_GRADE_STRINGS.has(rawGrade)) {
    return rawGrade;
  }
  const score = getSubjectGradeNumericScore(subj);
  if (score >= 9.5) return "O";
  if (score >= 8.5) return "A+";
  if (score >= 7.5) return "A";
  if (score >= 6.5) return "B+";
  if (score >= 5.5) return "B";
  if (score >= 4.5) return "C+";
  if (score >= 4.0) return "C";
  if (score >= 3.5) return "D";
  if (score > 0) return "F";
  return "—";
}

export function getSubjectEffectiveScore(subj: any): number | null {
  if (!subj) return null;
  const score = getSubjectGradeNumericScore(subj);
  if (score > 0) return score;
  return null;
}

export interface AnalyticsSubject {
  name: string;
  code: string;
  credits: number;
  pct: number;
  letterGrade: string;
  gradePoint: number;
  status?: SubjectStatus;
  semester?: string;
}

export interface AssessmentItem {
  name: string;
  marksObtained: number | null;
  maxMarks: number | null;
  weightPct?: number | null;
}

export interface DetailedSemesterSubject {
  id: string;
  _id?: string;
  subjectName: string;
  name: string;
  subjectCode: string;
  code: string;
  credits: number;
  marksObtained: number | null;
  maxMarks: number | null;
  finalPercentage: number | null;
  pct: number;
  grade: string | null;
  letterGrade: string;
  gradePoint: number | null;
  remarks?: string | null;
  status?: SubjectStatus;
  assessments: AssessmentItem[];
}

export interface SemesterSummary {
  highestSubject: { name: string; code: string; pct: number } | null;
  lowestSubject: { name: string; code: string; pct: number } | null;
  averageMarks: number;
  totalCredits: number;
  sgpa: number | null;
}

export interface CompletedSemesterDetail {
  id: string;
  _id?: string;
  name: string;
  semesterNumber: number;
  isCurrent?: boolean;
  sgpa: number | null;
  cgpa?: number | null;
  creditsEarned: number;
  credits?: number;
  totalCredits?: number;
  totalSubjects: number;
  verificationStatus: string;
  updatedAt?: string;
  subjects: DetailedSemesterSubject[];
  summary: SemesterSummary;
  aiInsight?: string;
}

export interface CreditDistributionItem {
  category: string;
  credits: number;
  count: number;
}

export interface AnalyticsSummary {
  semesterTrend: Array<{ semester: string; sgpa: number }>;
  cgpaHistory: Array<{ semester: string; cgpa: number }>;
  creditDistribution: CreditDistributionItem[];
  highestSubject: AnalyticsSubject;
  lowestSubject: AnalyticsSubject;
  totalSubjectsEvaluated: number;
  completedSemesters?: CompletedSemesterDetail[];
}

export const AnalyticsService = {
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await api.get<AnalyticsSummary>("/analytics");
    console.log("Transcript API Response", response.data);
    return response.data;
  },
};
