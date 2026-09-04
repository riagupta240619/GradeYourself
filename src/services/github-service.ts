import { api } from "./api";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  url: string;
  pushed_at: string;
  stargazers_count: number;
  fork: boolean;
  language: string | null;
  default_branch: string;
}

export interface LinkedRepo {
  _id?: string;
  id?: string;
  repoId?: number;
  repoName: string;
  repoFullName: string;
  fullName?: string;
  htmlUrl: string;
  subjectId?: string;
  semesterId?: string;
  linkedAt: string;
  isPublic: boolean;
  repoDescription?: string;
  stars: number;
}

export interface GitHubAuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
}

export interface GitHubConnectPayload {
  code: string; // OAuth code from GitHub
  redirectUri: string;
}

export interface GitHubRepoLinking {
  subjectId?: string;
  semesterId?: string;
  repoFullName: string;
  repoName: string;
  htmlUrl?: string;
  isPublic?: boolean;
  repoDescription?: string;
  stars?: number;
}

export class GitHubService {
  private static readonly API_BASE = "/github";

  /**
   * Initiates GitHub OAuth flow.
   * Fetches the authorization URL from the backend that the user should redirect to.
   */
  static async getAuthUrl(redirectUri?: string): Promise<string> {
    const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : "";
    const response = await api.get<{ authUrl: string }>(`${this.API_BASE}/authorize${params}`);
    return response.data.authUrl;
  }

  /**
   * Exchange the OAuth code for a GitHub access token.
   */
  static async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ token: string; username: string }> {
    const response = await api.post<{ token: string; username: string }>(
      `${this.API_BASE}/token`,
      { code, redirectUri }
    );
    return response.data;
  }

  /**
   * Fetches the authenticated user's repositories.
   * Filters for relevant course/repo types based on search keywords.
   */
  static async fetchUserRepos(
    token: string,
    options: { search?: string; onlyPrivate?: boolean; onlyPublic?: boolean } = {}
  ): Promise<GitHubRepo[]> {
    const { search = "", onlyPrivate = false, onlyPublic = false } = options;

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (onlyPrivate) params.append("type", "private");
    if (onlyPublic) params.append("type", "public");

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get<GitHubRepo[]>(
      `${this.API_BASE}/repos${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Links a GitHub repository to a subject/semester combination.
   * Stores the linking metadata in the backend.
   */
  static async linkRepoToSubject(
    token: string,
    linking: GitHubRepoLinking
  ): Promise<LinkedRepo> {
    const response = await api.post<LinkedRepo>(
      `${this.API_BASE}/link`,
      linking,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Retrieves all linked repositories for a specific subject or semester.
   */
  static async getLinkedRepos(
    token: string,
    subjectId?: string,
    semesterId?: string
  ): Promise<LinkedRepo[]> {
    const params = new URLSearchParams();
    if (subjectId) params.append("subjectId", subjectId);
    if (semesterId) params.append("semesterId", semesterId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get<LinkedRepo[]>(
      `${this.API_BASE}/linked${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Unlinks a GitHub repository from a subject/semester.
   */
  static async unlinkRepo(
    token: string,
    linkId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${this.API_BASE}/link/${linkId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Checks if a GitHub repo is already linked to a subject/semester.
   */
  static async isRepoLinked(
    token: string,
    repoFullName: string,
    subjectId?: string,
    semesterId?: string
  ): Promise<boolean> {
    const params = new URLSearchParams();
    if (subjectId) params.append("subjectId", subjectId);
    if (semesterId) params.append("semesterId", semesterId);

    const query = params.toString() ? `&${params.toString()}` : "";
    const response = await api.get<{ linked: boolean }>(
      `${this.API_BASE}/linked/check?repo=${encodeURIComponent(repoFullName)}${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.linked;
  }

  /**
   * Fetches detailed information about a specific GitHub repository.
   */
  static async getRepoDetails(
    token: string,
    repoFullName: string
  ): Promise<GitHubRepo> {
    const response = await api.get<GitHubRepo>(
      `${this.API_BASE}/repos/${encodeURIComponent(repoFullName)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Updates the public/private status of a linked repo.
   */
  static async updateLinkVisibility(
    token: string,
    linkId: string,
    isPublic: boolean
  ): Promise<LinkedRepo> {
    const response = await api.patch<LinkedRepo>(
      `${this.API_BASE}/link/${linkId}/visibility`,
      { isPublic },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }
}

/**
 * Extracts course/relevant keywords from a subject name to aid repo matching.
 */
export function extractRepoKeywords(subjectName: string): string[] {
  const lower = subjectName.toLowerCase();
  const baseKeywords: Record<string, string[]> = {
    "data structures": ["ds", "data-structures", "algorithm", "tree", "graph"],
    "operating systems": ["os", "process", "memory", "scheduling", "deadlock"],
    "computer networks": ["cn", "network", "tcp/ip", "routing", "protocol"],
    "database systems": ["db", "database", "sql", "normalization", "query"],
    "cyber security": ["sec", "security", "encryption", "network-security", "crypto"],
    "algorithms": ["algo", "algorithm", "dp", "graph", "sort"],
    "machine learning": ["ml", "ai", "neural", "model", "training"],
    "web development": ["web", "frontend", "backend", "fullstack", "javascript"],
    "software engineering": ["se", "design-pattern", "git", "ci-cd"],
    "artificial intelligence": ["ai", "ml", "neural", "deep-learning"],
  };

  const matched: string[] = [];
  for (const [keywords, kws] of Object.entries(baseKeywords)) {
    if (lower.includes(keywords)) {
      matched.push(...kws);
    }
  }

  // Always include the subject name itself as a keyword
  matched.push(subjectName.toLowerCase().replace(/\s+/g, "-"));

  return [...new Set(matched)];
}