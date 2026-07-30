import { api } from "./api";

export interface AnalyticsSubject {
  name: string;
  code: string;
  credits: number;
  pct: number;
  letterGrade: string;
  gradePoint: number;
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
