import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { MaterialCard } from "@/components/storage/MaterialCard";
import { SearchFilters } from "@/components/storage/SearchFilters";
import { TreePanel } from "@/components/storage/TreePanel";
import { Breadcrumb } from "@/components/storage/Breadcrumb";
import { FolderModal } from "@/components/storage/FolderModal";
import { Uploader } from "@/components/storage/Uploader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Folder, FileText, Plus } from "lucide-react";

interface Semester {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Subject {
  id: string;
  name: string;
  colorTag?: string;
}

interface FolderItem {
  id: string;
  name: string;
  materialCount: number;
}

interface Material {
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
  createdAt: string;
}

interface StorageState {
  // Hierarchy state
  selectedSemester: Semester | null;
  selectedSubject: Subject | null;
  selectedFolder: FolderItem | null;
  selectedMaterial: Material | null;

  // Materials list
  materials: Material[];

  // Search/filter state
  searchQuery: string;
  selectedSemesters: string[];
  selectedSubjects: string[];
  selectedFolders: string[];
  selectedFileTypes: ("pdf" | "ppt" | "image" | "text" | "other")[];
  selectedTags: string[];
  minDownloads: number;
  dateRange: [Date | null, Date | null];
  isPublicFilter: boolean;

  // Pagination
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  // UI state
  isLoading: boolean;
  showFolderModal: boolean;
  showUploadModal: boolean;
  error: string | null;

  // Storage stats
  usedStorage: number;
  totalQuota: number;
  materialTotal: number;
}

const DEFAULT_STATE: StorageState = {
  selectedSemester: null,
  selectedSubject: null,
  selectedFolder: null,
  selectedMaterial: null,
  materials: [],
  searchQuery: "",
  selectedSemesters: [],
  selectedSubjects: [],
  selectedFolders: [],
  selectedFileTypes: [],
  selectedTags: [],
  minDownloads: 0,
  dateRange: [null, null],
  isPublicFilter: false,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  isLoading: true,
  showFolderModal: false,
  showUploadModal: false,
  error: null,
  usedStorage: 0,
  totalQuota: 5 * 1024 * 1024 * 1024, // 5 GB default
  materialTotal: 0,
};

export function StoragePage() {
  const [state, setState] = useState<StorageState>(DEFAULT_STATE);
  const [searchParams] = useSearchParams();

  // Initialize data on mount
  useEffect(() => {
    fetchStorageTree();
    fetchMaterials();
    fetchStorageStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the semester/subject/folder tree
  const fetchStorageTree = useCallback(async () => {
    try {
      const res = await api.get("/api/study-material/tree", {
        headers: { accept: "application/json" },
      });
      setState((prev) => ({ ...prev, ...res.data, isLoading: false }));
    } catch (err) {
      console.error("Failed to fetch storage tree:", err);
      toast.error("Failed to load storage tree");
    }
  }, []);

  // Fetch materials with current filters
  const fetchMaterials = useCallback(async (overrides?: Partial<StorageState>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const merged = overrides ?? {};
      const res = await api.get("/api/study-material", {
        params: {
          semesterId: merged.selectedSemester?.id,
          subjectId: merged.selectedSubject?.id,
          folderId: merged.selectedFolder?.id,
          search: merged.searchQuery,
          fileType: merged.selectedFileTypes?.length
            ? merged.selectedFileTypes.join(",")
            : undefined,
          tags: merged.selectedTags?.length
            ? merged.selectedTags.join(",")
            : undefined,
          minDownloads: merged.minDownloads,
          uploadedAfter: merged.dateRange?.[0]?.toISOString(),
          uploadedBefore: merged.dateRange?.[1]?.toISOString(),
          isPublic: merged.isPublicFilter,
          page: merged.page ?? 1,
          limit: merged.limit ?? 20,
        },
      });

      const materials: Material[] = (res.data.materials ?? []).map((mat: Record<string, unknown>) => ({
        id: (mat._id as string) || (mat.id as string),
        title: mat.title as string,
        fileName: mat.fileName as string,
        fileType: mat.fileType as Material["fileType"],
        fileSize: mat.fileSize as number,
        downloadCount: mat.downloadCount as number,
        tags: (mat.tags as string[]) || [],
        semesterName: (mat.semester as { name?: string } | undefined)?.name,
        subjectName: (mat.subject as { name?: string } | undefined)?.name,
        folderName: (mat.folder as { name?: string } | undefined)?.name,
        isPublic: mat.isPublic as boolean | undefined,
        createdAt: mat.createdAt as string,
      }));

      setState((prev) => ({
        ...prev,
        materials,
        materialTotal: res.data.total ?? 0,
        total: res.data.total ?? 0,
        totalPages: res.data.totalPages ?? 1,
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to fetch materials:", err);
      toast.error("Failed to load materials");
      setState((prev) => ({ ...prev, isLoading: false, error: "Failed to load materials" }));
    }
  }, []);

  // Fetch storage statistics
  const fetchStorageStats = useCallback(async () => {
    try {
      const res = await api.get("/api/study-material/stats", {
        headers: { accept: "application/json" },
      });
      setState((prev) => ({
        ...prev,
        usedStorage: res.data.usedStorage ?? 0,
        totalQuota: res.data.totalQuota ?? prev.totalQuota,
        materialTotal: res.data.materialTotal ?? 0,
        isLoading: false,
      }));
    } catch (err) {
      console.error("Failed to fetch storage stats:", err);
    }
  }, []);

  // Handle semester selection
  const handleSemesterSelect = useCallback((semester: Semester) => {
    const next: Partial<StorageState> = {
      selectedSemester: semester,
      selectedSubject: null,
      selectedFolder: null,
      searchQuery: "",
      page: 1,
    };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  // Handle subject selection
  const handleSubjectSelect = useCallback((subject: Subject) => {
    const next: Partial<StorageState> = {
      selectedSubject: subject,
      selectedFolder: null,
      searchQuery: "",
      page: 1,
    };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  // Handle folder selection
  const handleFolderSelect = useCallback((folder: FolderItem) => {
    const next: Partial<StorageState> = {
      selectedFolder: folder,
      searchQuery: "",
      page: 1,
    };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handleSearchChange = useCallback((query: string) => {
    const next: Partial<StorageState> = { searchQuery: query, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handleTagSelect = useCallback((tags: string[]) => {
    const next: Partial<StorageState> = { selectedTags: tags, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handleFileTypeSelect = useCallback((fileTypes: ("pdf" | "ppt" | "image" | "text" | "other")[]) => {
    const next: Partial<StorageState> = { selectedFileTypes: fileTypes, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handleMinDownloadsChange = useCallback((minDownloads: number) => {
    const next: Partial<StorageState> = { minDownloads, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handleDateRangeChange = useCallback((dateRange: [Date | null, Date | null]) => {
    const next: Partial<StorageState> = { dateRange, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handlePublicFilterToggle = useCallback((isPublic: boolean) => {
    const next: Partial<StorageState> = { isPublicFilter: isPublic, page: 1 };
    setState((prev) => ({ ...prev, ...next }));
    fetchMaterials(next);
  }, [fetchMaterials]);

  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
    fetchMaterials({ page });
  }, [fetchMaterials]);

  // Handle folder creation
  const handleFolderCreate = useCallback(async (folderName: string, subjectId: string) => {
    try {
      await api.post("/api/study-material/folders", { name: folderName, subjectId });
      toast.success("Folder created successfully");
      fetchStorageTree();
      fetchMaterials();
      setState((prev) => ({ ...prev, showFolderModal: false }));
    } catch (err) {
      toast.error("Failed to create folder");
    }
  }, [fetchStorageTree, fetchMaterials]);

  // Handle material download
  const handleDownloadMaterial = useCallback(async (materialId: string) => {
    try {
      await api.patch(`/api/study-material/${materialId}/downloads`);
      toast.success("Material downloaded successfully");
      fetchMaterials();
    } catch (err) {
      toast.error("Failed to download material");
    }
  }, [fetchMaterials]);

  // Handle material deletion
  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await api.delete(`/api/study-material/${materialId}`);
      toast.success("Material deleted successfully");
      fetchStorageTree();
      fetchMaterials();
    } catch (err) {
      toast.error("Failed to delete material");
    }
  }, [fetchStorageTree, fetchMaterials]);

  return (
    <div className="min-h-screen bg-background/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-bold">
              Storage
              {state.materialTotal > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {state.materialTotal} materials
                </span>
              )}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, showFolderModal: true }))}
            >
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, showUploadModal: true }))}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Modals */}
        {state.showUploadModal && (
          <Uploader
            onSelectSemester={(semester) => handleSemesterSelect(semester as Semester)}
            onSelectSubject={(subject) => handleSubjectSelect(subject as Subject)}
            onClose={() => setState((prev) => ({ ...prev, showUploadModal: false }))}
          />
        )}

        {state.showFolderModal && (
          <FolderModal
            onConfirm={handleFolderCreate}
            onClose={() => setState((prev) => ({ ...prev, showFolderModal: false }))}
          />
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Left panel: Tree + Filters */}
          <div className="space-y-4">
            <TreePanel
              semesters={state.selectedSemester ? [state.selectedSemester] : []}
              onSelect={(semester) => semester && handleSemesterSelect(semester as Semester)}
              onSelectSubject={(subject) => subject && handleSubjectSelect(subject as Subject)}
              onSelectFolder={(folder) => folder && handleFolderSelect(folder as FolderItem)}
              isLoading={state.isLoading}
            />

            <SearchFilters
              searchQuery={state.searchQuery}
              onSearchChange={handleSearchChange}
              selectedSemesters={state.selectedSemesters}
              onSemesterToggle={(id: string) => {
                setState((prev) => ({
                  ...prev,
                  selectedSemesters: prev.selectedSemesters.includes(id)
                    ? prev.selectedSemesters.filter((s) => s !== id)
                    : [...prev.selectedSemesters, id],
                }));
              }}
              selectedSubjects={state.selectedSubjects}
              onSubjectToggle={(id: string) => {
                setState((prev) => ({
                  ...prev,
                  selectedSubjects: prev.selectedSubjects.includes(id)
                    ? prev.selectedSubjects.filter((s) => s !== id)
                    : [...prev.selectedSubjects, id],
                }));
              }}
              selectedFolders={state.selectedFolders}
              onFolderToggle={(id: string) => {
                setState((prev) => ({
                  ...prev,
                  selectedFolders: prev.selectedFolders.includes(id)
                    ? prev.selectedFolders.filter((f) => f !== id)
                    : [...prev.selectedFolders, id],
                }));
              }}
              selectedFileTypes={state.selectedFileTypes}
              onFileTypeToggle={(fts: ("pdf" | "ppt" | "image" | "text" | "other")[]) => handleFileTypeSelect(fts)}
              selectedTags={state.selectedTags}
              onTagToggle={(tags: string[]) => handleTagSelect(tags)}
              minDownloads={state.minDownloads}
              onMinDownloadsChange={(n: number) => handleMinDownloadsChange(n)}
              dateRange={state.dateRange}
              onDateRangeChange={(dr: [Date | null, Date | null]) => handleDateRangeChange(dr)}
              isPublicFilter={state.isPublicFilter}
              onPublicFilterToggle={(val: boolean) => handlePublicFilterToggle(val)}
            />
          </div>

          {/* Right panel: Breadcrumb + Materials */}
          <div className="space-y-4">
            <Breadcrumb
              trail={[
                { label: "Storage", href: "/app/storage" },
                ...(state.selectedSemester
                  ? [{ label: state.selectedSemester.name, href: `/app/storage?semesterId=${state.selectedSemester.id}` }]
                  : []),
                ...(state.selectedSubject
                  ? [{ label: state.selectedSubject.name, href: `/app/storage?subjectId=${state.selectedSubject.id}` }]
                  : []),
                ...(state.selectedFolder
                  ? [{ label: state.selectedFolder.name, isCurrent: true }]
                  : []),
              ]}
            />

            {/* Materials Grid */}
            <div className="space-y-4">
              {state.isLoading && state.materials.length === 0 && (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  Loading materials...
                </div>
              )}

              {state.materials.length === 0 && !state.isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No materials found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState((prev) => ({ ...prev, showUploadModal: true }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload files
                  </Button>
                </div>
              )}

              {state.materials.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {state.materials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onDownload={() => handleDownloadMaterial(material.id)}
                      onDelete={() => handleDeleteMaterial(material.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {state.total > state.limit && (
                <div className="flex justify-center pt-4 gap-2">
                  {state.page > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(state.page - 1)}>
                      Previous
                    </Button>
                  )}
                  <span className="flex items-center text-sm text-muted-foreground px-2">
                    Page {state.page} of {state.totalPages}
                  </span>
                  {state.page < state.totalPages && (
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(state.page + 1)}>
                      Next
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}