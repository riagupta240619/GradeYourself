import { create } from "zustand";
import type { Semester, Subject, GradeScale } from "@/types";

interface AcademicState {
  semesters: Semester[];
  scale: GradeScale;
  targetCgpa: number;
  activeSemesterId: string | null;

  // Actions
  setScale: (scale: GradeScale) => void;
  setTargetCgpa: (target: number) => void;
  setSemesters: (semesters: Semester[]) => void;
  setActiveSemesterId: (id: string | null) => void;
  
  // Clear all client state (used on logout)
  clearState: () => void;
}

/**
 * In-memory client UI state store.
 * NO persist middleware to localStorage, preventing cross-user data leakage.
 * All authoritative academic data resides in MongoDB via backend APIs.
 */
export const useAcademicStore = create<AcademicState>()((set) => ({
  semesters: [],
  scale: "10.0",
  targetCgpa: 8.5,
  activeSemesterId: null,

  setScale: (scale) => set({ scale }),
  setTargetCgpa: (targetCgpa) => set({ targetCgpa }),
  setSemesters: (semesters) => set({ semesters }),
  setActiveSemesterId: (activeSemesterId) => set({ activeSemesterId }),

  clearState: () => {
    // Clear localStorage key if any legacy persist data remains
    try {
      localStorage.removeItem("gradewise-academic-store");
    } catch {
      // Ignore
    }
    set({
      semesters: [],
      scale: "10.0",
      targetCgpa: 8.5,
      activeSemesterId: null,
    });
  },
}));
