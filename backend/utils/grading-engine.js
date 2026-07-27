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

// Convert letter grade to points and representative percentage
function gradeToDetails(gradeStr, scale = "10.0") {
  if (!gradeStr) return { letter: "P", points: scale === "4.0" ? 2.0 : 4.0, pct: 50 };
  const g = String(gradeStr).trim().toUpperCase();

  if (scale === "4.0") {
    switch (g) {
      case "A": case "A+": case "O": return { letter: "A", points: 4.0, pct: 95 };
      case "A-": return { letter: "A-", points: 3.7, pct: 91 };
      case "B+": return { letter: "B+", points: 3.3, pct: 88 };
      case "B": return { letter: "B", points: 3.0, pct: 84 };
      case "B-": return { letter: "B-", points: 2.7, pct: 81 };
      case "C+": return { letter: "C+", points: 2.3, pct: 78 };
      case "C": return { letter: "C", points: 2.0, pct: 72 };
      case "D": return { letter: "D", points: 1.0, pct: 62 };
      case "F": case "FAIL": return { letter: "F", points: 0.0, pct: 0 };
      default: return { letter: g, points: 3.0, pct: 80 };
    }
  }

  // 10.0 Scale
  switch (g) {
    case "O": case "OUTSTANDING": return { letter: "O", points: 10.0, pct: 95 };
    case "A+": case "EXCELLENT": return { letter: "A+", points: 9.0, pct: 85 };
    case "A": case "VERY GOOD": return { letter: "A", points: 8.0, pct: 75 };
    case "B+": case "GOOD": return { letter: "B+", points: 7.0, pct: 65 };
    case "B": case "ABOVE AVERAGE": return { letter: "B", points: 6.0, pct: 55 };
    case "C": case "AVERAGE": return { letter: "C", points: 5.0, pct: 47 };
    case "P": case "PASS": return { letter: "P", points: 4.0, pct: 40 };
    case "F": case "FAIL": return { letter: "F", points: 0.0, pct: 0 };
    default: return { letter: g, points: 8.0, pct: 75 };
  }
}

/**
 * Calculate subject score percentage, letter grade, and grade points
 */
function calculateSubjectScore(subject, scale = "10.0") {
  if (!subject) {
    return { pct: 0, letter: "P", gradePoint: 4.0 };
  }

  // 1. If subject has explicitly stored snapshot percentage/grade, use them directly
  if (subject.finalPercentage !== null && subject.finalPercentage !== undefined && !isNaN(Number(subject.finalPercentage))) {
    const pct = Number(subject.finalPercentage);
    const letter = subject.grade || (scale === "4.0" ? pctToGrade4Scale(pct).letter : pctToGrade10Scale(pct).letter);
    const gradePoint = subject.gradePoint !== null && subject.gradePoint !== undefined
      ? Number(subject.gradePoint)
      : (scale === "4.0" ? pctToGrade4Scale(pct).points : pctToGrade10Scale(pct).points);

    return { pct: Number(pct.toFixed(2)), letter, gradePoint };
  }

  // 2. If subject has stored letter grade, derive details from grade
  if (subject.grade) {
    const details = gradeToDetails(subject.grade, scale);
    const pct = subject.finalPercentage !== null && subject.finalPercentage !== undefined ? Number(subject.finalPercentage) : details.pct;
    const gradePoint = subject.gradePoint !== null && subject.gradePoint !== undefined ? Number(subject.gradePoint) : details.points;
    return { pct, letter: subject.grade, gradePoint };
  }

  // 3. If subject has stored marksObtained and maxMarks
  if (typeof subject.marksObtained === "number" && typeof subject.maxMarks === "number" && subject.maxMarks > 0) {
    const pct = Math.min(100, Math.max(0, (subject.marksObtained / subject.maxMarks) * 100));
    const gradeInfo = scale === "4.0" ? pctToGrade4Scale(pct) : pctToGrade10Scale(pct);
    const letter = subject.grade || gradeInfo.letter;
    const gradePoint = subject.gradePoint !== null && subject.gradePoint !== undefined ? Number(subject.gradePoint) : gradeInfo.points;

    return { pct: Number(pct.toFixed(2)), letter, gradePoint };
  }

  const marks = subject.marks || {};
  const hasMarksMap = marks && (marks.size > 0 || (typeof marks === "object" && Object.keys(marks).length > 0));

  // 3. If subject has internalMarks and externalMarks without a marks map
  if (!hasMarksMap && (subject.internalMarks > 0 || subject.externalMarks > 0)) {
    const internal = subject.internalMarks || 0;
    const external = subject.externalMarks || 0;
    const totalMarks = internal + external;
    const pct = Math.min(100, Math.max(0, totalMarks));

    const gradeInfo = scale === "4.0" ? pctToGrade4Scale(pct) : pctToGrade10Scale(pct);
    return { pct, letter: subject.grade || gradeInfo.letter, gradePoint: subject.gradePoint !== null && subject.gradePoint !== undefined ? Number(subject.gradePoint) : gradeInfo.points };
  }

  // 4. If subject has scheme and marks map
  const scheme = subject.scheme || {
    assessmentTypes: [
      { id: "a1", name: "Assignments", weightPct: 20, maxMarks: 20 },
      { id: "m1", name: "Midterm Exam", weightPct: 30, maxMarks: 50 },
      { id: "f1", name: "Final Exam", weightPct: 50, maxMarks: 100 },
    ],
  };

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

  if (totalWeightEvaluated === 0) {
    return {
      pct: null,
      letter: "In Progress",
      gradePoint: null,
      status: "In Progress",
      isInProgress: true,
    };
  }

  const pct = (totalWeightedScore / totalWeightEvaluated) * 100;
  const clampedPct = Math.min(100, Math.max(0, pct));
  const gradeInfo = scale === "4.0" ? pctToGrade4Scale(clampedPct) : pctToGrade10Scale(clampedPct);

  return {
    pct: Number(clampedPct.toFixed(2)),
    letter: subject.grade || gradeInfo.letter,
    gradePoint: subject.gradePoint !== null && subject.gradePoint !== undefined ? Number(subject.gradePoint) : gradeInfo.points,
    status: "Completed",
    isInProgress: false,
  };
}

/**
 * Calculate SGPA for a semester
 */
function calculateSgpa(semester, scale = "10.0") {
  if (!semester) return null;

  if (semester.finalizedSgpa !== null && semester.finalizedSgpa !== undefined && !isNaN(Number(semester.finalizedSgpa))) {
    return Number(semester.finalizedSgpa);
  }

  const subjects = semester.subjects || [];
  if (subjects.length === 0) return null;

  let totalPoints = 0;
  let totalCredits = 0;

  for (const subj of subjects) {
    const cred = Number(subj.credits || 3);
    const score = calculateSubjectScore(subj, scale);
    if (score.isInProgress || score.pct === null || score.gradePoint === null) {
      continue;
    }
    totalPoints += score.gradePoint * cred;
    totalCredits += cred;
  }

  if (totalCredits === 0) return null;

  const sgpa = totalPoints / totalCredits;
  return Number(sgpa.toFixed(2));
}

/**
 * Calculate overall CGPA across completed semesters ONLY
 */
function calculateCgpa(semesters = [], scale = "10.0") {
  if (!semesters || semesters.length === 0) return null;

  // Requirement 3: Official CGPA should always be calculated ONLY from CompletedSemesters.
  const completedSemesters = semesters.filter((sem) => !sem.isCurrent);
  if (completedSemesters.length === 0) return null;

  let totalWeightedSgpa = 0;
  let totalCreditsSum = 0;

  for (const sem of completedSemesters) {
    const semSgpa = calculateSgpa(sem, scale);
    if (semSgpa === null || isNaN(semSgpa)) continue;
    const semCredits = sem.credits || (sem.subjects && sem.subjects.length > 0 ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0) : 20);
    totalWeightedSgpa += semSgpa * semCredits;
    totalCreditsSum += semCredits;
  }

  if (totalCreditsSum === 0) return null;

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
