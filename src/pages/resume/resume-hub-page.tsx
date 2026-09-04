import { useState, useEffect } from "react";
import { 
  FileText, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  FileCode,
  ShieldAlert
} from "lucide-react";
import { api } from "@/services/api";
import { ResumeList } from "@/components/resume/resume-list";
import { OverleafSection } from "@/components/resume/overleaf-section";
import { AtsScannerSection } from "@/components/resume/ats-scanner-section";
import type { 
  ResumeItem, 
  ResumeDomain, 
  OverleafTemplate, 
  MultiEngineAnalysis 
} from "@/components/resume/resume-types";

export function ResumeHubPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [templates, setTemplates] = useState<OverleafTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ resumes: ResumeItem[] }>("/resumes");
      const fetched = res.data.resumes || [];
      setResumes(fetched);
      if (fetched.length > 0 && !selectedResumeId) {
        setSelectedResumeId(fetched[0]._id);
      }
    } catch {
      setError("Unable to load resumes. Sign in to store and manage multiple resume versions.");
    } finally {
      setLoading(false);
    }

    try {
      setTemplatesLoading(true);
      const tmplRes = await api.get<{ templates: OverleafTemplate[] }>("/resumes/templates/overleaf");
      setTemplates(tmplRes.data.templates || []);
    } catch {
      // Fallback empty templates handled by component
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateResume = async (params: {
    name: string;
    domain: ResumeDomain;
    targetRole?: string;
    overleafUrl?: string;
    rawText?: string;
    skills?: string[];
  }) => {
    try {
      const payload = {
        name: params.name,
        domain: params.domain,
        targetRole: params.targetRole,
        overleafUrl: params.overleafUrl,
        rawText: params.rawText,
        data: {
          skills: params.skills || [],
          personal: { name: params.name },
          experience: [],
          projects: [],
          education: []
        }
      };
      const res = await api.post<{ resume: ResumeItem }>("/resumes", payload);
      setResumes(prev => [res.data.resume, ...prev]);
      setSelectedResumeId(res.data.resume._id);
      showToast(`Created targeted resume for ${params.domain.toUpperCase()}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create resume.");
    }
  };

  const handleDuplicateResume = async (id: string) => {
    try {
      const res = await api.post<{ resume: ResumeItem }>(`/resumes/${id}/duplicate`);
      setResumes(prev => [res.data.resume, ...prev]);
      showToast("Duplicated resume successfully.");
    } catch {
      showToast("Unable to duplicate resume.");
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(prev => prev.filter(r => r._id !== id));
      if (selectedResumeId === id) {
        const remaining = resumes.filter(r => r._id !== id);
        setSelectedResumeId(remaining[0]?._id || "");
      }
      showToast("Resume deleted successfully.");
    } catch {
      showToast("Unable to delete resume.");
    }
  };

  const handleParsePdf = async (file: File) => {
    return new Promise<{ text: string; domain: ResumeDomain; suggestedRole: string; detectedSkills: string[]; suggestedName: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const res = await api.post<{ text: string; domain: ResumeDomain; suggestedRole: string; detectedSkills: string[]; suggestedName: string }>(
            "/resumes/parse-pdf",
            { base64, filename: file.name }
          );
          resolve(res.data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateResume = async (id: string, patch: Partial<ResumeItem>) => {
    try {
      const res = await api.put<{ resume: ResumeItem }>(`/resumes/${id}`, patch);
      setResumes(prev => prev.map(r => r._id === id ? res.data.resume : r));
      showToast("Resume updated.");
    } catch {
      showToast("Unable to update resume.");
    }
  };

  const handleUseTemplate = async (tmpl: OverleafTemplate) => {
    await handleCreateResume({
      name: `${tmpl.title} (Draft)`,
      domain: tmpl.domain,
      targetRole: tmpl.popularFor.split(",")[0].trim(),
      overleafUrl: tmpl.overleafUrl,
      rawText: tmpl.previewSnippet
    });
  };

  const handleRunScan = async (params: {
    resumeId?: string;
    resumeText?: string;
    jobDescription: string;
    targetRole?: string;
  }): Promise<MultiEngineAnalysis | null> => {
    try {
      setScanning(true);
      setError(null);
      const res = await api.post<{ analysis: MultiEngineAnalysis }>("/resumes/ats", params);
      showToast("ATS multi-engine scan completed!");
      return res.data.analysis;
    } catch (err: any) {
      setError(err.response?.data?.message || "ATS scan failed. Please check your inputs.");
      return null;
    } finally {
      setScanning(false);
    }
  };

  const domainsCount = new Set(resumes.map(r => r.domain)).size;
  const overleafLinkedCount = resumes.filter(r => Boolean(r.overleafUrl)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Resume Hub</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Organize domain-specific resumes, integrate with Overleaf LaTeX, and benchmark against Jobscan & Enhancv ATS scoring engines.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-semibold text-[var(--text-primary)] shadow-sm">
            📁 {resumes.length} Stored Resumes
          </span>
          <span className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-semibold text-blue-600 dark:text-blue-400 shadow-sm">
            🎯 {domainsCount} Active Tracks
          </span>
          <span className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm">
            🍃 {overleafLinkedCount} Overleaf Linked
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-600 dark:text-red-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── STACKED SECTION 1: IN-WEBSITE MULTI-ENGINE ATS SCANNER ── */}
      <AtsScannerSection
        resumes={resumes}
        selectedResumeId={selectedResumeId}
        onSelectResumeId={setSelectedResumeId}
        onRunScan={handleRunScan}
        onParsePdf={handleParsePdf}
        scanning={scanning}
      />

      {/* ── STACKED SECTION 2: DOMAIN RESUMES LIBRARY ── */}
      <ResumeList
        resumes={resumes}
        loading={loading}
        selectedResumeId={selectedResumeId}
        onSelectResume={setSelectedResumeId}
        onCreateResume={handleCreateResume}
        onDuplicateResume={handleDuplicateResume}
        onDeleteResume={handleDeleteResume}
        onUpdateResume={handleUpdateResume}
        onParsePdf={handleParsePdf}
      />

      {/* ── STACKED SECTION 3: OVERLEAF LATEX TEMPLATES & RESOURCES ── */}
      <OverleafSection
        templates={templates}
        loading={templatesLoading}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
