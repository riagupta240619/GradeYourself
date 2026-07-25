/**
 * GradeWise AI - Backend Grading & CGPA Calculation Engine
 * Handles Subject Score Percentage, Letter Grade, Grade Points, SGPA, and overall CGPA
 * Supports multiple grading schemes (10.0 scale, 4.0 scale).
 */

// Convert percentage to letter grade & grade points for 10.0 scale
function pctToGrade10Scale(pct) {
  if (pct >= 90) return { letter: "O", points: 10.0 };
  if (pct >= 80) return { letter: "A+", points: 9.0 };
  if (pct >= 70) return { letter: "A", points: 8.0 };
  if (pct >= 60) return { letter: "B+", points: 7.0 };
  if (pct >= 50) return { letter: "B", points: 6.0 };
  if (pct >= 45) return { letter: "C", points: 5.0 };
  if (pct >= 40) return { letter: "P", points: 4.0 };
  return { letter: "F", points: 0.0 };
}

// Convert percentage to letter grade & grade points for 4.0 scale
function pctToGrade4Scale(pct) {
  if (pct >= 93) return { letter: "A", points: 4.0 };
  if (pct >= 90) return { letter: "A-", points: 3.7 };
  if (pct >= 87) return { letter: "B+", points: 3.3 };
  if (pct >= 83) return { letter: "B", points: 3.0 };
  if (pct >= 80) return { letter: "B-", points: 2.7 };
  if (pct >= 77) return { letter: "C+", points: 2.3 };
  if (pct >= 70) return { letter: "C", points: 2.0 };
  if (pct >= 60) return { letter: "D", points: 1.0 };
  return { letter: "F", points: 0.0 };
}

/**
 * Calculate subject score percentage, letter grade, and grade points
 */
function calculateSubjectScore(subject, scale = "10.0") {
  if (!subject) {
    return { pct: 0, letter: "F", gradePoint: 0 };
  }

  // If subject has internalMarks and externalMarks
  if (subject.internalMarks !== undefined || subject.externalMarks !== undefined) {
    const internal = subject.internalMarks || 0;
    const external = subject.externalMarks || 0;
    const totalMarks = internal + external;
    const pct = Math.min(100, Math.max(0, totalMarks));

    const gradeInfo = scale === "4.0" ? pctToGrade4Scale(pct) : pctToGrade10Scale(pct);
    return { pct, letter: gradeInfo.letter, gradePoint: gradeInfo.points };
  }

  // If subject has scheme and marks map
  const scheme = subject.scheme || {
    assessmentTypes: [
      { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
      { id: "a2", name: "Midterm", weightPct: 30, maxMarks: 50 },
      { id: "a3", name: "Final", weightPct: 50, maxMarks: 100 },
    ],
  };

  const marks = subject.marks || {};
  let totalWeightEvaluated = 0;
  let totalWeightedScore = 0;

  for (const type of scheme.assessmentTypes || []) {
    const markVal = marks[type.id] !== undefined ? marks[type.id] : marks.get ? marks.get(type.id) : null;
    if (markVal !== null && markVal !== undefined && !isNaN(Number(markVal))) {
      const numericMark = Number(markVal);
      const contribution = (numericMark / type.maxMarks) * type.weightPct;
      totalWeightedScore += contribution;
      totalWeightEvaluated += type.weightPct;
    }
  }

  const pct = totalWeightEvaluated > 0 ? (totalWeightedScore / totalWeightEvaluated) * 100 : 82.5;
  const clampedPct = Math.min(100, Math.max(0, pct));
  const gradeInfo = scale === "4.0" ? pctToGrade4Scale(clampedPct) : pctToGrade10Scale(clampedPct);

  return { pct: Number(clampedPct.toFixed(2)), letter: gradeInfo.letter, gradePoint: gradeInfo.points };
}

/**
 * Calculate SGPA for a semester
 */
function calculateSgpa(semester, scale = "10.0") {
  if (!semester) return scale === "4.0" ? 3.5 : 8.5;

  if (semester.finalizedSgpa !== null && semester.finalizedSgpa !== undefined && !isNaN(Number(semester.finalizedSgpa))) {
    return Number(semester.finalizedSgpa);
  }

  const subjects = semester.subjects || [];
  if (subjects.length === 0) return scale === "4.0" ? 3.5 : 8.5;

  let totalPoints = 0;
  let totalCredits = 0;

  for (const subj of subjects) {
    const cred = Number(subj.credits || 3);
    const score = calculateSubjectScore(subj, scale);
    totalPoints += score.gradePoint * cred;
    totalCredits += cred;
  }

  if (totalCredits === 0) return scale === "4.0" ? 3.5 : 8.5;

  const sgpa = totalPoints / totalCredits;
  return Number(sgpa.toFixed(2));
}

/**
 * Calculate overall CGPA across semesters
 */
function calculateCgpa(semesters = [], scale = "10.0") {
  if (!semesters || semesters.length === 0) return scale === "4.0" ? 3.5 : 8.5;

  let totalWeightedSgpa = 0;
  let totalCreditsSum = 0;

  for (const sem of semesters) {
    const semSgpa = calculateSgpa(sem, scale);
    const semCredits = sem.credits || (sem.subjects && sem.subjects.length > 0 ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0) : 20);
    totalWeightedSgpa += semSgpa * semCredits;
    totalCreditsSum += semCredits;
  }

  if (totalCreditsSum === 0) return scale === "4.0" ? 3.5 : 8.5;

  const cgpa = totalWeightedSgpa / totalCreditsSum;
  return Number(cgpa.toFixed(2));
}

/**
 * Find at-risk subjects requiring attention
 */
function findAtRiskSubjects(subjects = [], scale = "10.0") {
  const atRisk = [];

  for (const subj of subjects) {
    const score = calculateSubjectScore(subj, scale);
    if (score.pct < 65) {
      atRisk.push({
        subjectId: subj._id || subj.id || `subj-${subj.name}`,
        subjectName: subj.name,
        reason: `Current score is ${score.pct}%. Target grade (${subj.targetGrade || "A"}) is at risk.`,
        currentPct: score.pct,
        letterGrade: score.letter,
      });
    }
  }

  return atRisk;
}

module.exports = {
  calculateSubjectScore,
  calculateSgpa,
  calculateCgpa,
  findAtRiskSubjects,
  pctToGrade10Scale,
  pctToGrade4Scale,
};
