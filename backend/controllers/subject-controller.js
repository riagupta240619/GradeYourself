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
    status: score.status,
    isInProgress: score.isInProgress,
  };
}

/**
 * Helper to safely sanitize marks map and reject NaN, Infinity, or non-numeric junk.
 */
function sanitizeMarksMap(rawMarks) {
  if (!rawMarks || typeof rawMarks !== "object") return new Map();
  const entries = rawMarks instanceof Map ? Array.from(rawMarks.entries()) : Object.entries(rawMarks);
  const cleanMap = new Map();
  for (const [k, v] of entries) {
    if (v === null || v === undefined || v === "") {
      cleanMap.set(String(k), null);
    } else {
      const num = Number(v);
      if (!isNaN(num) && isFinite(num) && num >= 0 && num <= 1000) {
        cleanMap.set(String(k), num);
      }
    }
  }
  return cleanMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
/**
 * Helper to get or create the user's active current semester (isCurrent: true).
 * If all existing semesters are completed (e.g. Semesters 1-4), automatically
 * creates the next semester (e.g. Semester 5).
 */
async function getOrCreateCurrentSemester(userId) {
  let currentSem = await Semester.findOne({ user: userId, isCurrent: true });
  if (currentSem) return currentSem;

  const allSemesters = await Semester.find({ user: userId });
  let maxSemNum = 0;
  allSemesters.forEach((s) => {
    const match = (s.name || "").match(/\d+/);
    if (match) {
      maxSemNum = Math.max(maxSemNum, parseInt(match[0], 10));
    }
  });

  const nextSemNum = maxSemNum > 0 ? maxSemNum + 1 : 1;
  currentSem = await Semester.create({
    user: userId,
    name: `Semester ${nextSemNum}`,
    isCurrent: true,
    credits: 20,
  });

  return currentSem;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/subjects
 * @desc    Create a subject inside the active CurrentSemester owned by the authenticated user.
 * @access  Private
 */
const addSubject = async (req, res, next) => {
  try {
    const { name, code, credits, semesterId, internalMarks, externalMarks, targetGrade, colorTag, marks, scheme } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400);
      throw new Error("Subject name is required");
    }

    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
      res.status(400);
      throw new Error("Credits must be a valid number between 1 and 10");
    }

    // Resolve target semester or get/create active current semester
    let semester = null;
    if (semesterId && typeof semesterId === "string" && semesterId !== "current") {
      semester = await Semester.findOne({ _id: semesterId, user: req.user._id });
    }

    if (!semester) {
      semester = await getOrCreateCurrentSemester(req.user._id);
    }

    // Enforce read-only protection on completed semesters
    if (!semester.isCurrent) {
      res.status(400);
      throw new Error("Cannot add new subjects to a completed semester. Completed semesters are read-only. Please select the active current semester, or use Edit Semester in Past Results.");
    }

    const cleanMarks = sanitizeMarksMap(marks);

    const subject = await SubjectModel.create({
      user: req.user._id,
      semester: semester._id,
      name: name.trim().slice(0, 150),
      code: typeof code === "string" ? code.trim().slice(0, 50) : "",
      credits: numCredits,
      internalMarks: !isNaN(Number(internalMarks)) ? Math.max(0, Math.min(100, Number(internalMarks))) : 0,
      externalMarks: !isNaN(Number(externalMarks)) ? Math.max(0, Math.min(100, Number(externalMarks))) : 0,
      targetGrade: typeof targetGrade === "string" ? targetGrade.slice(0, 5) : "A",
      colorTag: typeof colorTag === "string" ? colorTag.slice(0, 20) : "#3b82f6",
      marks: cleanMarks,
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

    const query = { user: req.user._id };
    if (req.query.semesterId && typeof req.query.semesterId === "string") {
      query.semester = req.query.semesterId;
    } else if (req.query.currentOnly === "true" || req.query.all !== "true") {
      const currentSem = await Semester.findOne({ user: req.user._id, isCurrent: true });
      query.semester = currentSem ? currentSem._id : null;
    }

    const subjects = query.semester === null ? [] : await SubjectModel.find(query).sort({ createdAt: -1 });

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

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400);
        throw new Error("Subject name cannot be empty");
      }
      subject.name = name.trim().slice(0, 150);
    }

    if (code !== undefined) {
      subject.code = typeof code === "string" ? code.trim().slice(0, 50) : "";
    }

    if (credits !== undefined) {
      const numCredits = Number(credits);
      if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
        res.status(400);
        throw new Error("Credits must be a valid number between 1 and 10");
      }
      subject.credits = numCredits;
    }

    if (semesterId !== undefined) {
      const targetSemester = await Semester.findOne({ _id: semesterId, user: req.user._id });
      if (!targetSemester) {
        res.status(404);
        throw new Error("Target semester not found");
      }
      subject.semester = targetSemester._id;
    }

    if (internalMarks !== undefined) {
      const num = Number(internalMarks);
      if (!isNaN(num)) subject.internalMarks = Math.max(0, Math.min(100, num));
    }

    if (externalMarks !== undefined) {
      const num = Number(externalMarks);
      if (!isNaN(num)) subject.externalMarks = Math.max(0, Math.min(100, num));
    }

    if (targetGrade !== undefined && typeof targetGrade === "string") {
      subject.targetGrade = targetGrade.slice(0, 5);
    }

    if (colorTag !== undefined && typeof colorTag === "string") {
      subject.colorTag = colorTag.slice(0, 20);
    }

    if (marks !== undefined) {
      subject.marks = sanitizeMarksMap(marks);
    }

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
