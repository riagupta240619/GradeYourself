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

/**
 * Resolve the user's grading scale from their profile.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

/**
 * Build a semester-compatible object for the grading engine.
 *
 * The grading engine's calculateSgpa() accepts { finalizedSgpa, subjects[] }.
 * This helper produces that shape by fetching the real subjects from the
 * authoritative Subject collection.
 */
async function semesterWithSubjects(semester) {
  const subjects = await SubjectModel.find({ semester: semester._id });
  return { ...semester.toObject(), subjects };
}

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get the full dashboard: CGPA, SGPA, subjects, at-risk list, trend.
 *          Returns empty-state values when the user has no academic data yet.
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const scale = resolveScale(user);

    // Fetch semesters — NO auto-seeding; new users get an empty state.
    const rawSemesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });

    if (rawSemesters.length === 0) {
      // Return a well-formed empty state so the frontend can render an empty view
      return res.status(200).json({
        user,
        cgpa: null,
        sgpa: null,
        totalCredits: 0,
        targetCgpa: user?.targetCgpa || (scale === "4.0" ? 3.8 : 9.0),
        currentSemester: null,
        semesters: [],
        subjects: [],
        cgpaTrend: [],
        atRiskSubjects: [],
      });
    }

    // Enrich each semester with its subjects from the Subject collection
    const semestersWithSubjects = await Promise.all(rawSemesters.map(semesterWithSubjects));

    // CGPA across all semesters
    const calculatedCgpa = calculateCgpa(semestersWithSubjects, scale);

    // Current (or most recent) semester
    const currentSemRaw = rawSemesters.find((s) => s.isCurrent) || rawSemesters[rawSemesters.length - 1];
    const currentSemEnriched = semestersWithSubjects.find((s) => String(s._id) === String(currentSemRaw._id));
    const calculatedSgpa = calculateSgpa(currentSemEnriched, scale);

    // Total credits across all semesters
    const totalCredits = semestersWithSubjects.reduce((sum, sem) => {
      const semCredits =
        sem.subjects && sem.subjects.length > 0
          ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0)
          : sem.credits || 20;
      return sum + semCredits;
    }, 0);

    // CGPA trend (one data point per semester)
    const cgpaTrend = semestersWithSubjects.map((sem) => ({
      semester: sem.name.replace(/\s*\(current\)/i, ""),
      sgpa: calculateSgpa(sem, scale),
    }));

    // Current subjects with calculated scores
    const currentSubjects = (currentSemEnriched?.subjects || []).map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        ...subj.toObject(),
        calculatedPct: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
      };
    });

    // At-risk subjects
    const atRiskSubjects = findAtRiskSubjects(currentSemEnriched?.subjects || [], scale);

    res.status(200).json({
      user,
      cgpa: calculatedCgpa,
      sgpa: calculatedSgpa,
      totalCredits,
      targetCgpa: scale === "4.0" ? 3.8 : 9.0,
      currentSemester: currentSemRaw,
      semesters: rawSemesters,
      subjects: currentSubjects,
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

    const rawSemesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });

    const formatted = await Promise.all(
      rawSemesters.map(async (sem) => {
        const subjects = await SubjectModel.find({ semester: sem._id });
        const fakeSem = { ...sem.toObject(), subjects };
        return {
          ...sem.toObject(),
          calculatedSgpa: calculateSgpa(fakeSem, scale),
        };
      })
    );

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/subjects
 * @desc    Get subjects for the active semester with backend calculated grades.
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    // Find the current semester (or most recent)
    const currentSem = await Semester.findOne({ user: req.user._id, isCurrent: true }) ||
      await Semester.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (!currentSem) {
      return res.status(200).json([]);
    }

    const subjects = await SubjectModel.find({ semester: currentSem._id, user: req.user._id });
    const formatted = subjects.map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        ...subj.toObject(),
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

    if (rawSemesters.length === 0) {
      return res.status(200).json({ cgpa: null, totalCredits: 0 });
    }

    const semestersWithSubjects = await Promise.all(rawSemesters.map(semesterWithSubjects));
    const cgpa = calculateCgpa(semestersWithSubjects, scale);
    const totalCredits = semestersWithSubjects.reduce((sum, sem) => {
      return sum + (sem.subjects.length > 0
        ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0)
        : sem.credits || 20);
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
