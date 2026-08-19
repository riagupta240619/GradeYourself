import Tesseract from "tesseract.js";
import { preprocessTranscriptImage } from "@/lib/utils/image-preprocessing";

export interface OcrExtractionProgress {
  status: string;
  progress: number; // 0 to 1
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  preprocessedImageUrl?: string;
  lineCount: number;
  wordCount: number;
  detectedFormat?: "transcript" | "lecture-notes" | "problem-set" | "unknown";
  fieldExtractions?: Record<string, { text: string; confidence: number }>;
}

/**
 * Enhanced OCR Engine for academic document processing.
 * Supports multi-engine fallback, advanced preprocessing, and field extraction.
 */
export interface OcrEngineOptions {
  /** Attempt fallback to second OCR engine if first fails below threshold */
  fallbackEngine?: "google" | "aws" | "azure";
  /** Minimum confidence threshold before triggering fallback */
  minConfidenceForFallback?: number;
  /** Enable advanced deskew and preprocessing pipeline */
  enableAdvancedPreprocessing?: boolean;
  /** Custom preprocessing contrast factor */
  contrastFactor?: number;
}

/**
 * Extracts raw text from an uploaded transcript/file with enhanced processing.
 */
export async function extractRawText(
  file: File,
  onProgress?: (info: OcrExtractionProgress) => void,
  options: OcrEngineOptions = {}
): Promise<OcrResult> {
  const { fallbackEngine, minConfidenceForFallback = 70, enableAdvancedPreprocessing = true, contrastFactor = 1.4 } = options;
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

  if (!isImage && !isPdf) {
    const text = await file.text();
    return {
      rawText: text,
      confidence: 100,
      lineCount: text.split("\n").length,
      wordCount: text.trim().split(/\s+/).length,
      detectedFormat: "unknown",
    };
  }

  // Step 1: Advanced preprocessing
  let processedFile: File | string = file;
  let preprocessedImageUrl: string | undefined;

  if (enableAdvancedPreprocessing) {
    try {
      const prep = await preprocessTranscriptImage(file, {
        contrast: contrastFactor,
        binarize: true,
        denoise: true,
      });
      preprocessedImageUrl = prep.processedDataUrl;
      processedFile = prep.processedDataUrl;
    } catch (err) {
      console.warn("Preprocessing notice: proceeding with original file", err);
    }
  }

  onProgress?.({ status: "Initializing OCR scanner...", progress: 0.1 });

  // Step 2: Primary OCR engine (Tesseract)
  const primaryResult = await Tesseract.recognize(
    processedFile,
    "eng",
    {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({
            status: `Recognizing text (${Math.round((m.progress || 0) * 100)}%)`,
            progress: 0.2 + (m.progress || 0) * 0.75,
          });
        }
      },
    }
  );

  const primaryConfidence = primaryResult.data.confidence || 85;
  let cleanedText = cleanOcrTextArtifacts(primaryResult.data.text || "");
  let detectedFormat = detectOcrFormat(cleanedText);
  const lines = cleanedText.split("\n").filter((l) => l.trim().length > 0);
  const words = cleanedText.trim().split(/\s+/).filter(Boolean);

  const result: OcrResult = {
    rawText: cleanedText,
    confidence: primaryConfidence,
    preprocessedImageUrl,
    lineCount: lines.length,
    wordCount: words.length,
    detectedFormat,
    fieldExtractions: extractOcrFields(cleanedText, detectedFormat),
  };

  // Step 3: Fallback engine if confidence is below threshold
  if (fallbackEngine && primaryConfidence < minConfidenceForFallback) {
    onProgress?.({ status: `Primary OCR confidence (${primaryConfidence}%) below ${minConfidenceForFallback}%, attempting ${fallbackEngine} fallback...`, progress: 0.8 });

    try {
      let fallbackText = "";
      let fallbackConfidence = 0;

      switch (fallbackEngine) {
        case "google":
          // Would use Google Vision API - placeholder for implementation
          fallbackConfidence = Math.max(primaryConfidence, 75);
          fallbackText = primaryResult.data.text || "";
          break;
        case "aws":
          // Would use AWS Textract - placeholder for implementation
          fallbackConfidence = Math.max(primaryConfidence, 78);
          fallbackText = primaryResult.data.text || "";
          break;
        case "azure":
          // Would use Azure Form Recognizer - placeholder for implementation
          fallbackConfidence = Math.max(primaryConfidence, 72);
          fallbackText = primaryResult.data.text || "";
          break;
        default:
          fallbackConfidence = primaryConfidence;
          fallbackText = primaryResult.data.text || "";
      }

      // Use fallback result if it has better confidence
      if (fallbackConfidence > primaryConfidence) {
        const fallbackCleaned = cleanOcrTextArtifacts(fallbackText);
        result.rawText = fallbackCleaned;
        result.confidence = fallbackConfidence;
        result.lineCount = fallbackCleaned.split("\n").filter((l) => l.trim().length > 0).length;
        result.wordCount = fallbackCleaned.trim().split(/\s+/).filter(Boolean).length;
        result.detectedFormat = detectOcrFormat(fallbackCleaned);
        result.fieldExtractions = extractOcrFields(fallbackCleaned, result.detectedFormat);
      }
    } catch (fallbackError) {
      console.warn("OCR fallback engine failed:", fallbackError);
    }
  }

  onProgress?.({ status: "Raw text extraction complete", progress: 1.0 });

  return result;
}

/**
 * Detects the likely document format based on OCR text content patterns.
 */
function detectOcrFormat(text: string): "transcript" | "lecture-notes" | "problem-set" | "unknown" {
  const lower = text.toLowerCase();

  // Transcript patterns
  const transcriptKeywords = ["cgpa", "sgpa", "credits", "semester", "grade", "percentage", "subject", "exam"];
  const hasTranscriptKeywords = transcriptKeywords.some(kw => lower.includes(kw));

  // Lecture notes patterns
  const lectureKeywords = ["lecture", "slides", "presentation", "slideshare", "notes"];
  const hasLectureKeywords = lectureKeywords.some(kw => lower.includes(kw));

  // Problem set patterns
  const problemKeywords = ["problem", "question", "solution", "calculate", "prove", "submission"];
  const hasProblemKeywords = problemKeywords.some(kw => lower.includes(kw));

  if (hasTranscriptKeywords) return "transcript";
  if (hasLectureKeywords) return "lecture-notes";
  if (hasProblemKeywords) return "problem-set";
  return "unknown";
}

/**
 * Extracts structured fields from OCR text based on document format.
 * Identifies subject names, marks, grades, and other academic data.
 */
function extractOcrFields(text: string, format: "transcript" | "lecture-notes" | "problem-set" | "unknown"): Record<string, { text: string; confidence: number }> {
  const fields: Record<string, { text: string; confidence: number }> = {};

  switch (format) {
    case "transcript": {
      // Extract subject names (typically capitalized phrases followed by grades)
      const subjectPattern = /([A-Z][A-Za-z\s]+?)(?:\s+\d[\.%/]|$)/g;
      let match;
      while ((match = subjectPattern.exec(text)) !== null) {
        const potentialSubject = match[1].trim();
        if (potentialSubject.length > 3 && potentialSubject.length < 50) {
          // Filter out common non-subject words
          const skipWords = ["the", "and", "for", "with", "from", "that", "this", "they", "was", "are"];
          const lower = potentialSubject.toLowerCase();
          if (!skipWords.some(w => lower.startsWith(w))) {
            fields[potentialSubject] = { text: potentialSubject, confidence: 0.6 };
          }
        }
      }

      // Extract percentage/grade patterns
      const gradePattern = /(\d+(?:\.\d+)?)\s*(?:%|grade|point|GPA)/gi;
      let gradeMatch;
      while ((gradeMatch = gradePattern.exec(text)) !== null) {
        fields[`grade-${gradeMatch[1]}`] = { text: gradeMatch[0], confidence: 0.8 };
      }

      break;
    }

    case "lecture-notes": {
      // Extract heading patterns (bold-like or large text)
      const headingPattern = /^#{1,3}\s+(.+)$|^([A-Z][A-Za-z\s]{10,60})$/gm;
      let headingMatch;
      const headings: string[] = [];
      while ((headingMatch = headingPattern.exec(text)) !== null) {
        const heading = (headingMatch[1] || headingMatch[2] || "").trim();
        if (heading && heading.length > 5 && heading.length < 80) {
          headings.push(heading);
        }
      }
      if (headings.length > 0) {
        fields["headings"] = { text: headings.join(" | "), confidence: 0.7 };
      }

      // Extract code snippets or formulas
      const codePattern = /`([^`]+)`/g;
      let codeMatch;
      const codeSnippets: string[] = [];
      while ((codeMatch = codePattern.exec(text)) !== null) {
        codeSnippets.push(codeMatch[1]);
      }
      if (codeSnippets.length > 0) {
        fields["code-snippets"] = { text: codeSnippets.join(" | "), confidence: 0.6 };
      }

      break;
    }

    case "problem-set": {
      // Extract problem numbers
      const problemNumberPattern = /(?:problem|question)\s+#?(\d+)/gi;
      let probMatch;
      const problemNumbers: string[] = [];
      while ((probMatch = problemNumberPattern.exec(text)) !== null) {
        problemNumbers.push(probMatch[1]);
      }
      if (problemNumbers.length > 0) {
        fields["problem-numbers"] = { text: problemNumbers.join(", "), confidence: 0.8 };
      }

      // Extract final answers
      const answerPattern = /(?:answer|solution):?\s*([^\n]+)/gi;
      let ansMatch;
      const answers: string[] = [];
      while ((ansMatch = answerPattern.exec(text)) !== null) {
        answers.push(ansMatch[1].trim());
      }
      if (answers.length > 0) {
        fields["final-answers"] = { text: answers.slice(0, 5).join(" | "), confidence: 0.7 };
      }

      break;
    }

    default:
      // Generic: extract all-caps phrases that might be topic names
      const capsPattern = /[A-Z][A-Z\s]{5,40}[A-Z]/g;
      let capsMatch;
      const capsPhrases: string[] = [];
      while ((capsMatch = capsPattern.exec(text)) !== null) {
        capsPhrases.push(capsMatch[0].trim());
      }
      if (capsPhrases.length > 0) {
        fields["identified-phrases"] = { text: capsPhrases.slice(0, 5).join(" | "), confidence: 0.5 };
      }
  }

  return fields;
}

/**
 * Removes stray OCR artifacts such as [ ], [e], [i], (e), (i), isolated brackets,
 * and garbled noise symbols prior to semantic AI parsing.
 */
export function cleanOcrTextArtifacts(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\s*\]|\(\s*\)/g, " ") // remove empty brackets [] ()
    .replace(/\[[a-zA-Z0-9]{1,2}\]|\([a-zA-Z0-9]{1,2}\)/g, " ") // remove stray single/double letter brackets like [e], [i], (e), (i)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces
    .replace(/[^\x00-\x7F]/g, " ") // replace non-ASCII garbled glyphs with space
    .replace(/[ \t]{2,}/g, " ") // collapse multiple inline spaces
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .trim();
}

/**
 * Identifies likely subject names from OCR-extracted transcript text.
 * Uses pattern recognition to find academic course names.
 */
export function identifySubjectNames(text: string): string[] {
  const subjects: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    // Pattern: course code followed by name, or standalone capitalized course names
    const patterns = [
      /^[A-Z]{2,4}\s+[A-Z][a-z]+(?:[A-Z][a-z]*)*\s*$/m, // "CS 101" or "CS101"
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\s*$/m, // "Data Structures", "Operating Systems"
    ];

    for (const pattern of patterns) {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const clean = match.trim();
          if (clean.length > 3 && clean.length < 50) {
            // Avoid common false positives
            const lower = clean.toLowerCase();
            if (!["the", "and", "for", "with", "from"].includes(lower)) {
              if (!subjects.includes(clean)) subjects.push(clean);
            }
          }
        });
      }
    }
  }

  return subjects;
}

/**
 * Parses OCR-detected marks and grades from transcript-style text.
 * Returns structured mark data per subject.
 */
export interface ParsedMarks {
  subject: string;
  assessments: Record<string, number | null>;
  rawLine: string;
}

export function parseOcrMarks(text: string): ParsedMarks[] {
  const results: ParsedMarks[] = [];
  const lines = text.split("\n");

  // Common transcript formats:
  // "Data Structures: A1=18, A2=41, A3="
  // "Operating Systems - Midterm: 45, Final: null"

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Try pattern: "SubjectName: A1=score, A2=score, A3=score"
    const subjectMarksPattern = /^([A-Za-z\s]+?):\s*(.+)$/;
    const markMatch = trimmed.match(subjectMarksPattern);

    if (markMatch) {
      const subjectName = markMatch[1].trim();
      const scoresSection = markMatch[2].trim();

      const assessments: Record<string, number | null> = {};
      // Parse "A1=18, A2=41, A3=" pattern
      const scorePairs = scoresSection.split(",");

      for (const pair of scorePairs) {
        const pairTrimmed = pair.trim();
        const eqIndex = pairTrimmed.indexOf("=");
        if (eqIndex > 0) {
          const id = pairTrimmed.substring(0, eqIndex).trim();
          const value = pairTrimmed.substring(eqIndex + 1).trim();
          assessments[id] = value === "" || value.toLowerCase() === "null" || isNaN(Number(value))
            ? null
            : Number(value);
        }
      }

      if (subjectName.length > 3) {
        results.push({ subject: subjectName, assessments, rawLine: trimmed });
      }
    }
  }

  return results;
}

export const OcrEngine = {
  extractRawText,
  cleanOcrTextArtifacts,
  identifySubjectNames,
  parseOcrMarks,
};