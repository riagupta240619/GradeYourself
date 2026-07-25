import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Target,
  Wand2,
  BookOpen,
  Puzzle,
  Bot,
  Globe,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { semesters as defaultMockSemesters } from "@/lib/data/mock";
import { SemesterService, type SemesterWithTotalCredits } from "@/services/semester-service";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/target-planner", label: "Target Planner", icon: Target },
  { to: "/app/simulator", label: "What-if Simulator", icon: Wand2 },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
  { to: "/app/assessment-builder", label: "Assessment Builder", icon: Puzzle },
  { to: "/app/advisor", label: "AI Advisor", icon: Bot },
  { to: "/app/templates", label: "Community Templates", icon: Globe },
];

export function Sidebar() {
  const [semesterOpen, setSemesterOpen] = useState(false);
  const [backendSemesters, setBackendSemesters] = useState<SemesterWithTotalCredits[]>([]);

  useEffect(() => {
    SemesterService.getSemesters()
      .then((data) => {
        if (data && data.length > 0) {
          setBackendSemesters(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load semesters from backend:", err);
      });
  }, []);

  const semesterList = useMemo(() => {
    return backendSemesters.length > 0 ? backendSemesters : defaultMockSemesters;
  }, [backendSemesters]);

  const current = useMemo(() => {
    return semesterList.find((s) => s.isCurrent) || semesterList[0] || { name: "Current Semester" };
  }, [semesterList]);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r p-4" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">
          G
        </div>
        <span className="font-semibold">GradeWise AI</span>
      </div>

      <div className="relative mb-4">
        <button
          onClick={() => setSemesterOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-[var(--bg-elevated)]"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <span className="truncate">{current.name}</span>
          <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
        </button>
        {semesterOpen && (
          <div
            className="absolute z-10 mt-1 w-full animate-fade-up rounded-lg border bg-[var(--bg-elevated)] p-1 shadow-lg"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {semesterList.map((s, idx) => (
              <button
                key={s.id || `sem-${idx}`}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--bg-surface)]"
                onClick={() => setSemesterOpen(false)}
              >
                <span className="truncate">{s.name}</span>
                {s.finalizedSgpa && <span className="font-tabular text-xs text-[var(--text-tertiary)]">{s.finalizedSgpa}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/app/settings"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      >
        <Settings size={17} />
        Settings
      </NavLink>
    </aside>
  );
}
