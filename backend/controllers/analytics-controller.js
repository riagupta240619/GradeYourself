"use strict";

const Semester = require("../models/semester-model");
const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const { calculateSubjectScore, calculateSgpa, calculateCgpa } = require("../utils/grading-engine");

/**
 * Resolve the user's grading scale from their profile.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

/**
 * @route   GET /api/analytics
 * @desc    Analytics summary: semester trend, CGPA history, credit distribution,
 *          highest and lowest performing subjects.
 *          All subject data is read from the authoritative Subject collection.
 *          Returns empty-state values when the user has no academic data yet.
 * @access  Private
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const semesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });

    if (semesters.length === 0) {
      return res.status(200).json({
        semesterTrend: [],
        cgpaHistory: [],
        creditDistribution: [],
        highestSubject: null,
        lowestSubject: null,
        totalSubjectsEvaluated: 0,
      });
    }

    const semesterTrend = [];
    const cgpaHistory = [];
    let allSubjects = [];

    for (let i = 0; i < semesters.length; i++) {
      const sem = semesters[i];
      const semName = sem.name.replace(/\s*\(current\)/i, "");

      // Fetch this semester's subjects from the authoritative Subject collection
      const subjects = await SubjectModel.find({ semester: sem._id, user: req.user._id });

      // Build a grading-engine-compatible semester shape
      const semForEngine = { ...sem.toObject(), subjects };

      const semSgpa = calculateSgpa(semForEngine, scale);
      semesterTrend.push({ semester: semName, sgpa: semSgpa });

      // Progressive CGPA up to and including this semester
      const priorSems = semesters.slice(0, i);
      const priorSubjectSets = await Promise.all(
        priorSems.map(async (ps) => {
          const psSubjects = await SubjectModel.find({ semester: ps._id, user: req.user._id });
          return { ...ps.toObject(), subjects: psSubjects };
        })
      );
      const progressiveCgpa = calculateCgpa([...priorSubjectSets, semForEngine], scale);
      cgpaHistory.push({ semester: semName, cgpa: progressiveCgpa });

      // Collect all subject scores for highest/lowest and credit distribution
      for (const subj of subjects) {
        const score = calculateSubjectScore(subj, scale);
        allSubjects.push({
          name: subj.name,
          code: subj.code || "SUBJ",
          credits: subj.credits || 3,
          pct: score.pct,
          letterGrade: score.letter,
          gradePoint: score.gradePoint,
          semester: semName,
        });
      }
    }

    // Sort by score descending
    allSubjects.sort((a, b) => b.pct - a.pct);

    const highestSubject = allSubjects.length > 0 ? allSubjects[0] : null;
    const lowestSubject = allSubjects.length > 0 ? allSubjects[allSubjects.length - 1] : null;

    // Credit distribution by broad academic category
    const categoryMap = {};
    for (const subj of allSubjects) {
      let category = "Core Engineering";
      if (/CS|Data|Code|System|Network/i.test(subj.name || subj.code)) {
        category = "Computer Science";
      } else if (/MATH|Calculus|Discrete|Linear/i.test(subj.name || subj.code)) {
        category = "Mathematics";
      } else if (/PHYS|Science|Chemistry/i.test(subj.name || subj.code)) {
        category = "Basic Sciences";
      }

      if (!categoryMap[category]) {
        categoryMap[category] = { category, credits: 0, count: 0 };
      }
      categoryMap[category].credits += subj.credits;
      categoryMap[category].count += 1;
    }

    res.status(200).json({
      semesterTrend,
      cgpaHistory,
      creditDistribution: Object.values(categoryMap),
      highestSubject,
      lowestSubject,
      totalSubjectsEvaluated: allSubjects.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsSummary,
};
