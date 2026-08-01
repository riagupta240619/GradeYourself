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
  ChevronDown,
  Sparkles,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { SemesterService, type SemesterWithTotalCredits } from "@/services/semester-service";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/academic-planner", label: "Academic Planner", icon: Target, badge: "Planner" },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
  { to: "/app/assessment-builder", label: "Assessment Builder", icon: Puzzle },
];

export function Sidebar() {
  const [semesterOpen, setSemesterOpen] = useState(false);
  const [backendSemesters, setBackendSemesters] = useState<SemesterWithTotalCredits[]>([]);
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
    return backendSemesters.find((s) => s.isCurrent) || backendSemesters[backendSemesters.length - 1];
  }, [backendSemesters]);

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white/90 dark:border-white/10 dark:bg-zinc-950/80 p-4 backdrop-blur-2xl transition-all duration-300 z-20 hidden md:flex">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between px-2 pt-1">
        <NavLink to="/app/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-blue-500 text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] group-hover:scale-105 transition-transform duration-200">
            <GraduationCap size={20} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
              GradeWise <span className="gradient-purple-text">AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500 tracking-wider">
              Academic OS v2.4
            </span>
          </div>
        </NavLink>
      </div>

      {/* Semester Switcher Dropdown */}
      <div className="relative mb-5 px-1">
        <button
          onClick={() => backendSemesters.length > 0 && setSemesterOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-900/90 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-all hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">{current.name}</span>
          </div>
          {backendSemesters.length > 0 && (
            <ChevronDown
              size={14}
              className={cn("text-slate-400 dark:text-zinc-400 transition-transform duration-200", semesterOpen && "rotate-180")}
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
              className="absolute left-1 right-1 z-30 mt-1.5 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-xl"
            >
              {backendSemesters.map((s, idx) => (
                <button
                  key={s.id || s._id || `sem-${idx}`}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 dark:text-zinc-300 transition-colors hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-white"
                  onClick={() => setSemesterOpen(false)}
                >
                  <span className="truncate">{s.name}</span>
                  {s.finalizedSgpa !== null && s.finalizedSgpa !== undefined && (
                    <span className="font-tabular text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">
                      SGPA: {s.finalizedSgpa}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Nav Items */}
      <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        Navigation
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-purple-50 text-purple-700 font-semibold border border-purple-200 shadow-sm dark:bg-gradient-to-r dark:from-purple-900/40 dark:to-purple-800/20 dark:text-white dark:border-purple-500/30 dark:shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/80 dark:hover:text-zinc-200 hover:border-slate-200 dark:hover:border-white/5 border border-transparent"
                )
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                  )}
                />
                <span className="whitespace-nowrap truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute right-2 h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shadow-[0_0_8px_#c084fc]"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Navigation & Settings */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 px-1">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200 dark:bg-zinc-800 dark:text-white dark:border-white/10"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            )
          }
        >
          <Settings size={18} className="text-slate-400 dark:text-zinc-500" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
