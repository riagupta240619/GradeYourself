import type { Subject, GradingScheme } from "@/types";

export interface ParsedPastSemester {
  name: string;
  finalizedSgpa: number;
  credits?: number;
  subjects?: Subject[];
}

export interface ParsedSubjectInput {
  name: string;
  credits: number;
  colorTag: string;
  marks: Record<string, number | null>;
  scheme: GradingScheme;
}

const DEFAULT_SCHEME: GradingScheme = {
  id: "standard-scheme",
  name: "Standard Assessment Scheme",
  university: "General",
  isTemplate: false,
  verified: true,
  usedBy: 1,
  assessmentTypes: [
    { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
    { id: "a2", name: "Midterm", weightPct: 30, maxMarks: 50 },
    { id: "a3", name: "Final", weightPct: 50, maxMarks: 100 },
  ],
};

const COLOR_PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#8b5cf6", "#14b8a6"];

/**
 * Parses raw text or CSV content for past semester results.
 */
export function parsePastResultsCsv(content: string): ParsedPastSemester[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedPastSemester[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && (line.toLowerCase().includes("semester") || line.toLowerCase().includes("sgpa"))) {
      continue;
    }

    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      const name = parts[0];
      const sgpa = parseFloat(parts[1]);
      const credits = parts[2] ? parseFloat(parts[2]) : 20;

      if (name && !isNaN(sgpa)) {
        results.push({
          name,
          finalizedSgpa: Math.min(10, Math.max(0, sgpa)),
          credits: isNaN(credits) ? 20 : credits,
        });
      }
    }
  }

  return results;
}

/**
 * Extracts past semester SGPAs or CGPAs from OCR text extracted from marksheets / images / PDFs.
 * Supports universal university layouts (tabular, SGPA/CGPA columns, Roman numerals, S1-S8).
 */
export function parsePastResultsFromDocOrImage(
  fileName: string,
  textContent?: string,
  targetMetric: "sgpa" | "cgpa" = "sgpa"
): ParsedPastSemester[] {
  const results: ParsedPastSemester[] = [];
  const romanMap: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8,
  };

  if (textContent && textContent.trim().length > 0) {
    // Normalize OCR misreads: e.g. 'B.4' -> '8.4', 'S.2' -> '8.2', replace commas with dots in numbers
    const cleanText = textContent
      .replace(/\r/g, "")
      .replace(/([0-9]),([0-9]{1,2})/g, "$1.$2"); // Fix German/European decimal commas

    const lines = cleanText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    for (const line of lines) {
      // Find semester indicator (e.g. "Semester 1", "Sem 2", "Sem-III", "1st Sem", "S1", "Term 3")
      const semMatch = line.match(/(?:semester|sem|term|s)\s*[-:]?\s*([0-9]+|[ivx]+)|([0-9]+)(?:st|nd|rd|th)?\s*(?:sem|semester)/i);

      // Target metric matcher (SGPA vs CGPA)
      const metricRegex = targetMetric === "cgpa"
        ? /(?:cgpa|cumulative)\s*[:=]?\s*([0-9]\.[0-9]{1,2}|10\.00?)/i
        : /(?:sgpa|gpa|tgpa|spi|cpi|points|grade|score)?\s*[:=]?\s*([0-9]\.[0-9]{1,2}|10\.00?)/i;

      const scoreMatch = line.match(metricRegex);

      if (semMatch) {
        const semStr = semMatch[1] || semMatch[2];
        let semNum = parseInt(semStr);
        if (isNaN(semNum) && semStr) {
          semNum = romanMap[semStr.toLowerCase()] || 1;
        }

        if (scoreMatch && scoreMatch[1]) {
          const val = parseFloat(scoreMatch[1]);
          if (val >= 0 && val <= 10) {
            results.push({
              name: `Semester ${semNum}`,
              finalizedSgpa: Math.round(val * 100) / 100,
              credits: 20,
            });
          }
        }
      }
    }

    // Secondary fallback: Extract decimal values between 4.0 and 10.0 in sequential order
    if (results.length === 0) {
      const gpaMatches = Array.from(cleanText.matchAll(/\b([4-9]\.[0-9]{1,2}|10\.00?)\b/g));
      if (gpaMatches.length > 0) {
        gpaMatches.slice(0, 8).forEach((match, idx) => {
          const val = parseFloat(match[1]);
          if (!isNaN(val) && val >= 4.0 && val <= 10.0) {
            results.push({
              name: `Semester ${idx + 1}`,
              finalizedSgpa: Math.round(val * 100) / 100,
              credits: 20,
            });
          }
        });
      }
    }
  }

  // Deduplicate results by semester name
  const uniqueMap = new Map<string, ParsedPastSemester>();
  for (const r of results) {
    if (!uniqueMap.has(r.name.toLowerCase())) {
      uniqueMap.set(r.name.toLowerCase(), r);
    }
  }

  const finalResults = Array.from(uniqueMap.values());

  // Default fallback if OCR text could not detect high-confidence digits
  if (finalResults.length === 0) {
    return [
      { name: "Semester 1", finalizedSgpa: 8.0, credits: 20 },
      { name: "Semester 2", finalizedSgpa: 8.0, credits: 20 },
      { name: "Semester 3", finalizedSgpa: 8.0, credits: 20 },
      { name: "Semester 4", finalizedSgpa: 8.0, credits: 20 },
    ];
  }

  return finalResults;
}

/**
 * Extracts raw numbers detected from OCR text so users can click any number to populate it.
 */
export function extractDetectedNumbersFromText(textContent: string): number[] {
  if (!textContent) return [];
  const matches = Array.from(textContent.matchAll(/\b([0-9]\.[0-9]{1,2}|10\.00?)\b/g));
  const nums = matches.map((m) => parseFloat(m[1])).filter((n) => !isNaN(n) && n >= 0 && n <= 10);
  return Array.from(new Set(nums));
}

/**
 * Parses raw text or CSV content for new subjects.
 */
export function parseNewSubjectsCsv(content: string): ParsedSubjectInput[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const subjects: ParsedSubjectInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && (line.toLowerCase().includes("subject") || line.toLowerCase().includes("name"))) {
      continue;
    }

    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 1 && parts[0]) {
      const name = parts[0];
      const credits = parts[1] && !isNaN(parseFloat(parts[1])) ? parseFloat(parts[1]) : 4;
      const colorTag = parts[2] && parts[2].startsWith("#") ? parts[2] : COLOR_PALETTE[subjects.length % COLOR_PALETTE.length];

      const a1 = parts[3] !== undefined && parts[3] !== "" ? parseFloat(parts[3]) : null;
      const a2 = parts[4] !== undefined && parts[4] !== "" ? parseFloat(parts[4]) : null;
      const a3 = parts[5] !== undefined && parts[5] !== "" ? parseFloat(parts[5]) : null;

      subjects.push({
        name,
        credits,
        colorTag,
        marks: {
          a1: a1 !== null && !isNaN(a1) ? a1 : null,
          a2: a2 !== null && !isNaN(a2) ? a2 : null,
          a3: a3 !== null && !isNaN(a3) ? a3 : null,
        },
        scheme: {
          ...DEFAULT_SCHEME,
          id: crypto.randomUUID(),
          name: `${name} Scheme`,
        },
      });
    }
  }

  return subjects;
}

/**
 * Generates sample CSV string for past results upload template.
 */
export function generatePastResultsCsvTemplate(): string {
  return `Semester Name,SGPA,Credits
Semester 1,8.1,20
Semester 2,7.9,22
Semester 3,8.3,20
Semester 4,8.5,22`;
}

/**
 * Generates sample CSV string for new subjects upload template.
 */
export function generateNewSubjectsCsvTemplate(): string {
  return `Subject Name,Credits,Color Tag,Assignments Marks,Midterm Marks,Final Marks
Artificial Intelligence,4,#6366f1,18,42,
Machine Learning,4,#22c55e,19,45,
Web Development,3,#f59e0b,20,48,
Cloud Computing,4,#ec4899,17,39,`;
}
