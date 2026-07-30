import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/app-layout";
import { ProtectedRoute } from "@/routes/protected-route";

import { LandingPage } from "@/pages/landing/landing-page";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password-page";
import { OnboardingPage } from "@/pages/onboarding/onboarding-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { SubjectDetailsPage } from "@/pages/subjects/subject-details-page";
import { AnalyticsPage } from "@/pages/analytics/analytics-page";
import { AcademicPlannerPage } from "@/pages/academic-planner/academic-planner-page";
import { AssessmentBuilderPage } from "@/pages/assessment-builder/assessment-builder-page";
import { TemplatesPage } from "@/pages/templates/templates-page";
import { NotificationsPage } from "@/pages/notifications/notifications-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { ProfilePage } from "@/pages/profile/profile-page";
import { AdminPanelPage } from "@/pages/admin/admin-panel-page";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route path="/app" element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectDetailsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="academic-planner" element={<AcademicPlannerPage />} />
          <Route path="academic_planner" element={<AcademicPlannerPage />} />
          {/* Legacy Redirects */}
          <Route path="target-planner" element={<Navigate to="/app/academic-planner" replace />} />
          <Route path="simulator" element={<Navigate to="/app/academic-planner" replace />} />
          <Route path="advisor" element={<Navigate to="/app/academic-planner" replace />} />
          <Route path="assessment-builder" element={<AssessmentBuilderPage />} />
          <Route path="templates" element={<Navigate to="/app/assessment-builder" replace />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPanelPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
