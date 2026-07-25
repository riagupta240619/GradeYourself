import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function AppLayout() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
