import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  // Show a neutral loading screen while checking session via HttpOnly cookie
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <span className="text-xs text-[var(--text-tertiary)]">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if user session is absent
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has not completed setup profile, force redirect to /onboarding (unless already on /onboarding)
  if (!user.profileCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed setup profile and tries to visit /onboarding, skip setup and redirect to /app/dashboard
  if (user.profileCompleted && location.pathname === "/onboarding") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
