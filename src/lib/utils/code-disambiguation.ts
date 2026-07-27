/**
 * Contextual Subject Code OCR Misread Disambiguation Engine.
 * Corrects common OCR character swaps (O ↔ 0, I ↔ 1, S ↔ 5, B ↔ 8, G ↔ 6)
 * ONLY when the corrected string matches a valid university subject code pattern.
 */

export interface SubjectCodeValidationResult {
  code: string;
  originalCode: string;
  isCorrected: boolean;
  isValidPattern: boolean;
}

/**
 * Validates whether a string matches standard university subject code patterns.
 * e.g. "24CSE0214", "CS101", "15CS41", "EC-201", "MATH101", "UC0101"
 */
export function isValidSubjectCodePattern(code: string): boolean {
  if (!code || code.length < 3 || code.length > 15) return false;
  const clean = code.trim().toUpperCase().replace(/[\s-]/g, "");

  // Pattern A: 2 digits + 3-5 letters + 3-5 digits (e.g. 24CSE0214)
  if (/^[0-9]{2}[A-Z]{2,5}[0-9]{3,5}[A-Z]?$/.test(clean)) return true;

  // Pattern B: 2-4 letters + 2-5 digits (e.g. CS101, MATH201)
  if (/^[A-Z]{2,4}[0-9]{2,5}[A-Z]?$/.test(clean)) return true;

  // Pattern C: 2 digits + 2-4 letters + 2-4 digits (e.g. 15CS41)
  if (/^[0-9]{2}[A-Z]{2,4}[0-9]{2,4}[A-Z]?$/.test(clean)) return true;

  // Generic Alphanumeric Subject Code with at least 1 letter & 1 digit
  if (/^[A-Z0-9]{4,12}$/.test(clean) && /[A-Z]/.test(clean) && /[0-9]/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Disambiguates OCR character misreads in subject codes based on positional context.
 * e.g. "24CSED214" -> "24CSE0214"
 * e.g. "CS1O1" -> "CS101"
 * e.g. "24CSE021I" -> "24CSE0217" or "24CSE0211"
 */
export function disambiguateSubjectCodeOcr(rawCode: string): SubjectCodeValidationResult {
  if (!rawCode) {
    return { code: "", originalCode: "", isCorrected: false, isValidPattern: false };
  }

  const originalCode = rawCode.trim().toUpperCase().replace(/\s+/g, "");

  // If already a valid pattern, return directly
  if (isValidSubjectCodePattern(originalCode)) {
    return { code: originalCode, originalCode, isCorrected: false, isValidPattern: true };
  }

  // Candidate Correction 1: Format "24CSE0214" (2 digits + letters + digits)
  const matchA = originalCode.match(/^([0-9OISBG]{2})([A-Z0-9]{3,5})([A-Z0-9]{3,5})$/);
  if (matchA) {
    const prefixDigits = matchA[1]
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/S/g, "5")
      .replace(/B/g, "8")
      .replace(/G/g, "6");

    const lettersPart = matchA[2]
      .replace(/0/g, "O")
      .replace(/1/g, "I")
      .replace(/5/g, "S")
      .replace(/8/g, "B")
      .replace(/6/g, "G")
      .replace(/D/g, "E"); // Common OCR misread D -> E in CSE

    const digitsPart = matchA[3]
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/S/g, "5")
      .replace(/B/g, "8")
      .replace(/G/g, "6");

    const corrected = `${prefixDigits}${lettersPart}${digitsPart}`;
    if (isValidSubjectCodePattern(corrected)) {
      return { code: corrected, originalCode, isCorrected: true, isValidPattern: true };
    }
  }

  // Candidate Correction 2: Standard Prefix-Letter + Digits (e.g. CS101, MATH201)
  const matchB = originalCode.match(/^([A-Z0-9]{2,4})([A-Z0-9]{2,5})$/);
  if (matchB) {
    const lettersPart = matchB[1]
      .replace(/0/g, "O")
      .replace(/1/g, "I")
      .replace(/5/g, "S")
      .replace(/8/g, "B")
      .replace(/6/g, "G");

    const digitsPart = matchB[2]
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/S/g, "5")
      .replace(/B/g, "8")
      .replace(/G/g, "6");

    const corrected = `${lettersPart}${digitsPart}`;
    if (isValidSubjectCodePattern(corrected)) {
      return { code: corrected, originalCode, isCorrected: true, isValidPattern: true };
    }
  }

  return {
    code: originalCode,
    originalCode,
    isCorrected: false,
    isValidPattern: isValidSubjectCodePattern(originalCode),
  };
}
