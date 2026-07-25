"use strict";

const SubjectModel = require("../models/subject-model");
const Semester = require("../models/semester-model");
const User = require("../models/user-model");
const { calculateSubjectScore } = require("../utils/grading-engine");

/**
 * Resolve the user's grading scale from their profile.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

/**
 * Format subject with backend-calculated score, letter grade, and grade points.
 */
function formatSubject(subject, scale) {
  const score = calculateSubjectScore(subject, scale);
  return {
    ...subject.toObject(),
    calculatedPct: score.pct,
    letterGrade: score.letter,
    gradePoint: score.gradePoint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/subjects
 * @desc    Create a subject inside a semester owned by the authenticated user.
 *          The semester's user ownership is verified before creation.
 * @access  Private
 */
const addSubject = async (req, res, next) => {
  try {
    const { name, code, credits, semesterId, internalMarks, externalMarks, targetGrade, colorTag, marks, scheme } = req.body;

    if (!name || name.trim() === "") {
      res.status(400);
      throw new Error("Subject name is required");
    }

    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
      res.status(400);
      throw new Error("Credits must be a valid number between 1 and 10");
    }

    if (!semesterId) {
      res.status(400);
      throw new Error("semesterId is required");
    }

    // ── Verify semester exists and belongs to this user ───────────────────────
    const semester = await Semester.findOne({ _id: semesterId, user: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const subject = await SubjectModel.create({
      user: req.user._id,
      semester: semester._id,
      name: name.trim(),
      code: code || "",
      credits: numCredits,
      internalMarks: Number(internalMarks) || 0,
      externalMarks: Number(externalMarks) || 0,
      targetGrade: targetGrade || "A",
      colorTag: colorTag || "#3b82f6",
      marks: marks || {},
      scheme: scheme || undefined,
    });

    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    res.status(201).json(formatSubject(subject, scale));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects for the authenticated user (optionally filtered by semesterId).
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    // Optional filter: /api/subjects?semesterId=xxx
    const query = { user: req.user._id };
    if (req.query.semesterId) {
      query.semester = req.query.semesterId;
    }

    const subjects = await SubjectModel.find(query).sort({ createdAt: -1 });

    const formatted = subjects.map((subj) => formatSubject(subj, scale));
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subjects/:id
 * @desc    Get a single subject owned by the authenticated user.
 * @access  Private
 */
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await SubjectModel.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }

    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    res.status(200).json(formatSubject(subject, scale));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject details or marks.
 *          Ownership is verified via { _id, user } — never trusts client-supplied userId.
 *          If semesterId is being changed, the target semester must also belong to this user.
 * @access  Private
 */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await SubjectModel.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }

    const { name, code, credits, semesterId, internalMarks, externalMarks, targetGrade, colorTag, marks, scheme } = req.body;

    if (name !== undefined) subject.name = name;
    if (code !== undefined) subject.code = code;

    if (credits !== undefined) {
      const numCredits = Number(credits);
      if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
        res.status(400);
        throw new Error("Credits must be a valid number between 1 and 10");
      }
      subject.credits = numCredits;
    }

    // If the caller wants to move the subject to a different semester,
    // verify the target semester also belongs to this user.
    if (semesterId !== undefined) {
      const targetSemester = await Semester.findOne({ _id: semesterId, user: req.user._id });
      if (!targetSemester) {
        res.status(404);
        throw new Error("Target semester not found");
      }
      subject.semester = targetSemester._id;
    }

    if (internalMarks !== undefined) subject.internalMarks = Number(internalMarks);
    if (externalMarks !== undefined) subject.externalMarks = Number(externalMarks);
    if (targetGrade !== undefined) subject.targetGrade = targetGrade;
    if (colorTag !== undefined) subject.colorTag = colorTag;
    if (marks !== undefined) subject.marks = marks;
    if (scheme !== undefined) subject.scheme = scheme;

    const updated = await subject.save();
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    res.status(200).json(formatSubject(updated, scale));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject owned by the authenticated user.
 * @access  Private
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await SubjectModel.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.status(200).json({ message: "Subject deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
