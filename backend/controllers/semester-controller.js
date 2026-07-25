const Semester = require("../models/semester-model");
const User = require("../models/user-model");
const { calculateSgpa } = require("../utils/grading-engine");

/**
 * Calculate total credits for a semester (from subjects or default credits)
 */
function calculateTotalCredits(semester) {
  if (semester.subjects && semester.subjects.length > 0) {
    return semester.subjects.reduce((sum, subj) => sum + (subj.credits || 0), 0);
  }
  return semester.credits || 20;
}

/**
 * Format semester with backend computed SGPA and total credits
 */
async function formatSemester(semester, userId) {
  const user = await User.findById(userId);
  const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
  const sgpa = calculateSgpa(semester, scale);
  const totalCredits = calculateTotalCredits(semester);

  return {
    ...semester.toObject(),
    calculatedSgpa: sgpa,
    totalCredits,
  };
}

/**
 * @route   POST /api/semesters
 * @desc    Add / Create a new semester
 * @access  Private
 */
const addSemester = async (req, res, next) => {
  try {
    const { name, isCurrent, finalizedSgpa, credits, subjects } = req.body;

    if (!name || name.trim() === "") {
      res.status(400);
      throw new Error("Semester name is required");
    }

    if (isCurrent) {
      await Semester.updateMany({ user: req.user._id }, { isCurrent: false });
    }

    const semester = await Semester.create({
      user: req.user._id,
      name: name.trim(),
      isCurrent: isCurrent || false,
      finalizedSgpa: finalizedSgpa !== undefined ? finalizedSgpa : null,
      credits: Number(credits) || 20,
      subjects: subjects || [],
    });

    const formatted = await formatSemester(semester, req.user._id);
    res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/semesters
 * @desc    Get all user semesters with backend computed SGPA and total credits
 * @access  Private
 */
const getSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const formattedSemesters = semesters.map((sem) => ({
      ...sem.toObject(),
      calculatedSgpa: calculateSgpa(sem, scale),
      totalCredits: calculateTotalCredits(sem),
    }));

    res.status(200).json(formattedSemesters);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/semesters/:id
 * @desc    Update a semester
 * @access  Private
 */
const updateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.id, user: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const { name, isCurrent, finalizedSgpa, credits, subjects } = req.body;

    if (isCurrent) {
      await Semester.updateMany({ user: req.user._id, _id: { $ne: semester._id } }, { isCurrent: false });
      semester.isCurrent = true;
    } else if (isCurrent === false) {
      semester.isCurrent = false;
    }

    if (name !== undefined) semester.name = name.trim();
    if (finalizedSgpa !== undefined) semester.finalizedSgpa = finalizedSgpa;
    if (credits !== undefined) semester.credits = Number(credits);
    if (subjects !== undefined) semester.subjects = subjects;

    const updatedSemester = await semester.save();
    const formatted = await formatSemester(updatedSemester, req.user._id);
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/semesters/:id
 * @desc    Delete a semester
 * @access  Private
 */
const deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }
    res.status(200).json({ message: "Semester deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
};
