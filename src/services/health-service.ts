import { api } from "./api";

export interface HealthResponse {
  message: string;
}

export const HealthService = {
  async getHealth(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>("/health");
    return response.data;
  },
};
