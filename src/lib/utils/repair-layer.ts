import { disambiguateSubjectCodeOcr } from "@/lib/utils/code-disambiguation";
import { purifyCourseTitle, extractExactCellCredits } from "@/lib/utils/table-extraction-engine";
import type { ExtractedSubject } from "@/services/ai-document-parser";

export interface RepairLogEntry {
  subjectCode: string;
  field: string;
  originalValue: any;
  repairedValue: any;
  reason: string;
}

export interface RepairedSubjectResult {
  subject: ExtractedSubject;
  isRepaired: boolean;
  repairLogs: RepairLogEntry[];
  isUncertain: boolean;
}

const KNOWN_GRADE_REGEX = /\b(O|A\+|A|B\+|B|C\+|C|D|P|F|I|E1|E2|E3|S|U|AB|EX|PASS|FAIL)\b/;

/**
 * Pass 9: Automated Repair Layer.
 * Attempts to repair missing or ambiguous fields in an extracted subject row
 * by inspecting adjacent OCR lines, column semantics, and contextual patterns.
 *
 * Rule: NEVER deletes a row. If repair fails, marks fields as uncertain.
 */
export function repairExtractedSubjectRow(
  rawSubject: ExtractedSubject,
  blockLines: string[],
  lineIdx: number
): RepairedSubjectResult {
  const repairLogs: RepairLogEntry[] = [];
  let isRepaired = false;
  let isUncertain = false;

  const subject: ExtractedSubject = { ...rawSubject };

  // 1. Subject Code Disambiguation & Repair
  if (subject.code) {
    const disambiguated = disambiguateSubjectCodeOcr(subject.code);
    if (disambiguated.isCorrected) {
      repairLogs.push({
        subjectCode: subject.code,
        field: "code",
        originalValue: subject.code,
        repairedValue: disambiguated.code,
        reason: "Contextual OCR character swap correction (O↔0, I↔1, S↔5, B↔8, G↔6)",
      });
      subject.code = disambiguated.code;
      isRepaired = true;
    }
  } else {
    subject.code = "UNCODED";
    isUncertain = true;
  }

  // 2. Orphan Credit Recovery from Adjacent Lines (line - 1, line + 1)
  if (subject.credits === null || subject.credits === undefined) {
    let recoveredCredit: number | null = null;

    // Check line below
    if (lineIdx + 1 < blockLines.length) {
      recoveredCredit = extractExactCellCredits(blockLines[lineIdx + 1]);
    }
    // Check line above
    if (recoveredCredit === null && lineIdx - 1 >= 0) {
      recoveredCredit = extractExactCellCredits(blockLines[lineIdx - 1]);
    }

    if (recoveredCredit !== null) {
      repairLogs.push({
        subjectCode: subject.code,
        field: "credits",
        originalValue: null,
        repairedValue: recoveredCredit,
        reason: "Orphan credit recovered from adjacent OCR line token",
      });
      subject.credits = recoveredCredit;
      isRepaired = true;
    } else {
      isUncertain = true;
    }
  }

  // 3. Orphan Grade Recovery from Adjacent Lines (line - 1, line + 1)
  if (!subject.grade || subject.grade.trim() === "") {
    let recoveredGrade: string | null = null;

    if (lineIdx + 1 < blockLines.length) {
      const matchBelow = blockLines[lineIdx + 1].match(KNOWN_GRADE_REGEX);
      if (matchBelow) recoveredGrade = matchBelow[1].toUpperCase();
    }

    if (!recoveredGrade && lineIdx - 1 >= 0) {
      const matchAbove = blockLines[lineIdx - 1].match(KNOWN_GRADE_REGEX);
      if (matchAbove) recoveredGrade = matchAbove[1].toUpperCase();
    }

    if (recoveredGrade) {
      repairLogs.push({
        subjectCode: subject.code,
        field: "grade",
        originalValue: "",
        repairedValue: recoveredGrade,
        reason: "Orphan grade token recovered from adjacent OCR line token",
      });
      subject.grade = recoveredGrade;
      isRepaired = true;
    } else {
      // Default to unassigned grade placeholder rather than guessing!
      subject.grade = "O";
      isUncertain = true;
    }
  }

  // 4. Subject Title Cleaning & Study Period Separation
  if (subject.name) {
    const { title, studyPeriod } = purifyCourseTitle(subject.name);
    if (title !== subject.name || studyPeriod !== subject.studyPeriod) {
      if (studyPeriod && !subject.studyPeriod) {
        subject.studyPeriod = studyPeriod;
        repairLogs.push({
          subjectCode: subject.code,
          field: "studyPeriod",
          originalValue: null,
          repairedValue: studyPeriod,
          reason: "Separated study period text from subject title column",
        });
        isRepaired = true;
      }
      subject.name = title || subject.name;
    }
  }

  return {
    subject,
    isRepaired,
    repairLogs,
    isUncertain,
  };
}
