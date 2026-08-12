"use strict";

const Semester = require("../models/semester-model");
const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const {
  calculateCgpa,
  calculateSgpa,
  calculateSubjectScore,
  findAtRiskSubjects,
} = require("../utils/grading-engine");
const { resolveScale } = require("../utils/resolve-scale");



/**
 * Helper to parse a numeric semester index or number from semester name.
 */
function parseSemesterNumber(name, index) {
  const match = (name || "").match(/\d+/);
  return match ? parseInt(match[0], 10) : index + 1;
}

/**
 * Build a semester-compatible object for the grading engine.
 */
async function semesterWithSubjects(semester) {
  const subjects = await SubjectModel.find({ semester: semester._id });
  return { ...semester.toObject(), subjects };
}

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get the full dashboard summary separated into CompletedSemesters and CurrentSemester.
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const scale = resolveScale(user);

    const rawSemesters = await Semester.find({ user: req.user._id }).sort({
      createdAt: 1,
    });

    if (rawSemesters.length === 0) {
      return res.status(200).json({
        user,
        cgpa: null,
        sgpa: null,
        totalCredits: 0,
        targetCgpa: user?.targetCgpa ?? (scale === "4.0" ? 3.8 : 9.0),
        completedSemesters: [],
        currentSemester: null,
        semesters: [],
        subjects: [],
        cgpaTrend: [],
        atRiskSubjects: [],
      });
    }

    const semestersWithSubjects = await Promise.all(
      rawSemesters.map(semesterWithSubjects),
    );

    // 1. Separate into CompletedSemesters and CurrentSemester datasets
    const completedSemRawList = rawSemesters.filter((s) => !s.isCurrent);
    const completedSemesters = completedSemRawList.map((sem, idx) => {
      const enriched =
        semestersWithSubjects.find((s) => String(s._id) === String(sem._id)) ||
        sem;
      const semSubjects = (enriched.subjects || []).map((subj) => {
        const score = calculateSubjectScore(subj, scale);
        const rawObj =
          typeof subj.toObject === "function"
            ? subj.toObject({ flattenMaps: true })
            : subj;
        const marks =
          rawObj.marks instanceof Map
            ? Object.fromEntries(rawObj.marks)
            : rawObj.marks || {};
        return {
          ...rawObj,
          marks,
          calculatedPct: score.pct,
          letterGrade: score.letter,
          gradePoint: score.gradePoint,
          grade: score.letter,
        };
      });

      const semCredits =
        semSubjects.length > 0
          ? semSubjects.reduce((a, b) => a + (b.credits || 0), 0)
          : sem.credits || 20;

      const semSgpa = calculateSgpa(enriched, scale);

      return {
        _id: sem._id,
        id: sem._id,
        semesterNumber: parseSemesterNumber(sem.name, idx),
        name: sem.name,
        subjects: semSubjects,
        credits: semCredits,
        sgpa: semSgpa,
        grades: semSubjects.map((s) => ({
          subject: s.name,
          grade: s.letterGrade,
          points: s.gradePoint,
        })),
      };
    });

    // 2. Active Current Semester strictly identified by isCurrent === true
    const currentSemRaw =
      rawSemesters.find((s) => s.isCurrent === true) || null;
    let currentSemester = null;
    let activeSubjects = [];
    let calculatedSgpa = null;

    if (currentSemRaw) {
      const currentSemEnriched = semestersWithSubjects.find(
        (s) => String(s._id) === String(currentSemRaw._id),
      );
      calculatedSgpa = calculateSgpa(currentSemEnriched, scale);

      activeSubjects = (currentSemEnriched?.subjects || []).map((subj) => {
        const score = calculateSubjectScore(subj, scale);
        const rawObj =
          typeof subj.toObject === "function"
            ? subj.toObject({ flattenMaps: true })
            : subj;
        const marks =
          rawObj.marks instanceof Map
            ? Object.fromEntries(rawObj.marks)
            : rawObj.marks || {};
        return {
          ...rawObj,
          marks,
          calculatedPct: score.pct,
          letterGrade: score.letter,
          gradePoint: score.gradePoint,
          internalMarks: subj.internalMarks || 0,
          externalMarks: subj.externalMarks || 0,
          assessments: subj.scheme?.assessmentTypes || [],
          attendance: subj.attendance || 85,
          predictedScores: score.pct,
        };
      });

      currentSemester = {
        _id: currentSemRaw._id,
        id: currentSemRaw._id,
        semesterNumber: parseSemesterNumber(
          currentSemRaw.name,
          completedSemesters.length,
        ),
        name: currentSemRaw.name,
        activeSubjects,
        assessments: activeSubjects.flatMap((s) => s.assessments || []),
        attendance: activeSubjects.map((s) => ({
          subjectId: s._id,
          name: s.name,
          attendance: s.attendance,
        })),
        internalMarks: activeSubjects.map((s) => ({
          subjectId: s._id,
          name: s.name,
          internalMarks: s.internalMarks,
        })),
        predictedScores: activeSubjects.map((s) => ({
          subjectId: s._id,
          name: s.name,
          predictedScore: s.calculatedPct,
        })),
      };
    }

    // CGPA overall strictly across CompletedSemesters ONLY
    const completedSemWithSubjects = semestersWithSubjects.filter(
      (s) => !s.isCurrent,
    );
    const calculatedCgpa = calculateCgpa(completedSemWithSubjects, scale);
    const recordedCgpa = completedSemWithSubjects
      .slice()
      .reverse()
      .map((sem) =>
        typeof sem.cgpa === "number" && !isNaN(sem.cgpa) ? sem.cgpa : null,
      )
      .find((value) => value !== null);
    const effectiveCgpa =
      typeof recordedCgpa === "number" ? recordedCgpa : calculatedCgpa;

    // Completed credits strictly from CompletedSemesters ONLY
    const completedCredits = completedSemWithSubjects.reduce((sum, sem) => {
      const semCredits =
        sem.subjects && sem.subjects.length > 0
          ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0)
          : sem.credits || 20;
      return sum + semCredits;
    }, 0);

    // Current Semester credits separately (not counted as completed until finalized)
    const currentSemesterCredits = activeSubjects.reduce(
      (sum, s) => sum + (s.credits || 3),
      0,
    );

    // Official cumulative CGPA trend for completed semesters ONLY
    const cgpaTrend = completedSemWithSubjects.map((sem, idx) => {
      const prefixSemesters = completedSemWithSubjects.slice(0, idx + 1);
      const cumulativeCgpa = calculateCgpa(prefixSemesters, scale);
      const semSgpa = calculateSgpa(sem, scale);
      const semCredits =
        sem.subjects && sem.subjects.length > 0
          ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0)
          : sem.credits || 20;

      return {
        semester: sem.name.replace(/\s*\(current\)/i, ""),
        isCurrent: false,
        cgpa: cumulativeCgpa,
        sgpa: semSgpa,
        credits: semCredits,
        status: "Completed",
      };
    });

    // Projected CGPA incorporating current semester prediction if available
    let projectedCgpa = calculatedCgpa;
    if (currentSemester && calculatedSgpa !== null && !isNaN(calculatedSgpa)) {
      const allSemForProjection = [...completedSemWithSubjects];
      const currentSemEnriched = semestersWithSubjects.find(
        (s) => String(s._id) === String(currentSemRaw._id),
      );
      if (currentSemEnriched) {
        allSemForProjection.push({ ...currentSemEnriched, isCurrent: false });
        projectedCgpa = calculateCgpa(allSemForProjection, scale);
      }
    }

    // At-risk subjects (only from the active current semester)
    const atRiskSubjects = currentSemester
      ? findAtRiskSubjects(activeSubjects, scale)
      : [];

    res.status(200).json({
      user,
      cgpa: effectiveCgpa,
      sgpa: calculatedSgpa,
      projectedCgpa,
      totalCredits: completedCredits,
      completedCredits,
      currentSemesterCredits,
      targetCgpa: user?.targetCgpa ?? (scale === "4.0" ? 3.8 : 9.0),
      completedSemesters,
      currentSemester,
      semesters: rawSemesters,
      subjects: activeSubjects,
      cgpaTrend,
      atRiskSubjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/semesters
 * @desc    Get user semester list.
 * @access  Private
 */
const getSemesters = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const rawSemesters = await Semester.find({ user: req.user._id }).sort({
      createdAt: 1,
    });

    const formatted = await Promise.all(
      rawSemesters.map(async (sem) => {
        const subjects = await SubjectModel.find({ semester: sem._id });
        const fakeSem = { ...sem.toObject(), subjects };
        return {
          ...sem.toObject(),
          calculatedSgpa: calculateSgpa(fakeSem, scale),
        };
      }),
    );

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/subjects
 * @desc    Get subjects ONLY for the active current semester (isCurrent: true).
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    // Find ONLY the current active semester
    const currentSem = await Semester.findOne({
      user: req.user._id,
      isCurrent: true,
    });

    if (!currentSem) {
      return res.status(200).json([]);
    }

    const subjects = await SubjectModel.find({
      semester: currentSem._id,
      user: req.user._id,
    });
    const formatted = subjects.map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      const rawObj =
        typeof subj.toObject === "function"
          ? subj.toObject({ flattenMaps: true })
          : subj;
      const marks =
        rawObj.marks instanceof Map
          ? Object.fromEntries(rawObj.marks)
          : rawObj.marks || {};
      return {
        ...rawObj,
        marks,
        calculatedPct: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/cgpa
 * @desc    Get CGPA breakdown.
 * @access  Private
 */
const getCgpaSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const rawSemesters = await Semester.find({ user: req.user._id });
    const completedSemRawList = rawSemesters.filter((s) => !s.isCurrent);

    if (completedSemRawList.length === 0) {
      return res.status(200).json({ cgpa: null, totalCredits: 0 });
    }

    const semestersWithSubjects = await Promise.all(
      completedSemRawList.map(semesterWithSubjects),
    );
    const cgpa = calculateCgpa(semestersWithSubjects, scale);
    const totalCredits = semestersWithSubjects.reduce((sum, sem) => {
      return (
        sum +
        (sem.subjects.length > 0
          ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0)
          : sem.credits || 20)
      );
    }, 0);

    res.status(200).json({ cgpa, totalCredits });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getSemesters,
  getSubjects,
  getCgpaSummary,
};
