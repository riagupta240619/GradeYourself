import { api } from "./api";
import type { GradingScheme } from "@/types";

export const TemplateService = {
  async getTemplates(): Promise<GradingScheme[]> {
    const response = await api.get<GradingScheme[]>("/templates");
    return response.data;
  },
};
