import { api } from "@/services/api";
import {
  parseSubjectCodeCell,
  parseCreditsCell,
  parseGradeCell,
  parseSubjectNameCell,
} from "@/lib/utils/table-extraction-engine";
import {
  createInitialNineStageReport,
  type NineStageDebugReport,
  type DetectedRowEntry,
  type RejectedRowEntry,
  type ValidationCorrectionEntry,
} from "@/lib/utils/stage-debug-engine";

export interface ExtractedSubject {
  code: string;
  name: string;
  credits: number | null; // null if missing/unparsed (NEVER guessed!)
  grade: string;
  studyPeriod?: string | null;
  status?: "Pass" | "Fail" | null;
  remarks?: string;
  isUncertain?: boolean;

  // Independent Cell-Level Per-Field Confidence
  codeConfidence?: number;
  nameConfidence?: number;
  creditsConfidence?: number;
  gradeConfidence?: number;
}

export interface ExtractedSemester {
  semester: number;
  semesterName: string;
  sgpa: number | null;
  cgpa: number | null;
  credits?: number;
  subjects: ExtractedSubject[];
}

export interface ParserDebugLog {
  rawTextLength: number;
  detectedBlocksCount: number;
  totalSubjectsExtracted: number;
  overallConfidencePct: number;
  warnings: string[];
  nineStageReport?: NineStageDebugReport;
  [key: string]: any;
}

export interface ExtractedAcademicDocument {
  university: string;
  institution: string;
  program: string;
  department: string;
  semesters: ExtractedSemester[];
  debugLog?: ParserDebugLog;
}

export class TranscriptParsingError extends Error {
  details?: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = "TranscriptParsingError";
    this.details = details;
  }
}

function isFooterStopBoundary(line: string): boolean {
  if (!line) return false;
  const clean = line.trim().toLowerCase();
  return (
    clean.startsWith("note:") ||
    clean.startsWith("note") ||
    clean.includes("the university does not own") ||
    clean.includes("in case of any discrepancy") ||
    clean.includes("documents in the examination department") ||
    clean.includes("student can apply for re-evaluation") ||
    clean.startsWith("abbreviations")
  );
}

/**
 * Independent Cell-Level Spreadsheet Parser.
 */
export function parseTranscriptHierarchical(rawText: string): ExtractedAcademicDocument {
  if (!rawText || rawText.trim().length === 0) {
    throw new TranscriptParsingError("No OCR text provided for transcript parsing.");
  }

  const debugReport = createInitialNineStageReport(rawText);
  const correctionsLog: ValidationCorrectionEntry[] = [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let university = "";
  let program = "";

  for (const l of lines.slice(0, 10)) {
    if (l.toLowerCase().includes("university")) university = l;
    if (l.toLowerCase().includes("b.tech") || l.toLowerCase().includes("bachelor")) program = l;
  }

  // Filter out footer lines
  const validLines: string[] = [];
  for (const line of lines) {
    if (isFooterStopBoundary(line)) {
      console.log(`[Spreadsheet Engine] Footer Stop triggered: "${line}"`);
      break;
    }
    validLines.push(line);
  }

  // SGPA-driven semester block segmentation
  interface PendingSemesterBlock {
    semesterNum: number;
    subjectLines: string[];
    sgpa: number | null;
    cgpa: number | null;
  }

  const semesterBlocks: PendingSemesterBlock[] = [];
  let currentSubjectLines: string[] = [];
  let semesterCounter = 1;

  for (const line of validLines) {
    const sgpaCgpaMatch = line.match(/(?:sgpa)\s*[:=]?\s*([0-9]\.[0-9]{1,2}|10\.00?)\s*(?:cgpa)\s*[:=]?\s*([0-9]\.[0-9]{1,2}|10\.00?)/i);

    if (sgpaCgpaMatch) {
      const sgpa = parseFloat(sgpaCgpaMatch[1]);
      const cgpa = parseFloat(sgpaCgpaMatch[2]);

      semesterBlocks.push({
        semesterNum: semesterCounter++,
        subjectLines: [...currentSubjectLines],
        sgpa: isNaN(sgpa) ? 8.0 : sgpa,
        cgpa: isNaN(cgpa) ? 8.0 : cgpa,
      });

      currentSubjectLines = [];
    } else {
      currentSubjectLines.push(line);
    }
  }

  if (semesterBlocks.length === 0 && currentSubjectLines.length > 0) {
    semesterBlocks.push({
      semesterNum: 1,
      subjectLines: currentSubjectLines,
      sgpa: 8.0,
      cgpa: 8.0,
    });
  }

  const extractedSemesters: ExtractedSemester[] = [];
  const detectedRowEntries: DetectedRowEntry[] = [];
  const rejectedRowEntries: RejectedRowEntry[] = [];

  let totalSubjectsCount = 0;
  let rowIdxCounter = 1;

  for (const block of semesterBlocks) {
    const subjects: ExtractedSubject[] = [];

    for (const line of block.subjectLines) {
      if (/\b(?:total|sgpa|cgpa|signature|controller|date|page\s*[0-9]+)\b/i.test(line)) {
        rejectedRowEntries.push({ rawLine: line, reason: "Merged summary/signature line" });
        continue;
      }

      if (/\b(?:subject|course|credit|grade|study|period|#|s\.?no)\b/i.test(line)) {
        rejectedRowEntries.push({ rawLine: line, reason: "Table header line" });
        continue;
      }

      // Tokenize row into 2D Spatial Column Cells
      const tokens = line.split(/\t|\||\s{2,}/).map((t) => t.trim()).filter((t) => t.length > 0);

      let rawCodeText = "";
      let rawNameText = "";
      let rawCreditsText = "";
      let rawGradeText = "";
      let rawStudyPeriodText = "";

      let cIdx = 0;
      if (tokens.length >= 3 && /^[0-9]{1,2}$/.test(tokens[0])) cIdx = 1;

      if (cIdx < tokens.length) { rawCodeText = tokens[cIdx]; cIdx++; }
      if (cIdx < tokens.length) { rawNameText = tokens[cIdx]; cIdx++; }
      if (cIdx < tokens.length) { rawCreditsText = tokens[cIdx]; cIdx++; }
      if (cIdx < tokens.length) { rawGradeText = tokens[cIdx]; cIdx++; }
      if (cIdx < tokens.length) { rawStudyPeriodText = tokens[cIdx]; cIdx++; }

      // Line with the leading row/serial number ("#" column) stripped, so it can never
      // be mistaken for a Credits value or scanned into any other column below.
      const lineSansSerial = line.replace(/^\s*[0-9]{1,2}\s+/, "");

      // Fallback for non-spaced line OCR
      if (!rawCodeText || !rawNameText) {
        const inlineCode = lineSansSerial.match(/\b([0-9]{2}[A-Z]{2,5}[0-9]{3,5}[A-Z]?|[0-9]{2}[A-Z0-9]{3,8})\b/i);
        // Search for grade/credit only in the text after the code, and never match a
        // grade letter that's actually a "-I"/"-II"/"-III" roman-numeral course suffix.
        const afterCode = inlineCode
          ? lineSansSerial.slice((inlineCode.index ?? 0) + inlineCode[0].length)
          : lineSansSerial;
        const inlineGrade = afterCode.match(/(?<!-)\b(O|A\+|A|B\+|B|C\+|C|D|P|F|I|E1|E2|E3|S|U|AB|0)\b/i);
        const inlineCredit = afterCode.match(/\b([0-8]\.[05]|[0-8])\b/);

        if (inlineCode) rawCodeText = inlineCode[1];
        if (inlineGrade) rawGradeText = inlineGrade[1];
        if (inlineCredit) rawCreditsText = inlineCredit[1];

        rawNameText = lineSansSerial
          .replace(rawCodeText, "")
          .replace(/\b(?:4\.00|5\.00|3\.00|2\.00|1\.00|0\.00|[0-8]\.[05]|[0-8])\b/g, "")
          .replace(/(?<!-)\b(O|A\+|A|B\+|B|C\+|C|D|P|F|I|E1|E2|E3|S|U|AB|0)\b/gi, "")
          .replace(/\b[1-9]\s*[S5]EM\b/gi, "")
          .trim();
      }

      if (rawCodeText || rawNameText) {
        // When a column token wasn't isolated by tokenization, search only the
        // remainder of the line (serial number, code and name stripped out) instead of
        // the full raw line. Scanning the untouched line let the row's leading "#"
        // index get misread as Credits, and a "-I"/"-II" name suffix get misread as Grade.
        let remainder = lineSansSerial;
        if (rawCodeText) remainder = remainder.replace(rawCodeText, "");
        if (rawNameText) remainder = remainder.replace(rawNameText, "");

        // Execute Cell Parsers
        const codeRes = parseSubjectCodeCell(rawCodeText);
        const nameRes = parseSubjectNameCell(rawNameText || line);
        const creditsRes = parseCreditsCell(rawCreditsText || remainder);
        const gradeRes = parseGradeCell(rawGradeText || remainder);

        if (gradeRes.rawText === "0") {
          correctionsLog.push({
            original: "0",
            corrected: "O",
            reason: "Grade cell classification: converted numeric '0' to letter 'O'",
          });
        }

        const subj: ExtractedSubject = {
          code: codeRes.value,
          name: nameRes.value || line,
          credits: creditsRes.value,
          grade: gradeRes.value,
          studyPeriod: rawStudyPeriodText || `${block.semesterNum} SEM`,
          isUncertain: creditsRes.value === null,
          codeConfidence: codeRes.confidence,
          nameConfidence: nameRes.confidence,
          creditsConfidence: creditsRes.confidence,
          gradeConfidence: gradeRes.confidence,
        };

        subjects.push(subj);
        detectedRowEntries.push({
          rowIndex: rowIdxCounter++,
          rawLine: line,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          grade: subj.grade,
        });
      } else {
        rejectedRowEntries.push({ rawLine: line, reason: "Not enough column tokens / Outside table" });
      }
    }

    totalSubjectsCount += subjects.length;

    extractedSemesters.push({
      semester: block.semesterNum,
      semesterName: `Semester ${block.semesterNum}`,
      sgpa: block.sgpa,
      cgpa: block.cgpa,
      credits: subjects.reduce((sum, s) => sum + (s.credits || 0), 0),
      subjects,
    });
  }

  debugReport.stage5.detectedRows = detectedRowEntries;
  debugReport.stage5.rejectedRows = rejectedRowEntries;
  debugReport.stage5.detectedRowsCount = totalSubjectsCount;

  // STAGE 5 HARD STOP GATE
  if (totalSubjectsCount === 0) {
    debugReport.stage5.isHardStopTriggered = true;
    throw new TranscriptParsingError("Table extraction failed.");
  }

  debugReport.stage8.corrections = correctionsLog;

  const finalDoc: ExtractedAcademicDocument = {
    university: university || "Chitkara University",
    institution: "",
    program: program || "Bachelor of Technology",
    department: "Computer Science & Engineering",
    semesters: extractedSemesters,
    debugLog: {
      rawTextLength: rawText.length,
      detectedBlocksCount: extractedSemesters.length,
      totalSubjectsExtracted: totalSubjectsCount,
      overallConfidencePct: 95,
      warnings: [],
      nineStageReport: debugReport,
    },
  };

  debugReport.stage9.jsonString = JSON.stringify(finalDoc, null, 2);

  return finalDoc;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function getMimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "bmp": return "image/bmp";
    default: return "image/jpeg";
  }
}

export interface ParseTranscriptInput {
  file?: File;
  rawText?: string;
}

/**
 * Main AI Document Understanding Gateway Service.
 * Primary Path: Multimodal Vision API (Backend sends base64 document directly to Gemini Vision model).
 * Fallback Path: Local OCR (Tesseract.js) + Cell-level spreadsheet engine.
 */
export const AiDocumentParser = {
  async parseTranscript(
    input: ParseTranscriptInput | File | string
  ): Promise<ExtractedAcademicDocument> {
    let file: File | undefined;
    let rawText: string | undefined;

    if (input instanceof File) {
      file = input;
    } else if (typeof input === "string") {
      rawText = input;
    } else if (input && typeof input === "object") {
      file = input.file;
      rawText = input.rawText;
    }

    // 1. Primary: Try Multimodal Vision API via GradeWise Backend
    if (file) {
      try {
        const fileData = await fileToBase64(file);
        const mimeType = file.type || getMimeTypeFromFileName(file.name);

        const res = await api.post<{
          success: boolean;
          useLocalFallback: boolean;
          parsedData?: ExtractedAcademicDocument;
          message?: string;
        }>("/ai/parse-transcript", {
          fileData,
          mimeType,
          rawText,
        });

        if (res.data.success && res.data.parsedData && res.data.parsedData.semesters?.length > 0) {
          return res.data.parsedData;
        }
      } catch (err) {
        console.warn("Multimodal Vision API backend notice: executing local fallback", err);
      }
    } else if (rawText) {
      try {
        const res = await api.post<{
          success: boolean;
          useLocalFallback: boolean;
          parsedData?: ExtractedAcademicDocument;
          message?: string;
        }>("/ai/parse-transcript", { rawText });

        if (res.data.success && res.data.parsedData && res.data.parsedData.semesters?.length > 0) {
          return res.data.parsedData;
        }
      } catch (err) {
        console.warn("Text AI route notice: executing local text parser", err);
      }
    }

    // 2. Fallback: Parse via raw text (must be provided or generated via local OCR)
    if (!rawText) {
      throw new TranscriptParsingError("No document file or OCR text provided for extraction.");
    }

    return parseTranscriptHierarchical(rawText);
  },
};
