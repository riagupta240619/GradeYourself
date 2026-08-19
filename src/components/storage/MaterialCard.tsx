import { FileText, File, Image, Download, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface MaterialCardProps {
  material: {
    id: string;
    title: string;
    fileName: string;
    fileType: "pdf" | "ppt" | "image" | "text" | "other";
    fileSize: number;
    downloadCount: number;
    tags: string[];
    semesterName?: string;
    subjectName?: string;
    folderName?: string;
    isPublic?: boolean;
  };
  onDownload?: () => void;
  onDelete?: () => void;
}

function getFileTypeBadgeColor(
  fileType: "pdf" | "ppt" | "image" | "text" | "other"
): string {
  switch (fileType) {
    case "pdf":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "ppt":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "image":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
    case "text":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function MaterialCard({ material, onDownload, onDelete }: MaterialCardProps) {
  const fileTypeLabels: Record<"pdf" | "ppt" | "image" | "text" | "other", string> = {
    pdf: "PDF",
    ppt: "PPT",
    image: "IMG",
    text: "TXT",
    other: "File",
  };

  const fileIcon =
    material.fileType === "pdf" ? (
      <FileText className="h-5 w-5 text-purple-500" />
    ) : material.fileType === "ppt" ? (
      <FileText className="h-5 w-5 text-orange-500" />
    ) : material.fileType === "image" ? (
      <Image className="h-5 w-5 text-cyan-500" />
    ) : (
      <File className="h-5 w-5 text-gray-500" />
    );

  const iconBg =
    material.fileType === "pdf"
      ? "bg-purple-500/10"
      : material.fileType === "ppt"
      ? "bg-orange-500/10"
      : material.fileType === "image"
      ? "bg-cyan-500/10"
      : "bg-gray-500/10";

  return (
    <div
      className="group relative border rounded-lg p-4 hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={() => onDownload?.()}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            iconBg
          )}
        >
          {fileIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate text-sm">{material.title}</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {material.fileName}
          </p>
          {(material.semesterName || material.subjectName) && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {[material.semesterName, material.subjectName]
                .filter(Boolean)
                .join(" › ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span
          className={cn(
            "text-[10px] font-medium rounded px-2 py-0.5",
            getFileTypeBadgeColor(material.fileType)
          )}
        >
          {fileTypeLabels[material.fileType]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {material.downloadCount} ↓
        </span>
      </div>

      {/* Action buttons on hover */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this material?")) onDelete();
            }}
            className="p-1 rounded-md hover:bg-muted transition-colors text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}