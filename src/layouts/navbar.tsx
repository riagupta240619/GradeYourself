import { NavLink, useNavigate } from "react-router-dom";
import { Search, Sun, Moon, Bell, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "R";

  return (
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-sm text-[var(--color-accent)] font-semibold"
          title={user?.name || "Profile"}
        >
          {initial}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-red-400"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
