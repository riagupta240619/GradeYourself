import { useState, useEffect } from "react";
import { Search, CheckCircle2, AlertCircle, Layers, Download, Eye, Loader2, BookOpen, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateService } from "@/services/template-service";
import type { GradingScheme } from "@/types";
import { normalizeScheme } from "@/utils/grading-engine";
import { toast } from "sonner";

interface TemplateMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GradingScheme) => void;
}

export function TemplateMarketplaceModal({ isOpen, onClose, onSelectTemplate }: TemplateMarketplaceModalProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "verified" | "custom">("all");
  const [templates, setTemplates] = useState<GradingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<GradingScheme | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      TemplateService.getTemplates()
        .then((data) => setTemplates(data || []))
        .catch(() => setTemplates([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = templates.filter((t) => {
    const matchesSearch =
      (t.university || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.name || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (category === "verified") return t.verified;
    if (category === "custom") return !t.verified;
    return true;
  });

  const handleUseTemplate = (tmpl: GradingScheme) => {
    onSelectTemplate(tmpl);
    onClose();
    toast.success(`Template "${tmpl.name}" imported into Assessment Builder! Customize weights & assessments.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/95 shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Marketplace Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 p-6 bg-white/80 dark:bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
              <Sparkles size={14} /> Evaluation Scheme Repository
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Browse Community & University Templates</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Select a pre-configured scheme to clone into your Assessment Builder
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-slate-900 dark:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 px-6 py-4 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/80 p-1 border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setCategory("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                category === "all" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Templates ({templates.length})
            </button>
            <button
              onClick={() => setCategory("verified")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                category === "verified" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Verified Universities
            </button>
            <button
              onClick={() => setCategory("custom")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                category === "custom" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Custom Community Schemes
            </button>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-400 w-full sm:w-72">
            <Search size={15} className="text-zinc-500" />
            <input
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none"
              placeholder="Search university or scheme name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Templates Marketplace Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-purple-500 dark:text-purple-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">Loading evaluation scheme repository...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-lg">
                <BookOpen size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No scheme templates found.</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const norm = normalizeScheme(t);

                return (
                  <Card key={t.id || (t as any)._id} className="border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-zinc-900/90 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-xl">
                    <CardContent className="flex flex-col gap-4 pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">{t.university}</h3>
                          <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold mt-0.5">{t.name}</p>
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

                      <div className="flex flex-col gap-1.5 text-xs bg-slate-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-slate-200 dark:border-white/5 font-mono">
                        {norm.components.map((c) => (
                          <div key={c.id} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-700 dark:text-zinc-300 truncate max-w-[150px] font-sans">{c.name}</span>
                            <span className="text-purple-400 font-bold">{c.weightPct}% ({c.rule.toUpperCase()})</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-white/10 pt-3">
                        <span className="text-zinc-400 font-medium">Community Usage</span>
                        <span className="font-mono font-bold text-purple-400">{(t.usedBy || 1200).toLocaleString()} Users</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 gap-1.5 text-xs font-bold"
                          onClick={() => handleUseTemplate(t)}
                        >
                          <Download size={14} /> Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => setPreviewTemplate(t)}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Scheme Detailed Breakdown Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{previewTemplate.name}</h3>
                <p className="text-xs text-purple-600 dark:text-purple-300">{previewTemplate.university}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {normalizeScheme(previewTemplate).components.map((comp) => (
                <div key={comp.id} className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900 p-3.5 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>{comp.name}</span>
                    <Badge tone="accent">{comp.weightPct}% Weight</Badge>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Aggregation Rule: <span className="text-purple-600 dark:text-purple-300 font-semibold">{comp.rule.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 border-t border-slate-200 dark:border-white/5 pt-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Nested Assessments</span>
                    {comp.assessments.map((a) => (
                      <div key={a.id} className="flex justify-between text-slate-700 dark:text-zinc-300 text-[11px] font-mono">
                        <span>{a.name}</span>
                        <span className="text-purple-400 font-bold">Max: {a.maxMarks} Marks</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 font-bold"
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  handleUseTemplate(tmpl);
                }}
              >
                Use Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
