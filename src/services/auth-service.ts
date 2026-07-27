import { api } from "./api";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  college?: string;
  course?: string;
  semesterSystem?: string;
  currentSemester?: string;
  branch?: string;
  academicSession?: string;
  currentCgpa?: number | null;
  academicStatus?: string;
  targetCgpa?: number;
  totalDegreeCredits?: number;
  profileCompleted: boolean;
  token?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  college?: string;
  course?: string;
  semesterSystem?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SetupPayload {
  college?: string;
  course?: string;
  semesterSystem?: string;
  currentSemester?: string;
  branch?: string;
  academicSession?: string;
  currentCgpa?: number | null;
  academicStatus?: string;
  targetCgpa?: number;
  totalDegreeCredits?: number;
}

export interface UpdateProfilePayload {
  name?: string;
  college?: string;
  branch?: string;
  course?: string;
  semesterSystem?: string;
  currentSemester?: string;
  academicSession?: string;
  currentCgpa?: number | null;
  academicStatus?: string;
  targetCgpa?: number;
  totalDegreeCredits?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const AuthService = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const response = await api.post<AuthUser>("/auth/register", payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const response = await api.post<AuthUser>("/auth/login", payload);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/logout");
    return response.data;
  },

  async getProfile(): Promise<AuthUser> {
    const response = await api.get<AuthUser>("/auth/me");
    return response.data;
  },

  async updateSetup(payload: SetupPayload): Promise<AuthUser> {
    const response = await api.put<AuthUser>("/auth/setup", payload);
    return response.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const response = await api.put<AuthUser>("/auth/profile", payload);
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>("/auth/change-password", payload);
    return response.data;
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>("/auth/delete-account", {
      data: { password },
    });
    return response.data;
  },
};
