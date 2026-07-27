/**
 * Deterministic Academic Knowledge Layer & Validator.
 * Encapsulates official grade scales, credit bounds, GPA limits, and university code rules.
 */

export const KNOWN_VALID_GRADES = new Set([
  "O", "A+", "A", "B+", "B", "C+", "C", "D", "P", "F",
  "I", "E1", "E2", "E3", "S", "U", "AB", "E", "EX", "PASS", "FAIL"
]);

export const KNOWN_VALID_CREDITS = new Set([
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8
]);

export interface MultiEngineConfidenceInput {
  imageQuality: number;       // 0 - 100 (10% weight)
  structureConf: number;      // 0 - 100 (20% weight)
  ocrConf: number;            // 0 - 100 (20% weight)
  llmConf: number;            // 0 - 100 (20% weight)
  consensusAgreement: number; // 0 - 100 (15% weight)
  validationScore: number;    // 0 - 100 (15% weight)
}

/**
 * Validates whether a grade token is a recognized letter grade (e.g. O, A+, B).
 * Explicitly preserves O (Outstanding).
 */
export function validateAcademicGrade(grade: string): boolean {
  if (!grade) return false;
  return KNOWN_VALID_GRADES.has(grade.trim().toUpperCase());
}

/**
 * Validates whether a numeric credit value is within realistic academic bounds (0 to 8).
 */
export function validateAcademicCredits(credits: number | null | undefined): boolean {
  if (credits === null || credits === undefined || isNaN(credits)) return false;
  return KNOWN_VALID_CREDITS.has(credits);
}

/**
 * Validates whether SGPA / CGPA is within standard 0.0 - 10.0 bounds.
 */
export function validateAcademicGpa(gpa: number | null | undefined): boolean {
  if (gpa === null || gpa === undefined || isNaN(gpa)) return false;
  return gpa >= 0.0 && gpa <= 10.0;
}

/**
 * Computes Multi-Engine Final Mathematical Confidence Score.
 * Formula: Image Quality (10%) + Structure Detection (20%) + OCR (20%) + LLM (20%) + Consensus Agreement (15%) + Validation (15%).
 */
export function calculateMultiEngineConfidence(input: MultiEngineConfidenceInput): number {
  const score =
    (input.imageQuality * 0.10) +
    (input.structureConf * 0.20) +
    (input.ocrConf * 0.20) +
    (input.llmConf * 0.20) +
    (input.consensusAgreement * 0.15) +
    (input.validationScore * 0.15);

  return Math.max(35, Math.min(98, Math.round(score)));
}
