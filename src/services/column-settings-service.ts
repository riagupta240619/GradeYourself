export type ColumnKey =
  | "subjectName"
  | "subjectCode"
  | "credits"
  | "marksObtained"
  | "maxMarks"
  | "scorePct"
  | "letterGrade"
  | "status"
  | "gradePoint"
  | "remarks";

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
  align?: "left" | "center" | "right";
}

export const DEFAULT_TRANSCRIPT_COLUMNS: ColumnConfig[] = [
  { key: "subjectName", label: "Subject Name", visible: true, align: "left" },
  { key: "subjectCode", label: "Subject Code", visible: true, align: "left" },
  { key: "credits", label: "Credits", visible: true, align: "left" },
  { key: "marksObtained", label: "Marks Obtained", visible: true, align: "left" },
  { key: "maxMarks", label: "Max Marks", visible: true, align: "left" },
  { key: "scorePct", label: "Score %", visible: true, align: "left" },
  { key: "letterGrade", label: "Letter Grade", visible: true, align: "right" },
  { key: "status", label: "Status", visible: true, align: "left" },
  { key: "gradePoint", label: "Grade Points", visible: true, align: "right" },
  { key: "remarks", label: "Remarks", visible: true, align: "right" },
];

const STORAGE_KEY = "gradewise_transcript_columns";

export const ColumnSettingsService = {
  getTranscriptColumnSettings(): ColumnConfig[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_TRANSCRIPT_COLUMNS;
      const parsed: ColumnConfig[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_TRANSCRIPT_COLUMNS;
      }

      // Merge saved configuration with defaults in case new columns were added
      const savedKeys = new Set(parsed.map((c) => c.key));
      const missingDefaults = DEFAULT_TRANSCRIPT_COLUMNS.filter(
        (def) => !savedKeys.has(def.key),
      );

      return [...parsed, ...missingDefaults];
    } catch (e) {
      console.error("Failed to load transcript column settings:", e);
      return DEFAULT_TRANSCRIPT_COLUMNS;
    }
  },

  saveTranscriptColumnSettings(columns: ColumnConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
      window.dispatchEvent(
        new CustomEvent("transcript-columns-updated", { detail: columns }),
      );
    } catch (e) {
      console.error("Failed to save transcript column settings:", e);
    }
  },

  restoreDefaultTranscriptColumns(): ColumnConfig[] {
    this.saveTranscriptColumnSettings(DEFAULT_TRANSCRIPT_COLUMNS);
    return DEFAULT_TRANSCRIPT_COLUMNS;
  },
};
