import { useState } from "react";
import { ExternalLink, Copy, Check, FileCode, Sparkles, BookOpen, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OverleafTemplate, ResumeDomain } from "./resume-types";

interface OverleafSectionProps {
  templates: OverleafTemplate[];
  loading: boolean;
  onUseTemplate: (template: OverleafTemplate) => void;
}

export function OverleafSection({ templates, loading, onUseTemplate }: OverleafSectionProps) {
  const [selectedDomain, setSelectedDomain] = useState<ResumeDomain>("all");
  const [previewTemplate, setPreviewTemplate] = useState<OverleafTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = templates.filter(t => selectedDomain === "all" || t.domain === selectedDomain);

  const handleCopy = (t: OverleafTemplate) => {
    navigator.clipboard.writeText(t.previewSnippet);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Overleaf LaTeX Templates & Resources</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Industry-proven LaTeX resume templates with 1-click Overleaf editing and full ATS compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.overleaf.com/project"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs font-semibold hover:border-emerald-500/50 hover:text-emerald-600 transition"
          >
            My Overleaf Projects <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Domain filters */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(["all", "cybersecurity", "fullstack", "ai_ml", "devops_cloud", "sde"] as const).map(d => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedDomain === d
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {d === "all" ? "All Templates" :
             d === "cybersecurity" ? "🛡️ Cybersecurity" :
             d === "fullstack" ? "🌐 Full Stack" :
             d === "ai_ml" ? "🧠 AI & ML" :
             d === "devops_cloud" ? "☁️ Cloud / DevOps" : "⚡ Core SDE"}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading Overleaf templates…
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-secondary)]">
            No templates found for this filter.
          </div>
        ) : (
          filtered.map(t => (
            <div
              key={t.id}
              className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">LaTeX</span>
                </div>

                <h3 className="mt-2.5 text-base font-bold text-[var(--text-primary)] group-hover:text-emerald-600 transition">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {t.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {t.tags.map(tag => (
                    <span key={tag} className="rounded-md bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <a
                  href={t.overleafUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Open in Overleaf <ExternalLink size={12} />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUseTemplate(t)}
                  className="rounded-xl text-xs"
                  title="Add this template to your stored resumes"
                >
                  <Plus size={13} className="mr-1" /> Use
                </Button>
                <button
                  onClick={() => handleCopy(t)}
                  className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition"
                  title="Copy LaTeX boilerplate snippet"
                >
                  {copiedId === t.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
