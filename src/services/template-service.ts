import { api } from "./api";
import type { GradingScheme, SchemeComponent } from "@/types";

export interface CreateTemplatePayload {
  name: string;
  university?: string;
  components: SchemeComponent[];
}

export const TemplateService = {
  async getTemplates(): Promise<GradingScheme[]> {
    const response = await api.get<GradingScheme[]>("/templates");
    return response.data;
  },

  async createTemplate(payload: CreateTemplatePayload): Promise<GradingScheme> {
    const response = await api.post<GradingScheme>("/templates", payload);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<{ message: string; id: string }> {
    const response = await api.delete<{ message: string; id: string }>(`/templates/${id}`);
    return response.data;
  },
};
