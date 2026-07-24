import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

const notifications = [
  { group: "Today", icon: AlertTriangle, tone: "var(--color-warning)", text: "Computer Networks flagged as at-risk", read: false },
  { group: "Today", icon: TrendingUp, tone: "var(--color-accent)", text: "Your predicted CGPA updated to 8.2–8.6", read: false },
  { group: "This Week", icon: CheckCircle2, tone: "var(--color-success)", text: "Your community template for XYZ University was approved", read: true },
];

export function NotificationsPage() {
  const groups = Array.from(new Set(notifications.map((n) => n.group)));
  return (
    <div className="flex max-w-xl flex-col gap-6 animate-fade-up">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-2 text-sm font-medium text-[var(--text-tertiary)]">{g}</p>
          <div className="flex flex-col gap-1.5">
            {notifications.filter((n) => n.group === g).map((n, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <n.icon size={16} style={{ color: n.tone }} className="shrink-0" />
                <span className={n.read ? "text-[var(--text-secondary)]" : "font-medium"}>{n.text}</span>
                {!n.read && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
