import { useState } from "react";
import { Search, CheckCircle2, AlertCircle, Layers, Sparkles, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { communityTemplates } from "@/lib/data/mock";
import { toast } from "sonner";

export function TemplatesPage() {
  const [search, setSearch] = useState("");

  const filtered = communityTemplates.filter(
    (t) =>
      t.university.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex max-w-5xl flex-col gap-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Layers size={12} className="text-purple-400" /> Scheme Repository
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Community Grading Schemes</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Pre-configured grading schemes & credit distributions from top universities worldwide.</p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-400 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all w-full sm:w-72">
          <Search size={16} className="text-zinc-500" />
          <input
            className="w-full bg-transparent text-white placeholder-zinc-500 outline-none"
            placeholder="Search university or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:border-purple-500/30 transition-all flex flex-col justify-between">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{t.university}</h3>
                  <p className="text-xs text-purple-300 font-medium mt-0.5">{t.name}</p>
                </div>
                {t.verified ? (
                  <Badge tone="success">
                    <CheckCircle2 size={12} /> Verified
                  </Badge>
                ) : (
                  <Badge tone="warning">
                    <AlertCircle size={12} /> Unverified
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                <span className="text-zinc-400 font-medium">Verified Community Scheme</span>
                <span className="font-mono font-bold text-purple-400">{t.usedBy.toLocaleString()} Users</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={() => toast.success(`Applied ${t.name} scheme!`)}
                >
                  <Download size={13} /> Use Scheme
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info(`Previewing ${t.name}`)}>
                  <Eye size={13} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
