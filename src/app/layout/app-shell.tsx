import { NavLink, Outlet } from "react-router-dom";
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
  Bell,
  Moon,
  Sun,
  Search,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/app/providers/theme-provider";
import { cn } from "@/lib/utils";
import { semesters } from "@/lib/data/mock";
import { useState } from "react";

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

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [semesterOpen, setSemesterOpen] = useState(false);
  const current = semesters.find((s) => s.isCurrent)!;

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
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
              {semesters.map((s) => (
                <button
                  key={s.id}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--bg-surface)]"
                  onClick={() => setSemesterOpen(false)}
                >
                  {s.name}
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b bg-[var(--bg-surface)]/70 px-6 backdrop-blur"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <Search size={15} />
            <span>Search subjects, templates...</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NavLink
              to="/app/notifications"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              <Bell size={16} />
            </NavLink>
            <NavLink
              to="/app/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-sm text-[var(--color-accent)]"
            >
              R
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
