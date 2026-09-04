import { useState, useRef } from "react";
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  FileText, 
  Layers, 
  Check, 
  Copy, 
  Loader2, 
  ShieldCheck, 
  Gauge, 
  Target,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeItem, ResumeDomain, MultiEngineAnalysis, ActionableFix } from "./resume-types";

interface AtsScannerSectionProps {
  resumes: ResumeItem[];
  selectedResumeId: string;
  onSelectResumeId: (id: string) => void;
  onRunScan: (params: { resumeId?: string; resumeText?: string; jobDescription: string; targetRole?: string }) => Promise<MultiEngineAnalysis | null>;
  onParsePdf?: (file: File) => Promise<{ text: string; domain: ResumeDomain; suggestedRole: string; detectedSkills: string[]; suggestedName: string }>;
  scanning: boolean;
}

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    role: "Full Stack Engineer (MERN / Cloud)",
    desc: "Seeking a Full Stack Software Engineer proficient in React, Next.js, TypeScript, Node.js, Express, and MongoDB/PostgreSQL. Experience building RESTful APIs, microservices, and deploying on AWS or Docker. Must have strong understanding of Git, CI/CD pipelines, state management, and performance optimization. 2+ years of experience delivering scalable web applications."
  },
  {
    role: "Cybersecurity Analyst / SOC Tier 1-2",
    desc: "We are hiring a Cybersecurity Analyst with hands-on experience in SIEM tools (Splunk, QRadar), Wireshark packet analysis, vulnerability management, and incident response. Familiarity with NIST CSF, OWASP Top 10, firewall rules, Kali Linux, and threat hunting. Industry certifications like Security+, CEH, or CySA+ preferred. Ability to analyze security logs and mitigate cyber threats."
  },
  {
    role: "Machine Learning / AI Engineer",
    desc: "Looking for an ML Engineer with deep knowledge of Python, PyTorch, TensorFlow, Scikit-learn, and NLP/transformers. Experience fine-tuning LLMs, building RAG pipelines, deploying models with Docker and FastAPI, and handling high-volume vector databases (Pinecone, Chroma). Strong mathematical background in linear algebra and deep learning optimization."
  },
  {
    role: "DevOps & Cloud SRE",
    desc: "Seeking a Cloud DevOps Engineer to manage Kubernetes clusters, Docker containers, and AWS/GCP cloud infrastructure. Experience with Terraform infrastructure-as-code, CI/CD GitHub Actions pipelines, Prometheus/Grafana monitoring, and maintaining 99.9% uptime SLA. Proficient in Linux, Bash, and microservice networking."
  }
];

export function AtsScannerSection({
  resumes,
  selectedResumeId,
  onSelectResumeId,
  onRunScan,
  onParsePdf,
  scanning
}: AtsScannerSectionProps) {
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTIONS[0].desc);
  const [targetRole, setTargetRole] = useState(SAMPLE_JOB_DESCRIPTIONS[0].role);
  const [customResumeText, setCustomResumeText] = useState("");
  const [useCustomText, setUseCustomText] = useState(false);
  const [analysis, setAnalysis] = useState<MultiEngineAnalysis | null>(null);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadMsg, setPdfUploadMsg] = useState<string | null>(null);
  const scannerPdfRef = useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    if (!jobDescription.trim()) return;
    const res = await onRunScan({
      resumeId: !useCustomText ? selectedResumeId : undefined,
      resumeText: useCustomText ? customResumeText : undefined,
      jobDescription,
      targetRole
    });
    if (res) {
      setAnalysis(res);
    }
  };

  const handleScanPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onParsePdf) return;
    try {
      setUploadingPdf(true);
      const parsed = await onParsePdf(file);
      setCustomResumeText(parsed.text || "");
      setUseCustomText(true);
      if (parsed.suggestedRole) {
        setTargetRole(parsed.suggestedRole);
      }
      setPdfUploadMsg(`Loaded "${file.name}" (detected: ${(parsed.domain || "general").toUpperCase()}) — ready for scan!`);
    } catch {
      alert("Unable to parse PDF file. Please ensure it is a readable PDF.");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  const handleCopyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKw(kw);
    setTimeout(() => setCopiedKw(null), 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30";
  };

  return (
    <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
      {/* Hidden PDF file input */}
      <input
        type="file"
        ref={scannerPdfRef}
        onChange={handleScanPdfUpload}
        accept=".pdf,.txt"
        className="hidden"
      />

      {/* Header */}
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">In-Website Multi-Engine ATS Scanner</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Evaluate your resume against industry scoring engines (Jobscan, Enhancv, ResumeWorded) without third-party paywalls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={13} /> 100% Native In-Browser Scan
            </span>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Column: Resume Selection & Source */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Resume Source to Scan</label>
              <div className="flex items-center gap-3">
                {onParsePdf && (
                  <button
                    type="button"
                    onClick={() => scannerPdfRef.current?.click()}
                    disabled={uploadingPdf}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Upload size={12} /> {uploadingPdf ? "Parsing PDF…" : "Upload PDF"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setUseCustomText(!useCustomText)}
                  className="text-xs font-medium text-purple-600 hover:underline"
                >
                  {useCustomText ? "← Select saved" : "Paste text →"}
                </button>
              </div>
            </div>

            {pdfUploadMsg && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="truncate">{pdfUploadMsg}</span>
                <button onClick={() => setPdfUploadMsg(null)} className="ml-2 font-bold hover:opacity-75">×</button>
              </div>
            )}

            {!useCustomText ? (
              <div className="mt-2 space-y-2">
                {resumes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--text-secondary)]">
                    No saved resumes found. Switch to "Paste custom text" or create one in the Resume Library below.
                  </p>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={e => onSelectResumeId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none"
                  >
                    {resumes.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({(r.domain || "general").toUpperCase()}) {r.targetRole ? `— ${r.targetRole}` : ""}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected resume preview info */}
                {selectedResumeId && resumes.find(r => r._id === selectedResumeId) && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 text-xs space-y-1">
                    {(() => {
                      const sel = resumes.find(r => r._id === selectedResumeId)!;
                      return (
                        <>
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-[var(--text-primary)]">{sel.name}</span>
                            <span className="capitalize text-purple-600">{sel.domain}</span>
                          </div>
                          {sel.overleafUrl && (
                            <p className="text-[var(--text-secondary)] truncate">
                              🔗 Overleaf Linked: {sel.overleafUrl}
                            </p>
                          )}
                          <p className="text-[var(--text-tertiary)]">
                            Skills: {(sel.data?.skills || []).slice(0, 5).join(", ") || "No structured skills"}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={customResumeText}
                onChange={e => setCustomResumeText(e.target.value)}
                placeholder="Paste your raw resume text, bullet points, or LaTeX document content here to scan…"
                className="mt-2 min-h-[160px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs font-mono focus:border-purple-500 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Target Role / Title</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Developer, Security Operations Analyst"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Job Description & Quick Presets */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Target Job Description</label>
            <div className="flex flex-wrap gap-1">
              <span className="text-[11px] text-[var(--text-secondary)] mr-1 self-center">Presets:</span>
              {SAMPLE_JOB_DESCRIPTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setJobDescription(preset.desc);
                    setTargetRole(preset.role);
                  }}
                  className="rounded-lg bg-[var(--bg-surface-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-purple-600 hover:text-white transition"
                >
                  {preset.role.split("/")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the target job description (skills, responsibilities, required qualifications)…"
            className="min-h-[160px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs leading-relaxed focus:border-purple-500 focus:outline-none"
          />

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleScan}
              disabled={scanning || (!useCustomText && !selectedResumeId && resumes.length === 0)}
              className="bg-purple-600 px-6 font-semibold hover:bg-purple-700 text-white rounded-xl shadow-md"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Running Multi-Engine Scans…
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Scan Resume Across ATS Engines
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* MULTI-ENGINE SCORE DASHBOARD RESULTS */}
      {analysis && (
        <div className="mt-8 space-y-6 border-t border-[var(--border)] pt-6">
          {/* Top Banner: Composite Score & Tier */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 border border-purple-500/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                  ATS Readability Index: {analysis.tier}
                </span>
                <h3 className="mt-2 text-2xl font-black text-[var(--text-primary)]">
                  Overall Composite ATS Score: {analysis.overallScore} / 100
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Computed by aggregating keyword density, impact verbs, and structural parseability from 3 benchmark models.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">Keywords Matched</p>
                  <p className="text-lg font-bold text-emerald-600">{analysis.matchedKeywords.length} Found</p>
                </div>
                <div className="h-10 w-px bg-[var(--border)]" />
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">Critical Missing</p>
                  <p className="text-lg font-bold text-amber-600">{analysis.missingKeywords.length} Terms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Scoring Engines (Separate scorecards requested by user) */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* ENGINE 1: JOBSCAN BENCHMARK */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                    JS
                  </span>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Jobscan Benchmark</h4>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColor(analysis.engineBreakdown.jobscan.score)}`}>
                  {analysis.engineBreakdown.jobscan.score}/100
                </span>
              </div>

              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Rating: <strong className="text-[var(--text-primary)]">{analysis.engineBreakdown.jobscan.rating}</strong>
              </p>

              <div className="space-y-1.5 rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Keyword Match:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.jobscan.metrics.keywordMatchRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Hard Skills Coverage:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.jobscan.metrics.hardSkillsCovered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Title Alignment:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.jobscan.metrics.jobTitleMatch}</span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                "{analysis.engineBreakdown.jobscan.tips}"
              </p>
            </div>

            {/* ENGINE 2: ENHANCV BENCHMARK */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 font-bold text-xs">
                    EC
                  </span>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Enhancv Benchmark</h4>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColor(analysis.engineBreakdown.enhancv.score)}`}>
                  {analysis.engineBreakdown.enhancv.score}/100
                </span>
              </div>

              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Rating: <strong className="text-[var(--text-primary)]">{analysis.engineBreakdown.enhancv.rating}</strong>
              </p>

              <div className="space-y-1.5 rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Action Verbs Count:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.enhancv.metrics.actionVerbsCount} strong verbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Metrics Quantified:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.enhancv.metrics.quantifiedResultsFound} found</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Brevity Check:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.enhancv.metrics.brevityStatus}</span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                "{analysis.engineBreakdown.enhancv.tips}"
              </p>
            </div>

            {/* ENGINE 3: RESUMEWORDED BENCHMARK */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                    RW
                  </span>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">ResumeWorded Benchmark</h4>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColor(analysis.engineBreakdown.resumeWorded.score)}`}>
                  {analysis.engineBreakdown.resumeWorded.score}/100
                </span>
              </div>

              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Rating: <strong className="text-[var(--text-primary)]">{analysis.engineBreakdown.resumeWorded.rating}</strong>
              </p>

              <div className="space-y-1.5 rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Contact Completeness:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.resumeWorded.metrics.contactDetailsComplete}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Standard Headings:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.resumeWorded.metrics.sectionsDetected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Overused Words:</span>
                  <span className="font-semibold">{analysis.engineBreakdown.resumeWorded.metrics.overusedWords}</span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                "{analysis.engineBreakdown.resumeWorded.tips}"
              </p>
            </div>
          </div>

          {/* Missing vs Matched Keywords */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Missing Keywords to Add ({analysis.missingKeywords.length})
                </h4>
                <span className="text-[11px] text-[var(--text-secondary)]">Click keyword to copy</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords.length === 0 ? (
                  <p className="text-xs text-emerald-600">No critical missing keywords! All core JD terms matched.</p>
                ) : (
                  analysis.missingKeywords.map(kw => (
                    <button
                      key={kw}
                      onClick={() => handleCopyKeyword(kw)}
                      className="group inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-500/10 transition"
                      title="Click to copy keyword"
                    >
                      {kw}
                      {copiedKw === kw ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-50 group-hover:opacity-100" />}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Successfully Matched Keywords ({analysis.matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {analysis.matchedKeywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Improvement Checklist */}
          {analysis.actionableFixes.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
              <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Target size={16} className="text-purple-600" />
                Recommended Optimization Checklist
              </h4>
              <div className="space-y-2">
                {analysis.actionableFixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-[var(--bg-surface-elevated)] p-3 text-xs">
                    <span className={`rounded-md px-2 py-0.5 font-bold uppercase text-[10px] shrink-0 ${
                      fix.priority === "high" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {fix.engine}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{fix.title}</p>
                      <p className="mt-0.5 text-[var(--text-secondary)]">{fix.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
