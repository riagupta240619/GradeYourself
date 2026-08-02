import { Bot, TrendingDown, Target, Sparkles, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const suggestions = [
  {
    icon: TrendingDown,
    tone: "warning" as const,
    title: "At-Risk Focus Recommendation",
    text: "Computer Networks has declined across your last 2 assessments. The final exam is worth 50% of your total grade — prioritize revision here first.",
    action: "Review Computer Networks",
    link: "/app/subjects",
  },
  {
    icon: Target,
    tone: "accent" as const,
    title: "CGPA Milestone Gap Analysis",
    text: "You're only 6% away from reaching your 9.0 CGPA target. Data Structures and Database Systems currently have the highest available weightage headroom to close that gap.",
    action: "Open Target Planner",
    link: "/app/target-planner",
  },
  {
    icon: Award,
    tone: "success" as const,
    title: "High Performance Trajectory",
    text: "Software Engineering internal assessments are averaging 94%. Maintaining this trajectory guarantees an A+ grade baseline.",
    action: "View Full Analytics",
    link: "/app/analytics",
  },
];

export function AdvisorPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Bot size={12} className="text-purple-400" /> AI Academic Assistant
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Academic Advisor</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Real-time intelligent recommendations calculated from your live subject marks and exam weightages.</p>
      </div>

      <Card className="glow-purple border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-50/80 via-white to-slate-50 dark:bg-zinc-900 shadow-sm">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
            <Sparkles size={24} />
          </div>
          <div>
<<<<<<< Updated upstream
            <h3 className="text-sm font-bold text-white">Automated Study Optimization Active</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Engine analyzed 4 active subjects and identified 3 high-impact action items for this semester.</p>
=======
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Automated Study Optimization Active</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Engine analyzed 4 active subjects and identified 3 high-impact action items for this semester.</p>
>>>>>>> Stashed changes
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {suggestions.map((s, i) => (
          <Card key={i} className="hover:border-purple-500/30 transition-all">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  s.tone === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : s.tone === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                }`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    <Badge tone={s.tone}>{s.tone.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">{s.text}</p>
                </div>
              </div>

              <Link to={s.link} className="shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
                  {s.action} <ArrowRight size={13} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
