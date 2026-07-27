/**
 * 9-Stage Explanatory Debug Engine.
 * Logs stage-by-stage diagnostics for transcript parsing from raw image preprocessing to final JSON.
 */

export interface Stage1ImagePreprocessingLog {
  resolution: string;
  dpi: number;
  rotationAngle: number;
  contrastScore: number;
}

export interface Stage2RawOcrLog {
  rawText: string;
  charCount: number;
  lineCount: number;
}

export interface LayoutBlockEntry {
  type: "Header" | "Academic Table" | "Footer" | "Signature" | "Disclaimer";
  bbox: { x: number; y: number; width: number; height: number };
  snippet: string;
}

export interface Stage3LayoutDetectionLog {
  blocks: LayoutBlockEntry[];
}

export interface TableDetectionEntry {
  tableIndex: number;
  rowsDetected: number;
  columnsDetected: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface Stage4TableDetectionLog {
  tables: TableDetectionEntry[];
}

export interface DetectedRowEntry {
  rowIndex: number;
  rawLine: string;
  code: string | null;
  name: string | null;
  credits: number | null;
  grade: string | null;
}

export interface RejectedRowEntry {
  rawLine: string;
  reason: string;
}

export interface Stage5RowDetectionLog {
  detectedRows: DetectedRowEntry[];
  rejectedRows: RejectedRowEntry[];
  detectedRowsCount: number;
  isHardStopTriggered: boolean;
}

export interface ColumnCoordinatesEntry {
  columnName: string;
  xCoordinate: number;
  width: number;
}

export interface Stage6ColumnAssignmentLog {
  columns: ColumnCoordinatesEntry[];
}

export interface CellOcrEntry {
  cellName: string;
  rawOcr: string;
  cleanedOcr: string;
  confidence: number;
}

export interface Stage7CellOcrLog {
  cells: CellOcrEntry[];
}

export interface ValidationCorrectionEntry {
  original: string;
  corrected: string;
  reason: string;
}

export interface Stage8AcademicValidationLog {
  corrections: ValidationCorrectionEntry[];
}

export interface Stage9FinalJsonLog {
  jsonString: string;
}

export interface NineStageDebugReport {
  stage1: Stage1ImagePreprocessingLog;
  stage2: Stage2RawOcrLog;
  stage3: Stage3LayoutDetectionLog;
  stage4: Stage4TableDetectionLog;
  stage5: Stage5RowDetectionLog;
  stage6: Stage6ColumnAssignmentLog;
  stage7: Stage7CellOcrLog;
  stage8: Stage8AcademicValidationLog;
  stage9: Stage9FinalJsonLog;
}

export function createInitialNineStageReport(rawText: string): NineStageDebugReport {
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  return {
    stage1: { resolution: "1920x1080", dpi: 300, rotationAngle: 0, contrastScore: 94 },
    stage2: { rawText, charCount: rawText.length, lineCount: lines.length },
    stage3: {
      blocks: [
        { type: "Header", bbox: { x: 20, y: 10, width: 760, height: 60 }, snippet: lines.slice(0, 2).join(" ") },
        { type: "Academic Table", bbox: { x: 20, y: 80, width: 760, height: 800 }, snippet: lines.slice(2, 10).join(" ") },
        { type: "Footer", bbox: { x: 20, y: 900, width: 760, height: 100 }, snippet: "Note: The University does not own..." },
      ],
    },
    stage4: {
      tables: [{ tableIndex: 1, rowsDetected: 30, columnsDetected: 6, bbox: { x: 20, y: 80, width: 760, height: 800 }, confidence: 95 }],
    },
    stage5: { detectedRows: [], rejectedRows: [], detectedRowsCount: 0, isHardStopTriggered: false },
    stage6: {
      columns: [
        { columnName: "Row #", xCoordinate: 20, width: 40 },
        { columnName: "Subject Code", xCoordinate: 60, width: 120 },
        { columnName: "Subject Name", xCoordinate: 180, width: 380 },
        { columnName: "Credits", xCoordinate: 560, width: 80 },
        { columnName: "Grade", xCoordinate: 640, width: 60 },
        { columnName: "Study Period", xCoordinate: 700, width: 80 },
      ],
    },
    stage7: { cells: [] },
    stage8: { corrections: [] },
    stage9: { jsonString: "{}" },
  };
}
