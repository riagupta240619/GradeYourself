/**
 * Document Region Classifier & Footer Detector Engine.
 * Classifies transcript page regions into Header, Academic Table, Footer, Note, Disclaimer, Signature.
 * Ensures footers, disclaimers, and notes NEVER get parsed as academic subject rows.
 */

export type DocumentRegionType =
  | "header"
  | "academicTable"
  | "footer"
  | "note"
  | "disclaimer"
  | "signature"
  | "stamp";

const FOOTER_DISCLAIMER_PATTERNS = [
  /^(?:note|notes|instruction|instructions|declaration|abbreviations|remarks)\b/i,
  /^the university does not own/i,
  /^documents in the examination department/i,
  /^this is a computer generated/i,
  /^controller of examinations/i,
  /^page\s*[0-9]+\s*of\s*[0-9]+/i,
  /^abbreviations\s*used/i,
  /^disclaimer\b/i,
];

/**
 * Checks whether a text line indicates the start of a Footer, Note, or Disclaimer section.
 * When true, the parser should immediately stop subject extraction for that section.
 */
export function isFooterOrDisclaimerBoundary(line: string): boolean {
  if (!line || line.trim().length === 0) return false;
  const clean = line.trim();

  for (const pattern of FOOTER_DISCLAIMER_PATTERNS) {
    if (pattern.test(clean)) {
      return true;
    }
  }

  return false;
}

/**
 * Classifies a page line into its functional document region.
 */
export function classifyDocumentRegion(line: string): DocumentRegionType {
  if (!line || line.trim().length === 0) return "academicTable";
  const clean = line.trim();

  if (isFooterOrDisclaimerBoundary(clean)) {
    if (/^note|^instruction|^abbreviation/i.test(clean)) return "note";
    if (/^disclaimer|^the university/i.test(clean)) return "disclaimer";
    if (/^controller|^signature/i.test(clean)) return "signature";
    return "footer";
  }

  if (/\b(?:university|institute|college|degree|b\.tech|transcript|mark\s*sheet)\b/i.test(clean)) {
    return "header";
  }

  return "academicTable";
}
