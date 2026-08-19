import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

interface Tag {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSemesters: string[];
  onSemesterToggle: (id: string) => void;
  selectedSubjects: string[];
  onSubjectToggle: (id: string) => void;
  selectedFolders: string[];
  onFolderToggle: (id: string) => void;
  selectedFileTypes: ("pdf" | "ppt" | "image" | "text" | "other")[];
  onFileTypeToggle: (fts: ("pdf" | "ppt" | "image" | "text" | "other")[]) => void;
  selectedTags: string[];
  onTagToggle: (tags: string[]) => void;
  minDownloads: number;
  onMinDownloadsChange: (n: number) => void;
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (dr: [Date | null, Date | null]) => void;
  isPublicFilter: boolean;
  onPublicFilterToggle: (val: boolean) => void;
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedSemesters,
  onSemesterToggle,
  selectedSubjects,
  onSubjectToggle,
  selectedFolders,
  onFolderToggle,
  selectedFileTypes,
  onFileTypeToggle,
  selectedTags,
  onTagToggle,
  minDownloads,
  onMinDownloadsChange,
  dateRange,
  onDateRangeChange,
  isPublicFilter,
  onPublicFilterToggle,
}: SearchFiltersProps) {
  const [showTags, setShowTags] = useState(false);
  const { openToast } = useToast();

  // Handle tag input
  const [newTag, setNewTag] = useState("");

  const handleTagAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagToggle([...selectedTags, trimmed]);
      setNewTag("");
    }
  };

  const handleTagRemove = (tag: string) => {
    onTagToggle(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-pointer-events w-4 h-4" />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 bg-[var(--bg-surface)] border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)]"
          aria-label="Search materials"
        />
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Semester filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Semester
          </label>
          <div className="flex flex-wrap gap-1">
            {/* Would render semester options dynamically */}
            <span
              className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors {selectedSemesters.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onSemesterToggle("sem-1")}
            >
              Sem 1
            </span>
            <span
              className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors {selectedSemesters.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onSemesterToggle("sem-2")}
            >
              Sem 2
            </span>
          </div>
        </div>

        {/* Subject filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Subject
          </label>
          <div className="flex flex-wrap gap-1">
            <span
              className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors {selectedSubjects.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onSubjectToggle("ds123")}
            >
              Data Structures
            </span>
          </div>
        </div>

        {/* Folder filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Folder
          </label>
          <div className="flex flex-wrap gap-1">
            <span
              className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors {selectedFolders.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onFolderToggle("ln456")}
            >
              Lecture Notes
            </span>
          </div>
        </div>

        {/* File type filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            File Type
          </label>
          <div className="flex flex-wrap gap-1">
            <span
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors {selectedFileTypes.includes('pdf') ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onFileTypeToggle((prev) => 
                prev.includes('pdf') ? prev.filter(t => t !== 'pdf') : [...prev, 'pdf']
              )}
            >
              PDF
            </span>
            <span
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors {selectedFileTypes.includes('ppt') ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onFileTypeToggle((prev) => 
                prev.includes('ppt') ? prev.filter(t => t !== 'ppt') : [...prev, 'ppt']
              )}
            >
              PPT
            </span>
          </div>
        </div>

        {/* Tags filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Tags
          </label>
          <div className="flex flex-wrap gap-1">
            {/* Dynamic tags would render here */}
            <span
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors {selectedTags.includes('lecture') ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onTagToggle([...selectedTags, 'lecture'])}
            >
              lecture
            </span>
            <span
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors {selectedTags.includes('assignment') ? 'bg-purple-100 text-purple-800' : 'bg-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
              onClick={() => onTagToggle([...selectedTags, 'assignment'])}
            >
              assignment
            </span>
          </div>
        </div>

        {/* Min downloads */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Min downloads
          </label>
          <input
            type="number"
            min="0"
            value={minDownloads}
            onChange={(e) => onMinDownloadsChange(Number(e.target.value))}
            className="w-full bg-[var(--bg-surface)] rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)]"
            aria-label="Minimum downloads"
          />
        </div>

        {/* Date range */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Date range
          </label>
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] text-muted-foreground cursor-pointer select-none"
              onClick={() => onDateRangeChange([null, null])}
            >
              All time
            </span>
            <span
              className="text-[10px] text-muted-foreground cursor-pointer select-none"
              onClick={() => onDateRangeChange([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()])}
            >
              Last 30 days
            </span>
          </div>
        </div>

        {/* Public filter */}
        <div>
          <label className="text-xs font-medium mb-1 {theme === 'dark' ? 'text-white' : 'text-gray-600'}">
            Public
          </label>
          <label
            className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition-colors {isPublicFilter ? 'bg-purple-100 text-purple-800 border-purple-300' : 'border-transparent hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]'}"
            onClick={() => onPublicFilterToggle(!isPublicFilter)}
          >
            <span>{isPublicFilter ? "Public" : "Private"}</span>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 18h6v-6H9v6zm3-6h2v2H12v-2zm3 8h-2v-2h2v2z" />
            </svg>
          </label>
        </div>
      </div>

      {/* Tag input section */}
      {showTags && (
        <div className="mt-3 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors bg-purple-100 text-purple-800 dark:bg-[var(--bg-surface-strong)] dark:text-[var(--text-primary)]"
            >
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="ml-1 text-[10px] opacity-80"
                aria-label="Remove tag"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 bg-[var(--bg-surface)] rounded-lg px-2 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)]"
              maxLength="20"
            />
            <button
              onClick={handleTagAdd}
              className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-medium"
              disabled={!newTag.trim()}
              title="Add tag"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}