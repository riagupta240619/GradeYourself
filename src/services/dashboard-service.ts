import { api } from "./api";
import type { Semester } from "@/types";
import type { AuthUser } from "./auth-service";

export interface DashboardSubject {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  credits: number;
  targetGrade?: string;
  colorTag?: string;
  calculatedPct?: number | null;
  letterGrade?: string | null;
  gradePoint?: number | null;
  status?: string;
  isInProgress?: boolean;
  internalMarks?: number;
  externalMarks?: number;
  marks?: Record<string, number | null>;
  scheme?: any;
}

export interface CompletedSemester {
  _id?: string;
  id?: string;
  semesterNumber: number;
  name: string;
  subjects: DashboardSubject[];
  credits: number;
  sgpa: number | null;
  grades: Array<{ subject: string; grade?: string; points?: number }>;
}

export interface CurrentSemesterData {
  _id?: string;
  id?: string;
  semesterNumber?: number;
  name?: string;
  activeSubjects: DashboardSubject[];
  assessments?: any[];
  attendance?: any[];
  internalMarks?: any[];
  predictedScores?: any[];
}

export interface DashboardSummary {
  user: AuthUser;
  cgpa: number | null;
  sgpa: number | null;
  projectedCgpa?: number | null;
  totalCredits: number;
  completedCredits?: number;
  currentSemesterCredits?: number;
  targetCgpa: number;
  completedSemesters?: CompletedSemester[];
  currentSemester?: CurrentSemesterData | null;
  semesters: Semester[];
  subjects: DashboardSubject[];
  cgpaTrend: Array<{ semester: string; sgpa: number | null }>;
  atRiskSubjects: Array<{ subjectId: string; subjectName: string; reason: string; currentPct?: number; letterGrade?: string }>;
}

export const DashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  },

  async getSemesters(): Promise<Semester[]> {
    const response = await api.get<Semester[]>("/dashboard/semesters");
    return response.data;
  },

  async getSubjects(): Promise<DashboardSubject[]> {
    const response = await api.get<DashboardSubject[]>("/dashboard/subjects");
    return response.data;
  },

  async getCgpaSummary(): Promise<{ cgpa: number; totalCredits: number }> {
    const response = await api.get<{ cgpa: number; totalCredits: number }>("/dashboard/cgpa");
    return response.data;
  },
};
