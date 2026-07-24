import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { AppShell } from "@/app/layout/app-shell";

import { LandingPage } from "@/pages/landing/landing-page";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password-page";
import { OnboardingPage } from "@/pages/onboarding/onboarding-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { SubjectDetailsPage } from "@/pages/subjects/subject-details-page";
import { AnalyticsPage } from "@/pages/analytics/analytics-page";
import { TargetPlannerPage } from "@/pages/target-planner/target-planner-page";
import { SimulatorPage } from "@/pages/simulator/simulator-page";
import { AssessmentBuilderPage } from "@/pages/assessment-builder/assessment-builder-page";
import { AdvisorPage } from "@/pages/advisor/advisor-page";
import { TemplatesPage } from "@/pages/templates/templates-page";
import { NotificationsPage } from "@/pages/notifications/notifications-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { ProfilePage } from "@/pages/profile/profile-page";
import { AdminPanelPage } from "@/pages/admin/admin-panel-page";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route path="/app" element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="subjects" element={<SubjectDetailsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="target-planner" element={<TargetPlannerPage />} />
            <Route path="simulator" element={<SimulatorPage />} />
            <Route path="assessment-builder" element={<AssessmentBuilderPage />} />
            <Route path="advisor" element={<AdvisorPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPanelPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
