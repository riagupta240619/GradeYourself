const Semester = require("../models/semester-model");
const User = require("../models/user-model");
const {
  calculateCgpa,
  calculateSgpa,
  calculateSubjectScore,
  findAtRiskSubjects,
} = require("../utils/grading-engine");

// Initial seed data generator for new users
const defaultInitialSemesters = [
  {
    name: "Semester 1",
    isCurrent: false,
    finalizedSgpa: 8.4,
    credits: 20,
    subjects: [
      {
        name: "Calculus & Linear Algebra",
        code: "MATH101",
        credits: 4,
        targetGrade: "A",
        marks: { a1: 18, m1: 26, f1: 45 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
    ],
  },
  {
    name: "Semester 2",
    isCurrent: false,
    finalizedSgpa: 8.6,
    credits: 20,
    subjects: [
      {
        name: "Physics for Engineers",
        code: "PHYS102",
        credits: 4,
        targetGrade: "A",
        marks: { a1: 19, m1: 27, f1: 46 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
    ],
  },
  {
    name: "Semester 3",
    isCurrent: false,
    finalizedSgpa: 8.8,
    credits: 22,
    subjects: [
      {
        name: "Data Structures & Algorithms",
        code: "CS201",
        credits: 4,
        targetGrade: "A",
        marks: { a1: 17, m1: 25, f1: 44 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
    ],
  },
  {
    name: "Semester 4 (Current)",
    isCurrent: true,
    finalizedSgpa: null,
    credits: 22,
    subjects: [
      {
        name: "Data Structures & Algorithms",
        code: "CS201",
        credits: 4,
        targetGrade: "A+",
        marks: { a1: 18, m1: 27 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
      {
        name: "Database Management Systems",
        code: "CS202",
        credits: 4,
        targetGrade: "A",
        marks: { a1: 16, m1: 22 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
      {
        name: "Computer Networks",
        code: "CS203",
        credits: 3,
        targetGrade: "B+",
        marks: { a1: 10, m1: 12 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
      {
        name: "Operating Systems",
        code: "CS204",
        credits: 4,
        targetGrade: "A",
        marks: { a1: 19, m1: 28 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
      {
        name: "Discrete Mathematics",
        code: "MATH202",
        credits: 3,
        targetGrade: "A",
        marks: { a1: 15, m1: 21 },
        scheme: {
          assessmentTypes: [
            { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
            { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
            { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
          ],
        },
      },
    ],
  },
];

/**
 * Ensure user has initial semester data in MongoDB
 */
async function ensureUserSemesters(userId) {
  let userSemesters = await Semester.find({ user: userId });
  if (userSemesters.length === 0) {
    const created = [];
    for (const semData of defaultInitialSemesters) {
      const sem = await Semester.create({
        user: userId,
        ...semData,
      });
      created.push(sem);
    }
    return created;
  }
  return userSemesters;
}

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary metrics, user profile, semester data, CGPA, and subjects
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const userSemesters = await ensureUserSemesters(req.user._id);

    // Determine scale from user profile (e.g. 4.0 GPA vs 10.0 CGPA)
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    // Compute backend CGPA & SGPA
    const calculatedCgpa = calculateCgpa(userSemesters, scale);

    const currentSemester = userSemesters.find((s) => s.isCurrent) || userSemesters[userSemesters.length - 1];
    const calculatedSgpa = calculateSgpa(currentSemester, scale);

    // Calculate total credits
    const totalCredits = userSemesters.reduce((sum, sem) => {
      const semCredits = sem.credits || (sem.subjects && sem.subjects.length > 0 ? sem.subjects.reduce((a, b) => a + (b.credits || 0), 0) : 20);
      return sum + semCredits;
    }, 0);

    // CGPA trend calculation
    const cgpaTrend = userSemesters.map((sem) => ({
      semester: sem.name.replace(/\s*\(current\)/i, ""),
      sgpa: calculateSgpa(sem, scale),
    }));

    // Current subjects with computed scores & letter grades
    const currentSubjects = (currentSemester?.subjects || []).map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        ...subj.toObject(),
        calculatedPct: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
      };
    });

    // At-risk subjects calculation
    const atRiskSubjects = findAtRiskSubjects(currentSemester?.subjects || [], scale);

    res.status(200).json({
      user,
      cgpa: calculatedCgpa,
      sgpa: calculatedSgpa,
      totalCredits,
      targetCgpa: scale === "4.0" ? 3.8 : 9.0,
      currentSemester,
      semesters: userSemesters,
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
 * @desc    Get user semesters list
 * @access  Private
 */
const getSemesters = async (req, res, next) => {
  try {
    const userSemesters = await ensureUserSemesters(req.user._id);
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const formattedSemesters = userSemesters.map((sem) => ({
      ...sem.toObject(),
      calculatedSgpa: calculateSgpa(sem, scale),
    }));

    res.status(200).json(formattedSemesters);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/subjects
 * @desc    Get subjects for the active semester with backend calculated grades
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const userSemesters = await ensureUserSemesters(req.user._id);
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const active = userSemesters.find((s) => s.isCurrent) || userSemesters[userSemesters.length - 1];
    const subjects = (active?.subjects || []).map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        ...subj.toObject(),
        calculatedPct: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
      };
    });

    res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/cgpa
 * @desc    Get CGPA breakdown
 * @access  Private
 */
const getCgpaSummary = async (req, res, next) => {
  try {
    const userSemesters = await ensureUserSemesters(req.user._id);
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const cgpa = calculateCgpa(userSemesters, scale);
    const totalCredits = userSemesters.reduce((sum, sem) => sum + (sem.credits || 20), 0);

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
