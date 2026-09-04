"use strict";

const {
  calculateSubjectScore,
  calculateSgpa,
  calculateCgpa,
  pctToGrade10Scale,
  pctToGrade4Scale,
  gradeToDetails,
  normalizeScheme,
  evaluateComponentScore,
} = require("../utils/grading-engine");

/**
 * POST /api/calculator/cgpa
 * Public CGPA Calculator - no authentication required
 * Accepts manual subject/semester input and returns calculated CGPA
 */
function calculateCgpaPublic(req, res, next) {
  try {
    const { semesters, scale = "10.0" } = req.body;

    if (!semesters || !Array.isArray(semesters) || semesters.length === 0) {
      res.status(400);
      throw new Error("At least one semester is required");
    }

    // Validate each semester has subjects
    for (const sem of semesters) {
      if (!sem.subjects || !Array.isArray(sem.subjects) || sem.subjects.length === 0) {
        res.status(400);
        throw new Error("Each semester must have at least one subject");
      }
    }

    const cgpa = calculateCgpa(semesters, scale);
    const sgpaResults = semesters.map((sem) => ({
      semester: sem.name || sem.semesterName || "Semester",
      sgpa: calculateSgpa(sem, scale),
      credits: sem.credits || sem.subjects.reduce((sum, s) => sum + (Number(s.credits) || 3), 0),
    }));

    res.json({
      cgpa,
      scale,
      semesters: sgpaResults,
      totalCredits: sgpaResults.reduce((sum, s) => sum + s.credits, 0),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/calculator/sgpa
 * Public SGPA Calculator - no authentication required
 * Accepts manual subject input for a single semester and returns SGPA
 */
function calculateSgpaPublic(req, res, next) {
  try {
    const { subjects, scale = "10.0", credits } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400);
      throw new Error("At least one subject is required");
    }

    const semester = {
      subjects,
      credits: credits || subjects.reduce((sum, s) => sum + (Number(s.credits) || 3), 0),
    };

    const sgpa = calculateSgpa(semester, scale);
    const subjectResults = subjects.map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        name: subj.name,
        code: subj.code,
        credits: subj.credits,
        percentage: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
        status: score.isInProgress ? "In Progress" : "Completed",
      };
    });

    res.json({
      sgpa,
      scale,
      subjects: subjectResults,
      totalCredits: semester.credits,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/calculator/grade-prediction
 * Public Grade Prediction - no authentication required
 * Predicts required scores for target CGPA
 */
function predictGradesPublic(req, res, next) {
  try {
    const { 
      currentCgpa, 
      completedCredits, 
      targetCgpa, 
      totalDegreeCredits, 
      remainingSemesters,
      scale = "10.0"
    } = req.body;

    if (typeof currentCgpa !== "number" || typeof completedCredits !== "number" || 
        typeof targetCgpa !== "number" || typeof totalDegreeCredits !== "number") {
      res.status(400);
      throw new Error("currentCgpa, completedCredits, targetCgpa, and totalDegreeCredits are required");
    }

    if (completedCredits >= totalDegreeCredits) {
      res.status(400);
      throw new Error("Completed credits cannot exceed total degree credits");
    }

    const remainingCredits = totalDegreeCredits - completedCredits;
    const currentPoints = currentCgpa * completedCredits;
    const targetPoints = targetCgpa * totalDegreeCredits;
    const requiredPoints = targetPoints - currentPoints;
    const requiredAverage = requiredPoints / remainingCredits;

    const isAchievable = requiredAverage <= (scale === "4.0" ? 4.0 : 10.0);
    const isRealistic = requiredAverage <= (scale === "4.0" ? 3.7 : 9.0);

    res.json({
      currentCgpa,
      targetCgpa,
      completedCredits,
      remainingCredits,
      requiredAverageGpa: Number(requiredAverage.toFixed(2)),
      isAchievable,
      isRealistic,
      scale,
      semestersRemaining: remainingSemesters || Math.ceil(remainingCredits / 20),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/calculator/custom-scheme
 * Public Custom Marking Scheme Calculator
 * Accepts custom assessment scheme and calculates grades
 */
function calculateCustomSchemePublic(req, res, next) {
  try {
    const { subjects, scale = "10.0" } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400);
      throw new Error("At least one subject is required");
    }

    const results = subjects.map((subj) => {
      const normScheme = normalizeScheme(subj.scheme);
      const marks = subj.marks || {};
      
      let totalWeightEvaluated = 0;
      let totalWeightedScore = 0;
      const componentResults = [];

      for (const comp of normScheme.components || []) {
        const evalRes = evaluateComponentScore(comp, marks);
        if (evalRes.hasEntered) {
          totalWeightEvaluated += evalRes.weightPct;
          totalWeightedScore += evalRes.contribution;
        }
        componentResults.push({
          name: comp.name,
          weightPct: comp.weightPct,
          hasEntered: evalRes.hasEntered,
          compPct: evalRes.compPct,
          contribution: evalRes.contribution,
          enteredCount: evalRes.enteredCount,
          totalCount: evalRes.totalCount,
        });
      }

      let pct = null;
      let letter = null;
      let gradePoint = null;
      let status = "In Progress";

      if (totalWeightEvaluated > 0) {
        pct = (totalWeightedScore / totalWeightEvaluated) * 100;
        const clampedPct = Math.min(100, Math.max(0, pct));
        const gradeInfo = scale === "4.0" ? pctToGrade4Scale(clampedPct) : pctToGrade10Scale(clampedPct);
        letter = gradeInfo.letter;
        gradePoint = gradeInfo.points;
        status = "Completed";
      }

      return {
        name: subj.name,
        code: subj.code,
        credits: subj.credits,
        percentage: pct ? Number(pct.toFixed(2)) : null,
        letterGrade: letter,
        gradePoint,
        status,
        components: componentResults,
      };
    });

    // Calculate overall CGPA from custom scheme results
    const completedSubjects = results.filter(r => r.status === "Completed");
    let cgpa = null;
    if (completedSubjects.length > 0) {
      let totalPoints = 0;
      let totalCredits = 0;
      for (const subj of completedSubjects) {
        if (subj.gradePoint !== null) {
          totalPoints += subj.gradePoint * subj.credits;
          totalCredits += subj.credits;
        }
      }
      if (totalCredits > 0) {
        cgpa = Number((totalPoints / totalCredits).toFixed(2));
      }
    }

    res.json({
      scale,
      subjects: results,
      cgpa,
      totalCredits: results.reduce((sum, s) => sum + s.credits, 0),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calculateCgpaPublic,
  calculateSgpaPublic,
  predictGradesPublic,
  calculateCustomSchemePublic,
};