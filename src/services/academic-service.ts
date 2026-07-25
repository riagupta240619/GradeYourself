import { useAcademicStore } from "@/hooks/use-academic-store";
import type { Semester, Subject, GradeScale } from "@/types";

/**
 * Service layer abstraction for Academic domain operations.
 * Currently proxies to local state store; ready to swap with API client requests.
 */
export const AcademicService = {
  getSemesters(): Semester[] {
    return useAcademicStore.getState().semesters;
  },

  getCurrentScale(): GradeScale {
    return useAcademicStore.getState().scale;
  },

  getTargetCgpa(): number {
    return useAcademicStore.getState().targetCgpa;
  },

  updateScale(scale: GradeScale): void {
    useAcademicStore.getState().setScale(scale);
  },

  updateTargetCgpa(target: number): void {
    useAcademicStore.getState().setTargetCgpa(target);
  },

  addSemester(name: string, isCurrent = false, finalizedSgpa: number | null = null, credits = 20): string {
    return useAcademicStore.getState().addSemester(name, isCurrent, finalizedSgpa, credits);
  },

  deleteSemester(semesterId: string): void {
    useAcademicStore.getState().deleteSemester(semesterId);
  },

  addSubject(semesterId: string, subject: Omit<Subject, "id" | "semesterId">): void {
    useAcademicStore.getState().addSubject(semesterId, subject);
  },

  updateSubjectMarks(subjectId: string, assessmentTypeId: string, mark: number | null): void {
    useAcademicStore.getState().updateSubjectMarks(subjectId, assessmentTypeId, mark);
  },

  deleteSubject(subjectId: string): void {
    useAcademicStore.getState().deleteSubject(subjectId);
  },

  resetData(): void {
    useAcademicStore.getState().resetToDefaultData();
  },
};
