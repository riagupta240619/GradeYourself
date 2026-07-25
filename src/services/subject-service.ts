import { api } from "./api";
import type { Subject } from "@/types";

export interface CreateSubjectPayload {
  name: string;
  code?: string;
  credits: number;
  semester?: string;
  internalMarks?: number;
  externalMarks?: number;
  targetGrade?: string;
  colorTag?: string;
  marks?: Record<string, number | null>;
}

export interface UpdateSubjectPayload extends Partial<CreateSubjectPayload> {}

export const SubjectService = {
  async createSubject(payload: CreateSubjectPayload): Promise<Subject> {
    const response = await api.post<Subject>("/subjects", payload);
    return response.data;
  },

  async getSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>("/subjects");
    return response.data;
  },

  async getSubjectById(id: string): Promise<Subject> {
    const response = await api.get<Subject>(`/subjects/${id}`);
    return response.data;
  },

  async updateSubject(id: string, payload: UpdateSubjectPayload): Promise<Subject> {
    const response = await api.put<Subject>(`/subjects/${id}`, payload);
    return response.data;
  },

  async deleteSubject(id: string): Promise<{ message: string; id: string }> {
    const response = await api.delete<{ message: string; id: string }>(`/subjects/${id}`);
    return response.data;
  },
};
