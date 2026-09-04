"use strict";
const Resume = require("../models/resume-model");

// Top Industry Resume Platforms & Builders Directory
const TOP_RESUME_PLATFORMS = [
  {
    id: "canva",
    name: "Canva",
    tagline: "Visual & Creative Drag-and-Drop Resume Builder",
    description: "Ideal for creative developers, UI/UX engineers, tech product managers, and modern graphic portfolios.",
    websiteUrl: "https://www.canva.com/resumes/templates/",
    icon: "Palette",
    badgeColor: "purple",
    popularWith: "Creative Tech, UI/UX, Full-Stack, Product Designers",
    features: ["Drag-and-drop visual design", "Hundreds of curated modern presets", "Export to PDF & high-res PNG", "Infographic skills & timelines"]
  },
  {
    id: "overleaf",
    name: "Overleaf (LaTeX)",
    tagline: "Academic & Tech Industry Standard",
    description: "The gold standard for Computer Science, engineering, research publications, and top-tier tech/FAANG ATS compliance.",
    websiteUrl: "https://www.overleaf.com/latex/templates/category/cv-or-resume",
    icon: "FileCode",
    badgeColor: "emerald",
    popularWith: "SDE, AI/ML Researchers, Systems Engineers, FAANG",
    features: ["Exact typographic control", "Jake's Resume & Deedy CV", "Math & algorithmic equations", "FAANG ATS gold standard"]
  },
  {
    id: "flowcv",
    name: "FlowCV",
    tagline: "Smart ATS Formatter with Live Preview",
    description: "Effortless auto-formatting with modern design tokens, multi-column adaptability, and instant PDF download.",
    websiteUrl: "https://flowcv.com/",
    icon: "Zap",
    badgeColor: "cyan",
    popularWith: "Modern SDE, Cloud Engineers, Career Starters",
    features: ["Smart auto-formatting", "ATS-checked layouts", "Custom accent colors & icons", "Instant high-resolution PDF"]
  },
  {
    id: "reactive_resume",
    name: "Reactive Resume",
    tagline: "100% Free & Open-Source Privacy-First Builder",
    description: "A free, privacy-friendly, open-source resume builder with JSON Resume schema support and zero ads.",
    websiteUrl: "https://rxresu.me/",
    icon: "Globe",
    badgeColor: "indigo",
    popularWith: "Open-Source Developers, Web Engineers, Privacy Advocates",
    features: ["100% free & open-source", "Zero user tracking", "JSON resume schema compatible", "Multiple languages & themes"]
  },
  {
    id: "google_docs",
    name: "Google Docs Templates",
    tagline: "Universal & 100% Free Cloud Word Processor",
    description: "Universally accepted by ATS scanners. Simple to collaborate on, edit on any device, and export to PDF/DOCX.",
    websiteUrl: "https://docs.google.com/document/u/0/?ftv=1",
    icon: "FileText",
    badgeColor: "blue",
    popularWith: "All Students, Enterprise Tech, Fast Drafting",
    features: ["100% free cloud access", "Universal ATS readability", "Easy real-time collaboration", "Export DOCX & PDF"]
  },
  {
    id: "novoresume",
    name: "Novoresume",
    tagline: "Professional ATS-Optimized Formats",
    description: "Built-in content optimizer with live suggestions to pass corporate applicant tracking systems.",
    websiteUrl: "https://novoresume.com/resume-templates",
    icon: "Award",
    badgeColor: "amber",
    popularWith: "Executive Tech, Corporate Engineering, Consultants",
    features: ["ATS content analyzer", "Industry-tailored sections", "Clean modern layouts", "Pre-written bullet suggestions"]
  }
];

// Curated templates across all top platforms (Canva, Overleaf, FlowCV, Reactive Resume, Google Docs)
const BUILDER_TEMPLATES = [
  // ── Canva Templates ──
  {
    id: "canva-minimalist-sde",
    title: "Canva: Minimalist Tech & Full-Stack SDE",
    platform: "canva",
    platformName: "Canva",
    domain: "fullstack",
    category: "Full Stack & SDE (Canva)",
    description: "A sleek, modern single-page resume template on Canva featuring clean typography, structured project showcases, and tech stack chips.",
    overleafUrl: "https://www.canva.com/templates/?query=minimalist-software-engineer-resume",
    builderUrl: "https://www.canva.com/templates/?query=minimalist-software-engineer-resume",
    tags: ["Canva", "Visual Clean", "Full-Stack", "Modern Layout"],
    popularFor: "Full Stack Developer, React/Node Engineer, Web Architect",
    previewSnippet: "[Canva Visual Template - Open in Canva to customize layout, colors, typography, and skills chips visually]"
  },
  {
    id: "canva-uiux-frontend",
    title: "Canva: Creative UI/UX & Frontend Developer",
    platform: "canva",
    platformName: "Canva",
    domain: "sde",
    category: "Frontend & Creative Tech (Canva)",
    description: "Designed on Canva for frontend engineers and UI/UX developers who want to showcase design sensibilities, Figma links, and live demos.",
    overleafUrl: "https://www.canva.com/templates/?query=frontend-developer-resume",
    builderUrl: "https://www.canva.com/templates/?query=frontend-developer-resume",
    tags: ["Canva", "UI/UX", "Portfolio Focus", "Design Systems"],
    popularFor: "Frontend Developer, UI/UX Engineer, Product Designer",
    previewSnippet: "[Canva Creative Template - Open in Canva for interactive drag-and-drop editing with custom asset libraries]"
  },
  {
    id: "canva-cybersecurity-soc",
    title: "Canva: Cybersecurity & InfoSec Analyst",
    platform: "canva",
    platformName: "Canva",
    domain: "cybersecurity",
    category: "Cybersecurity & InfoSec (Canva)",
    description: "Clean corporate security analyst layout on Canva highlighting certifications (CompTIA Security+, CEH, CISSP) and incident response tools.",
    overleafUrl: "https://www.canva.com/templates/?query=cybersecurity-resume",
    builderUrl: "https://www.canva.com/templates/?query=cybersecurity-resume",
    tags: ["Canva", "Infographic Certs", "Security Ops", "Corporate"],
    popularFor: "SOC Analyst, Security Engineer, Pentester",
    previewSnippet: "[Canva Security Analyst Template - Highlight certs, tools (Splunk, Wireshark), and compliance badges visually]"
  },
  {
    id: "canva-ai-data-science",
    title: "Canva: AI & Data Science Specialist",
    platform: "canva",
    platformName: "Canva",
    domain: "ai_ml",
    category: "AI, ML & Data Science (Canva)",
    description: "Visual data science template with clean KPI metrics boxes, Kaggle achievements, and machine learning pipeline highlights.",
    overleafUrl: "https://www.canva.com/templates/?query=data-science-resume",
    builderUrl: "https://www.canva.com/templates/?query=data-science-resume",
    tags: ["Canva", "KPI Callouts", "Data Science", "Python/PyTorch"],
    popularFor: "Data Scientist, ML Engineer, Analytics Lead",
    previewSnippet: "[Canva Data Science Template - Structured metrics callouts, Python toolkits, and GitHub/Kaggle badges]"
  },

  // ── Overleaf (LaTeX) Templates ──
  {
    id: "jakes-resume",
    title: "Overleaf: Jake's Resume (FAANG Gold Standard)",
    platform: "overleaf",
    platformName: "Overleaf",
    domain: "sde",
    category: "Software Engineering (Overleaf LaTeX)",
    description: "The most popular single-page ATS-friendly LaTeX template used for FAANG and top tech applications.",
    overleafUrl: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    builderUrl: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    tags: ["LaTeX", "Single Page", "ATS High Parse", "FAANG"],
    popularFor: "Full Stack, Backend, Frontend, General SDE",
    previewSnippet: "\\documentclass[letterpaper,11pt]{article}\n\\usepackage{latexsym}\n\\usepackage[empty]{fullpage}\n% Standard Jake's Resume header & structure\n\\begin{document}\n..."
  },
  {
    id: "cyber-security-analyst",
    title: "Overleaf: Cybersecurity & SOC Threat Analyst CV",
    platform: "overleaf",
    platformName: "Overleaf",
    domain: "cybersecurity",
    category: "Cybersecurity & InfoSec (Overleaf LaTeX)",
    description: "Tailored for Penetration Testers, SOC Tier 1/2, SIEM Engineers, and Security Compliance roles with specialized certification badges.",
    overleafUrl: "https://www.overleaf.com/latex/templates/simple-hipstercv/vngvymrmqmqs",
    builderUrl: "https://www.overleaf.com/latex/templates/simple-hipstercv/vngvymrmqmqs",
    tags: ["LaTeX", "Security Ops", "Certifications Focus", "SIEM/NIST"],
    popularFor: "SOC Analyst, Pentester, Cloud Security, Threat Hunter",
    previewSnippet: "\\documentclass[10pt,a4paper]{article}\n% Cybersecurity Domain Resume\n% Emphasizes SIEM, Wireshark, Splunk, NIST 800-53, CVEs\n..."
  },
  {
    id: "deedy-resume-two-column",
    title: "Overleaf: Deedy Resume (Two-Column Technical CV)",
    platform: "overleaf",
    platformName: "Overleaf",
    domain: "ai_ml",
    category: "AI, ML & Data Science (Overleaf LaTeX)",
    description: "Designed by former Facebook & Cornell engineer Debarghya Das. Dual-column format ideal for ML publications and deep project stacks.",
    overleafUrl: "https://www.overleaf.com/latex/templates/deedy-cv/bjryvfsjdyxz",
    builderUrl: "https://www.overleaf.com/latex/templates/deedy-cv/bjryvfsjdyxz",
    tags: ["LaTeX", "Two Column", "Research/ML", "Publications"],
    popularFor: "Machine Learning Engineer, Data Scientist, NLP/CV Researcher",
    previewSnippet: "\\documentclass[]{deedy-resume-openfont}\n% Deedy Resume for ML & Research\n..."
  },
  {
    id: "devops-sre-minimal",
    title: "Overleaf: Cloud Infrastructure & DevOps SRE",
    platform: "overleaf",
    platformName: "Overleaf",
    domain: "devops_cloud",
    category: "Cloud & DevOps (Overleaf LaTeX)",
    description: "Focuses on CI/CD pipelines, Kubernetes, Terraform, AWS/GCP, latency reductions, and 99.99% uptime metrics.",
    overleafUrl: "https://www.overleaf.com/latex/templates/software-engineer-resume/rqzvwxmybxxk",
    builderUrl: "https://www.overleaf.com/latex/templates/software-engineer-resume/rqzvwxmybxxk",
    tags: ["LaTeX", "DevOps", "Kubernetes", "AWS/Terraform"],
    popularFor: "DevOps Engineer, SRE, Platform Engineer, Cloud Architect",
    previewSnippet: "\\documentclass[11pt,a4paper]{article}\n% SRE & Cloud Architect Template\n..."
  },

  // ── FlowCV Templates ──
  {
    id: "flowcv-clean-tech",
    title: "FlowCV: Modern Clean ATS Tech Resume",
    platform: "flowcv",
    platformName: "FlowCV",
    domain: "fullstack",
    category: "Full Stack & Web (FlowCV)",
    description: "Smart ATS auto-formatter with live design preview, custom bullet styling, and clean sans-serif typography.",
    overleafUrl: "https://flowcv.com/",
    builderUrl: "https://flowcv.com/",
    tags: ["FlowCV", "Auto-Formatting", "ATS Clean", "Instant PDF"],
    popularFor: "Full Stack Developer, SDE, Cloud Engineers",
    previewSnippet: "[FlowCV Smart Formatter - Open FlowCV to format sections, customize spacing, and download free ATS-clean PDF]"
  },

  // ── Reactive Resume (Open Source) ──
  {
    id: "reactive-resume-standard",
    title: "Reactive Resume: Open-Source JSON Standard",
    platform: "reactive_resume",
    platformName: "Reactive Resume",
    domain: "sde",
    category: "Open-Source & Privacy (Reactive Resume)",
    description: "100% free open-source privacy-first resume builder. Fully compliant with the standard JSON Resume schema with zero ads.",
    overleafUrl: "https://rxresu.me/",
    builderUrl: "https://rxresu.me/",
    tags: ["Reactive Resume", "Open Source", "JSON Resume", "Zero Ads"],
    popularFor: "Software Engineers, Open-Source Contributors, Privacy Focus",
    previewSnippet: "[Reactive Resume - Open rxresu.me for free private resume generation with JSON Resume schema compatibility]"
  },

  // ── Google Docs Templates ──
  {
    id: "google-docs-swiss",
    title: "Google Docs: Swiss ATS Universal Template",
    platform: "google_docs",
    platformName: "Google Docs",
    domain: "sde",
    category: "General Tech & ATS (Google Docs)",
    description: "Universally accessible, clean single-column Google Docs template with 100% guaranteed ATS readability and easy cloud sharing.",
    overleafUrl: "https://docs.google.com/document/u/0/?ftv=1",
    builderUrl: "https://docs.google.com/document/u/0/?ftv=1",
    tags: ["Google Docs", "Free Cloud", "100% ATS Safe", "Easy Collab"],
    popularFor: "All Engineering & Tech Roles, Fast Cloud Editing",
    previewSnippet: "[Google Docs Swiss Format - Free cloud word processor with instant ATS readability and PDF export]"
  }
];

function normalizeResumeInput(body) {
  const data = body.data || {};
  return {
    personal: data.personal && typeof data.personal === "object" ? data.personal : {},
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills.map(String).filter(Boolean) : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    links: Array.isArray(data.links) ? data.links : []
  };
}

function words(text) {
  return [...new Set(String(text || "").toLowerCase().match(/[a-z][a-z0-9+#.-]{1,}/g) || [])];
}

// Extract full text representation of a resume
function getResumeFullText(resume, rawText) {
  if (rawText && typeof rawText === "string" && rawText.trim().length > 20) {
    return rawText.trim();
  }
  const d = resume.data || resume;
  const parts = [];
  if (d.personal) {
    parts.push(Object.values(d.personal).join(" "));
  }
  if (Array.isArray(d.skills)) {
    parts.push(d.skills.join(" "));
  }
  if (Array.isArray(d.experience)) {
    parts.push(d.experience.map(e => `${e.title || ""} ${e.company || ""} ${e.description || ""}`).join(" "));
  }
  if (Array.isArray(d.projects)) {
    parts.push(d.projects.map(p => `${p.title || p.name || ""} ${p.description || ""} ${p.technologies || ""}`).join(" "));
  }
  if (Array.isArray(d.education)) {
    parts.push(d.education.map(e => `${e.institution || ""} ${e.degree || ""} ${e.field || ""}`).join(" "));
  }
  if (Array.isArray(d.certifications)) {
    parts.push(d.certifications.map(c => typeof c === "string" ? c : `${c.name || ""} ${c.issuer || ""}`).join(" "));
  }
  return parts.join("\n");
}

// Industry strong action verbs prioritized by Enhancv and Jobscan
const STRONG_ACTION_VERBS = new Set([
  "spearheaded", "engineered", "architected", "developed", "designed", "deployed",
  "optimized", "orchestrated", "automated", "refactored", "implemented", "scaled",
  "accelerated", "diminished", "eliminated", "delivered", "mentored", "revamped",
  "integrated", "pioneered", "built", "managed", "resolved", "executed", "launched"
]);

// Hard technical keywords by domain for specialized ATS benchmarking
const DOMAIN_HARD_SKILLS = {
  cybersecurity: ["siem", "wireshark", "splunk", "kali", "metasploit", "firewall", "ids/ips", "nist", "owasp", "cve", "burp suite", "soc", "penetration testing", "incident response", "cryptography", "edr", "vulnerability management", "wireshark", "snort", "wireshark", "zero trust"],
  fullstack: ["react", "next.js", "node.js", "express", "mongodb", "postgresql", "typescript", "javascript", "graphql", "rest api", "tailwind", "redux", "docker", "prisma", "redis", "html5", "css3", "ci/cd", "microservices", "aws"],
  ai_ml: ["python", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "opencv", "nlp", "llm", "transformer", "huggingface", "cuda", "deep learning", "machine learning", "computer vision", "rag", "langchain", "keras", "bert"],
  devops_cloud: ["docker", "kubernetes", "aws", "terraform", "ansible", "jenkins", "github actions", "ci/cd", "prometheus", "grafana", "linux", "bash", "helm", "gcp", "azure", "serverless", "nginx", "kafka"],
  mobile: ["react native", "flutter", "swift", "kotlin", "android", "ios", "dart", "xcode", "mobile ui", "app store", "play store", "sqlite", "jetpack compose"],
  sde: ["c++", "java", "python", "data structures", "algorithms", "object oriented programming", "multithreading", "low level design", "system design", "operating systems", "database management", "networking", "sql"]
};

/**
 * Multi-Engine ATS Scoring Evaluator
 * Evaluates candidate against 3 distinct industry standard ATS benchmarks:
 * 1. Jobscan Benchmark: Keyword match rate, hard skills coverage, search term frequency.
 * 2. Enhancv Benchmark: Action verb strength, quantifiable impact metrics, brevity.
 * 3. ResumeWorded Benchmark: Section parseability, contact info completeness, formatting warnings.
 */
function analyzeMultiEngine(resumeData, jobDescription, targetRole, domain, rawTextInput) {
  const fullText = getResumeFullText(resumeData, rawTextInput);
  const resumeWordList = words(fullText);
  const resumeWordsSet = new Set(resumeWordList);
  const jobWordsList = words(jobDescription);

  const stopWords = new Set([
    "with", "and", "the", "for", "that", "this", "from", "your", "you", "are", "our",
    "will", "have", "has", "years", "year", "work", "team", "role", "job", "skills",
    "experience", "using", "must", "able", "looking", "candidate", "about", "what",
    "their", "they", "been", "also", "into", "more", "such", "well", "like"
  ]);

  // 1. Keyword extraction from Job Description
  const relevantJobKeywords = [...new Set(jobWordsList.filter(w => !stopWords.has(w)))].slice(0, 70);
  const matchedKeywords = relevantJobKeywords.filter(k => resumeWordsSet.has(k));
  const missingKeywords = relevantJobKeywords.filter(k => !resumeWordsSet.has(k)).slice(0, 20);

  // Domain skills check
  const domainSkills = DOMAIN_HARD_SKILLS[domain] || DOMAIN_HARD_SKILLS.fullstack;
  const matchedDomainSkills = domainSkills.filter(s => fullText.toLowerCase().includes(s.toLowerCase()));
  const missingDomainSkills = domainSkills.filter(s => !fullText.toLowerCase().includes(s.toLowerCase())).slice(0, 8);

  // Job title alignment
  const roleKeywords = words(targetRole || "");
  const roleMatchCount = roleKeywords.filter(rw => fullText.toLowerCase().includes(rw)).length;
  const roleAlignment = roleKeywords.length ? Math.min(100, Math.round((roleMatchCount / roleKeywords.length) * 100)) : 80;

  // ── ENGINE 1: JOBSCAN BENCHMARK ──
  const keywordMatchRate = relevantJobKeywords.length
    ? Math.round((matchedKeywords.length / relevantJobKeywords.length) * 100)
    : 70;
  const hardSkillsScore = Math.min(100, Math.round((matchedDomainSkills.length / Math.max(1, domainSkills.length * 0.5)) * 100));
  const jobscanScore = Math.min(100, Math.max(25, Math.round(keywordMatchRate * 0.5 + hardSkillsScore * 0.35 + roleAlignment * 0.15)));

  // ── ENGINE 2: ENHANCV BENCHMARK ──
  // Impact, Action Verbs, and Quantifiable metrics
  const matchedActionVerbs = resumeWordList.filter(w => STRONG_ACTION_VERBS.has(w));
  const uniqueActionVerbs = [...new Set(matchedActionVerbs)];
  const actionVerbScore = Math.min(100, Math.round((uniqueActionVerbs.length / 7) * 100));

  // Count quantifiable numbers, percentages, dollar values, latencies, multipliers (e.g. 40%, $10k, 2x, 500ms)
  const metricMatches = fullText.match(/\b\d+(\.\d+)?%|\$\d+[kKmMbB]?|\b\d+[xX]\b|\b\d+\s*(ms|seconds|minutes|users|requests|qps|stars|downloads|clients|reduction|increase)\b/gi) || [];
  const metricsScore = Math.min(100, Math.round((metricMatches.length / 5) * 100));

  // Word count brevity check: optimal tech resume is 350 - 750 words
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const brevityScore = (wordCount >= 300 && wordCount <= 850) ? 95 : wordCount < 300 ? 60 : 75;

  const enhancvScore = Math.min(100, Math.max(30, Math.round(actionVerbScore * 0.4 + metricsScore * 0.4 + brevityScore * 0.2)));

  // ── ENGINE 3: RESUMEWORDED BENCHMARK ──
  // Formatting, parseability, structure, section balance
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(fullText);
  const hasPhone = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(fullText);
  const hasGitHubOrLinkedIn = /github\.com|linkedin\.com|gitlab\.com/i.test(fullText);
  const contactScore = (hasEmail ? 40 : 0) + (hasPhone ? 30 : 0) + (hasGitHubOrLinkedIn ? 30 : 0);

  const sectionsPresent = ["education", "experience", "projects", "skills"].filter(s => fullText.toLowerCase().includes(s));
  const parseabilityScore = Math.round((sectionsPresent.length / 4) * 100);

  // Repetition penalty
  const wordFrequencies = {};
  for (const w of resumeWordList) {
    if (!stopWords.has(w)) wordFrequencies[w] = (wordFrequencies[w] || 0) + 1;
  }
  const overused = Object.entries(wordFrequencies).filter(([_, count]) => count > 7).map(([w]) => w);
  const repetitionPenalty = Math.min(20, overused.length * 5);

  const resumeWordedScore = Math.min(100, Math.max(20, Math.round((contactScore * 0.4 + parseabilityScore * 0.6) - repetitionPenalty)));

  // ── OVERALL COMPOSITE SCORE ──
  const overallScore = Math.round(jobscanScore * 0.45 + enhancvScore * 0.35 + resumeWordedScore * 0.2);

  // Tier level
  const tier = overallScore >= 85 ? "Interview Ready (Top 10%)" :
               overallScore >= 70 ? "Competitive Match" :
               overallScore >= 55 ? "Moderate Alignment" : "Needs Optimization";

  // Engine-specific recommendations
  const engineBreakdown = {
    jobscan: {
      name: "Jobscan Benchmark",
      score: jobscanScore,
      rating: jobscanScore >= 80 ? "High Match" : jobscanScore >= 60 ? "Moderate Match" : "Low Match",
      metrics: {
        keywordMatchRate: `${keywordMatchRate}%`,
        hardSkillsCovered: `${matchedDomainSkills.length}/${domainSkills.length}`,
        jobTitleMatch: `${roleAlignment}%`
      },
      tips: missingKeywords.length ? `Incorporate key JD terms: ${missingKeywords.slice(0, 6).join(", ")}` : "Great keyword alignment with job description."
    },
    enhancv: {
      name: "Enhancv Benchmark",
      score: enhancvScore,
      rating: enhancvScore >= 80 ? "High Impact" : enhancvScore >= 60 ? "Good Impact" : "Passive Tone",
      metrics: {
        actionVerbsCount: uniqueActionVerbs.length,
        quantifiedResultsFound: metricMatches.length,
        brevityStatus: `${wordCount} words (${wordCount >= 300 && wordCount <= 800 ? "Ideal" : "Needs adjustment"})`
      },
      tips: metricMatches.length < 3
        ? "Add at least 3 measurable metrics (% improvement, latency drop, users served) in bullet points."
        : "Strong evidence of quantifiable results."
    },
    resumeWorded: {
      name: "ResumeWorded Benchmark",
      score: resumeWordedScore,
      rating: resumeWordedScore >= 80 ? "Clean Parse" : resumeWordedScore >= 60 ? "Acceptable" : "Formatting Risks",
      metrics: {
        contactDetailsComplete: hasEmail && (hasPhone || hasGitHubOrLinkedIn) ? "Complete" : "Incomplete",
        sectionsDetected: `${sectionsPresent.length}/4 standard sections`,
        overusedWords: overused.length ? overused.slice(0, 4).join(", ") : "None"
      },
      tips: !hasGitHubOrLinkedIn
        ? "Add a clean GitHub or LinkedIn profile link in the header for technical credibility."
        : "Standard ATS section headings detected successfully."
    }
  };

  const actionableFixes = [];
  if (missingKeywords.length > 0) {
    actionableFixes.push({
      engine: "Jobscan",
      priority: "high",
      title: "Missing High-Value Keywords",
      detail: `Your resume is missing terms frequently parsed by recruiters: ${missingKeywords.slice(0, 8).join(", ")}.`
    });
  }
  if (metricMatches.length < 3) {
    actionableFixes.push({
      engine: "Enhancv",
      priority: "medium",
      title: "Quantify Project Impact",
      detail: "Use Google's X-Y-Z formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Include numbers (e.g. 'reduced load time by 35%')."
    });
  }
  if (uniqueActionVerbs.length < 4) {
    actionableFixes.push({
      engine: "Enhancv",
      priority: "medium",
      title: "Replace Weak / Passive Verbs",
      detail: "Lead every bullet point with strong technical action verbs like 'Engineered', 'Orchestrated', 'Architected', or 'Automated'."
    });
  }
  if (!hasGitHubOrLinkedIn) {
    actionableFixes.push({
      engine: "ResumeWorded",
      priority: "low",
      title: "Missing Portfolio / GitHub Link",
      detail: "Include your active GitHub, personal domain, or LinkedIn URL in your header."
    });
  }

  return {
    overallScore,
    tier,
    engineBreakdown,
    matchedKeywords: matchedKeywords.slice(0, 25),
    missingKeywords: missingKeywords.slice(0, 20),
    matchedDomainSkills,
    missingDomainSkills,
    actionableFixes,
    scannedAt: new Date().toISOString()
  };
}

// Controller Actions
async function listResumes(req, res, next) {
  try {
    const domainFilter = req.query.domain;
    const query = { user: req.user._id };
    if (domainFilter && domainFilter !== "all") {
      query.domain = domainFilter;
    }
    const resumes = await Resume.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ resumes });
  } catch (e) {
    next(e);
  }
}

async function createResume(req, res, next) {
  try {
    const name = String(req.body.name || "Untitled Resume").trim();
    const domain = String(req.body.domain || "fullstack").toLowerCase();
    const targetRole = String(req.body.targetRole || "").trim();
    const overleafUrl = String(req.body.overleafUrl || "").trim();
    const rawText = String(req.body.rawText || "").trim();

    const resume = await Resume.create({
      user: req.user._id,
      name,
      domain,
      targetRole,
      overleafUrl,
      rawText,
      template: String(req.body.template || "classic"),
      data: normalizeResumeInput(req.body)
    });
    res.status(201).json({ resume });
  } catch (e) {
    next(e);
  }
}

async function getResume(req, res, next) {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found");
    }
    res.json({ resume });
  } catch (e) {
    next(e);
  }
}

async function updateResume(req, res, next) {
  try {
    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.domain !== undefined) patch.domain = String(req.body.domain).toLowerCase();
    if (req.body.targetRole !== undefined) patch.targetRole = String(req.body.targetRole).trim();
    if (req.body.overleafUrl !== undefined) patch.overleafUrl = String(req.body.overleafUrl).trim();
    if (req.body.rawText !== undefined) patch.rawText = String(req.body.rawText).trim();
    if (req.body.template !== undefined) patch.template = String(req.body.template);
    if (req.body.data !== undefined) patch.data = normalizeResumeInput(req.body);

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      patch,
      { new: true, runValidators: true }
    );
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found");
    }
    res.json({ resume });
  } catch (e) {
    next(e);
  }
}

async function duplicateResume(req, res, next) {
  try {
    const source = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!source) {
      res.status(404);
      throw new Error("Resume not found");
    }
    const copy = await Resume.create({
      user: req.user._id,
      name: `${source.name} (Copy)`.slice(0, 150),
      domain: source.domain,
      targetRole: source.targetRole,
      overleafUrl: source.overleafUrl,
      rawText: source.rawText,
      template: source.template,
      data: source.data,
      versionNumber: (source.versionNumber || 1) + 1,
      parentResume: source._id
    });
    res.status(201).json({ resume: copy });
  } catch (e) {
    next(e);
  }
}

async function deleteResume(req, res, next) {
  try {
    const result = await Resume.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) {
      res.status(404);
      throw new Error("Resume not found");
    }
    res.json({ message: "Resume deleted" });
  } catch (e) {
    next(e);
  }
}

async function getOverleafTemplates(req, res, next) {
  try {
    const domain = req.query.domain;
    const platform = req.query.platform;
    let templates = BUILDER_TEMPLATES;
    if (domain && domain !== "all") {
      templates = templates.filter(t => t.domain === domain);
    }
    if (platform && platform !== "all") {
      templates = templates.filter(t => t.platform === platform);
    }
    res.json({
      templates,
      platforms: TOP_RESUME_PLATFORMS,
    });
  } catch (e) {
    next(e);
  }
}

async function atsAnalysis(req, res, next) {
  try {
    const jobDescription = String(req.body.jobDescription || "").trim();
    if (!jobDescription) {
      res.status(400);
      throw new Error("Job description is required to scan ATS alignment");
    }

    let resumeData = {};
    let rawText = String(req.body.resumeText || "").trim();
    let targetRole = String(req.body.targetRole || "").trim();
    let domain = String(req.body.domain || "fullstack").toLowerCase();

    if (req.body.resumeId) {
      const stored = await Resume.findOne({ _id: req.body.resumeId, user: req.user._id });
      if (stored) {
        resumeData = stored;
        if (!rawText && stored.rawText) rawText = stored.rawText;
        if (!targetRole && stored.targetRole) targetRole = stored.targetRole;
        if (stored.domain) domain = stored.domain;
      }
    } else if (req.body.data) {
      resumeData = { data: normalizeResumeInput(req.body) };
    }

    const analysis = analyzeMultiEngine(resumeData, jobDescription, targetRole, domain, rawText);

    // If resumeId was provided, save to its atsHistory
    if (req.body.resumeId) {
      await Resume.findByIdAndUpdate(req.body.resumeId, {
        $push: {
          atsHistory: {
            $each: [{
              overallScore: analysis.overallScore,
              tier: analysis.tier,
              jobscanScore: analysis.engineBreakdown.jobscan.score,
              enhancvScore: analysis.engineBreakdown.enhancv.score,
              resumeWordedScore: analysis.engineBreakdown.resumeWorded.score,
              targetRole,
              scannedAt: new Date()
            }],
            $slice: -10
          }
        }
      });
    }

    res.json({ analysis });
  } catch (e) {
    next(e);
  }
}

function escapeLatex(value) {
  return String(value || "")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/\\/g, "\\textbackslash{}");
}

async function latexExport(req, res, next) {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found");
    }
    const d = resume.data || {};
    const lines = [
      "% Auto-generated GradeWise LaTeX Document",
      "\\documentclass[11pt,a4paper]{article}",
      "\\usepackage[margin=0.75in]{geometry}",
      "\\usepackage{hyperref}",
      "\\usepackage{enumitem}",
      "\\begin{document}",
      "\\begin{center}",
      `{\\LARGE \\textbf{${escapeLatex(d.personal?.name || resume.name)}}} \\\\[4pt]`
    ];

    const contact = [
      d.personal?.email ? `\\href{mailto:${d.personal.email}}{${escapeLatex(d.personal.email)}}` : null,
      d.personal?.phone ? escapeLatex(d.personal.phone) : null,
      d.personal?.location ? escapeLatex(d.personal.location) : null
    ].filter(Boolean);

    if (contact.length) lines.push(contact.join(" $|$ ") + " \\\\[8pt]");
    lines.push("\\end{center}");

    if ((d.skills || []).length) {
      lines.push("\\section*{Technical Skills}", "\\begin{itemize}[leftmargin=*]", `\\item ${escapeLatex(d.skills.join(", "))}`, "\\end{itemize}");
    }

    if ((d.experience || []).length) {
      lines.push("\\section*{Experience}");
      for (const e of d.experience) {
        lines.push(`\\textbf{${escapeLatex(e.title || "Software Engineer")}} -- ${escapeLatex(e.company || "Company")} \\\\[2pt]`);
        if (e.description) lines.push(`${escapeLatex(e.description)} \\\\[4pt]`);
      }
    }

    if ((d.projects || []).length) {
      lines.push("\\section*{Projects}");
      for (const p of d.projects) {
        lines.push(`\\textbf{${escapeLatex(p.name || p.title || "Project")}} \\\\[2pt]`);
        if (p.description) lines.push(`${escapeLatex(p.description)} \\\\[4pt]`);
      }
    }

    lines.push("\\end{document}");
    res.json({
      latex: lines.join("\n"),
      overleafUrl: resume.overleafUrl || "https://www.overleaf.com/docs"
    });
  } catch (e) {
    next(e);
  }
}

async function parsePdfResume(req, res, next) {
  try {
    const base64 = req.body.base64;
    const filename = String(req.body.filename || "").trim();
    if (!base64) {
      res.status(400);
      throw new Error("Base64 encoded PDF file data is required");
    }
    const buffer = Buffer.from(base64, "base64");
    let rawText = "";
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      rawText = (data.text || "").trim();
    } catch (parseErr) {
      console.warn("[ResumeController] pdf-parse warning:", parseErr.message);
      // Fallback: extract textual runs from PDF buffer
      const str = buffer.toString("latin1");
      const parenMatches = str.match(/\(([^()]{2,})\)/g) || [];
      if (parenMatches.length > 5) {
        rawText = parenMatches.map(m => m.slice(1, -1)).join(" ");
      } else {
        const textRuns = str.match(/[a-zA-Z0-9.,@#+/\-_ \n\r\t]{4,}/g) || [];
        rawText = textRuns.filter(t => !t.includes("/Catalog") && !t.includes("/ObjStm")).join(" ");
      }
    }
    rawText = rawText.trim();

    // Auto-detect domain
    const lowerText = rawText.toLowerCase();
    let detectedDomain = "fullstack";
    let maxDomainMatches = 0;
    for (const [dom, skills] of Object.entries(DOMAIN_HARD_SKILLS)) {
      const matchCount = skills.filter(s => lowerText.includes(s.toLowerCase())).length;
      if (matchCount > maxDomainMatches) {
        maxDomainMatches = matchCount;
        detectedDomain = dom;
      }
    }

    // Auto-detect skills
    const allKnownSkills = Object.values(DOMAIN_HARD_SKILLS).flat();
    const detectedSkills = [...new Set(allKnownSkills.filter(s => lowerText.includes(s.toLowerCase())))].slice(0, 15);

    // Suggested Role
    const suggestedRole = detectedDomain === "cybersecurity" ? "Cybersecurity Analyst / SOC Engineer" :
                          detectedDomain === "ai_ml" ? "Machine Learning Engineer / Data Scientist" :
                          detectedDomain === "devops_cloud" ? "Cloud DevOps SRE Engineer" :
                          detectedDomain === "mobile" ? "Mobile Application Developer" :
                          detectedDomain === "sde" ? "Software Development Engineer" : "Full Stack Software Developer";

    const cleanName = filename ? filename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ") : "Imported PDF Resume";

    res.json({
      text: rawText,
      domain: detectedDomain,
      suggestedRole,
      detectedSkills,
      suggestedName: cleanName
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listResumes,
  createResume,
  getResume,
  updateResume,
  duplicateResume,
  deleteResume,
  getOverleafTemplates,
  atsAnalysis,
  latexExport,
  parsePdfResume
};