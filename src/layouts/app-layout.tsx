import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function AppLayout() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090b] text-white antialiased">
      {/* Subtle Ambient Radial Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl opacity-60" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl opacity-50" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-indigo-900/10 blur-3xl opacity-40" />

      {/* Main Layout Container */}
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
