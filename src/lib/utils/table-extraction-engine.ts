import { disambiguateSubjectCodeOcr } from "@/lib/utils/code-disambiguation";

export interface CellParserResult<T> {
  value: T;
  rawText: string;
  confidence: number; // 0 to 100
}

const CLOSED_GRADE_MAP: Record<string, string> = {
  "0": "O", O: "O", "A+": "A+", A: "A", "B+": "B+", B: "B",
  "C+": "C", C: "C", D: "D", P: "P", F: "F", I: "I", S: "S", U: "U",
  "E1": "E1", "E2": "E2", "E3": "E3", AB: "AB"
};

const ALLOWED_CREDITS = new Set([
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8
]);

/**
 * Legacy compatibility helper for credit extraction.
 */
export function extractExactCellCredits(cellText: string): number | null {
  return parseCreditsCell(cellText).value;
}

/**
 * Legacy compatibility helper for course title purification.
 */
export function purifyCourseTitle(rawTitle: string): {
  title: string;
  relocatedCredits: number | null;
  relocatedGrade: string | null;
  studyPeriod: string | null;
} {
  const parsed = parseSubjectNameCell(rawTitle);
  return {
    title: parsed.value,
    relocatedCredits: null,
    relocatedGrade: null,
    studyPeriod: null,
  };
}

/**
 * Subject Code Cell Parser.
 */
export function parseSubjectCodeCell(cellText: string): CellParserResult<string> {
  if (!cellText || cellText.trim().length === 0) {
    return { value: "UNCODED", rawText: "", confidence: 30 };
  }

  const clean = cellText.trim();
  const codeRes = disambiguateSubjectCodeOcr(clean);

  if (codeRes.isValidPattern) {
    return {
      value: codeRes.code,
      rawText: cellText,
      confidence: codeRes.isCorrected ? 88 : 98,
    };
  }

  const fallbackMatch = clean.match(/\b([0-9]{2}[A-Z0-9]{3,8})\b/i);
  if (fallbackMatch) {
    return {
      value: fallbackMatch[1].toUpperCase(),
      rawText: cellText,
      confidence: 75,
    };
  }

  return { value: clean.toUpperCase(), rawText: cellText, confidence: 50 };
}

/**
 * Credits Cell Parser.
 * Reads ONLY from Credits column cell. Rejects non-credit numbers (500, 300, row indices).
 * Allowed values: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8.
 */
export function parseCreditsCell(cellText: string): CellParserResult<number | null> {
  if (!cellText || cellText.trim().length === 0) {
    return { value: null, rawText: "", confidence: 0 };
  }

  const clean = cellText.trim();

  // Match credit value token
  const match = clean.match(/\b([0-8]\.[05]|[0-8])\b/);
  if (match) {
    const val = parseFloat(match[1]);
    if (ALLOWED_CREDITS.has(val)) {
      return { value: val, rawText: cellText, confidence: 100 };
    }
  }

  return { value: null, rawText: cellText, confidence: 0 };
}

/**
 * Grade Cell Parser.
 * Closed Grade Vocabulary classification problem.
 * Converts OCR "0" inside Grade cell to letter "O". Never outputs numeric grades.
 */
export function parseGradeCell(cellText: string): CellParserResult<string> {
  if (!cellText || cellText.trim().length === 0) {
    return { value: "O", rawText: "", confidence: 50 };
  }

  const clean = cellText.trim().toUpperCase();
  const mapped = CLOSED_GRADE_MAP[clean];

  if (mapped) {
    return {
      value: mapped,
      rawText: cellText,
      confidence: clean === "0" ? 85 : 98,
    };
  }

  const match = clean.match(/\b(O|A\+|A|B\+|B|C\+|C|D|P|F|I|E1|E2|E3|S|U|AB|0)\b/);
  if (match) {
    const matchedGrade = CLOSED_GRADE_MAP[match[1]] || match[1];
    return {
      value: matchedGrade,
      rawText: cellText,
      confidence: 88,
    };
  }

  return { value: "O", rawText: cellText, confidence: 50 };
}

/**
 * Subject Name Cell Parser.
 * Removes 1 SEM, 2 SEM, 3 SEM, 4 SEM, Credits, Grade, SGPA, CGPA, Marks, 500, 300, 400.
 * Keeps official course title only.
 */
export function parseSubjectNameCell(cellText: string): CellParserResult<string> {
  if (!cellText || cellText.trim().length === 0) {
    return { value: "", rawText: "", confidence: 0 };
  }

  let text = cellText.trim();

  // Purify title: strip marks, study periods, summary headers, random punctuation
  const cleanTitle = text
    .replace(/\b(?:500|300|100|200|400|600|700|800|900|1000|1200|452)\b/g, "")
    .replace(/\b[1-9]\s*SEM\b/gi, "")
    .replace(/\b(?:sgpa|cgpa|credits|grade|marks|status|result)\b/gi, "")
    .replace(/\[\s*\]|\(\s*\)/g, "")
    .replace(/[-|:;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const finalTitle = cleanTitle.replace(/\s+([IVX]{1,4})$/i, "-$1");

  return {
    value: finalTitle || cellText.trim(),
    rawText: cellText,
    confidence: finalTitle.length >= 3 ? 92 : 60,
  };
}
