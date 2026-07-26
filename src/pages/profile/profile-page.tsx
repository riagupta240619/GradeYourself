import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { communityTemplates } from "@/lib/data/mock";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, Award, BookOpen, Sparkles } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const contributed = communityTemplates.slice(0, 1);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <GraduationCap size={12} className="text-purple-400" /> Student Profile
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">User Profile & Activity</h1>
      </div>

      {/* User Header Profile Card */}
      <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/20">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-3xl font-bold text-white shadow-xl">
            {initial}
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold text-white">{user?.name || "Student User"}</h2>
            <p className="text-xs text-purple-300 font-medium">{user?.college || "Chitkara University Institute of Engineering & Technology"}</p>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <Badge tone="accent">{user?.branch || "Computer Science & Engineering"}</Badge>
              <Badge tone="blue">Academic Session 2025-2026</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Semesters Tracked</p>
              <p className="text-4xl font-extrabold font-mono text-white mt-1">4</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen size={22} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Templates Contributed</p>
              <p className="text-4xl font-extrabold font-mono text-purple-400 mt-1">{contributed.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Award size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">Your Contributed Scheme Templates</h3>
          </div>

          {contributed.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 px-5 py-3.5 text-xs font-medium"
            >
              <span className="text-white font-semibold">{t.university} — {t.name}</span>
              <Badge tone={t.verified ? "success" : "warning"}>
                {t.verified ? "Verified Scheme ✓" : "Pending Review"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
