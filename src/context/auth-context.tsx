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

/** Helper to extract a user-friendly error message from Axios errors. */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }
  return fallback;
}

/** Helper to extract HTTP status code from Axios errors. */
function extractStatusCode(err: unknown): number | null {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "status" in err.response &&
    typeof err.response.status === "number"
  ) {
    return err.response.status;
  }
  return null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  /** True only during initial session restoration (one-time bootstrap). */
  initializing: boolean;
  /** True while an auth action (login, register, etc.) is in-flight. */
  submitting: boolean;
  /** Combined loading = initializing || submitting — backward compatible. */
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  updateSetup: (payload: SetupPayload) => Promise<AuthUser>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  changePassword: (payload: ChangePasswordPayload) => Promise<{ message: string }>;
  deleteAccount: () => Promise<{ message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function clearClientAuthData() {
  const clearMatchingKeys = (storage: Storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && /(?:auth|token|session|academic)/i.test(key)) storage.removeItem(key);
    }
  };

  try {
    clearMatchingKeys(localStorage);
    clearMatchingKeys(sessionStorage);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  /** One-time bootstrap loading state — true until initial GET /auth/me resolves. */
  const [initializing, setInitializing] = useState<boolean>(true);
  /** Action-specific loading state — true while login/register/etc. is in-flight. */
  const [submitting, setSubmitting] = useState<boolean>(false);
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
        setInitializing(false);
      }
    }
    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.login(payload);
      setUser(res);
      return res;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to sign in");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.register(payload);
      setUser(res);
      return res;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to create account");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateSetup = async (payload: SetupPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const updatedUser = await AuthService.updateSetup(payload);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to save setup configuration");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const updatedUser = await AuthService.updateProfile(payload);
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent("academic-data-updated"));
      return updatedUser;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to update profile");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.changePassword(payload);
      // Password changed successfully: clear client session state as backend cleared auth cookie
      useAcademicStore.getState().clearState();
      setUser(null);
      return res;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to change password");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAccount = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.deleteAccount();
      useAcademicStore.getState().clearState();
      clearClientAuthData();
      setUser(null);
      return res;
    } catch (err: unknown) {
      if (extractStatusCode(err) === 401) {
        useAcademicStore.getState().clearState();
        clearClientAuthData();
        setUser(null);
      }
      const msg = extractErrorMessage(err, "Failed to delete account");
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    setSubmitting(true);
    try {
      await AuthService.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      useAcademicStore.getState().clearState();
      setUser(null);
      setSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        submitting,
        loading: initializing || submitting,
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
