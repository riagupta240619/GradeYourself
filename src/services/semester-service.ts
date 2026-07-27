import { api } from "./api";
import type { Semester } from "@/types";

export interface SemesterWithTotalCredits extends Semester {
  totalCredits?: number;
}

export interface CreateSemesterPayload {
  name: string;
  isCurrent?: boolean;
  finalizedSgpa?: number | null;
  credits?: number;
}

export interface UpdateSemesterPayload extends Partial<CreateSemesterPayload> {}

export interface UpdateFullSubjectInput {
  id?: string;
  _id?: string;
  name?: string;
  subjectName?: string;
  code?: string;
  subjectCode?: string;
  credits?: number;
  marksObtained?: number | null;
  maxMarks?: number | null;
  finalPercentage?: number | null;
  pct?: number | null;
  grade?: string | null;
  letterGrade?: string | null;
  gradePoint?: number | null;
  assessments?: Array<{
    id?: string;
    name: string;
    marksObtained?: number | null;
    maxMarks?: number | null;
    weightPct?: number | null;
  }>;
}

export interface UpdateFullSemesterPayload {
  name?: string;
  credits?: number;
  finalizedSgpa?: number | null;
  subjects?: UpdateFullSubjectInput[];
}

export const SemesterService = {
  async createSemester(payload: CreateSemesterPayload): Promise<SemesterWithTotalCredits> {
    const response = await api.post<SemesterWithTotalCredits>("/semesters", payload);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
    };
  },

  async getSemesters(): Promise<SemesterWithTotalCredits[]> {
    const response = await api.get<SemesterWithTotalCredits[]>("/semesters");
    return response.data.map((item) => ({
      ...item,
      id: item._id || item.id,
    }));
  },

  async updateSemester(id: string, payload: UpdateSemesterPayload): Promise<SemesterWithTotalCredits> {
    const response = await api.put<SemesterWithTotalCredits>(`/semesters/${id}`, payload);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
    };
  },

  async updateFullSemester(id: string, payload: UpdateFullSemesterPayload): Promise<SemesterWithTotalCredits> {
    const response = await api.put<SemesterWithTotalCredits>(`/semesters/${id}/full`, payload);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
    };
  },

  async deleteSemester(id: string): Promise<{ message: string; id: string }> {
    const response = await api.delete<{ message: string; id: string }>(`/semesters/${id}`);
    return response.data;
  },

  async bulkSaveTranscript(payload: {
    university?: string;
    program?: string;
    semesters: Array<{
      semester?: number;
      semesterName?: string;
      sgpa?: number | null;
      cgpa?: number | null;
      credits?: number;
      subjects?: Array<{
        code?: string;
        name: string;
        credits?: number | null;
        grade?: string;
        status?: string | null;
      }>;
    }>;
  }): Promise<{ message: string; savedSemesters: SemesterWithTotalCredits[] }> {
    const response = await api.post<{ message: string; savedSemesters: SemesterWithTotalCredits[] }>(
      "/semesters/bulk-transcript",
      payload
    );
    return response.data;
  },
};
