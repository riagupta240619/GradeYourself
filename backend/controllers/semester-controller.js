"use strict";

const Semester = require("../models/semester-model");
const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const { calculateSgpa, calculateSubjectScore } = require("../utils/grading-engine");

/**
 * Resolve the user's grading scale from their profile.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

/**
 * Calculate total credits for a semester using the authoritative Subject collection.
 * Falls back to semester.credits (the stored default) if no subjects exist yet.
 */
async function fetchTotalCredits(semesterId, fallbackCredits) {
  const subjects = await SubjectModel.find({ semester: semesterId }).select("credits");
  if (subjects.length > 0) {
    return subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  }
  return fallbackCredits || 20;
}

/**
 * Build the SGPA for a semester.
 * For finalized semesters, uses stored finalizedSgpa.
 * For active semesters, calculates live from Subject collection.
 */
async function computeSemesterSgpa(semester, scale) {
  if (semester.finalizedSgpa !== null && semester.finalizedSgpa !== undefined && !isNaN(Number(semester.finalizedSgpa))) {
    return Number(semester.finalizedSgpa);
  }
  // Live calculation — fetch subjects from collection
  const subjects = await SubjectModel.find({ semester: semester._id });
  const fakeSem = { finalizedSgpa: null, subjects };
  return calculateSgpa(fakeSem, scale);
}

/**
 * Format a semester with backend-computed SGPA and totalCredits.
 */
async function formatSemester(semester, scale) {
  const sgpa = await computeSemesterSgpa(semester, scale);
  const totalCredits = await fetchTotalCredits(semester._id, semester.credits);

  return {
    ...semester.toObject(),
    calculatedSgpa: sgpa,
    totalCredits,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/semesters
 * @desc    Create a new semester for the authenticated user.
 * @access  Private
 */
const addSemester = async (req, res, next) => {
  try {
    const { name, isCurrent, finalizedSgpa, credits } = req.body;

    if (!name || name.trim() === "") {
      res.status(400);
      throw new Error("Semester name is required");
    }

    // Enforce at most one current semester per user
    if (isCurrent) {
      await Semester.updateMany({ user: req.user._id }, { isCurrent: false });
    }

    const semester = await Semester.create({
      user: req.user._id,
      name: name.trim(),
      isCurrent: isCurrent || false,
      finalizedSgpa: finalizedSgpa !== undefined ? finalizedSgpa : null,
      credits: Number(credits) || 20,
    });

    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    const formatted = await formatSemester(semester, scale);
    res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/semesters
 * @desc    Get all semesters for the authenticated user.
 * @access  Private
 */
const getSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ user: req.user._id }).sort({ createdAt: 1 });
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const formatted = await Promise.all(semesters.map((sem) => formatSemester(sem, scale)));
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/semesters/:id
 * @desc    Update a semester owned by the authenticated user.
 *          Ownership verified via { _id, user } — never trusts client-supplied userId.
 * @access  Private
 */
const updateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.id, user: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const { name, isCurrent, finalizedSgpa, credits } = req.body;

    if (isCurrent) {
      await Semester.updateMany({ user: req.user._id, _id: { $ne: semester._id } }, { isCurrent: false });
      semester.isCurrent = true;
    } else if (isCurrent === false) {
      semester.isCurrent = false;
    }

    if (name !== undefined) semester.name = name.trim();
    if (finalizedSgpa !== undefined) semester.finalizedSgpa = finalizedSgpa;
    if (credits !== undefined) semester.credits = Number(credits);

    const updated = await semester.save();
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    const formatted = await formatSemester(updated, scale);
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/semesters/:id
 * @desc    Delete a semester and all its subjects (cascade) owned by the authenticated user.
 * @access  Private
 */
const deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    // Cascade-delete all subjects that belonged to this semester
    await SubjectModel.deleteMany({ semester: semester._id, user: req.user._id });

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
