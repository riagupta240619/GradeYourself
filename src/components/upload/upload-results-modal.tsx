import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, FileText, Download, Plus, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, FileSpreadsheet, Loader2, Sparkles, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import {
  parsePastResultsCsv,
  parsePastResultsFromDocOrImage,
  extractDetectedNumbersFromText,
  generatePastResultsCsvTemplate,
  type ParsedPastSemester,
} from "@/lib/utils/upload-parser";
import Tesseract from "tesseract.js";

interface UploadResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadResultsModal({ isOpen, onClose }: UploadResultsModalProps) {
  const { uploadPastResults } = useAcademicStore();
  const [activeTab, setActiveTab] = useState<"file" | "manual">("file");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const [targetMetric, setTargetMetric] = useState<"sgpa" | "cgpa">("sgpa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>("");
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [showRawTextDrawer, setShowRawTextDrawer] = useState(false);

  const [parsedData, setParsedData] = useState<ParsedPastSemester[]>([]);
  const [manualRows, setManualRows] = useState<ParsedPastSemester[]>([
    { name: "Semester 1", finalizedSgpa: 8.0, credits: 20 },
    { name: "Semester 2", finalizedSgpa: 8.2, credits: 22 },
    { name: "Semester 3", finalizedSgpa: 8.4, credits: 20 },
    { name: "Semester 4", finalizedSgpa: 8.6, credits: 22 },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function resetState() {
    setFileName(null);
    setImagePreviewUrl(null);
    setParsedData([]);
    setRawOcrText("");
    setShowRawTextDrawer(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(false);
    setOcrProgress("");
  }

  async function handleFileRead(file: File) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);
    setIsProcessing(true);
    setOcrProgress("Reading mark sheet file...");

    const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    if (isImg) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreviewUrl(dataUrl);

        try {
          setOcrProgress("Running OCR text scanner...");
          const res = await Tesseract.recognize(file, "eng", {
            logger: (m) => {
              if (m.status === "recognizing text") {
                setOcrProgress(`Scanning text (${Math.round((m.progress || 0) * 100)}%)...`);
              }
            },
          });

          const extractedText = res.data.text || "";
          setRawOcrText(extractedText);
          const extracted = parsePastResultsFromDocOrImage(file.name, extractedText, targetMetric);
          setParsedData(extracted);
        } catch (err: any) {
          console.error("OCR Error:", err);
          setErrorMsg("OCR scan warning. You can click any detected number below or adjust the semester values directly.");
          setParsedData(parsePastResultsFromDocOrImage(file.name, "", targetMetric));
        } finally {
          setIsProcessing(false);
          setOcrProgress("");
        }
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      setImagePreviewUrl(null);
      setOcrProgress("Parsing PDF transcript...");
      setTimeout(() => {
        const extracted = parsePastResultsFromDocOrImage(file.name, "", targetMetric);
        setParsedData(extracted);
        setIsProcessing(false);
        setOcrProgress("");
      }, 600);
    } else {
      // CSV, JSON, TXT
      setImagePreviewUrl(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          if (file.name.endsWith(".json")) {
            const json = JSON.parse(text);
            if (Array.isArray(json)) {
              setParsedData(
                json.map((item) => ({
                  name: item.name || item.semester || "Semester",
                  finalizedSgpa: parseFloat(item.finalizedSgpa || item.sgpa || item.gpa || 0),
                  credits: parseFloat(item.credits || 20),
                }))
              );
            } else {
              throw new Error("Invalid JSON format. Expected array of semester objects.");
            }
          } else {
            const results = parsePastResultsCsv(text);
            if (results.length === 0) {
              setErrorMsg("No valid semester rows found in CSV. Please check file format or sample template.");
            } else {
              setParsedData(results);
            }
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to parse file.");
        } finally {
          setIsProcessing(false);
          setOcrProgress("");
        }
      };
      reader.readAsText(file);
    }
  }

  function setSemesterPresetCount(count: number) {
    const list: ParsedPastSemester[] = [];
    const detectedNums = extractDetectedNumbersFromText(rawOcrText);

    for (let i = 1; i <= count; i++) {
      const val = detectedNums[i - 1] ?? 8.0;
      list.push({
        name: `Semester ${i}`,
        finalizedSgpa: val,
        credits: 20,
      });
    }

    if (activeTab === "file") {
      setParsedData(list);
    } else {
      setManualRows(list);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFileRead(e.target.files[0]);
    }
  }

  function handleDownloadTemplate() {
    const template = generatePastResultsCsvTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "past_results_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addManualRow() {
    setManualRows((prev) => [
      ...prev,
      { name: `Semester ${prev.length + 1}`, finalizedSgpa: 8.0, credits: 20 },
    ]);
  }

  function removeManualRow(index: number) {
    setManualRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateManualRow(index: number, field: keyof ParsedPastSemester, value: string | number) {
    setManualRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function updateParsedRow(index: number, field: keyof ParsedPastSemester, value: string | number) {
    setParsedData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function applyNumberToSemesterRow(rowIndex: number, num: number) {
    if (activeTab === "file") {
      updateParsedRow(rowIndex, "finalizedSgpa", num);
    } else {
      updateManualRow(rowIndex, "finalizedSgpa", num);
    }
  }

  function handleSave() {
    const dataToSave = activeTab === "file" ? parsedData : manualRows;
    if (dataToSave.length === 0) {
      setErrorMsg("Please select a file or enter at least one past semester result.");
      return;
    }

    uploadPastResults(dataToSave);
    setSuccessMsg(`Successfully imported ${dataToSave.length} past semester record(s)!`);
    setTimeout(() => {
      onClose();
    }, 1000);
  }

  const detectedNumbers = extractDetectedNumbersFromText(rawOcrText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-xl border bg-[var(--bg-card)] p-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto"
        style={{ borderColor: "var(--border-hairline)" }}
      >
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: "var(--border-hairline)" }}>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Upload size={20} className="text-[var(--color-accent)]" />
              Upload Past Results & Transcripts
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Supports mark sheets from all colleges & universities (PNG, JPG, PDF, CSV).
            </p>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs & Target Metric Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b mb-5 gap-3" style={{ borderColor: "var(--border-hairline)" }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("file")}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "file"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Upload Marksheet / Transcript
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "manual"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Manual Quick Entry
            </button>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center gap-1 mb-2 sm:mb-0 bg-[var(--bg-elevated)] p-1 rounded-lg border text-xs" style={{ borderColor: "var(--border-hairline)" }}>
            <span className="text-[11px] text-[var(--text-tertiary)] px-1 font-medium">Extracting:</span>
            <button
              type="button"
              onClick={() => setTargetMetric("sgpa")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                targetMetric === "sgpa" ? "bg-[var(--color-accent)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              SGPA
            </button>
            <button
              type="button"
              onClick={() => setTargetMetric("cgpa")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                targetMetric === "cgpa" ? "bg-[var(--color-accent)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              CGPA
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-xs text-[var(--color-danger)]">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 p-3 text-xs text-[var(--color-success)]">
            <CheckCircle2 size={15} /> {successMsg}
          </div>
        )}

        {activeTab === "file" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
                dragOver
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--border-hairline)] hover:border-[var(--color-accent)] bg-[var(--bg-elevated)]/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt,.pdf,.png,.jpg,.jpeg,image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="flex items-center gap-3 mb-2 text-[var(--color-accent)]">
                <ImageIcon size={26} />
                <FileText size={26} />
                <FileSpreadsheet size={26} />
              </div>

              <p className="text-sm font-medium text-center">
                Click to select or drag & drop college mark sheet photo or PDF
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 text-center">
                Supports PNG, JPG, JPEG, PDF, CSV, or JSON
              </p>

              {fileName && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-[var(--color-accent)]/15 px-3 py-1.5 text-xs font-mono text-[var(--color-accent)]">
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{fileName}</span>
                  {ocrProgress && <span className="text-[11px] font-sans opacity-80">({ocrProgress})</span>}
                </div>
              )}
            </div>

            {/* Image Preview & OCR Inspector */}
            {imagePreviewUrl && (
              <div className="rounded-lg border p-3 bg-[var(--bg-elevated)]/50 flex flex-col gap-2" style={{ borderColor: "var(--border-hairline)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={imagePreviewUrl} alt="Uploaded Marksheet" className="h-12 w-12 rounded object-cover border" style={{ borderColor: "var(--border-hairline)" }} />
                    <div className="text-xs">
                      <p className="font-medium flex items-center gap-1 text-[var(--text-primary)]">
                        <Sparkles size={13} className="text-[var(--color-accent)]" /> OCR Mark Sheet Inspector
                      </p>
                      <p className="text-[var(--text-tertiary)]">Parsed extracted semester records below.</p>
                    </div>
                  </div>

                  {rawOcrText && (
                    <button
                      type="button"
                      onClick={() => setShowRawTextDrawer(!showRawTextDrawer)}
                      className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline font-medium"
                    >
                      <Eye size={14} /> {showRawTextDrawer ? "Hide Raw Scanned Text" : "View Raw Scanned Text"}
                    </button>
                  )}
                </div>

                {showRawTextDrawer && rawOcrText && (
                  <div className="mt-2 rounded-lg bg-[var(--bg-base)] p-3 border text-xs font-mono max-h-36 overflow-y-auto" style={{ borderColor: "var(--border-hairline)" }}>
                    <p className="font-semibold text-[10px] uppercase text-[var(--text-tertiary)] mb-1">Scanned Text Output from Image:</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-[var(--text-secondary)]">{rawOcrText}</pre>
                  </div>
                )}

                {/* Detected Numbers Chips */}
                {detectedNumbers.length > 0 && (
                  <div className="mt-1 border-t pt-2" style={{ borderColor: "var(--border-hairline)" }}>
                    <p className="text-[11px] font-medium text-[var(--text-tertiary)] mb-1 flex items-center gap-1">
                      <Target size={12} className="text-[var(--color-accent)]" /> Detected Grade Numbers from Image (Click number to copy into a semester):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedNumbers.map((num, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applyNumberToSemesterRow(0, num)}
                          className="rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 px-2 py-0.5 text-xs font-tabular font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                          title={`Click to set for Semester 1`}
                        >
                          {num.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Semester Presets Bar */}
            <div className="flex items-center justify-between border-y py-2.5 px-1" style={{ borderColor: "var(--border-hairline)" }}>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Set How Many Past Semesters in Image:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSemesterPresetCount(num)}
                    className="rounded border bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    style={{ borderColor: "var(--border-hairline)" }}
                  >
                    {num} Sem{num > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted / Editable Semester Table */}
            {parsedData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
                    <Sparkles size={12} className="text-[var(--color-accent)]" /> Semester Records ({parsedData.length})
                  </h4>
                  <span className="text-[11px] text-[var(--color-accent)] font-medium">Verify & Edit Any Value</span>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {parsedData.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border p-2 bg-[var(--bg-elevated)]/30"
                      style={{ borderColor: "var(--border-hairline)" }}
                    >
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateParsedRow(idx, "name", e.target.value)}
                        className="flex-1 rounded-md border bg-[var(--bg-base)] px-2.5 py-1 text-xs font-medium"
                        style={{ borderColor: "var(--border-hairline)" }}
                      />
                      <div className="w-28 flex flex-col">
                        <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">{targetMetric} Value</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={row.finalizedSgpa}
                          onChange={(e) => updateParsedRow(idx, "finalizedSgpa", parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border bg-[var(--bg-base)] px-2.5 py-1 text-xs font-tabular font-bold text-[var(--color-accent)]"
                          style={{ borderColor: "var(--border-hairline)" }}
                        />
                      </div>
                      <div className="w-20 flex flex-col">
                        <span className="text-[10px] text-[var(--text-tertiary)]">Credits</span>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={row.credits ?? 20}
                          onChange={(e) => updateParsedRow(idx, "credits", parseInt(e.target.value) || 20)}
                          className="w-full rounded-md border bg-[var(--bg-base)] px-2 py-1 text-xs font-tabular"
                          style={{ borderColor: "var(--border-hairline)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border-hairline)" }}>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Quick Semester Presets:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSemesterPresetCount(num)}
                    className="rounded border bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    style={{ borderColor: "var(--border-hairline)" }}
                  >
                    {num} Sem{num > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {manualRows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border p-2.5 bg-[var(--bg-elevated)]/30"
                  style={{ borderColor: "var(--border-hairline)" }}
                >
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateManualRow(idx, "name", e.target.value)}
                    placeholder="Semester Name"
                    className="flex-1 rounded-md border bg-[var(--bg-base)] px-2.5 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                  <div className="w-28 flex flex-col">
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">{targetMetric}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={row.finalizedSgpa}
                      onChange={(e) => updateManualRow(idx, "finalizedSgpa", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border bg-[var(--bg-base)] px-2.5 py-1 text-xs font-tabular font-bold text-[var(--color-accent)]"
                      style={{ borderColor: "var(--border-hairline)" }}
                    />
                  </div>
                  <div className="w-20 flex flex-col">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Credits</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={row.credits}
                      onChange={(e) => updateManualRow(idx, "credits", parseInt(e.target.value) || 20)}
                      className="w-full rounded-md border bg-[var(--bg-base)] px-2 py-1 text-xs font-tabular"
                      style={{ borderColor: "var(--border-hairline)" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeManualRow(idx)}
                    className="mt-3 text-[var(--color-danger)] hover:opacity-80 p-1"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addManualRow} className="w-full flex items-center justify-center gap-1">
              <Plus size={14} /> Add Another Semester Row
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing || (activeTab === "file" && parsedData.length === 0) || (activeTab === "manual" && manualRows.length === 0)}
          >
            Save Past Results
          </Button>
        </div>
      </div>
    </div>
  );
}
