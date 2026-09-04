import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/theme-context";
import { useTheme } from "@/hooks/use-theme";
import { AuthProvider } from "@/context/auth-context";
import { AppRoutes } from "@/routes/app-routes";
import { HealthService } from "@/services/health-service";

function AppContent() {
  useEffect(() => {
    HealthService.getHealth()
      .then((data) => {
        console.log("%c[Backend Health Check Success]:", "color: #10b981; font-weight: bold;", data);
      })
      .catch((err) => {
        console.error("[Backend Health Check Failed]:", err);
      });
  }, []);

  return <BrowserRouter><ThemedRouter /></BrowserRouter>;
}

function ThemedRouter() { const { theme } = useTheme(); return <><Toaster theme={theme} position="top-right" richColors /><AppRoutes /></>; }

export default function App() { return <ThemeProvider><AuthProvider><AppContent /></AuthProvider></ThemeProvider>; }
