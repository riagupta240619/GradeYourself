import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Target, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

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

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
  level: number;
  isFolder?: boolean;
  isSubject?: boolean;
  isSemester?: boolean;
  disabled?: boolean;
}

interface TreePanelProps {
  semesters?: Semester[];
  isLoading?: boolean;
  onSelect: (semester?: Semester) => void;
  onSelectSubject?: (subject?: Subject) => void;
  onSelectFolder?: (folder?: FolderItem) => void;
}

export function TreePanel({
  semesters,
  isLoading,
  onSelect,
  onSelectSubject,
  onSelectFolder,
}: TreePanelProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { openToast } = useToast();

  // Build tree from semesters
  useEffect(() => {
    if (!semesters || semesters.length === 0) {
      setNodes([]);
      return;
    }

    const built: TreeNode[] = semesters.map((sem) => ({
      label: sem.name,
      value: sem.id,
      level: 0,
      isSemester: true,
      children: [
        {
          label: "Loading subjects...",
          value: `placeholder-${sem.id}`,
          level: 1,
          disabled: true,
        },
      ],
    }));

    setNodes(built);
  }, [semesters]);

  // Fetch subjects for a semester
  const fetchSubjects = useCallback(
    async (semesterId: string) => {
      try {
        const res = await api.get("/api/study-material/subjects", {
          params: { semesterId },
        });
        const subjects: Subject[] = res.data ?? [];

        setNodes((prev) =>
          prev.map((n) => {
            if (n.value !== semesterId || !n.isSemester) return n;
            return {
              ...n,
              children: subjects.map((sub) => ({
                label: sub.name,
                value: sub.id,
                level: 1,
                isSubject: true,
                children: [],
              })),
            };
          })
        );
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        openToast({ title: "Error", description: "Failed to load subjects", variant: "destructive" });
      }
    },
    [openToast]
  );

  // Fetch folders for a subject
  const fetchFolders = useCallback(
    async (subjectId: string) => {
      try {
        const res = await api.get("/api/study-material/folders", {
          params: { subjectId },
        });
        const folders: FolderItem[] = res.data ?? [];

        setNodes((prev) => {
          const updateChildren = (nodes: TreeNode[]): TreeNode[] =>
            nodes.map((n) => {
              if (n.value === subjectId && n.isSubject) {
                return {
                  ...n,
                  children: folders.map((fol) => ({
                    label: `${fol.name} (${fol.materialCount})`,
                    value: fol.id,
                    level: 2,
                    isFolder: true,
                  })),
                };
              }
              if (n.children) return { ...n, children: updateChildren(n.children) };
              return n;
            });
          return updateChildren(prev);
        });
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    },
    []
  );

  const toggleExpand = useCallback((value: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const handleClick = useCallback(
    (node: TreeNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.disabled) return;

      if (node.isSemester) {
        if (!expandedIds.has(node.value)) fetchSubjects(node.value);
        toggleExpand(node.value);
        onSelect(semesters?.find((s) => s.id === node.value));
      } else if (node.isSubject) {
        if (!expandedIds.has(node.value)) fetchFolders(node.value);
        toggleExpand(node.value);
        onSelectSubject?.({ id: node.value, name: node.label });
      } else if (node.isFolder) {
        onSelectFolder?.({ id: node.value, name: node.label, materialCount: 0 });
      }
    },
    [expandedIds, semesters, onSelect, onSelectSubject, onSelectFolder, fetchSubjects, fetchFolders, toggleExpand]
  );

  const renderNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedIds.has(node.value);
    return (
      <div key={node.value}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer select-none transition-colors text-sm",
            node.disabled && "opacity-50 cursor-not-allowed",
            !node.disabled && "hover:bg-muted/60",
            isExpanded && node.isSemester && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          )}
          style={{ paddingLeft: `${(node.level + 1) * 12}px` }}
          onClick={(e) => handleClick(node, e)}
        >
          {node.children && node.children.length > 0 && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 shrink-0",
                !isExpanded && "-rotate-90"
              )}
            />
          )}
          {!node.children?.length && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}

          {node.isSemester && <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />}
          {node.isSubject && <Target className="h-3.5 w-3.5 shrink-0" />}
          {node.isFolder && <Folder className="h-3.5 w-3.5 shrink-0" />}

          <span className="truncate">{node.label}</span>
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div>{node.children.map(renderNode)}</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground animate-pulse">Loading tree...</div>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground text-center">No semesters found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-2 space-y-0.5">
      {nodes.map(renderNode)}
    </div>
  );
}