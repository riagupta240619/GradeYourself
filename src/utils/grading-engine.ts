import type { Subject, Semester, PredictionRange, RiskFlag, GradeScale } from "@/types";

/** Percentage achieved so far for a single subject, based on entered marks only. */
export function subjectContributionPct(subject: Subject): number {
  let earned = 0;
  let weightEntered = 0;
  for (const type of subject.scheme.assessmentTypes) {
    const raw = subject.marks[type.id];
    if (raw !== null && raw !== undefined) {
      earned += (raw / type.maxMarks) * type.weightPct;
      weightEntered += type.weightPct;
    }
  }
  return weightEntered > 0 ? (earned / weightEntered) * 100 : 0;
}

/** Overall subject percentage assuming ungraded work scores the same rate as graded work so far. */
export function subjectCurrentPct(subject: Subject): number {
  let earned = 0;
  for (const type of subject.scheme.assessmentTypes) {
    const raw = subject.marks[type.id];
    if (raw !== null && raw !== undefined) {
      earned += (raw / type.maxMarks) * type.weightPct;
    }
  }
  return earned;
}

/** Confidence-ranged prediction for where a subject will land. */
export function predictSubject(subject: Subject): PredictionRange {
  const { earnedWeight, remainingWeight } = subject.scheme.assessmentTypes.reduce(
    (acc, type) => {
      const raw = subject.marks[type.id];
      if (raw !== null && raw !== undefined) {
        acc.earnedWeight += (raw / type.maxMarks) * type.weightPct;
      } else {
        acc.remainingWeight += type.weightPct;
      }
      return acc;
    },
    { earnedWeight: 0, remainingWeight: 0 }
  );

  // Plausible band on remaining, ungraded weight: 60%-100% by default.
  const low = earnedWeight + remainingWeight * 0.6;
  const high = earnedWeight + remainingWeight * 1.0;

  // Confidence narrows as more weight has already been graded.
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
      return pctToScale(pct, "10.0"); // letter derives from the 10-pt equivalent
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

/** Cumulative CGPA across all provided semesters. */
export function calculateCgpa(semesters: Semester[], scale: GradeScale): number {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const sem of semesters) {
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
  const { earnedWeight, remainingWeight } = subject.scheme.assessmentTypes.reduce(
    (acc, type) => {
      const raw = subject.marks[type.id];
      if (raw !== null && raw !== undefined) {
        acc.earnedWeight += (raw / type.maxMarks) * type.weightPct;
      } else {
        acc.remainingWeight += type.weightPct;
      }
      return acc;
    },
    { earnedWeight: 0, remainingWeight: 0 }
  );

  if (remainingWeight === 0) {
    return { possible: earnedWeight >= targetPct, requiredAvgPct: 0 };
  }

  const neededFromRemaining = targetPct - earnedWeight;
  const requiredAvgPct = (neededFromRemaining / remainingWeight) * 100;
  return { possible: requiredAvgPct <= 100, requiredAvgPct: Math.round(requiredAvgPct * 10) / 10 };
}
