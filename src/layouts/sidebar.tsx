import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Folder,
  ChevronDown,
  Sparkles,
  GraduationCap,
  ChevronRight,
  Code2,
  FileText,
  GitBranch,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  SemesterService,
  type SemesterWithTotalCredits,
} from "@/services/semester-service";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  {
    to: "/app/academic-planner",
    label: "Academic Planner",
    icon: Target,
    badge: "Planner",
  },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
  { to: "/app/assessment-builder", label: "Assessment Builder", icon: Puzzle },
  { to: "/app/storage", label: "Storage", icon: Folder },
  { to: "/app/coding", label: "Coding Hub", icon: Code2 },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
  { to: "/app/resume", label: "Resume Hub", icon: FileText },
  { to: "/app/github", label: "GitHub", icon: GitBranch },
];

export function Sidebar() {
  const [semesterOpen, setSemesterOpen] = useState(false);
  const [backendSemesters, setBackendSemesters] = useState<
    SemesterWithTotalCredits[]
  >([]);
  const location = useLocation();

  useEffect(() => {
    SemesterService.getSemesters()
      .then((data) => {
        setBackendSemesters(data || []);
      })
      .catch((err) => {
        console.error("Failed to load semesters from backend:", err);
        setBackendSemesters([]);
      });
  }, []);

  const current = useMemo(() => {
    if (backendSemesters.length === 0) {
      return { name: "Current Semester" };
    }
    return (
      backendSemesters.find((s) => s.isCurrent) ||
      backendSemesters[backendSemesters.length - 1]
    );
  }, [backendSemesters]);

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] p-5 backdrop-blur-xl transition-all duration-300 z-20 hidden md:flex">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between px-1 pt-1">
        <NavLink to="/app/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-sm group-hover:bg-purple-700 transition-colors duration-200">
            <GraduationCap size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-[var(--text-primary)] text-base leading-tight">
              GradeWise{" "}
              <span className="text-purple-600 dark:gradient-purple-text">
                AI
              </span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] tracking-wider">
              Academic OS v2.4
            </span>
          </div>
        </NavLink>
      </div>

      {/* Semester Switcher Dropdown */}
      <div className="relative mb-6">
        <button
          onClick={() =>
            backendSemesters.length > 0 && setSemesterOpen((o) => !o)
          }
          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-surface-strong)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate font-semibold">{current.name}</span>
          </div>
          {backendSemesters.length > 0 && (
            <ChevronDown
              size={14}
              className={cn(
                "text-[var(--text-tertiary)] transition-transform duration-200",
                semesterOpen && "rotate-180",
              )}
            />
          )}
        </button>

        <AnimatePresence>
          {semesterOpen && backendSemesters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 z-30 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 shadow-lg backdrop-blur-xl"
            >
              {backendSemesters.map((s, idx) => (
                <button
                  key={s.id || s._id || `sem-${idx}`}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                  onClick={() => setSemesterOpen(false)}
                >
                  <span className="truncate font-medium">{s.name}</span>
                  {s.finalizedSgpa !== null &&
                    s.finalizedSgpa !== undefined && (
                      <span className="font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">
                        SGPA: {s.finalizedSgpa}
                      </span>
                    )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Nav Section */}
      <div className="space-y-6 flex flex-1 flex-col">
        <div>
          <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Navigation
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-purple-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-purple-800/30 dark:text-white dark:border dark:border-purple-500/30"
                        : "text-[var(--text-secondary)] hover:bg-purple-50 hover:text-purple-700 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--bg-surface-strong)] dark:hover:text-[var(--text-primary)]",
                    )
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Left Accent Bar for Active Item */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white dark:bg-purple-400" />
                    )}
                    <item.icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors duration-150",
                        isActive
                          ? "text-white dark:text-purple-400"
                          : "text-[var(--text-tertiary)] group-hover:text-[var(--accent-purple)] dark:group-hover:text-[var(--text-primary)]",
                      )}
                    />
                    <span className="whitespace-nowrap truncate">
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                        isActive
                          ? "bg-purple-700 text-white dark:bg-purple-500/30 dark:text-purple-200"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Navigation & Settings */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150",
              isActive
                ? "bg-[var(--accent-purple)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]",
            )
          }
        >
          <Settings
            size={18}
            className={cn(
              "shrink-0",
              location.pathname === "/app/settings"
                ? "text-white"
                : "text-slate-400 dark:text-zinc-500",
            )}
          />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
