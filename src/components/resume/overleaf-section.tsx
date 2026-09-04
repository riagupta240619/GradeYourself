import { useState } from "react";
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Layers,
  Palette,
  FileCode,
  Zap,
  Globe,
  FileText,
  Award,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OverleafTemplate, ResumeDomain, ResumeBuilderType } from "./resume-types";

interface OverleafSectionProps {
  templates: OverleafTemplate[];
  loading: boolean;
  onUseTemplate: (template: OverleafTemplate) => void;
}

const TOP_PLATFORMS = [
  {
    id: "canva",
    name: "Canva",
    tagline: "Visual & Creative Drag-and-Drop",
    desc: "Hundreds of visual graphic presets, modern layouts, and asset libraries. Perfect for UI/UX, full-stack, and creative tech portfolios.",
    url: "https://www.canva.com/resumes/templates/",
    icon: Palette,
    badge: "Visual / Creative",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    id: "overleaf",
    name: "Overleaf (LaTeX)",
    tagline: "Tech & Academic Gold Standard",
    desc: "Precise typesetting, mathematical equations, and single-page ATS-proof formats favored by FAANG, academia, and systems engineers.",
    url: "https://www.overleaf.com/latex/templates/category/cv-or-resume",
    icon: FileCode,
    badge: "LaTeX / FAANG",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  },
  {
    id: "flowcv",
    name: "FlowCV",
    tagline: "Smart ATS Auto-Formatter",
    desc: "Clean sans-serif typography with live spacing adjustments, real-time preview, and free high-resolution ATS-parsed PDF downloads.",
    url: "https://flowcv.com/",
    icon: Zap,
    badge: "Smart ATS",
    badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
  },
  {
    id: "reactive_resume",
    name: "Reactive Resume",
    tagline: "100% Free & Open-Source",
    desc: "Privacy-focused, zero ads, zero tracking, and fully compatible with the standard JSON Resume schema with multi-theme exports.",
    url: "https://rxresu.me/",
    icon: Globe,
    badge: "Open-Source / Free",
    badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
  },
  {
    id: "google_docs",
    name: "Google Docs",
    tagline: "Universal & Free Cloud Templates",
    desc: "100% accessible anywhere, zero rendering quirks, and guaranteed parser transparency for enterprise ATS scanners.",
    url: "https://docs.google.com/document/u/0/?ftv=1",
    icon: FileText,
    badge: "Universal Cloud",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    id: "novoresume",
    name: "Novoresume",
    tagline: "Corporate ATS Optimizer",
    desc: "Structured layouts with real-time content optimization tips and bullet suggestions for tech and corporate roles.",
    url: "https://novoresume.com/resume-templates",
    icon: Award,
    badge: "Content Optimizer",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  }
];

export function OverleafSection({ templates, loading, onUseTemplate }: OverleafSectionProps) {
  const [selectedDomain, setSelectedDomain] = useState<ResumeDomain>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<ResumeBuilderType>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter templates by domain and platform
  const filtered = templates.filter(t => {
    const matchesDomain = selectedDomain === "all" || t.domain === selectedDomain;
    const matchesPlatform = selectedPlatform === "all" || 
      t.platform === selectedPlatform || 
      (selectedPlatform === "overleaf" && (!t.platform || t.platform === "overleaf"));
    return matchesDomain && matchesPlatform;
  });

  const handleCopy = (t: OverleafTemplate) => {
    navigator.clipboard.writeText(t.previewSnippet || t.description);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case "canva":
        return { label: "🎨 Canva", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", btnText: "Open in Canva" };
      case "flowcv":
        return { label: "⚡ FlowCV", style: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", btnText: "Open in FlowCV" };
      case "reactive_resume":
        return { label: "🌐 Reactive Resume", style: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", btnText: "Open in Reactive" };
      case "google_docs":
        return { label: "📄 Google Docs", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", btnText: "Open in Docs" };
      default:
        return { label: "🍃 Overleaf", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", btnText: "Open in Overleaf" };
    }
  };

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: TOP RESUME BUILDERS & EXTERNAL SITES DIRECTORY ── */}
      <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Top Resume Builders & Platforms
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct links to build and customize your resume on industry-leading platforms.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOP_PLATFORMS.map(p => {
            const IconComp = p.icon;
            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 transition hover:-translate-y-0.5 hover:border-purple-500/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                        <IconComp size={15} />
                      </div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h4>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.badgeBg}`}>
                      {p.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] font-semibold text-[var(--text-secondary)]">
                    {p.tagline}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Official Platform</span>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Visit {p.name} <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 2: CURATED TEMPLATES & FILTERS (Starts cleanly from screenshot 2) ── */}
      <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Curated Resume Templates Gallery
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Filter by platform or target track and import pre-configured templates into your GradeWise library.
              </p>
            </div>
          </div>
        </div>

        {/* ── FILTER BARS: PLATFORM & DOMAIN ── */}
        <div className="space-y-3">
          {/* Platform filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">Platform:</span>
            {(["all", "canva", "overleaf", "flowcv", "reactive_resume", "google_docs"] as const).map(plat => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  selectedPlatform === plat
                    ? "bg-purple-600 text-white shadow-xs"
                    : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {plat === "all" ? "All Builders" :
                 plat === "canva" ? "🎨 Canva" :
                 plat === "overleaf" ? "🍃 Overleaf (LaTeX)" :
                 plat === "flowcv" ? "⚡ FlowCV" :
                 plat === "reactive_resume" ? "🌐 Reactive Resume" : "📄 Google Docs"}
              </button>
            ))}
          </div>

          {/* Domain filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">Target Track:</span>
            {(["all", "cybersecurity", "fullstack", "ai_ml", "devops_cloud", "sde"] as const).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedDomain === d
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {d === "all" ? "All Tracks" :
                 d === "cybersecurity" ? "🛡️ Cyber" :
                 d === "fullstack" ? "🌐 Full Stack" :
                 d === "ai_ml" ? "🧠 AI/ML" :
                 d === "devops_cloud" ? "☁️ DevOps" : "⚡ SDE"}
              </button>
            ))}
          </div>
        </div>

        {/* ── TEMPLATES GRID ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {loading ? (
            <div className="col-span-full py-10 text-center text-sm text-[var(--text-secondary)]">
              Loading curated templates across builders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No templates found matching your selected platform and domain filter.
            </div>
          ) : (
            filtered.map(t => {
              const badgeMeta = getPlatformBadge(t.platform);
              const externalUrl = t.builderUrl || t.overleafUrl;

              return (
                <div
                  key={t.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeMeta.style}`}>
                        {badgeMeta.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">
                        {t.domain.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-600 transition">
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
                      href={externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition"
                    >
                      {badgeMeta.btnText} <ExternalLink size={12} />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUseTemplate(t)}
                      className="rounded-xl text-xs"
                      title="Add this template to your stored resumes in GradeWise"
                    >
                      <Plus size={13} className="mr-1" /> Use
                    </Button>
                    <button
                      onClick={() => handleCopy(t)}
                      className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition"
                      title="Copy boilerplate snippet or details"
                    >
                      {copiedId === t.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
