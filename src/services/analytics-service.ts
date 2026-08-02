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

export function getSubjectEffectiveScore(subj: any): number | null {
  if (!subj) return null;

  // Priority 1: finalPercentage or pct
  const pctVal = subj.finalPercentage ?? subj.pct;
  if (typeof pctVal === "number" && !isNaN(pctVal) && pctVal >= 0) {
    return Math.round(pctVal * 10) / 10;
  }

  // Priority 2: marksObtained / maxMarks
  const marks = subj.marksObtained;
  const max = subj.maxMarks;
  if (
    typeof marks === "number" &&
    !isNaN(marks) &&
    typeof max === "number" &&
    !isNaN(max) &&
    max > 0
  ) {
    return Math.round((marks / max) * 1000) / 10;
  }

  // Priority 3: gradePoint
  const gp = subj.gradePoint;
  if (typeof gp === "number" && !isNaN(gp) && gp >= 0) {
    return gp <= 10 ? Math.round(gp * 100) / 10 : Math.round(gp * 10) / 10;
  }

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
