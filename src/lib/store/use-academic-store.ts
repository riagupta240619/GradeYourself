import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Semester, Subject, GradeScale } from "@/types";
import { semesters as initialSemesters } from "@/lib/data/mock";

interface AcademicState {
  semesters: Semester[];
  scale: GradeScale;
  targetCgpa: number;

  // Actions
  setScale: (scale: GradeScale) => void;
  setTargetCgpa: (target: number) => void;
  
  // Semester management
  addSemester: (name: string, isCurrent?: boolean, finalizedSgpa?: number | null, credits?: number) => string;
  deleteSemester: (semesterId: string) => void;
  uploadPastResults: (pastSemesters: Array<{ name: string; finalizedSgpa: number; credits?: number; subjects?: Subject[] }>) => void;
  
  // Subject management
  addSubject: (semesterId: string, subject: Omit<Subject, "id" | "semesterId">) => void;
  uploadNewSubjects: (semesterId: string, subjectsList: Array<Omit<Subject, "id" | "semesterId">>) => void;
  updateSubjectMarks: (subjectId: string, assessmentTypeId: string, mark: number | null) => void;
  deleteSubject: (subjectId: string) => void;
  
  // Reset
  resetToDefaultData: () => void;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
      semesters: initialSemesters,
      scale: "10.0",
      targetCgpa: 8.5,

      setScale: (scale) => set({ scale }),
      setTargetCgpa: (targetCgpa) => set({ targetCgpa }),

      addSemester: (name, isCurrent = false, finalizedSgpa = null, credits = 20) => {
        const id = crypto.randomUUID();
        set((state) => {
          const updatedSemesters = isCurrent
            ? state.semesters.map((s) => ({ ...s, isCurrent: false }))
            : [...state.semesters];
          return {
            semesters: [
              ...updatedSemesters,
              {
                id,
                name,
                isCurrent,
                finalizedSgpa,
                credits,
                subjects: [],
              },
            ],
          };
        });
        return id;
      },

      deleteSemester: (semesterId) => {
        set((state) => ({
          semesters: state.semesters.filter((s) => s.id !== semesterId),
        }));
      },

      uploadPastResults: (pastSemesters) => {
        set((state) => {
          // Normalize semester names (e.g., "Semester 4 (Current)" matches "Semester 4")
          const existingMap = new Map(
            state.semesters.map((s) => {
              const cleanKey = s.name.toLowerCase().replace(/\(current\)/gi, "").replace(/sem/gi, "semester").replace(/\s+/g, " ").trim();
              return [cleanKey, s];
            })
          );

          for (const past of pastSemesters) {
            const key = past.name.toLowerCase().replace(/\(current\)/gi, "").replace(/sem/gi, "semester").replace(/\s+/g, " ").trim();
            const existing = existingMap.get(key);
            if (existing) {
              existing.finalizedSgpa = past.finalizedSgpa;
              existing.credits = past.credits ?? existing.credits ?? 20;
              if (past.subjects && past.subjects.length > 0) {
                existing.subjects = past.subjects;
              }
            } else {
              const newSem: Semester = {
                id: crypto.randomUUID(),
                name: past.name,
                isCurrent: false,
                finalizedSgpa: past.finalizedSgpa,
                credits: past.credits ?? 20,
                subjects: past.subjects || [],
              };
              existingMap.set(key, newSem);
            }
          }

          return { semesters: Array.from(existingMap.values()) };
        });
      },

      addSubject: (semesterId, subjectData) => {
        set((state) => {
          const subjectId = crypto.randomUUID();
          const newSubject: Subject = {
            ...subjectData,
            id: subjectId,
            semesterId,
          };
          
          return {
            semesters: state.semesters.map((sem) => {
              if (sem.id === semesterId) {
                return {
                  ...sem,
                  subjects: [...sem.subjects, newSubject],
                };
              }
              return sem;
            }),
          };
        });
      },

      uploadNewSubjects: (semesterId, subjectsList) => {
        set((state) => {
          const newSubjects: Subject[] = subjectsList.map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            semesterId,
          }));

          return {
            semesters: state.semesters.map((sem) => {
              if (sem.id === semesterId) {
                return {
                  ...sem,
                  subjects: [...sem.subjects, ...newSubjects],
                };
              }
              return sem;
            }),
          };
        });
      },

      updateSubjectMarks: (subjectId, assessmentTypeId, mark) => {
        set((state) => ({
          semesters: state.semesters.map((sem) => ({
            ...sem,
            subjects: sem.subjects.map((subj) => {
              if (subj.id === subjectId) {
                return {
                  ...subj,
                  marks: {
                    ...subj.marks,
                    [assessmentTypeId]: mark,
                  },
                };
              }
              return subj;
            }),
          })),
        }));
      },

      deleteSubject: (subjectId) => {
        set((state) => ({
          semesters: state.semesters.map((sem) => ({
            ...sem,
            subjects: sem.subjects.filter((s) => s.id !== subjectId),
          })),
        }));
      },

      resetToDefaultData: () => {
        set({
          semesters: initialSemesters,
          scale: "10.0",
          targetCgpa: 8.5,
        });
      },
    }),
    {
      name: "gradewise-academic-store",
    }
  )
);
