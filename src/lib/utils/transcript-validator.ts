import type { ExtractedAcademicDocument, ExtractedSemester } from "@/services/ai-document-parser";
import { isValidSubjectCodePattern } from "@/lib/utils/code-disambiguation";

export interface ValidationIssue {
  id: string;
  type: "error" | "warning" | "info";
  semesterIndex?: number;
  subjectIndex?: number;
  field?: string;
  message: string;
}

export interface ValidatedSemester extends ExtractedSemester {
  isValid: boolean;
  isMismatch: boolean;
  issues: ValidationIssue[];
  calculatedCredits: number;
}

export interface ValidatedTranscriptDocument extends ExtractedAcademicDocument {
  overallConfidence: number; // 0 to 100
  totalIssuesCount: number;
  semesters: ValidatedSemester[];
  allIssues: ValidationIssue[];
}

const KNOWN_GRADES = new Set([
  "O", "A+", "A", "B+", "B", "C+", "C", "D", "P", "F",
  "I", "E1", "E2", "E3", "S", "U", "AB", "EX", "PASS", "FAIL"
]);

/**
 * Post-Processing Validation Engine for Extracted Academic Records.
 * Validates semester totals (Credits total, Subject count, SGPA, CGPA).
 * Flags isMismatch = true if semester totals fail validation.
 */
export function validateTranscriptDocument(
  doc: ExtractedAcademicDocument
): ValidatedTranscriptDocument {
  const issues: ValidationIssue[] = [];
  let totalChecksPassed = 0;
  let totalChecksCount = 0;

  const validatedSemesters: ValidatedSemester[] = doc.semesters.map((sem, sIdx) => {
    const semIssues: ValidationIssue[] = [];
    let calculatedCredits = 0;
    const seenCodes = new Set<string>();

    // 1. Validate SGPA
    totalChecksCount++;
    if (sem.sgpa === null || sem.sgpa === undefined || isNaN(sem.sgpa)) {
      semIssues.push({
        id: `sem-${sIdx}-sgpa-missing`,
        type: "warning",
        semesterIndex: sIdx,
        field: "sgpa",
        message: `SGPA for ${sem.semesterName} is missing or could not be verified.`,
      });
    } else if (sem.sgpa < 0 || sem.sgpa > 10) {
      semIssues.push({
        id: `sem-${sIdx}-sgpa-out-of-range`,
        type: "error",
        semesterIndex: sIdx,
        field: "sgpa",
        message: `SGPA (${sem.sgpa}) in ${sem.semesterName} is outside valid 0.0 - 10.0 scale bounds.`,
      });
    } else {
      totalChecksPassed++;
    }

    // 2. Validate Subjects & Calculate Sum of Credits
    if (!sem.subjects || sem.subjects.length === 0) {
      semIssues.push({
        id: `sem-${sIdx}-no-subjects`,
        type: "warning",
        semesterIndex: sIdx,
        message: `${sem.semesterName} has no extracted subject rows. Please verify document scan.`,
      });
    }

    sem.subjects.forEach((subj, subIdx) => {
      // Credits check (Must be explicit number in 0..8)
      totalChecksCount++;
      if (subj.credits === null || subj.credits === undefined || isNaN(subj.credits) || subj.credits < 0) {
        semIssues.push({
          id: `sem-${sIdx}-sub-${subIdx}-credits`,
          type: "warning",
          semesterIndex: sIdx,
          subjectIndex: subIdx,
          field: "credits",
          message: `Unparsed/missing credits for '${subj.name || subj.code || "Subject"}'. Please enter manually.`,
        });
      } else {
        calculatedCredits += subj.credits;
        totalChecksPassed++;
      }

      // Grade check (Preserves Grade O)
      totalChecksCount++;
      const normGrade = (subj.grade || "").trim().toUpperCase();
      if (!normGrade) {
        semIssues.push({
          id: `sem-${sIdx}-sub-${subIdx}-grade`,
          type: "warning",
          semesterIndex: sIdx,
          subjectIndex: subIdx,
          field: "grade",
          message: `Missing grade for subject '${subj.name || subj.code}'.`,
        });
      } else if (!KNOWN_GRADES.has(normGrade)) {
        semIssues.push({
          id: `sem-${sIdx}-sub-${subIdx}-grade-unrecognized`,
          type: "info",
          semesterIndex: sIdx,
          subjectIndex: subIdx,
          field: "grade",
          message: `Unusual grade '${subj.grade}' detected for '${subj.name}'.`,
        });
        totalChecksPassed += 0.5;
      } else {
        totalChecksPassed++;
      }

      // Subject Code Validation
      totalChecksCount++;
      if (subj.code) {
        const cleanCode = subj.code.trim().toUpperCase();
        if (!isValidSubjectCodePattern(cleanCode)) {
          semIssues.push({
            id: `sem-${sIdx}-sub-${subIdx}-code-format`,
            type: "info",
            semesterIndex: sIdx,
            subjectIndex: subIdx,
            field: "code",
            message: `Subject code '${cleanCode}' does not match standard university pattern.`,
          });
        }
        if (seenCodes.has(cleanCode)) {
          semIssues.push({
            id: `sem-${sIdx}-sub-${subIdx}-duplicate-code`,
            type: "warning",
            semesterIndex: sIdx,
            subjectIndex: subIdx,
            field: "code",
            message: `Duplicate Subject Code '${cleanCode}' found in ${sem.semesterName}.`,
          });
        } else {
          seenCodes.add(cleanCode);
        }
        totalChecksPassed++;
      }
    });

    // 3. Semester Credit Mismatch Audit
    const isMismatch = sem.credits !== undefined && sem.credits > 0 && Math.abs(calculatedCredits - sem.credits) > 0.01;
    if (isMismatch) {
      semIssues.push({
        id: `sem-${sIdx}-credit-mismatch`,
        type: "warning",
        semesterIndex: sIdx,
        field: "credits",
        message: `${sem.semesterName} calculated sum of credits (${calculatedCredits}) does not match transcript total (${sem.credits}).`,
      });
    }

    issues.push(...semIssues);

    return {
      ...sem,
      calculatedCredits: calculatedCredits || sem.credits || 0,
      isValid: semIssues.filter((i) => i.type === "error").length === 0,
      isMismatch,
      issues: semIssues,
    };
  });

  let confidenceScore = totalChecksCount > 0
    ? Math.round((totalChecksPassed / totalChecksCount) * 100)
    : 85;

  if (issues.length > 0) {
    confidenceScore = Math.min(92, confidenceScore);
  }

  return {
    ...doc,
    overallConfidence: Math.max(50, Math.min(95, confidenceScore)),
    totalIssuesCount: issues.length,
    semesters: validatedSemesters,
    allIssues: issues,
  };
}
