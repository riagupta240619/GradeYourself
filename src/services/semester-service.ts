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

  async deleteSemester(id: string): Promise<{ message: string; id: string }> {
    const response = await api.delete<{ message: string; id: string }>(`/semesters/${id}`);
    return response.data;
  },
};
