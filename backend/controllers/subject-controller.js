const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const { calculateSubjectScore } = require("../utils/grading-engine");

/**
 * Format subject with backend calculated score & grade metrics
 */
async function formatSubject(subject, userId) {
  const user = await User.findById(userId);
  const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
  const score = calculateSubjectScore(subject, scale);

  return {
    ...subject.toObject(),
    calculatedPct: score.pct,
    letterGrade: score.letter,
    gradePoint: score.gradePoint,
  };
}

/**
 * @route   POST /api/subjects
 * @desc    Create / Add a new subject with credit & mark validations
 * @access  Private
 */
const addSubject = async (req, res, next) => {
  try {
    const { name, code, credits, semester, internalMarks, externalMarks, targetGrade, colorTag, marks, scheme } = req.body;

    if (!name || name.trim() === "") {
      res.status(400);
      throw new Error("Subject name is required");
    }

    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 1 || numCredits > 10) {
      res.status(400);
      throw new Error("Credits must be a valid number between 1 and 10");
    }

    const subject = await SubjectModel.create({
      user: req.user._id,
      name: name.trim(),
      code: code || "",
      credits: numCredits,
      semester: semester || "Semester 4",
      internalMarks: Number(internalMarks) || 0,
      externalMarks: Number(externalMarks) || 0,
      targetGrade: targetGrade || "A",
      colorTag: colorTag || "#3b82f6",
      marks: marks || {},
      scheme: scheme || undefined,
    });

    const formatted = await formatSubject(subject, req.user._id);
    res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects for authenticated user with calculated grades
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await SubjectModel.find({ user: req.user._id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user._id);
    const scale = user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";

    const formattedSubjects = subjects.map((subj) => {
      const score = calculateSubjectScore(subj, scale);
      return {
        ...subj.toObject(),
        calculatedPct: score.pct,
        letterGrade: score.letter,
        gradePoint: score.gradePoint,
      };
    });

    res.status(200).json(formattedSubjects);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subjects/:id
 * @desc    Get single subject by ID
 * @access  Private
 */
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await SubjectModel.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    const formatted = await formatSubject(subject, req.user._id);
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject details or marks
 * @access  Private
 */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await SubjectModel.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }

    const { name, code, credits, semester, internalMarks, externalMarks, targetGrade, colorTag, marks, scheme } = req.body;

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
    if (semester !== undefined) subject.semester = semester;
    if (internalMarks !== undefined) subject.internalMarks = Number(internalMarks);
    if (externalMarks !== undefined) subject.externalMarks = Number(externalMarks);
    if (targetGrade !== undefined) subject.targetGrade = targetGrade;
    if (colorTag !== undefined) subject.colorTag = colorTag;
    if (marks !== undefined) subject.marks = marks;
    if (scheme !== undefined) subject.scheme = scheme;

    const updatedSubject = await subject.save();
    const formatted = await formatSubject(updatedSubject, req.user._id);
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject by ID
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
