export type GradeScale = "4.0" | "10.0" | "percentage" | "letter";

export interface AssessmentType {
  id: string;
  name: string;
  weightPct: number;
  maxMarks: number;
}

export interface GradingScheme {
  id: string;
  name: string;
  university: string;
  isTemplate: boolean;
  verified: boolean;
  usedBy: number;
  assessmentTypes: AssessmentType[];
}

export interface Subject {
  _id?: string;
  id: string;
  name: string;
  code?: string;
  colorTag?: string;
  semesterId?: string;
  semester?: string;
  scheme: GradingScheme;
  marks: Record<string, number | null>; // assessmentTypeId -> marks obtained
  credits: number;
  calculatedPct?: number;
  letterGrade?: string;
  gradePoint?: number;
  internalMarks?: number;
  externalMarks?: number;
}

export interface Semester {
  _id?: string;
  id: string;
  name: string;
  isCurrent: boolean;
  finalizedSgpa: number | null;
  credits?: number;
  subjects?: Subject[];
  calculatedSgpa?: number;
  totalCredits?: number;
}

export interface PredictionRange {
  low: number;
  high: number;
  confidencePct: number;
}

export interface RiskFlag {
  subjectId: string;
  subjectName: string;
  reason: string;
}

export type ThemeMode = "light" | "dark";
export type CgpaViewMode = "sgpa" | "cgpa";
