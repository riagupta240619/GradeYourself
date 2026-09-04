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

  // If user has accountType 'basic' and hasn't completed academic setup,
  // they can still access the app - onboarding is now optional
  // Only redirect to onboarding if they explicitly try to access academic features
  // without having an academic profile
  const isAcademicRoute = location.pathname.startsWith("/app/academic") || 
                          location.pathname.startsWith("/app/subjects") ||
                          location.pathname.startsWith("/app/analytics") ||
                          location.pathname.startsWith("/app/academic-planner");
  
  const hasAcademicProfile = user.accountType === "academic_enhanced" || user.accountType === "full" || user.profileCompleted;

  // If trying to access academic features without academic profile, redirect to onboarding
  if (isAcademicRoute && !hasAcademicProfile && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed setup profile and tries to visit /onboarding, skip setup and redirect to /app/dashboard
  if (hasAcademicProfile && location.pathname === "/onboarding") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
