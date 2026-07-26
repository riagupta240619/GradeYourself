import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  AuthService,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type SetupPayload,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
} from "@/services/auth-service";

import { useAcademicStore } from "@/lib/store/use-academic-store";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  updateSetup: (payload: SetupPayload) => Promise<AuthUser>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  changePassword: (payload: ChangePasswordPayload) => Promise<{ message: string }>;
  deleteAccount: (password: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore authenticated session on initial application load via GET /api/auth/me (HttpOnly cookie)
  useEffect(() => {
    async function initAuth() {
      try {
        const profile = await AuthService.getProfile();
        setUser(profile);
      } catch {
        useAcademicStore.getState().clearState();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.login(payload);
      setUser(res);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to sign in";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.register(payload);
      setUser(res);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create account";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSetup = async (payload: SetupPayload) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await AuthService.updateSetup(payload);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save setup configuration";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await AuthService.updateProfile(payload);
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      return updatedUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.changePassword(payload);
      // Password changed successfully: clear client session state as backend cleared auth cookie
      useAcademicStore.getState().clearState();
      setUser(null);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.deleteAccount(password);
      useAcademicStore.getState().clearState();
      setUser(null);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete account";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      useAcademicStore.getState().clearState();
      setUser(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        updateSetup,
        updateProfile,
        changePassword,
        deleteAccount,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
