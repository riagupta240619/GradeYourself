import { useState, useEffect } from "react";
import { FolderOpen, X, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

interface UploaderProps {
  onSelectSemester: (semester: { id: string; name: string }) => void;
  onSelectSubject: (subject: { id: string; name: string }) => void;
  onClose: () => void;
}

export function Uploader({ onSelectSemester, onSelectSubject, onClose }: UploaderProps) {
  const [selectedSemester, setSelectedSemester] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [semesters, setSemesters] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { openToast } = useToast();

  // Fetch semesters from backend
  useEffect(() => {
    api
      .get("/api/semesters")
      .then((res) => setSemesters(res.data ?? []))
      .catch(() => {
        // Fallback placeholder semesters so the UI isn't empty
        setSemesters([
          { id: "sem-1", name: "Semester 1" },
          { id: "sem-2", name: "Semester 2" },
        ]);
      });
  }, []);

  // Fetch subjects when semester changes
  useEffect(() => {
    if (!selectedSemester) {
      setSubjects([]);
      setSelectedSubject(null);
      return;
    }
    api
      .get("/api/subjects", { params: { semesterId: selectedSemester.id } })
      .then((res) => setSubjects(res.data ?? []))
      .catch(() => {
        setSubjects([
          { id: "sub-1", name: "Data Structures" },
          { id: "sub-2", name: "Operating Systems" },
        ]);
      });
  }, [selectedSemester]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !selectedSemester || !selectedSubject) {
      openToast({
        title: "Error",
        description: "Please select a semester, subject, and file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("semesterId", selectedSemester.id);
      formData.append("subjectId", selectedSubject.id);
      formData.append("tags", tags.join(","));
      formData.append("isPublic", "false");

      await api.post("/api/study-material/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      openToast({ title: "Success", description: "Files uploaded successfully" });
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      openToast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-background border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-semibold text-lg">Upload Materials</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Semester Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select
              value={selectedSemester?.id ?? ""}
              onChange={(e) => {
                const sem = semesters.find((s) => s.id === e.target.value) ?? null;
                setSelectedSemester(sem);
                if (sem) onSelectSemester(sem);
              }}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">— Select Semester —</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          {selectedSemester && (
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                value={selectedSubject?.id ?? ""}
                onChange={(e) => {
                  const subj = subjects.find((s) => s.id === e.target.value) ?? null;
                  setSelectedSubject(subj);
                  if (subj) onSelectSubject(subj);
                }}
                className="w-full bg-muted/30 rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">— Select Subject —</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="lecture, notes, assignment"
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              className="w-full bg-muted/30 rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          {/* File Upload */}
          <div
            className={cn(
              "p-6 rounded-lg border-2 border-dashed cursor-pointer text-center transition-colors",
              file
                ? "border-purple-500 bg-purple-500/5"
                : "border-border hover:border-purple-400 hover:bg-muted/20"
            )}
            onClick={() => document.getElementById("uploader-file-input")?.click()}
          >
            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {file.name}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag &amp; drop or click to browse
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">PDF, PPT, images, text files</p>
            <input
              type="file"
              id="uploader-file-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.md"
            />
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}