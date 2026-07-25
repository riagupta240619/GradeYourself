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
}

export const AnalyticsService = {
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await api.get<AnalyticsSummary>("/analytics");
    return response.data;
  },
};
