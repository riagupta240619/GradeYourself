import { useState, useRef } from "react";
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Sparkles, 
  ShieldAlert, 
  Globe, 
  Cpu, 
  Cloud, 
  Smartphone, 
  Terminal, 
  FileText, 
  Link as LinkIcon, 
  Loader2, 
  Check, 
  X,
  FileCode,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeItem, ResumeDomain, ResumeData } from "./resume-types";
import { DOMAIN_INFO } from "./resume-types";

interface ResumeListProps {
  resumes: ResumeItem[];
  loading: boolean;
  selectedResumeId: string;
  onSelectResume: (id: string) => void;
  onCreateResume: (data: {
    name: string;
    domain: ResumeDomain;
    targetRole?: string;
    overleafUrl?: string;
    rawText?: string;
    skills?: string[];
  }) => Promise<void>;
  onDuplicateResume: (id: string) => Promise<void>;
  onDeleteResume: (id: string) => Promise<void>;
  onUpdateResume: (id: string, patch: Partial<ResumeItem>) => Promise<void>;
  onParsePdf?: (file: File) => Promise<{ text: string; domain: ResumeDomain; suggestedRole: string; detectedSkills: string[]; suggestedName: string }>;
}

export function ResumeList({
  resumes,
  loading,
  selectedResumeId,
  onSelectResume,
  onCreateResume,
  onDuplicateResume,
  onDeleteResume,
  onUpdateResume,
  onParsePdf
}: ResumeListProps) {
  const [selectedDomain, setSelectedDomain] = useState<ResumeDomain>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOverleafId, setEditingOverleafId] = useState<string | null>(null);
  const [tempOverleafUrl, setTempOverleafUrl] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState<ResumeDomain>("fullstack");
  const [newTargetRole, setNewTargetRole] = useState("");
  const [newOverleafUrl, setNewOverleafUrl] = useState("");
  const [newSkills, setNewSkills] = useState("");
  const [newRawText, setNewRawText] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = resumes.filter(r => selectedDomain === "all" || r.domain === selectedDomain);

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const skillsArray = newSkills.split(",").map(s => s.trim()).filter(Boolean);
      await onCreateResume({
        name: newName.trim(),
        domain: newDomain,
        targetRole: newTargetRole.trim(),
        overleafUrl: newOverleafUrl.trim(),
        rawText: newRawText.trim(),
        skills: skillsArray
      });
      setShowCreateModal(false);
      setNewName("");
      setNewTargetRole("");
      setNewOverleafUrl("");
      setNewSkills("");
      setNewRawText("");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverleafLink = async (id: string) => {
    await onUpdateResume(id, { overleafUrl: tempOverleafUrl.trim() });
    setEditingOverleafId(null);
    setTempOverleafUrl("");
  };

  const getDomainIcon = (domain: ResumeDomain) => {
    switch (domain) {
      case "cybersecurity": return <ShieldAlert size={15} className="text-red-500" />;
      case "fullstack": return <Globe size={15} className="text-blue-500" />;
      case "ai_ml": return <Cpu size={15} className="text-purple-500" />;
      case "devops_cloud": return <Cloud size={15} className="text-cyan-500" />;
      case "mobile": return <Smartphone size={15} className="text-emerald-500" />;
      case "sde": return <Terminal size={15} className="text-amber-500" />;
      default: return <FileText size={15} className="text-gray-500" />;
    }
  };

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onParsePdf) return;
    try {
      setUploadingPdf(true);
      setUploadError(null);
      const parsed = await onParsePdf(file);
      const resumeTitle = parsed.suggestedName || file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
      const detectedDomain = parsed.domain || "fullstack";
      const targetRole = parsed.suggestedRole || "";
      const skillsArray = parsed.detectedSkills || [];
      const rawText = parsed.text || "";

      await onCreateResume({
        name: resumeTitle,
        domain: detectedDomain,
        targetRole,
        rawText,
        skills: skillsArray
      });
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Failed to parse PDF file. Please ensure it is an unencrypted PDF.");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  return (
    <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
      {/* Hidden PDF file input */}
      <input
        type="file"
        ref={pdfInputRef}
        onChange={handlePdfUpload}
        accept=".pdf,.txt"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Domain Resumes & Versions</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage specialized resumes tailored for different tracks (Cybersecurity, Full-Stack, AI/ML, SDE).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onParsePdf && (
            <Button
              variant="outline"
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploadingPdf}
              className="rounded-xl text-xs font-semibold"
              title="Upload your existing PDF resume to auto-import it"
            >
              {uploadingPdf ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5 text-blue-600" />}
              {uploadingPdf ? "Parsing PDF…" : "Upload Existing PDF"}
            </Button>
          )}

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold shadow-sm"
          >
            <Plus size={14} className="mr-1.5" /> Create Targeted Resume
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-600 dark:text-red-300">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-2 font-bold hover:opacity-75">×</button>
        </div>
      )}

      {/* Domain Filter Pills */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(["all", "cybersecurity", "fullstack", "ai_ml", "devops_cloud", "sde"] as const).map(d => {
          const count = d === "all" ? resumes.length : resumes.filter(r => r.domain === d).length;
          return (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedDomain === d
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {d === "all" ? "All Resumes" :
               d === "cybersecurity" ? "🛡️ Cybersecurity" :
               d === "fullstack" ? "🌐 Full Stack" :
               d === "ai_ml" ? "🧠 AI & ML" :
               d === "devops_cloud" ? "☁️ Cloud / DevOps" : "⚡ Core SDE"}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Resumes Grid */}
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading resume versions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
            <FileText className="mx-auto text-blue-500 mb-2 opacity-50" size={32} />
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">No resumes found in this domain</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Create a targeted resume for this role or import an Overleaf template from above.
            </p>
            <Button
              onClick={() => {
                if (selectedDomain !== "all") setNewDomain(selectedDomain);
                setShowCreateModal(true);
              }}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs"
            >
              <Plus size={13} className="mr-1" /> Add Resume
            </Button>
          </div>
        ) : (
          filtered.map(r => {
            const isSelected = selectedResumeId === r._id;
            const domainMeta = DOMAIN_INFO[r.domain as keyof typeof DOMAIN_INFO] || DOMAIN_INFO.fullstack;

            return (
              <div
                key={r._id}
                className={`group flex flex-col justify-between rounded-2xl border p-5 transition shadow-sm ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-blue-500/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-semibold">
                      {getDomainIcon(r.domain)}
                      {domainMeta.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      v{r.versionNumber || 1}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-[var(--text-primary)]">
                    {r.name}
                  </h3>

                  {r.targetRole && (
                    <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                      🎯 Target: {r.targetRole}
                    </p>
                  )}

                  {/* Overleaf Link Section */}
                  <div className="mt-3 rounded-xl bg-[var(--bg-surface-elevated)] p-2.5 border border-[var(--border)]">
                    {editingOverleafId === r._id ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={tempOverleafUrl}
                          onChange={e => setTempOverleafUrl(e.target.value)}
                          placeholder="https://www.overleaf.com/project/..."
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingOverleafId(null)}
                            className="rounded-md px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveOverleafLink(r._id)}
                            className="rounded-md bg-emerald-600 px-2.5 py-0.5 text-[11px] text-white font-semibold"
                          >
                            Save Link
                          </button>
                        </div>
                      </div>
                    ) : r.overleafUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={r.overleafUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <FileCode size={13} /> Overleaf Project <ExternalLink size={11} />
                        </a>
                        <button
                          onClick={() => {
                            setEditingOverleafId(r._id);
                            setTempOverleafUrl(r.overleafUrl || "");
                          }}
                          className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingOverleafId(r._id);
                          setTempOverleafUrl("");
                        }}
                        className="text-xs text-[var(--text-secondary)] hover:text-emerald-600 transition flex items-center gap-1"
                      >
                        <LinkIcon size={12} /> Link Overleaf Project URL
                      </button>
                    )}
                  </div>

                  {/* Skills preview */}
                  {(r.data?.skills || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(r.data?.skills || []).slice(0, 4).map(skill => (
                        <span key={skill} className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2 py-0.5 text-[10px] font-medium">
                          {skill}
                        </span>
                      ))}
                      {(r.data?.skills || []).length > 4 && (
                        <span className="text-[10px] text-[var(--text-tertiary)] self-center">
                          +{(r.data?.skills || []).length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <Button
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onSelectResume(r._id)}
                    className="flex-1 rounded-xl text-xs font-semibold"
                  >
                    <Sparkles size={12} className="mr-1" />
                    {isSelected ? "Active in ATS" : "Scan in ATS"}
                  </Button>

                  <button
                    onClick={() => onDuplicateResume(r._id)}
                    className="rounded-xl border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition"
                    title="Duplicate to create role variant"
                  >
                    <Copy size={13} />
                  </button>

                  {confirmingDeleteId === r._id ? (
                    <div className="flex items-center gap-1 rounded-xl bg-red-500/10 p-1 border border-red-500/30 animate-in fade-in">
                      <span className="text-[10px] font-bold text-red-600 px-1">Delete?</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onDeleteResume(r._id);
                          setConfirmingDeleteId(null);
                        }}
                        className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-700 transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDeleteId(null);
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteId(r._id);
                      }}
                      className="rounded-xl border border-[var(--border)] p-2 text-red-500/70 hover:bg-red-500/10 hover:text-red-600 transition"
                      title="Delete resume"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE RESUME MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-lg rounded-2xl border border-[var(--border)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Create Targeted Domain Resume</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)]">Resume Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Cybersecurity Threat Analyst CV or Full Stack MERN"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Target Domain</label>
                  <select
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value as ResumeDomain)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="cybersecurity">🛡️ Cybersecurity</option>
                    <option value="fullstack">🌐 Full Stack</option>
                    <option value="ai_ml">🧠 AI & ML</option>
                    <option value="devops_cloud">☁️ Cloud / DevOps</option>
                    <option value="mobile">📱 Mobile Dev</option>
                    <option value="sde">⚡ Core SDE</option>
                    <option value="other">📄 General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Target Role</label>
                  <input
                    type="text"
                    value={newTargetRole}
                    onChange={e => setNewTargetRole(e.target.value)}
                    placeholder="e.g. SOC Analyst or React Lead"
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)]">Overleaf Project URL (Optional)</label>
                <input
                  type="url"
                  value={newOverleafUrl}
                  onChange={e => setNewOverleafUrl(e.target.value)}
                  placeholder="https://www.overleaf.com/project/6492... or share link"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)]">Key Skills (comma-separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  placeholder="e.g. Wireshark, Splunk, NIST or React, Node.js, Docker"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-primary)]">Resume Raw Text / LaTeX Content (Optional)</label>
                <textarea
                  value={newRawText}
                  onChange={e => setNewRawText(e.target.value)}
                  placeholder="Paste your resume content or bullet points to enable immediate ATS scanning…"
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  Create Resume
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
