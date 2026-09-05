import { AlertTriangle, TrendingUp, CheckCircle2, Bell, Sparkles, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const notifications = [
  {
    group: "Today",
    icon: AlertTriangle,
    tone: "amber",
    title: "Computer Networks Risk Alert",
    text: "Computer Networks has been flagged as at-risk based on recent quiz assessment scores.",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    group: "Today",
    icon: TrendingUp,
    tone: "accent",
    title: "Target CGPA Recalculation",
    text: "Your predicted overall CGPA range has been updated to 8.4–8.8 CGPA following latest mark entry.",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    group: "This Week",
    icon: CheckCircle2,
    tone: "success",
    title: "Template Verification Approved",
    text: "Your community evaluation scheme template for Chitkara University was verified and published.",
    timestamp: "2 days ago",
    read: true,
  },
];

export function NotificationsPage() {
  const groups = Array.from(new Set(notifications.map((n) => n.group)));

  return (
    <div className="flex max-w-4xl flex-col gap-8 pb-10">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
          <Bell size={14} className="text-purple-600 dark:text-purple-400" /> Notifications Feed
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Updates & Alerts</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Real-time notifications regarding grade risks, prediction recalculations, and scheme approvals.
        </p>
      </div>

      {groups.map((g) => (
        <div key={g} className="flex flex-col gap-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 px-1">{g}</p>
          <div className="flex flex-col gap-3">
            {notifications
              .filter((n) => n.group === g)
              .map((n, i) => (
                <Card
                  key={i}
                  className={`flex items-start gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                    n.read
                      ? "border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-zinc-950/40 text-slate-600 dark:text-zinc-400"
                      : "border-purple-200 bg-white dark:border-purple-500/30 dark:bg-zinc-900/90 text-slate-900 dark:text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      n.tone === "amber"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                        : n.tone === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                        : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30"
                    }`}
                  >
                    <n.icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{n.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                          <Clock size={12} /> {n.timestamp}
                        </span>
                        {!n.read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse shadow-sm" title="Unread" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{n.text}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
