import type { GradingScheme, Subject, Semester } from "@/types";

const scheme = (overrides: Partial<GradingScheme> = {}): GradingScheme => ({
  id: crypto.randomUUID(),
  name: "Standard Scheme",
  university: "Chitkara University",
  isTemplate: false,
  verified: true,
  usedBy: 0,
  assessmentTypes: [
    { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
    { id: "a2", name: "Midterm", weightPct: 30, maxMarks: 50 },
    { id: "a3", name: "Final", weightPct: 50, maxMarks: 100 },
  ],
  ...overrides,
});

function subject(name: string, colorTag: string, marks: Record<string, number | null>, credits = 4): Subject {
  return {
    id: crypto.randomUUID(),
    name,
    colorTag,
    semesterId: "current",
    scheme: scheme({ name: `${name} Scheme` }),
    marks,
    credits,
  };
}

export const currentSemesterSubjects: Subject[] = [
  subject("Data Structures", "#6366f1", { a1: 18, a2: 41, a3: null }),
  subject("Operating Systems", "#22c55e", { a1: 19, a2: 45, a3: null }),
  subject("Computer Networks", "#f59e0b", { a1: 14, a2: 32, a3: null }),
  subject("Database Systems", "#ec4899", { a1: 20, a2: 47, a3: null }),
  subject("Cyber Security", "#06b6d4", { a1: 17, a2: 38, a3: null }),
];

export const semesters: Semester[] = [
  {
    id: "sem1",
    name: "Semester 1",
    isCurrent: false,
    finalizedSgpa: 8.1,
    subjects: [],
  },
  {
    id: "sem2",
    name: "Semester 2",
    isCurrent: false,
    finalizedSgpa: 7.9,
    subjects: [],
  },
  {
    id: "sem3",
    name: "Semester 3",
    isCurrent: false,
    finalizedSgpa: 8.3,
    subjects: [],
  },
  {
    id: "current",
    name: "Semester 4 (Current)",
    isCurrent: true,
    finalizedSgpa: null,
    subjects: currentSemesterSubjects,
  },
];

export const cgpaTrend = [
  { label: "Sem 1", value: 8.1 },
  { label: "Sem 2", value: 7.9 },
  { label: "Sem 3", value: 8.3 },
  { label: "Sem 4", value: 8.42 },
];
