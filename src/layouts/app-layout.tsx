import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function AppLayout() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] antialiased transition-colors duration-200">
      {/* Subtle Ambient Radial Background Glows (Dark Mode Only) */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl opacity-0 dark:opacity-60" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl opacity-0 dark:opacity-50" />

      {/* Main Layout Container */}
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
