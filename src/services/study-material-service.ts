import axios from "axios";
import { api } from "./api";

export interface StudyMaterial {
  id: string;
  title: string;
  fileName: string;
  path: string; // Storage path/prefix (e.g., "semester-4/ds/lecture-notes.pdf")
  subjectId: string;
  semesterId: string;
  uploader: string;
  uploadedAt: string;
  fileType: "pdf" | "ppt" | "image" | "text" | "other";
  fileSize: number;
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
  description: string;
}

export interface CreateMaterialPayload {
  title: string;
  fileName: string;
  path: string;
  subjectId: string;
  semesterId: string;
  fileType: "pdf" | "ppt" | "image" | "text" | "other";
  fileSize: number;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
}

export interface StudyMaterialFilters {
  subjectId?: string;
  semesterId?: string;
  isPublic?: boolean;
  tags?: string[];
}

export class StudyMaterialService {
  private static readonly API_BASE = "/api/study-material";

  /**
   * Uploads study material for a subject/semester.
   * In a production setup, this would integrate with Firebase Storage, S3, or similar.
   * For now, it stores metadata in the backend.
   */
  static async uploadMaterial(
    token: string,
    payload: CreateMaterialPayload
  ): Promise<StudyMaterial> {
    const response = await api.post<StudyMaterial>(
      `${this.API_BASE}/upload`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Retrieves study materials for a specific subject or semester.
   */
  static async getMaterials(
    token: string,
    filters: StudyMaterialFilters = {}
  ): Promise<StudyMaterial[]> {
    const { subjectId, semesterId, isPublic } = filters;
    const params = new URLSearchParams();

    if (subjectId) params.append("subjectId", subjectId);
    if (semesterId) params.append("semesterId", semesterId);
    if (isPublic !== undefined) params.append("isPublic", isPublic.toString());

    const response = await api.get<StudyMaterial[]>(
      `${this.API_BASE}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Retrieves a specific study material by ID.
   */
  static async getMaterialById(
    token: string,
    materialId: string
  ): Promise<StudyMaterial> {
    const response = await api.get<StudyMaterial>(
      `${this.API_BASE}/${materialId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Updates the public/private status of study material.
   */
  static async updateMaterialVisibility(
    token: string,
    materialId: string,
    isPublic: boolean
  ): Promise<StudyMaterial> {
    const response = await api.patch<StudyMaterial>(
      `${this.API_BASE}/${materialId}/visibility`,
      { isPublic },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Increments the download count for a material.
   */
  static async incrementDownloadCount(
    token: string,
    materialId: string
  ): Promise<StudyMaterial> {
    const response = await api.patch<StudyMaterial>(
      `${this.API_BASE}/${materialId}/downloads`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Deletes study material.
   */
  static async deleteMaterial(
    token: string,
    materialId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${this.API_BASE}/${materialId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Search materials by tag or title.
   */
  static async searchMaterials(
    token: string,
    query: string,
    filters: StudyMaterialFilters = {}
  ): Promise<StudyMaterial[]> {
    const { subjectId, semesterId } = filters;
    const params = new URLSearchParams();
    params.append("q", query);

    if (subjectId) params.append("subjectId", subjectId);
    if (semesterId) params.append("semesterId", semesterId);

    const response = await api.get<StudyMaterial[]>(
      `${this.API_BASE}/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }
}

/**
 * Extracts tags from a file name or description for categorization.
 */
export function extractTagsFromFilename(fileName: string): string[] {
  const lower = fileName.toLowerCase();
  const tags: string[] = [];

  // Common academic file patterns
  const patterns: Record<string, string> = {
    " Lecture": "lecture-notes",
    "Notes": "notes",
    "Slides": "slides",
    "Assignment": "assignments",
    "Exam": "exam-prep",
    "Study": "study-guide",
    "Reference": "reference",
    "Cheat": "cheat-sheet",
    "PPT": "presentation",
    "PDF": "pdf",
    "PNG": "image",
    "JPG": "image",
  };

  for (const [pattern, tag] of Object.entries(patterns)) {
    if (lower.includes(pattern)) {
      tags.push(tag);
    }
  }

  // Add file extension-based tag
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext) {
    tags.push(ext);
  }

  return [...new Set(tags)];
}