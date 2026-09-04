export type ResumeDomain = 
  | "all"
  | "cybersecurity" 
  | "fullstack" 
  | "ai_ml" 
  | "devops_cloud" 
  | "mobile" 
  | "sde" 
  | "other";

export interface ResumeData {
  personal?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    graduationYear?: string;
  }>;
  skills?: string[];
  projects?: Array<{
    title?: string;
    name?: string;
    description?: string;
    technologies?: string;
    link?: string;
  }>;
  experience?: Array<{
    company?: string;
    title?: string;
    duration?: string;
    description?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
  links?: Array<{
    label: string;
    url: string;
  }>;
}

export interface ResumeItem {
  _id: string;
  name: string;
  domain: ResumeDomain;
  targetRole?: string;
  overleafUrl?: string;
  rawText?: string;
  template?: string;
  versionNumber?: number;
  data?: ResumeData;
  atsHistory?: Array<{
    overallScore: number;
    tier: string;
    jobscanScore: number;
    enhancvScore: number;
    resumeWordedScore: number;
    targetRole?: string;
    scannedAt: string;
  }>;
  updatedAt: string;
  createdAt: string;
}

export type ResumeBuilderType = "all" | "canva" | "overleaf" | "flowcv" | "reactive_resume" | "google_docs" | "novoresume" | "other";

export interface ResumeBuilderPlatform {
  id: string;
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  icon: string;
  badgeColor: string;
  popularWith: string;
  features: string[];
}

export interface OverleafTemplate {
  id: string;
  title: string;
  domain: ResumeDomain;
  category: string;
  description: string;
  overleafUrl: string;
  builderUrl?: string;
  platform?: ResumeBuilderType;
  platformName?: string;
  tags: string[];
  popularFor: string;
  previewSnippet: string;
}

export interface EngineScorecard {
  name: string;
  score: number;
  rating: string;
  metrics: Record<string, string | number>;
  tips: string;
}

export interface ActionableFix {
  engine: "Jobscan" | "Enhancv" | "ResumeWorded";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface MultiEngineAnalysis {
  overallScore: number;
  tier: string;
  engineBreakdown: {
    jobscan: EngineScorecard;
    enhancv: EngineScorecard;
    resumeWorded: EngineScorecard;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedDomainSkills: string[];
  missingDomainSkills: string[];
  actionableFixes: ActionableFix[];
  scannedAt: string;
}

export const DOMAIN_INFO: Record<Exclude<ResumeDomain, "all">, { label: string; icon: string; color: string; desc: string }> = {
  cybersecurity: {
    label: "Cybersecurity & InfoSec",
    icon: "ShieldAlert",
    color: "from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    desc: "Penetration testing, SOC analyst, network defense, SIEM, NIST, and compliance."
  },
  fullstack: {
    label: "Full Stack & Web Dev",
    icon: "Globe",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    desc: "MERN/PERN, Next.js, REST APIs, Microservices, databases, and modern UI architectures."
  },
  ai_ml: {
    label: "AI, ML & Data Science",
    icon: "Cpu",
    color: "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
    desc: "PyTorch, LLMs, NLP, computer vision, data pipelines, predictive models, and research."
  },
  devops_cloud: {
    label: "DevOps, SRE & Cloud",
    icon: "Cloud",
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    desc: "Kubernetes, Docker, AWS/GCP, CI/CD pipelines, Terraform, and high availability systems."
  },
  mobile: {
    label: "Mobile & Cross-Platform",
    icon: "Smartphone",
    color: "from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    desc: "React Native, Flutter, Swift iOS, Kotlin Android, app store deployment."
  },
  sde: {
    label: "Core SDE & Systems",
    icon: "Terminal",
    color: "from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    desc: "C++, Java, multithreading, data structures, low level design, algorithms, and distributed systems."
  },
  other: {
    label: "General / Custom",
    icon: "FileText",
    color: "from-gray-500/20 to-slate-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30",
    desc: "General technical consulting, product management, or cross-disciplinary resumes."
  }
};
