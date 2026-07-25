const Semester = require("../models/semester-model");
const User = require("../models/user-model");
const { calculateSubjectScore, calculateSgpa, calculateCgpa } = require("../utils/grading-engine");

/**
 * @route   GET /api/analytics
 * @desc    Get analytics summary: Semester trend, CGPA history, Credit distribution, Highest & Lowest subjects
 * @access  Private
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const semesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });

    const semesterTrend = [];
    const cgpaHistory = [];
    let allSubjects = [];

    // Progressive CGPA and Semester trend calculation
    for (let i = 0; i < semesters.length; i++) {
      const sem = semesters[i];
      const semSgpa = calculateSgpa(sem, scale);
      const semName = sem.name.replace(/\s*\(current\)/i, "");

      semesterTrend.push({
        semester: semName,
        sgpa: semSgpa,
      });

      const subSemesters = semesters.slice(0, i + 1);
      const progressiveCgpa = calculateCgpa(subSemesters, scale);

      cgpaHistory.push({
        semester: semName,
        cgpa: progressiveCgpa,
      });

      if (sem.subjects && sem.subjects.length > 0) {
        for (const subj of sem.subjects) {
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
    }

    // Default subjects fallback if user has no subjects recorded yet
    if (allSubjects.length === 0) {
      allSubjects = [
        { name: "Operating Systems", code: "CS204", credits: 4, pct: 94.0, letterGrade: "O", gradePoint: 10 },
        { name: "Data Structures & Algorithms", code: "CS201", credits: 4, pct: 90.0, letterGrade: "O", gradePoint: 10 },
        { name: "Calculus & Linear Algebra", code: "MATH101", credits: 4, pct: 85.0, letterGrade: "A+", gradePoint: 9 },
        { name: "Discrete Mathematics", code: "MATH202", credits: 3, pct: 78.0, letterGrade: "A", gradePoint: 8 },
        { name: "Computer Networks", code: "CS203", credits: 3, pct: 65.0, letterGrade: "B+", gradePoint: 7 },
      ];
    }

    // Sort subjects by score percentage
    allSubjects.sort((a, b) => b.pct - a.pct);

    const highestSubject = allSubjects[0];
    const lowestSubject = allSubjects[allSubjects.length - 1];

    // Credit distribution by category (e.g. Core CS, Math, Physics, Elective)
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

    const creditDistribution = Object.values(categoryMap);

    res.status(200).json({
      semesterTrend,
      cgpaHistory,
      creditDistribution,
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
