import { api } from "@/services/api";

export interface AcademicResourceItem {
  id: string;
  title: string;
  link: string;
  description: string;
  source: "Let's Help Everyone" | "GeeksforGeeks" | string;
  category: "notes" | "books" | "youtube" | "website" | "gfg" | "exams" | "roadmap";
  subject: string;
  year?: number;
}

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  source: "Let's Help Everyone" | "GeeksforGeeks" | string;
  sourceUrl: string;
  contentType: "notes" | "guide" | "tutorial" | "practice" | "book" | "roadmap" | "exam";
  content?: string;
  tags: string[];
  fetchedAt?: string;
}

export interface ResourceTopicNode {
  name: string;
  resourceCount: number;
  resources: ResourceItem[];
}

export interface ResourceSubjectNode {
  id: string;
  name: string;
  description: string;
  totalResources: number;
  topics: ResourceTopicNode[];
  year?: number;
}

export interface AcademicSubject extends ResourceSubjectNode {
  year: number;
  branch?: string;
  notes: AcademicResourceItem[];
  books: AcademicResourceItem[];
  youtube: AcademicResourceItem[];
  website: AcademicResourceItem[];
  gfg: AcademicResourceItem[];
  exams: AcademicResourceItem[];
  roadmap: AcademicResourceItem[];
}


export interface AcademicYearGroup {
  year: number;
  label: string;
  count: number;
  subjects: AcademicSubject[];
}

export interface ResourceTreeResponse {
  totalSubjects: number;
  totalResources: number;
  years: AcademicYearGroup[];
  subjects: AcademicSubject[];
  providers: {
    letsHelp: { status: string; count: number; lastError: string | null };
    gfg: { status: string; count: number; lastError: string | null };
  };
  lastUpdated: string;
}

export interface ResourceDetail extends ResourceItem {
  navigation?: {
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
  };
}

export interface ResourceBookmark {
  _id: string;
  title: string;
  url: string;
  category: string;
  source: string;
  description?: string;
  resourceId?: string;
  createdAt?: string;
}

export const resourceApi = {
  getTree: async (forceRefresh = false): Promise<ResourceTreeResponse> => {
    const url = forceRefresh ? "/resources?force=true" : "/resources";
    const res = await api.get<ResourceTreeResponse>(url);
    return res.data;
  },

  getSubject: async (subjectName: string): Promise<AcademicSubject> => {
    const res = await api.get<AcademicSubject>(
      `/resources/subject/${encodeURIComponent(subjectName)}`
    );
    return res.data;
  },

  getById: async (id: string): Promise<ResourceDetail> => {
    const res = await api.get<ResourceDetail>(`/resources/${encodeURIComponent(id)}`);
    return res.data;
  },

  refresh: async (): Promise<ResourceTreeResponse> => {
    const res = await api.get<ResourceTreeResponse>("/resources?force=true");
    return res.data;
  },

  getBookmarks: async (): Promise<ResourceBookmark[]> => {
    try {
      const res = await api.get<{ bookmarks: ResourceBookmark[] }>("/resources/saved");
      return res.data.bookmarks || [];
    } catch {
      return [];
    }
  },

  saveBookmark: async (item: {
    title: string;
    url: string;
    category?: string;
    source?: string;
    description?: string;
    resourceId?: string;
  }): Promise<ResourceBookmark> => {
    const res = await api.post<ResourceBookmark>("/resources/saved", item);
    return res.data;
  },

  deleteBookmark: async (id: string): Promise<void> => {
    await api.delete(`/resources/saved/${encodeURIComponent(id)}`);
  },
};

