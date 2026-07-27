import type { ExtractedSubject } from "@/services/ai-document-parser";

export interface SpatialDetectedRow {
  lineIndex: number;
  originalLine: string;
  codeCandidate: string | null;
  nameCandidate: string | null;
  creditsCandidate: number | null;
  gradeCandidate: string | null;
  rowConfidence: number; // 0 to 100
}

export interface SemesterCompletenessAudit {
  semesterNum: number;
  expectedRows: number;
  detectedRows: number;
  recoveredRows: number;
  missingRows: number;
  coveragePct: number; // 0 to 100%
}

/**
 * Calculates per-row confidence score mathematically based on field presence.
 * Example: Row detected = 100%, Code = 40%, Title = 30%, Credits = 15%, Grade = 15%.
 */
export function calculateRowConfidence(subject: ExtractedSubject): number {
  let score = 40; // Base score for spatial row detection (row exists!)

  if (subject.code && subject.code !== "UNCODED" && subject.code !== "needs_review") {
    score += 25;
  }

  if (subject.name && subject.name.length > 3) {
    score += 20;
  }

  if (subject.credits !== null && subject.credits !== undefined && subject.credits > 0) {
    score += 10;
  }

  if (subject.grade && subject.grade !== "O") {
    score += 5;
  }

  return Math.min(100, Math.max(30, score));
}

/**
 * Spatial Academic Row Detector.
 * Identifies 100% of horizontal lines inside the academic table region
 * between Semester Header and SGPA summary lines.
 * Decoupled from OCR grade/code matching quality.
 */
export function detectSpatialAcademicRows(blockLines: string[]): SpatialDetectedRow[] {
  const detectedRows: SpatialDetectedRow[] = [];

  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];

    // Filter out summary lines (SGPA, CGPA, Total, Signature, Controller)
    if (/\b(?:total|sgpa|cgpa|grand total|signature|controller|date|page\s*[0-9]+)\b/i.test(line)) {
      continue;
    }

    // Filter out table column headers (e.g. "COURSE CODE", "SUBJECT NAME")
    if (/\b(?:course\s*code|subject\s*name|credit\s*hours|letter\s*grade)\b/i.test(line)) {
      continue;
    }

    // Every remaining line with text content inside the table region becomes a spatial row candidate!
    if (line.trim().length > 2) {
      const codeMatch = line.match(/\b([A-Z0-9]{2,6}[-\s]?[0-9]{2,5}[A-Z]?|[0-9]{2}[A-Z]{3,5}[0-9]{3,5}[A-Z]?)\b/i);
      const gradeMatch = line.match(/\b(O|A\+|A|B\+|B|C\+|C|D|P|F|I|E1|E2|E3|S|U|AB)\b/);

      detectedRows.push({
        lineIndex: i,
        originalLine: line,
        codeCandidate: codeMatch ? codeMatch[1] : null,
        nameCandidate: line,
        creditsCandidate: null,
        gradeCandidate: gradeMatch ? gradeMatch[1] : null,
        rowConfidence: 60,
      });
    }
  }

  return detectedRows;
}
