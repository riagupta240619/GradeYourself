import { AlertTriangle, TrendingUp, CheckCircle2, Bell, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const notifications = [
  { group: "Today", icon: AlertTriangle, tone: "amber", text: "Computer Networks flagged as at-risk based on recent quiz scores", read: false },
  { group: "Today", icon: TrendingUp, tone: "accent", text: "Your predicted CGPA range updated to 8.2–8.6 CGPA", read: false },
  { group: "This Week", icon: CheckCircle2, tone: "success", text: "Your community template for Chitkara University was verified", read: true },
];

export function NotificationsPage() {
  const groups = Array.from(new Set(notifications.map((n) => n.group)));

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Bell size={12} className="text-purple-400" /> Notifications Feed
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Updates & Alerts</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Real-time alerts regarding grade risks, prediction recalculations, and scheme approvals.</p>
      </div>

      {groups.map((g) => (
        <div key={g} className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400">{g}</p>
          <div className="flex flex-col gap-2.5">
            {notifications
              .filter((n) => n.group === g)
              .map((n, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 rounded-xl border p-4 text-xs transition-all ${
                    n.read
                      ? "border-white/10 bg-zinc-950/40 text-zinc-400"
                      : "border-purple-500/30 bg-purple-500/10 text-white font-semibold shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    n.tone === "amber"
                      ? "bg-amber-500/20 text-amber-400"
                      : n.tone === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    <n.icon size={16} />
                  </div>

                  <span className="flex-1 leading-snug">{n.text}</span>

                  {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500 shadow-[0_0_8px_#7c3aed]" />}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
