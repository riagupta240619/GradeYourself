import { useState } from "react";
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
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { LogoutModal } from "@/components/shared/logout-modal";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/analytics", label: "Analytics" },
  { to: "/app/academic-planner", label: "Academic Planner" },
  { to: "/app/subjects", label: "Subjects" },
  { to: "/app/assessment-builder", label: "Assessment Builder" },
  { to: "/app/settings", label: "Settings" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)]/95 px-4 sm:px-6 backdrop-blur-xl transition-colors duration-200">
        {/* Left Side: Mobile Menu Button & Global Search Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] md:hidden hover:bg-[var(--bg-surface-elevated)] dark:hover:bg-[var(--bg-surface-elevated)]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3.5 py-1.5 text-xs text-[var(--text-secondary)] backdrop-blur-md cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-all">
            <Search size={14} className="text-[var(--text-muted)]" />
            <span>Search subjects, assessment formulas, templates...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>

        {/* Right Side: Theme Toggle, Notifications, User Profile, Logout */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] dark:hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-all shadow-sm"
            aria-label="Toggle theme"
            title="Toggle theme mode"
          >
            {theme === "dark" ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-purple-600" />
            )}
          </button>

          <NavLink
            to="/app/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] dark:hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-all shadow-sm"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#c084fc]" />
          </NavLink>

          <div className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* User Profile Pill */}
          <NavLink
            to="/app/profile"
            className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 pr-3 hover:bg-[var(--bg-surface-elevated)] dark:hover:bg-[var(--bg-surface-elevated)] transition-all"
            title={user?.name || "User Profile"}
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-xs font-bold text-white shadow-sm">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-400 transition-all shadow-sm"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
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

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-[var(--border)] bg-[var(--bg-surface)]/95 dark:bg-[var(--bg-surface)]/95 px-4 py-3 md:hidden z-20 backdrop-blur-2xl"
          >
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--accent-purple-soft)] text-[var(--accent-purple-strong)] border border-[var(--accent-purple)]/20"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
