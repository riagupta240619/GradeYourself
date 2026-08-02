import { useState, useEffect } from "react";
import { Search, CheckCircle2, AlertCircle, Layers, Download, Eye, Loader2, BookOpen, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateService } from "@/services/template-service";
import type { GradingScheme } from "@/types";
import { normalizeScheme } from "@/utils/grading-engine";
import { toast } from "sonner";

export function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<GradingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<GradingScheme | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await TemplateService.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load community templates:", err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function handleDeleteTemplate(id: string, name: string) {
    if (confirm(`Delete template "${name}"?`)) {
      try {
        await TemplateService.deleteTemplate(id);
        toast.info(`Deleted template "${name}"`);
        fetchTemplates();
      } catch (err) {
        toast.error("Cannot delete community template.");
      }
    }
  }

  const filtered = templates.filter(
    (t) =>
      (t.university || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex max-w-5xl flex-col gap-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <Layers size={12} className="text-purple-400" /> Scheme Repository
          </div>
<<<<<<< Updated upstream
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Community & University Grading Schemes</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
=======
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Community & University Grading Schemes</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
>>>>>>> Stashed changes
            Pre-configured evaluation schemes for Chitkara University, Standard Theory, & Lab courses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-2.5 text-xs text-zinc-400 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all w-full sm:w-72">
          <Search size={16} className="text-zinc-500" />
          <input
            className="w-full bg-transparent text-white placeholder-zinc-500 outline-none"
            placeholder="Search university or scheme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 size={24} className="animate-spin text-purple-400 mb-2" />
          <p className="text-xs text-zinc-400 font-medium">Loading community grading scheme repository...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-lg">
            <BookOpen size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No community templates found.</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">Save a custom template from the Assessment Builder.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const norm = normalizeScheme(t);

            return (
              <Card key={t.id || (t as any)._id} className="hover:border-purple-500/30 transition-all flex flex-col justify-between">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
<<<<<<< Updated upstream
                      <h3 className="font-bold text-white text-base leading-snug">{t.university}</h3>
                      <p className="text-xs text-purple-300 font-medium mt-0.5">{t.name}</p>
=======
                      <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{t.university}</h3>
                      <p className="text-xs text-purple-600 dark:text-purple-300 font-medium mt-0.5">{t.name}</p>
>>>>>>> Stashed changes
                    </div>
                    {t.verified ? (
                      <Badge tone="success">
                        <CheckCircle2 size={12} /> Verified
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        <AlertCircle size={12} /> Custom
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-xs bg-zinc-950/60 p-2.5 rounded-lg border border-white/5 font-mono">
                    {norm.components.map((c) => (
                      <div key={c.id} className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-300 truncate max-w-[150px]">{c.name}</span>
                        <span className="text-purple-400 font-bold">{c.weightPct}% ({c.rule.toUpperCase()})</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
                    <span className="text-zinc-400 font-medium">Verified Scheme</span>
                    <span className="font-mono font-bold text-purple-400">{(t.usedBy || 0).toLocaleString()} Users</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 gap-1.5"
                      onClick={() => toast.success(`Template "${t.name}" ready to use in Assessment Builder!`)}
                    >
                      <Download size={13} /> Select Scheme
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewTemplate(t)}>
                      <Eye size={13} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-lg">{previewTemplate.name}</h3>
                <p className="text-xs text-purple-300">{previewTemplate.university}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-zinc-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {normalizeScheme(previewTemplate).components.map((comp) => (
                <div key={comp.id} className="rounded-xl border border-white/10 bg-zinc-950 p-3.5 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-white">
                    <span>{comp.name}</span>
                    <Badge tone="accent">{comp.weightPct}% Weight</Badge>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Aggregation Rule: <span className="text-purple-300 font-semibold">{comp.rule.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Assessments</span>
                    {comp.assessments.map((a) => (
                      <div key={a.id} className="flex justify-between text-zinc-300 text-[11px]">
                        <span>{a.name}</span>
                        <span className="font-mono text-purple-400">Max: {a.maxMarks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="primary" size="sm" onClick={() => setPreviewTemplate(null)}>
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
