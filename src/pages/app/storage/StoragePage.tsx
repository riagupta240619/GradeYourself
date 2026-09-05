import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FileText,
  Plus,
  Star,
  Link as LinkIcon,
  Trash2,
  Download,
  Eye,
  Upload,
  Search,
  Grid,
  List,
  FolderPlus,
  RefreshCw,
  HardDrive,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Edit2,
  FolderSymlink,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface StorageFileItem {
  _id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folder?: string | null;
  isFavorite: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  downloadUrl?: string;
}

interface StorageFolderItem {
  _id: string;
  name: string;
  parentFolder?: string | null;
}

interface SavedLinkItem {
  _id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  createdAt: string;
}

interface UniversalFavoriteItem {
  _id: string;
  itemType: string;
  title: string;
  url?: string;
  category?: string;
  description?: string;
  createdAt: string;
}

export function StoragePage() {
  const navigate = useNavigate();

  // Navigation State
  const [activeSection, setActiveSection] = useState<"files" | "favorites" | "links" | "trash">("files");
  const [currentFolder, setCurrentFolder] = useState<StorageFolderItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [folders, setFolders] = useState<StorageFolderItem[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLinkItem[]>([]);
  const [favorites, setFavorites] = useState<UniversalFavoriteItem[]>([]);
  const [stats, setStats] = useState({ usedStorage: 0, fileCount: 0, folderCount: 0, totalQuota: 5 * 1024 * 1024 * 1024 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<StorageFileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageFileItem | null>(null);

  // Form States
  const [newFolderName, setNewFolderName] = useState("");
  const [linkForm, setLinkForm] = useState({ title: "", url: "", category: "DSA", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCustomName, setUploadCustomName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Rename File State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Fetch all storage data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [filesRes, foldersRes, statsRes, linksRes, favsRes] = await Promise.all([
        api.get(`/storage/files`, {
          params: {
            view: activeSection,
            folder: activeSection === "files" ? (currentFolder ? currentFolder._id : "root") : undefined,
            search: searchQuery || undefined,
          },
        }),
        api.get("/storage/folders"),
        api.get("/storage/stats"),
        api.get("/storage/links"),
        api.get("/favorites"),
      ]);

      setFiles(filesRes.data.files || []);
      setFolders(foldersRes.data.folders || []);
      setStats(statsRes.data || { usedStorage: 0, totalQuota: 5 * 1024 * 1024 * 1024 });
      setSavedLinks(linksRes.data.links || []);
      setFavorites(favsRes.data.favorites || []);
    } catch (err) {
      console.error("Storage load error:", err);
      toast.error("Failed to load personal storage");
    } finally {
      setLoading(false);
    }
  }, [activeSection, currentFolder, searchQuery]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadCustomName.trim()) {
        formData.append("customName", uploadCustomName.trim());
      }
      if (currentFolder) {
        formData.append("folderId", currentFolder._id);
      }

      await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("File uploaded to My Storage");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCustomName("");
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post("/storage/folders", {
        name: newFolderName.trim(),
        parentFolder: currentFolder ? currentFolder._id : null,
      });
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName("");
      setShowFolderModal(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create folder");
    }
  };

  // Create Link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title || !linkForm.url) {
      toast.error("Title and URL are required");
      return;
    }

    try {
      await api.post("/storage/links", linkForm);
      toast.success("Saved link created");
      setLinkForm({ title: "", url: "", category: "DSA", description: "" });
      setShowLinkModal(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save link");
    }
  };

  // Delete Folder
  const handleDeleteFolder = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete folder "${name}"? Contained files will be moved to My Storage root.`
      )
    ) {
      return;
    }
    try {
      const res = await api.delete(`/storage/folders/${id}`);
      toast.success(res.data.message || `Folder "${name}" deleted`);
      if (currentFolder?._id === id) {
        setCurrentFolder(null);
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete folder");
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (file: StorageFileItem) => {
    try {
      await api.patch(`/storage/files/${file._id}`, {
        isFavorite: !file.isFavorite,
      });
      toast.success(!file.isFavorite ? "Saved to Favorites" : "Removed from Favorites");
      await fetchData();
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  // Rename File
  const handleRenameSubmit = async (id: string) => {
    if (!renameValue.trim()) {
      setEditingFileId(null);
      return;
    }
    try {
      await api.patch(`/storage/files/${id}`, { name: renameValue.trim() });
      toast.success("File renamed");
      setEditingFileId(null);
      await fetchData();
    } catch (err) {
      toast.error("Failed to rename file");
    }
  };

  // Move File to Folder
  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    try {
      await api.patch(`/storage/files/${fileId}`, { folderId: targetFolderId });
      toast.success("File moved");
      setShowMoveModal(null);
      await fetchData();
    } catch (err) {
      toast.error("Failed to move file");
    }
  };

  // Move to Trash
  const handleTrashFile = async (id: string) => {
    try {
      await api.delete(`/storage/files/${id}`);
      toast.success("Moved to Trash");
      await fetchData();
    } catch (err) {
      toast.error("Failed to delete file");
    }
  };

  // Restore from Trash
  const handleRestoreFile = async (id: string) => {
    try {
      await api.post(`/storage/files/${id}/restore`);
      toast.success("File restored");
      await fetchData();
    } catch (err) {
      toast.error("Failed to restore file");
    }
  };

  // Delete Permanently
  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this file? This cannot be undone.")) return;
    try {
      await api.delete(`/storage/files/${id}/permanent`);
      toast.success("File permanently deleted");
      await fetchData();
    } catch (err) {
      toast.error("Failed to permanently delete file");
    }
  };

  // Delete Saved Link
  const handleDeleteLink = async (id: string) => {
    try {
      await api.delete(`/storage/links/${id}`);
      toast.success("Saved link removed");
      await fetchData();
    } catch (err) {
      toast.error("Failed to remove link");
    }
  };

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // File icon resolver
  const getFileIcon = (mime: string, name: string) => {
    if (mime.includes("pdf") || name.endsWith(".pdf")) return <FileText className="text-red-500" size={24} />;
    if (mime.includes("image") || /\.(png|jpg|jpeg|webp|gif)$/i.test(name)) return <ImageIcon className="text-blue-500" size={24} />;
    if (mime.includes("sheet") || /\.(csv|xlsx|xls)$/i.test(name)) return <FileSpreadsheet className="text-emerald-500" size={24} />;
    if (mime.includes("javascript") || mime.includes("json") || /\.(ts|tsx|js|py|java|cpp)$/i.test(name))
      return <FileCode className="text-purple-500" size={24} />;
    return <FileText className="text-gray-400" size={24} />;
  };

  const usedPercentage = Math.min(100, Number(((stats.usedStorage / stats.totalQuota) * 100).toFixed(1)));

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <HardDrive size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                My Storage
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Personal cloud storage workspace for study materials, interview prep docs, coding sheets & favorites.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFolderModal(true)}
            className="border-[var(--border)] text-xs"
          >
            <FolderPlus size={14} className="mr-1.5 text-purple-600" />
            New Folder
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkModal(true)}
            className="border-[var(--border)] text-xs"
          >
            <LinkIcon size={14} className="mr-1.5 text-blue-600" />
            Save Link
          </Button>

          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
          >
            <Upload size={14} className="mr-1.5" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Main Storage Layout (Sidebar + Explorer) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Navigation Tree & Quota */}
        <div className="space-y-4 lg:col-span-1">
          {/* Navigation Card */}
          <div className="surface-card rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-2 block">
              Folders & Storage
            </span>

            <button
              onClick={() => {
                setActiveSection("files");
                setCurrentFolder(null);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                activeSection === "files" && !currentFolder
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Folder size={16} />
                <span>All Files (Root)</span>
              </div>
              <span className="text-[10px] opacity-80">{stats.fileCount}</span>
            </button>

            {/* User Folders */}
            <div className="pl-4 py-1 space-y-0.5 border-l border-[var(--border)] ml-4">
              {folders.map((f) => (
                <div
                  key={f._id}
                  className="group/item flex items-center justify-between rounded-lg hover:bg-[var(--bg-surface-elevated)] pr-1"
                >
                  <button
                    onClick={() => {
                      setActiveSection("files");
                      setCurrentFolder(f);
                    }}
                    className={cn(
                      "flex items-center gap-2 truncate flex-1 px-2.5 py-1.5 text-xs text-left transition",
                      currentFolder?._id === f._id && activeSection === "files"
                        ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold rounded-lg"
                        : "text-[var(--text-secondary)]"
                    )}
                  >
                    <Folder size={14} className="text-purple-500 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(f._id, f.name);
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-red-500 rounded transition"
                    title="Delete folder"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--border)] mt-2">
              <button
                onClick={() => {
                  setActiveSection("favorites");
                  setCurrentFolder(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  activeSection === "favorites"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Star size={16} className={activeSection === "favorites" ? "text-white" : "text-amber-500"} />
                  <span>Favorites</span>
                </div>
                <span className="text-[10px] opacity-80">{favorites.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection("links");
                  setCurrentFolder(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  activeSection === "links"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <LinkIcon size={16} className={activeSection === "links" ? "text-white" : "text-blue-500"} />
                  <span>Saved Links</span>
                </div>
                <span className="text-[10px] opacity-80">{savedLinks.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection("trash");
                  setCurrentFolder(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  activeSection === "trash"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 size={16} className={activeSection === "trash" ? "text-white" : "text-red-400"} />
                  <span>Trash</span>
                </div>
              </button>
            </div>
          </div>

          {/* Storage Quota Card */}
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[var(--text-primary)]">Storage Used</span>
              <span className="text-[var(--text-tertiary)]">{usedPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                style={{ width: `${Math.max(2, usedPercentage)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
              {formatBytes(stats.usedStorage)} of {formatBytes(stats.totalQuota)} used
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="space-y-4 lg:col-span-3">
          {/* Controls Bar: Breadcrumb + Search + View toggle */}
          <div className="surface-card rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <button
                onClick={() => {
                  setActiveSection("files");
                  setCurrentFolder(null);
                }}
                className="font-medium hover:text-purple-600"
              >
                My Storage
              </button>
              {currentFolder && (
                <>
                  <ChevronRight size={13} className="text-[var(--text-tertiary)]" />
                  <span className="font-bold text-[var(--text-primary)]">{currentFolder.name}</span>
                  <button
                    onClick={() => handleDeleteFolder(currentFolder._id, currentFolder.name)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition ml-2"
                    title="Delete this folder"
                  >
                    <Trash2 size={12} /> Delete Folder
                  </button>
                </>
              )}
              {activeSection !== "files" && (
                <>
                  <ChevronRight size={13} className="text-[var(--text-tertiary)]" />
                  <span className="font-bold text-[var(--text-primary)] capitalize">{activeSection}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <div className="relative flex-1 sm:flex-initial min-w-[140px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600 w-full sm:w-56"
                />
              </div>

              <div className="flex rounded-xl border border-[var(--border)] p-0.5 bg-[var(--bg-surface-elevated)]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-1.5 text-[var(--text-secondary)] transition",
                    viewMode === "grid" && "bg-[var(--bg-surface)] text-purple-600 shadow-xs"
                  )}
                  title="Grid View"
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg p-1.5 text-[var(--text-secondary)] transition",
                    viewMode === "list" && "bg-[var(--bg-surface)] text-purple-600 shadow-xs"
                  )}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-[var(--border)] p-2 text-xs"
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {/* VIEW: Saved Links View */}
          {activeSection === "links" ? (
            <div className="surface-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Saved Study Links</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Curated links to sheets, roadmaps, and interview references.</p>
                </div>
                <Button size="sm" onClick={() => setShowLinkModal(true)} className="bg-purple-600 text-xs text-white">
                  <Plus size={14} className="mr-1" /> Add Link
                </Button>
              </div>

              {savedLinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-xs text-[var(--text-tertiary)]">
                  <LinkIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No saved links yet. Click "Save Link" to bookmark resources like Striver Sheet or NeetCode!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {savedLinks.map((link) => (
                    <div
                      key={link._id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 flex flex-col justify-between hover:border-purple-500/40 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[10px] font-bold">
                            {link.category || "General"}
                          </span>
                          <button
                            onClick={() => handleDeleteLink(link._id)}
                            className="text-[var(--text-tertiary)] hover:text-red-500 p-1"
                            title="Remove Link"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <h4 className="mt-2 font-semibold text-xs text-[var(--text-primary)] line-clamp-1">{link.title}</h4>
                        {link.description && (
                          <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">{link.description}</p>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono truncate max-w-[180px]">
                          {link.url}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline"
                        >
                          Visit <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeSection === "favorites" ? (
            /* VIEW: Universal Favorites */
            <div className="surface-card rounded-2xl p-6">
              <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">Universal Favorites</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Saved files, links, interview questions, and learning sheets in one unified workspace.
              </p>

              {favorites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-xs text-[var(--text-tertiary)]">
                  <Star className="mx-auto h-8 w-8 mb-2 opacity-50 text-amber-500" />
                  No favorites saved yet. Star any file or interview question to see it here!
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map((fav) => (
                    <div
                      key={fav._id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 hover:border-purple-500/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Star size={16} className="text-amber-500 shrink-0 fill-amber-500" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-xs text-[var(--text-primary)]">{fav.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                            <span className="rounded bg-purple-500/10 text-purple-600 px-1.5 py-0.2 capitalize">
                              {fav.itemType.replace("_", " ")}
                            </span>
                            <span>• {fav.category || "General"}</span>
                          </div>
                        </div>
                      </div>
                      {fav.url && (
                        <a
                          href={fav.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-purple-600 hover:underline inline-flex items-center gap-1 shrink-0 ml-3"
                        >
                          Open <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* VIEW: File Explorer (Files & Trash) */
            <div className="space-y-4">
              {/* Folder list when in Files root */}
              {activeSection === "files" && !currentFolder && folders.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {folders.map((f) => (
                    <div
                      key={f._id}
                      className="surface-card rounded-xl p-3.5 flex items-center justify-between gap-2 hover:border-purple-500/40 transition group"
                    >
                      <button
                        onClick={() => setCurrentFolder(f)}
                        className="flex items-center gap-3 text-left min-w-0 flex-1"
                      >
                        <Folder className="h-6 w-6 text-purple-600 group-hover:scale-105 transition-transform shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[var(--text-primary)] truncate">{f.name}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">Folder</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(f._id, f.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        title="Delete folder"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Files Grid or List */}
              {files.length === 0 ? (
                <div className="surface-card rounded-2xl p-12 text-center">
                  <HardDrive className="mx-auto h-10 w-10 text-[var(--text-tertiary)] opacity-60" />
                  <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                    {activeSection === "trash" ? "Trash is Empty" : "No files in this location"}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    {activeSection === "trash"
                      ? "Deleted files will appear here before permanent deletion."
                      : "Upload lecture notes, PDFs, assignments, or study sheets."}
                  </p>
                  {activeSection === "files" && (
                    <Button
                      size="sm"
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 bg-purple-600 text-xs text-white"
                    >
                      <Upload size={14} className="mr-1" />
                      Upload Your First File
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((file) => (
                    <div
                      key={file._id}
                      className="surface-card rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow group relative border-[var(--border)]"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(file.mimeType, file.name)}
                          <div className="min-w-0">
                            {editingFileId === file._id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="rounded border border-purple-500 bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-hidden"
                                />
                                <button
                                  onClick={() => handleRenameSubmit(file._id)}
                                  className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            ) : (
                              <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate" title={file.name}>
                                {file.name}
                              </h4>
                            )}
                            <p className="text-[10px] text-[var(--text-tertiary)]">
                              {formatBytes(file.size)} • {new Date(file.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Favorite Button */}
                        {!file.isDeleted && (
                          <button
                            onClick={() => handleToggleFavorite(file)}
                            className="text-[var(--text-tertiary)] hover:text-amber-500 p-1"
                            title={file.isFavorite ? "Unfavorite" : "Favorite"}
                          >
                            <Star
                              size={15}
                              className={file.isFavorite ? "text-amber-500 fill-amber-500" : ""}
                            />
                          </button>
                        )}
                      </div>

                      {/* PDF Quiz generator shortcut */}
                      {file.name.toLowerCase().endsWith(".pdf") && !file.isDeleted && (
                        <button
                          onClick={() => navigate(`/app/quiz?fileId=${file._id}&title=${encodeURIComponent(file.name)}`)}
                          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 py-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                        >
                          <Sparkles size={13} />
                          <span>Generate Quiz from this PDF</span>
                        </button>
                      )}

                      {/* Card Footer Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
                        {file.isDeleted ? (
                          <div className="flex items-center gap-2 w-full justify-end">
                            <button
                              onClick={() => handleRestoreFile(file._id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                            >
                              <RotateCcw size={12} /> Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(file._id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline ml-2"
                            >
                              <Trash2 size={12} /> Delete Forever
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                                title="Preview"
                              >
                                <Eye size={14} />
                              </button>
                              <a
                                href={`/api/storage/files/${file._id}/content?download=true`}
                                download
                                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                              <button
                                onClick={() => {
                                  setEditingFileId(file._id);
                                  setRenameValue(file.name);
                                }}
                                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                                title="Rename"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setShowMoveModal(file)}
                                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                                title="Move to Folder"
                              >
                                <FolderSymlink size={14} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleTrashFile(file._id)}
                              className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600"
                              title="Move to Trash"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="surface-card rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Size</th>
                        <th className="py-2.5 px-4">Last Modified</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {files.map((file) => (
                        <tr key={file._id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(file.mimeType, file.name)}
                              <span className="font-semibold text-[var(--text-primary)]">{file.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-[var(--text-secondary)]">{formatBytes(file.size)}</td>
                          <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                            {new Date(file.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!file.isDeleted ? (
                                <>
                                  {file.name.toLowerCase().endsWith(".pdf") && (
                                    <button
                                      onClick={() =>
                                        navigate(`/app/quiz?fileId=${file._id}&title=${encodeURIComponent(file.name)}`)
                                      }
                                      className="rounded px-2 py-1 bg-purple-500/10 text-purple-600 font-semibold text-[11px] hover:bg-purple-600 hover:text-white"
                                      title="Generate Quiz"
                                    >
                                      Quiz
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setPreviewFile(file)}
                                    className="p-1 text-[var(--text-secondary)] hover:text-purple-600"
                                    title="Preview"
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <a
                                    href={`/api/storage/files/${file._id}/content?download=true`}
                                    download
                                    className="p-1 text-[var(--text-secondary)] hover:text-purple-600"
                                    title="Download"
                                  >
                                    <Download size={15} />
                                  </a>
                                  <button
                                    onClick={() => handleTrashFile(file._id)}
                                    className="p-1 text-[var(--text-secondary)] hover:text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRestoreFile(file._id)}
                                  className="text-emerald-600 font-semibold text-xs"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Upload File */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Upload to My Storage</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                {/* File picker */}
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Select File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setUploadFile(f);
                        if (!uploadCustomName) setUploadCustomName(f.name);
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                    Supports PDF, DOC/DOCX, TXT, Images, etc. Max 25 MB.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">File Name (Optional)</label>
                  <input
                    type="text"
                    value={uploadCustomName}
                    onChange={(e) => setUploadCustomName(e.target.value)}
                    placeholder="e.g. Unit 3 DBMS Normalization Notes"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                {currentFolder && (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Uploading into folder: <strong className="text-purple-600">{currentFolder.name}</strong>
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="bg-purple-600 text-xs text-white hover:bg-purple-700"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Create Folder */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Create New Folder</h3>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Folder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Study Material, OS, DSA"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowFolderModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white">
                    Create Folder
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Save Link (2.4 Requirement) */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Save Useful Link</h3>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateLink} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Striver A2Z DSA Sheet"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Category</label>
                  <select
                    value={linkForm.category}
                    onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="DSA">DSA</option>
                    <option value="DBMS">DBMS</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="System Design">System Design</option>
                    <option value="Interview Prep">Interview Prep</option>
                    <option value="Cheat Sheets">Cheat Sheets</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Notes on how to use this resource..."
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowLinkModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white">
                    Save to Storage
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Move File */}
      <AnimatePresence>
        {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Move "{showMoveModal.name}"</h3>
                <button
                  onClick={() => setShowMoveModal(null)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => handleMoveFile(showMoveModal._id, null)}
                  className="flex w-full items-center gap-2 rounded-xl p-2.5 hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                >
                  <Folder size={16} className="text-purple-600" />
                  <span>Root (My Storage)</span>
                </button>
                {folders.map((f) => (
                  <button
                    key={f._id}
                    onClick={() => handleMoveFile(showMoveModal._id, f._id)}
                    className="flex w-full items-center gap-2 rounded-xl p-2.5 hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                  >
                    <Folder size={16} className="text-purple-600" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: File Preview (2.5 Requirement) */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 bg-[var(--bg-surface-elevated)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(previewFile.mimeType, previewFile.name)}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-xs text-[var(--text-primary)]">{previewFile.name}</h3>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{formatBytes(previewFile.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {previewFile.name.toLowerCase().endsWith(".pdf") && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const id = previewFile._id;
                        const title = previewFile.name;
                        setPreviewFile(null);
                        navigate(`/app/quiz?fileId=${id}&title=${encodeURIComponent(title)}`);
                      }}
                      className="bg-purple-600 text-xs text-white"
                    >
                      <Sparkles size={13} className="mr-1" />
                      Generate Quiz
                    </Button>
                  )}
                  <a
                    href={`/api/storage/files/${previewFile._id}/content?download=true`}
                    download
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-strong)]"
                  >
                    <Download size={13} />
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-strong)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 bg-black/5 dark:bg-black/40 overflow-auto flex items-center justify-center p-4">
                {previewFile.mimeType.includes("pdf") || previewFile.name.endsWith(".pdf") ? (
                  <iframe
                    src={`/api/storage/files/${previewFile._id}/content`}
                    className="h-full w-full rounded-xl border border-[var(--border)] bg-white"
                    title={previewFile.name}
                  />
                ) : previewFile.mimeType.includes("image") ? (
                  <img
                    src={`/api/storage/files/${previewFile._id}/content`}
                    alt={previewFile.name}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                  />
                ) : (
                  <div className="text-center p-8 text-xs text-[var(--text-secondary)]">
                    <FileText className="mx-auto h-12 w-12 text-[var(--text-tertiary)] mb-3" />
                    <p className="font-semibold text-sm text-[var(--text-primary)]">Preview not available directly in browser</p>
                    <p className="mt-1">You can download this file to view it with your system reader.</p>
                    <a
                      href={`/api/storage/files/${previewFile._id}/content?download=true`}
                      download
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Download size={14} /> Download {previewFile.name}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}