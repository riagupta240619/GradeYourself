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
}

/**
 * OCR Engine strictly responsible ONLY for extracting raw text from transcripts.
 * Performs zero structure decisions or positional layout matching.
 */
export const OcrEngine = {
  /**
   * Extracts raw text from an uploaded transcript file (Image or PDF).
   */
  async extractRawText(
    file: File,
    onProgress?: (info: OcrExtractionProgress) => void
  ): Promise<OcrResult> {
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    if (!isImage && !isPdf) {
      // For CSV/TXT/JSON plain text files, return direct text content
      const text = await file.text();
      return {
        rawText: text,
        confidence: 100,
        lineCount: text.split("\n").length,
        wordCount: text.trim().split(/\s+/).length,
      };
    }

    onProgress?.({ status: "Preprocessing document image...", progress: 0.1 });

    let imageToScan: string | File = file;
    let preprocessedUrl: string | undefined;

    if (isImage) {
      try {
        const prep = await preprocessTranscriptImage(file, {
          contrast: 1.4,
          binarize: true,
          denoise: true,
        });
        imageToScan = prep.processedDataUrl;
        preprocessedUrl = prep.processedDataUrl;
      } catch (err) {
        console.warn("Preprocessing notice: proceeding with original file format", err);
      }
    }

    onProgress?.({ status: "Initializing OCR scanner...", progress: 0.2 });

    const res = await Tesseract.recognize(imageToScan, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({
            status: `Recognizing text (${Math.round((m.progress || 0) * 100)}%)`,
            progress: 0.2 + (m.progress || 0) * 0.75,
          });
        }
      },
    });

    onProgress?.({ status: "Raw text extraction complete", progress: 1.0 });

    const extractedRaw = res.data.text || "";
    const cleanedText = cleanOcrTextArtifacts(extractedRaw);
    const lines = cleanedText.split("\n").filter((l) => l.trim().length > 0);
    const words = cleanedText.trim().split(/\s+/).filter(Boolean);

    return {
      rawText: cleanedText,
      confidence: res.data.confidence || 85,
      preprocessedImageUrl: preprocessedUrl,
      lineCount: lines.length,
      wordCount: words.length,
    };
  },
};

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
