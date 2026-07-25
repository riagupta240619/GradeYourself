import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { AppRoutes } from "@/routes/app-routes";
import { HealthService } from "@/services/health-service";

export default function App() {
  useEffect(() => {
    HealthService.getHealth()
      .then((data) => {
        console.log("%c[Backend Health Check Success]:", "color: #10b981; font-weight: bold;", data);
      })
      .catch((err) => {
        console.error("[Backend Health Check Failed]:", err);
      });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
