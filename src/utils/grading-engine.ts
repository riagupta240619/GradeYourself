import type { Subject, Semester, PredictionRange, RiskFlag, GradeScale, SchemeComponent } from "@/types";

/** Normalize any grading scheme to the hierarchical components format. */
export function normalizeScheme(scheme: any): { components: SchemeComponent[] } {
  if (!scheme) {
    return {
      components: [
        {
          id: "comp-a1",
          name: "Assignments",
          weightPct: 20,
          rule: "average",
          assessments: [{ id: "a1", name: "Assignments", maxMarks: 20 }],
        },
        {
          id: "comp-m1",
          name: "Midterm Exam",
          weightPct: 30,
          rule: "average",
          assessments: [{ id: "m1", name: "Midterm Exam", maxMarks: 50 }],
        },
        {
          id: "comp-f1",
          name: "Final Exam",
          weightPct: 50,
          rule: "average",
          assessments: [{ id: "f1", name: "Final Exam", maxMarks: 100 }],
        },
      ],
    };
  }

  if (Array.isArray(scheme.components) && scheme.components.length > 0) {
    return scheme;
  }

  const types = scheme.assessmentTypes || [
    { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
    { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 50 },
    { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 100 },
  ];

  const components = types.map((t: any) => ({
    id: `comp-${t.id}`,
    name: t.name,
    weightPct: t.weightPct,
    rule: "average" as const,
    assessments: [{ id: t.id, name: t.name, maxMarks: t.maxMarks }],
  }));

  return { ...scheme, components };
}

/** Evaluate score for a single component based on its aggregation rule. */
export function evaluateComponentScore(component: SchemeComponent, marks: Record<string, number | null>) {
  const entered: Array<{ astId: string; name: string; num: number; maxMarks: number; pct: number }> = [];
  
  for (const ast of component.assessments || []) {
    const raw = marks ? marks[ast.id] : null;
    if (raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw))) {
      const num = Number(raw);
      const pct = ast.maxMarks > 0 ? (num / ast.maxMarks) * 100 : 0;
      entered.push({ astId: ast.id, name: ast.name, num, maxMarks: ast.maxMarks, pct });
    }
  }

  if (entered.length === 0) {
    return { hasEntered: false, compPct: null, weightPct: component.weightPct, contribution: 0, entered, totalCount: component.assessments.length };
  }

  let compPct = 0;
  const rule = component.rule || "average";

  switch (rule) {
    case "sum": {
      const sumObtained = entered.reduce((sum, item) => sum + item.num, 0);
      const sumMax = entered.reduce((sum, item) => sum + item.maxMarks, 0);
      compPct = sumMax > 0 ? (sumObtained / sumMax) * 100 : 0;
      break;
    }
    case "highest": {
      compPct = Math.max(...entered.map((item) => item.pct));
      break;
    }
    case "lowest": {
      compPct = Math.min(...entered.map((item) => item.pct));
      break;
    }
    case "best_n": {
      const n = component.bestN && component.bestN > 0 ? component.bestN : 1;
      const sortedPct = entered.map((item) => item.pct).sort((a, b) => b - a);
      const bestNPct = sortedPct.slice(0, n);
      const sum = bestNPct.reduce((acc, p) => acc + p, 0);
      compPct = sum / bestNPct.length;
      break;
    }
    case "average":
    default: {
      const sumPct = entered.reduce((sum, item) => sum + item.pct, 0);
      compPct = sumPct / entered.length;
      break;
    }
  }

  const clampedPct = Math.min(100, Math.max(0, compPct));
  const contribution = (clampedPct / 100) * component.weightPct;

  return {
    hasEntered: true,
    compPct: Number(clampedPct.toFixed(2)),
    weightPct: component.weightPct,
    contribution: Number(contribution.toFixed(2)),
    entered,
    totalCount: component.assessments.length,
  };
}

/** Check if a subject has any entered marks. */
export function hasSubjectMarks(subject: Subject): boolean {
  if (!subject) return false;
  const norm = normalizeScheme(subject.scheme);
  const marks = subject.marks || {};

  for (const comp of norm.components) {
    for (const ast of comp.assessments) {
      const raw = marks[ast.id];
      if (raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw))) {
        return true;
      }
    }
  }
  return false;
}

/** Overall subject percentage earned so far across evaluated components. */
export function subjectCurrentPct(subject: Subject): number {
  if (!subject) return 0;
  const norm = normalizeScheme(subject.scheme);
  const marks = subject.marks || {};

  let totalEvaluatedWeight = 0;
  let totalWeightedScore = 0;

  for (const comp of norm.components) {
    const res = evaluateComponentScore(comp, marks);
    if (res.hasEntered) {
      totalEvaluatedWeight += res.weightPct;
      totalWeightedScore += res.contribution;
    }
  }

  return totalEvaluatedWeight > 0 ? (totalWeightedScore / totalEvaluatedWeight) * 100 : 0;
}

/** Confidence-ranged prediction for where a subject will land. */
export function predictSubject(subject: Subject): PredictionRange {
  if (!subject) return { low: 0, high: 100, confidencePct: 0 };
  const norm = normalizeScheme(subject.scheme);
  const marks = subject.marks || {};

  let earnedWeight = 0;
  let remainingWeight = 0;

  for (const comp of norm.components) {
    const res = evaluateComponentScore(comp, marks);
    if (res.hasEntered) {
      earnedWeight += res.contribution;
      // Remaining weight in this component if not all assessments are done
      if (res.entered.length < comp.assessments.length) {
        const compRemainingShare = (comp.assessments.length - res.entered.length) / comp.assessments.length;
        remainingWeight += comp.weightPct * compRemainingShare;
      }
    } else {
      remainingWeight += comp.weightPct;
    }
  }

  const low = earnedWeight + remainingWeight * 0.6;
  const high = earnedWeight + remainingWeight * 1.0;
  const gradedShare = 100 - remainingWeight;
  const confidencePct = Math.round(40 + gradedShare * 0.6);

  return { low: Math.round(low * 10) / 10, high: Math.round(high * 10) / 10, confidencePct };
}

export function pctToScale(pct: number, scale: GradeScale): number {
  switch (scale) {
    case "10.0":
      return Math.round((pct / 10) * 100) / 100;
    case "4.0":
      return Math.round((pct / 25) * 100) / 100;
    case "percentage":
      return Math.round(pct * 10) / 10;
    case "letter":
      return pctToScale(pct, "10.0");
  }
}

export function pctToLetter(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 50) return "C";
  return "D";
}

/** Credit-weighted SGPA for a single semester, on the given scale. */
export function calculateSgpa(semester: Semester, scale: GradeScale): number {
  if (semester.finalizedSgpa !== null && semester.finalizedSgpa !== undefined) {
    return semester.finalizedSgpa;
  }
  const subjects = semester.subjects || [];
  const totalCredits = subjects.reduce((s, subj) => s + subj.credits, 0);
  if (totalCredits === 0) return 0;
  const points = subjects.reduce((sum, subj) => {
    const pct = subjectCurrentPct(subj);
    return sum + pctToScale(pct, scale) * subj.credits;
  }, 0);
  return Math.round((points / totalCredits) * 100) / 100;
}

/** Cumulative CGPA across CompletedSemesters ONLY. */
export function calculateCgpa(semesters: Semester[], scale: GradeScale): number {
  let totalCredits = 0;
  let totalPoints = 0;
  const completedSemesters = semesters.filter((sem) => !sem.isCurrent);
  for (const sem of completedSemesters) {
    const subjects = sem.subjects || [];
    const subjectCredits = subjects.reduce((s, subj) => s + subj.credits, 0);
    const credits = subjectCredits > 0 ? subjectCredits : (sem.credits ?? 20);

    const sgpa = sem.finalizedSgpa !== null && sem.finalizedSgpa !== undefined
      ? sem.finalizedSgpa
      : calculateSgpa(sem, scale);

    if (sgpa !== null && !isNaN(sgpa) && sgpa > 0) {
      totalCredits += credits;
      totalPoints += sgpa * credits;
    }
  }
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

/** Surfaces subjects that are trending down or need a stretch score to stay on target. */
export function findAtRiskSubjects(subjects: Subject[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  for (const subject of subjects) {
    const prediction = predictSubject(subject);
    if (prediction.high < 70) {
      flags.push({
        subjectId: subject.id,
        subjectName: subject.name,
        reason: `Predicted ${prediction.low}–${prediction.high}% — below target range`,
      });
    }
  }
  return flags;
}

/** Reverse-engineers the marks needed on remaining assessments to hit a target percentage. */
export function requiredMarksForTarget(subject: Subject, targetPct: number): { possible: boolean; requiredAvgPct: number } {
  if (!subject) return { possible: false, requiredAvgPct: 0 };
  const norm = normalizeScheme(subject.scheme);
  const marks = subject.marks || {};

  let earnedWeight = 0;
  let remainingWeight = 0;

  for (const comp of norm.components) {
    const res = evaluateComponentScore(comp, marks);
    if (res.hasEntered) {
      earnedWeight += res.contribution;
      if (res.entered.length < comp.assessments.length) {
        const compRemainingShare = (comp.assessments.length - res.entered.length) / comp.assessments.length;
        remainingWeight += comp.weightPct * compRemainingShare;
      }
    } else {
      remainingWeight += comp.weightPct;
    }
  }

  if (remainingWeight === 0) {
    return { possible: earnedWeight >= targetPct, requiredAvgPct: 0 };
  }

  const neededFromRemaining = targetPct - earnedWeight;
  const requiredAvgPct = (neededFromRemaining / remainingWeight) * 100;
  return { possible: requiredAvgPct <= 100, requiredAvgPct: Math.round(requiredAvgPct * 10) / 10 };
}

export interface AssessmentRequirement {
  id: string;
  name: string;
  maxMarks: number;
  isGraded: boolean;
  enteredMark: number | null;
  requiredMark: number | null;
  clampedRequiredMark: number | null;
  requiredPct: number;
  effortLevel: "Achieved" | "Low" | "Moderate" | "High" | "Unattainable";
}

export interface ComponentRequirement {
  id: string;
  name: string;
  weightPct: number;
  rule: string;
  assessments: AssessmentRequirement[];
}

export interface SubjectHierarchicalPlanningResult {
  possible: boolean;
  isAchieved: boolean;
  earnedContribution: number;
  remainingWeight: number;
  requiredAvgPct: number;
  maxPossiblePct: number;
  components: ComponentRequirement[];
  shortfallAssessments: Array<{ name: string; mark: number; maxMarks: number }>;
}

/** Calculate required scores for every nested assessment in a subject to hit a target percentage. */
export function calculateHierarchicalRequiredMarks(subject: Subject, targetPct: number): SubjectHierarchicalPlanningResult {
  if (!subject) {
    return {
      possible: false,
      isAchieved: false,
      earnedContribution: 0,
      remainingWeight: 0,
      requiredAvgPct: 0,
      maxPossiblePct: 0,
      components: [],
      shortfallAssessments: [],
    };
  }

  const norm = normalizeScheme(subject.scheme);
  const marks = subject.marks || {};

  let earnedContribution = 0;
  let remainingWeight = 0;
  const shortfallAssessments: Array<{ name: string; mark: number; maxMarks: number }> = [];

  const compBreakdowns: ComponentRequirement[] = [];

  for (const comp of norm.components) {
    const evalRes = evaluateComponentScore(comp, marks);
    if (evalRes.hasEntered) {
      earnedContribution += evalRes.contribution;
      if (evalRes.entered.length < comp.assessments.length) {
        const remainingShare = (comp.assessments.length - evalRes.entered.length) / comp.assessments.length;
        remainingWeight += comp.weightPct * remainingShare;
      }
      // Track completed assessments with low performance (< 60%) that cause shortfall
      for (const item of evalRes.entered) {
        if (item.pct < 60) {
          shortfallAssessments.push({ name: item.name, mark: item.num, maxMarks: item.maxMarks });
        }
      }
    } else {
      remainingWeight += comp.weightPct;
    }
  }

  const maxPossiblePct = Number((earnedContribution + remainingWeight).toFixed(1));
  const isAchieved = earnedContribution >= targetPct;
  const neededContribution = Math.max(0, targetPct - earnedContribution);
  const requiredAvgPct = remainingWeight > 0 ? (neededContribution / remainingWeight) * 100 : 0;
  const possible = !isAchieved && (remainingWeight > 0 ? requiredAvgPct <= 100 : false);

  for (const comp of norm.components) {
    const astReqs: AssessmentRequirement[] = [];

    for (const ast of comp.assessments) {
      const raw = marks[ast.id];
      const isGraded = raw !== null && raw !== undefined && (raw as any) !== "" && !isNaN(Number(raw));
      const enteredMark = isGraded ? Number(raw) : null;

      let requiredMark: number | null = null;
      let clampedRequiredMark: number | null = null;
      let reqPct = 0;
      let effortLevel: AssessmentRequirement["effortLevel"] = "Achieved";

      if (isGraded) {
        effortLevel = "Achieved";
      } else if (isAchieved) {
        effortLevel = "Achieved";
        requiredMark = 0;
        clampedRequiredMark = 0;
      } else if (!possible) {
        effortLevel = "Unattainable";
        requiredMark = null;
        clampedRequiredMark = ast.maxMarks;
        reqPct = 100;
      } else {
        reqPct = Math.round(requiredAvgPct * 10) / 10;
        requiredMark = (requiredAvgPct / 100) * ast.maxMarks;
        clampedRequiredMark = Math.min(ast.maxMarks, Math.max(0, Math.round(requiredMark * 10) / 10));

        if (reqPct > 90) effortLevel = "High";
        else if (reqPct > 75) effortLevel = "Moderate";
        else effortLevel = "Low";
      }

      astReqs.push({
        id: ast.id,
        name: ast.name,
        maxMarks: ast.maxMarks,
        isGraded,
        enteredMark,
        requiredMark,
        clampedRequiredMark,
        requiredPct: reqPct,
        effortLevel,
      });
    }

    compBreakdowns.push({
      id: comp.id,
      name: comp.name,
      weightPct: comp.weightPct,
      rule: comp.rule,
      assessments: astReqs,
    });
  }

  return {
    possible,
    isAchieved,
    earnedContribution: Number(earnedContribution.toFixed(1)),
    remainingWeight: Number(remainingWeight.toFixed(1)),
    requiredAvgPct: Math.round(requiredAvgPct * 10) / 10,
    maxPossiblePct,
    components: compBreakdowns,
    shortfallAssessments,
  };
}
