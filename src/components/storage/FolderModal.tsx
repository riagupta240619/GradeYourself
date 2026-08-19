import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FolderModalProps {
  onConfirm: (folderName: string, subjectId: string) => void;
  onClose: () => void;
  subjectId?: string;
  initialName?: string;
}

export function FolderModal({
  onConfirm,
  onClose,
  subjectId = "",
  initialName,
}: FolderModalProps) {
  const [folderName, setFolderName] = useState(initialName ?? "");
  const { openToast } = useToast();

  const handleSave = () => {
    const trimmed = folderName.trim();
    if (!trimmed) {
      openToast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    onConfirm(trimmed, subjectId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-background border rounded-lg p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-semibold text-lg">
            {initialName ? "Rename Folder" : "New Folder"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="e.g. Lecture Notes"
              maxLength={50}
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            {initialName ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}