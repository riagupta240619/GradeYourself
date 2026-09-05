import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  Menu,
  X,
  Command,
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  CalendarCheck,
  Target,
  BookOpen,
  Puzzle,
  Folder,
  Award,
  Brain,
  Code2,
  FileText,
  GitBranch,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { LogoutModal } from "@/components/shared/logout-modal";
import { cn } from "@/utils/cn";

const cgpaItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/attendance", label: "Smart Attendance", icon: CalendarCheck, badge: "Live" },
  { to: "/app/academic-planner", label: "Academic Planner", icon: Target, badge: "Planner" },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
  { to: "/app/assessment-builder", label: "Assessment Builder", icon: Puzzle },
];

const hubItems = [
  { to: "/app/storage", label: "Storage", icon: Folder },
  { to: "/app/interview", label: "Interview Prep", icon: Award, badge: "New" },
  { to: "/app/quiz", label: "AI Quiz", icon: Brain, badge: "AI" },
  { to: "/app/coding", label: "Coding Hub", icon: Code2 },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
  { to: "/app/resume", label: "Resume Hub", icon: FileText },
  { to: "/app/github", label: "GitHub", icon: GitBranch },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Automatically close mobile menu when navigating to another route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)]/95 px-3.5 sm:px-6 backdrop-blur-xl transition-colors duration-200">
        {/* Left Side: Mobile Menu Button & Global Search Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] md:hidden hover:bg-[var(--bg-surface-elevated)] transition-colors"
            aria-label="Open Navigation Drawer"
          >
            <Menu size={18} />
          </button>

          {/* Mobile Brand Mark (shown on small screens only) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white font-bold shadow-xs">
              <GraduationCap size={16} />
            </div>
            <span className="font-bold tracking-tight text-[var(--text-primary)] text-sm hidden min-[360px]:inline">
              GradeWise <span className="text-purple-600 dark:gradient-purple-text">AI</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3.5 py-1.5 text-xs text-[var(--text-secondary)] backdrop-blur-md cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-all">
            <Search size={14} className="text-[var(--text-muted)]" />
            <span className="truncate max-w-[200px] md:max-w-none">Search subjects, assessment formulas, templates...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>

        {/* Right Side: Theme Toggle, Notifications, User Profile, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={toggleTheme}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-all shadow-xs"
            aria-label="Toggle theme"
            title="Toggle theme mode"
          >
            {theme === "dark" ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-purple-600" />
            )}
          </button>

          <NavLink
            to="/app/notifications"
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-all shadow-xs"
            title="Notifications"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#c084fc]" />
          </NavLink>

          <div className="h-4 w-px bg-[var(--border)] mx-0.5 sm:mx-1" />

          {/* User Profile Pill */}
          <NavLink
            to="/app/profile"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 sm:p-1.5 sm:pr-3 hover:bg-[var(--bg-surface-elevated)] transition-all"
            title={user?.name || "User Profile"}
          >
            <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-xs font-bold text-white shadow-xs">
              {initial}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[100px]">
                {user?.name || "Student"}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[100px]">
                {user?.college || "Academic OS"}
              </span>
            </div>
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-400 transition-all shadow-xs"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />

      {/* Full Responsive Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 w-[290px] max-w-[85vw] bg-[var(--bg-surface)] border-r border-[var(--border)] shadow-2xl flex flex-col z-50 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-xs">
                    <GraduationCap size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold tracking-tight text-[var(--text-primary)] text-sm">
                      GradeWise <span className="text-purple-600 dark:gradient-purple-text">AI</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Academic OS v2.4
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                  aria-label="Close navigation drawer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Profile Summary Card in Drawer */}
              <div className="p-3.5 m-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-xs font-bold text-white shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate">{user?.name || "Student"}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.course || "Academic Program"}</p>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
                {/* CGPA & Academic Core Section */}
                <div>
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1.5">
                    Academic Analytics & Core
                  </span>
                  <nav className="flex flex-col gap-0.5">
                    {cgpaItems.map((item) => {
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                            isActive
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon size={16} className={isActive ? "text-white" : "text-[var(--text-tertiary)]"} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
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

                {/* Hubs & Career Preparation */}
                <div>
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1.5">
                    Hubs & Career Preparation
                  </span>
                  <nav className="flex flex-col gap-0.5">
                    {hubItems.map((item) => {
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                            isActive
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon size={16} className={isActive ? "text-white" : "text-[var(--text-tertiary)]"} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
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

              {/* Drawer Footer Actions */}
              <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface-elevated)]/50 space-y-1">
                <NavLink
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    location.pathname === "/app/settings"
                      ? "bg-purple-600 text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </NavLink>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

