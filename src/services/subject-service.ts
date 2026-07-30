import { api } from "./api";
import type { Subject } from "@/types";

export interface CreateSubjectPayload {
  name: string;
  code?: string;
  credits: number;
  semesterId: string;
  internalMarks?: number;
  externalMarks?: number;
  targetGrade?: string;
  colorTag?: string;
  marks?: Record<string, number | null>;
  scheme?: any;
}

export interface UpdateSubjectPayload extends Partial<CreateSubjectPayload> {}

export const SubjectService = {
  async createSubject(payload: CreateSubjectPayload): Promise<Subject> {
    const response = await api.post<Subject>("/subjects", payload);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
      scheme: item.scheme?.assessmentTypes ? item.scheme : {
        id: "default-scheme",
        name: "Standard Scheme",
        university: "General",
        isTemplate: false,
        verified: true,
        usedBy: 1,
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      },
    };
  },

  async getSubjects(semesterId?: string): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subjects", {
      params: semesterId ? { semesterId } : { currentOnly: "true" },
    });
    return response.data.map((item) => ({
      ...item,
      id: item._id || item.id,
      scheme: item.scheme?.assessmentTypes ? item.scheme : {
        id: "default-scheme",
        name: "Standard Scheme",
        university: "General",
        isTemplate: false,
        verified: true,
        usedBy: 1,
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      },
    }));
  },

  async getCurrentSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subjects", {
      params: { currentOnly: "true" },
    });
    return response.data.map((item) => ({
      ...item,
      id: item._id || item.id,
      scheme: item.scheme?.assessmentTypes ? item.scheme : {
        id: "default-scheme",
        name: "Standard Scheme",
        university: "General",
        isTemplate: false,
        verified: true,
        usedBy: 1,
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      },
    }));
  },

  async getSubjectById(id: string): Promise<Subject> {
    const response = await api.get<Subject>(`/subjects/${id}`);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
      scheme: item.scheme?.assessmentTypes ? item.scheme : {
        id: "default-scheme",
        name: "Standard Scheme",
        university: "General",
        isTemplate: false,
        verified: true,
        usedBy: 1,
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      },
    };
  },

  async updateSubject(id: string, payload: UpdateSubjectPayload): Promise<Subject> {
    const response = await api.put<Subject>(`/subjects/${id}`, payload);
    const item = response.data;
    return {
      ...item,
      id: item._id || item.id,
      scheme: item.scheme?.assessmentTypes ? item.scheme : {
        id: "default-scheme",
        name: "Standard Scheme",
        university: "General",
        isTemplate: false,
        verified: true,
        usedBy: 1,
        assessmentTypes: [
          { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
          { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 30 },
          { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 50 },
        ],
      },
    };
  },

  async updateMarks(id: string, marks: Record<string, number | null>): Promise<Subject> {
    return this.updateSubject(id, { marks });
  },

  async deleteSubject(id: string): Promise<{ message: string; id: string }> {
    const response = await api.delete<{ message: string; id: string }>(`/subjects/${id}`);
    return response.data;
  },
};
