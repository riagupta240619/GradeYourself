import axios from "axios";

/**
 * Helper to read non-HttpOnly cookie values from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Dynamically resolves and normalizes the backend API base URL.
 * Guarantees that `/api` is present regardless of whether VITE_API_URL
 * is set to "https://gradeyourself.onrender.com" or "https://gradeyourself.onrender.com/api".
 */
export function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || "").trim();
  if (!raw) {
    return "http://localhost:5000/api";
  }
  const clean = raw.replace(/\/+$/, "");
  if (clean.endsWith("/api")) {
    return clean;
  }
  return `${clean}/api`;
}

/**
 * Centralized Axios instance for GradeYourself API client
 *
 * Configured with withCredentials: true so the browser automatically handles
 * sending and receiving HttpOnly auth_token and XSRF-TOKEN cookies across cross-origin requests.
 */
export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Promise cache to ensure single initial CSRF bootstrap call
 */
let csrfBootstrapPromise: Promise<void> | null = null;

export async function ensureCsrfToken(): Promise<void> {
  if (getCookie("XSRF-TOKEN")) return;
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = api
      .get("/auth/csrf")
      .then(() => {})
      .catch((err) => {
        console.warn("[CSRF Bootstrap Warning]:", err.message);
      })
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }
  return csrfBootstrapPromise;
}

// Request interceptor: Attach Double-Submit CSRF token header for state-changing requests
api.interceptors.request.use(
  async (config) => {
    const method = (config.method || "get").toUpperCase();

    // Attach CSRF token on state-changing requests
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      // Ensure CSRF token cookie is initialized if missing (e.g. initial login/register)
      if (!getCookie("XSRF-TOKEN") && !config.url?.includes("/auth/csrf")) {
        await ensureCsrfToken();
      }

      const csrfToken = getCookie("XSRF-TOKEN");
      if (csrfToken && config.headers) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    if (error.response?.status !== 401) {
      console.error("[API Error]:", message);
    }
    return Promise.reject(error);
  }
);
