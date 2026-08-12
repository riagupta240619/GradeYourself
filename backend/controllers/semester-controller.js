const Semester = require("../models/semester-model");
const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const { calculateSgpa, gradeToDetails } = require("../utils/grading-engine");
const { resolveScale } = require("../utils/resolve-scale");



/**
 * Calculate total credits for a semester using the authoritative Subject collection.
 * Falls back to semester.credits (the stored default) if no subjects exist yet.
 */
async function fetchTotalCredits(semesterId, fallbackCredits) {
  const subjects = await SubjectModel.find({ semester: semesterId }).select(
    "credits",
  );
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
  if (
    semester.finalizedSgpa !== null &&
    semester.finalizedSgpa !== undefined &&
    !isNaN(Number(semester.finalizedSgpa))
  ) {
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

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400);
      throw new Error("Semester name is required");
    }

    const numCredits = Number(credits);
    const cleanCredits =
      !isNaN(numCredits) && numCredits >= 1 && numCredits <= 100
        ? numCredits
        : 20;

    let cleanFinalizedSgpa = null;
    if (
      finalizedSgpa !== undefined &&
      finalizedSgpa !== null &&
      finalizedSgpa !== ""
    ) {
      const parsedSgpa = Number(finalizedSgpa);
      if (!isNaN(parsedSgpa) && parsedSgpa >= 0 && parsedSgpa <= 10) {
        cleanFinalizedSgpa = Math.round(parsedSgpa * 100) / 100;
      }
    }

    // Enforce at most one current semester per user
    if (isCurrent) {
      await Semester.updateMany({ user: req.user._id }, { isCurrent: false });
    }

    const semester = await Semester.create({
      user: req.user._id,
      name: name.trim().slice(0, 100),
      isCurrent: Boolean(isCurrent),
      finalizedSgpa: cleanFinalizedSgpa,
      credits: cleanCredits,
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
    let semesters = await Semester.find({ user: req.user._id }).sort({
      createdAt: 1,
    });

    const hasCurrent = semesters.some((s) => s.isCurrent === true);
    if (!hasCurrent && semesters.length > 0) {
      let maxSemNum = 0;
      semesters.forEach((s) => {
        const match = (s.name || "").match(/\d+/);
        if (match) maxSemNum = Math.max(maxSemNum, parseInt(match[0], 10));
      });

      const nextSemNum = maxSemNum > 0 ? maxSemNum + 1 : 1;
      const newCurrent = await Semester.create({
        user: req.user._id,
        name: `Semester ${nextSemNum}`,
        isCurrent: true,
        credits: 20,
      });

      semesters.push(newCurrent);
    }

    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const formatted = await Promise.all(
      semesters.map((sem) => formatSemester(sem, scale)),
    );
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
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const { name, isCurrent, finalizedSgpa, credits } = req.body;

    if (isCurrent) {
      await Semester.updateMany(
        { user: req.user._id, _id: { $ne: semester._id } },
        { isCurrent: false },
      );
      semester.isCurrent = true;
    } else if (isCurrent === false) {
      semester.isCurrent = false;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400);
        throw new Error("Semester name cannot be empty");
      }
      semester.name = name.trim().slice(0, 100);
    }

    if (finalizedSgpa !== undefined) {
      if (finalizedSgpa === null || finalizedSgpa === "") {
        semester.finalizedSgpa = null;
      } else {
        const parsedSgpa = Number(finalizedSgpa);
        if (!isNaN(parsedSgpa) && parsedSgpa >= 0 && parsedSgpa <= 10) {
          semester.finalizedSgpa = Math.round(parsedSgpa * 100) / 100;
        }
      }
    }

    if (credits !== undefined) {
      const numCredits = Number(credits);
      if (!isNaN(numCredits) && numCredits >= 1 && numCredits <= 100) {
        semester.credits = numCredits;
      }
    }

    const updated = await semester.save();
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);
    const formatted = await formatSemester(updated, scale);
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/semesters/:id/full
 * @desc    Update a semester and replace its subjects list with updated snapshot details.
 * @access  Private
 */
const updateFullSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const { name, credits, finalizedSgpa, cgpa, subjects } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400);
        throw new Error("Semester name cannot be empty");
      }
      semester.name = name.trim().slice(0, 100);
    }

    if (credits !== undefined) {
      const numCredits = Number(credits);
      if (!isNaN(numCredits) && numCredits >= 1 && numCredits <= 100) {
        semester.credits = numCredits;
      }
    }

    if (finalizedSgpa !== undefined) {
      if (finalizedSgpa === null || finalizedSgpa === "") {
        semester.finalizedSgpa = null;
      } else {
        const parsedSgpa = Number(finalizedSgpa);
        if (!isNaN(parsedSgpa) && parsedSgpa >= 0 && parsedSgpa <= 10) {
          semester.finalizedSgpa = Math.round(parsedSgpa * 100) / 100;
        }
      }
    }

    if (cgpa !== undefined) {
      if (cgpa === null || cgpa === "") {
        semester.cgpa = null;
      } else {
        const parsedCgpa = Number(cgpa);
        if (!isNaN(parsedCgpa) && parsedCgpa >= 0 && parsedCgpa <= 10) {
          semester.cgpa = Math.round(parsedCgpa * 100) / 100;
        }
      }
    }

    // Update subjects array if provided
    if (Array.isArray(subjects)) {
      // Clear previous subjects for this semester
      await SubjectModel.deleteMany({
        semester: semester._id,
        user: req.user._id,
      });

      // Resolve user and scale once before the loop (avoids N+1 DB queries)
      const user = await User.findById(req.user._id);
      const scale = resolveScale(user);

      for (const subInput of subjects) {
        if (!subInput.name && !subInput.subjectName) continue;
        const subjName = (subInput.subjectName || subInput.name).trim();
        const subjCode = (subInput.subjectCode || subInput.code || "").trim();
        const numCredits = Number(subInput.credits) || 3;

        const gradeVal =
          subInput.grade ||
          subInput.letterGrade ||
          subInput.targetGrade ||
          null;
        const details = gradeVal
          ? gradeToDetails(gradeVal, scale)
          : { letter: "P", points: 4.0, pct: 50 };

        const gradePointVal =
          subInput.gradePoint !== undefined &&
          subInput.gradePoint !== null &&
          subInput.gradePoint !== ""
            ? Number(subInput.gradePoint)
            : details.points;

        const finalPctVal =
          subInput.finalPercentage !== undefined &&
          subInput.finalPercentage !== null &&
          subInput.finalPercentage !== ""
            ? Number(subInput.finalPercentage)
            : subInput.pct !== undefined &&
                subInput.pct !== null &&
                subInput.pct !== ""
              ? Number(subInput.pct)
              : details.pct;

        const statusVal =
          subInput.status &&
          [
            "completed",
            "in_progress",
            "reappear",
            "backlog",
            "incomplete",
            "withheld_result",
          ].includes(subInput.status)
            ? subInput.status
            : gradeVal || finalPctVal !== null || subInput.marksObtained !== null
              ? "completed"
              : "in_progress";

        await SubjectModel.create({
          user: req.user._id,
          semester: semester._id,
          name: subjName,
          code: subjCode,
          credits: numCredits,
          colorTag: subInput.colorTag || "#6366f1",
          targetGrade: gradeVal || "A",
          grade: gradeVal || details.letter,
          gradePoint: gradePointVal,
          status: statusVal,
          marksObtained:
            subInput.marksObtained !== undefined &&
            subInput.marksObtained !== null &&
            subInput.marksObtained !== ""
              ? Number(subInput.marksObtained)
              : null,
          maxMarks:
            subInput.maxMarks !== undefined &&
            subInput.maxMarks !== null &&
            subInput.maxMarks !== ""
              ? Number(subInput.maxMarks)
              : null,
          finalPercentage: finalPctVal,
          assessments: Array.isArray(subInput.assessments)
            ? subInput.assessments
            : [],
          marks: subInput.marks || {},
        });
      }
    }

    semester.updatedAt = new Date();
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
    const semester = await Semester.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    // Cascade-delete all subjects that belonged to this semester
    await SubjectModel.deleteMany({
      semester: semester._id,
      user: req.user._id,
    });

    res
      .status(200)
      .json({ message: "Semester deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK TRANSCRIPT IMPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/semesters/bulk-transcript
 * @desc    Persist extracted & user-verified transcript data (semesters + subjects) to DB.
 * @access  Private
 */
const bulkSaveTranscript = async (req, res, next) => {
  try {
    const { semesters, university, program } = req.body;

    if (!Array.isArray(semesters) || semesters.length === 0) {
      res.status(400);
      throw new Error("Invalid request: semesters array is required");
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    const scale = resolveScale(user);

    const savedSemesters = [];

    for (const semInput of semesters) {
      const name =
        semInput.semesterName || `Semester ${semInput.semester || 1}`;
      const sgpa =
        semInput.sgpa !== null && semInput.sgpa !== undefined
          ? Number(semInput.sgpa)
          : null;
      const cgpa =
        semInput.cgpa !== null && semInput.cgpa !== undefined
          ? Number(semInput.cgpa)
          : null;
      const credits = Number(semInput.credits) || 20;

      // Find existing semester or create new
      let semesterObj = await Semester.findOne({
        user: userId,
        name: name.trim(),
      });
      if (semesterObj) {
        semesterObj.finalizedSgpa = sgpa;
        semesterObj.cgpa = cgpa;
        semesterObj.credits = credits;
        semesterObj.isCurrent = false;
        await semesterObj.save();
      } else {
        semesterObj = await Semester.create({
          user: userId,
          name: name.trim(),
          isCurrent: false,
          finalizedSgpa: sgpa,
          cgpa: cgpa,
          credits: credits,
        });
      }

      // Add/Update subjects for this semester
      if (Array.isArray(semInput.subjects)) {
        // Clear previous subjects for clean update if overwriting
        await SubjectModel.deleteMany({
          semester: semesterObj._id,
          user: userId,
        });

        for (const subInput of semInput.subjects) {
          if (!subInput.name) continue;

          const gradeVal = subInput.grade || subInput.targetGrade || null;
          const details = gradeVal
            ? gradeToDetails(gradeVal, scale)
            : { letter: "P", points: 4.0, pct: 50 };

          const gradePointVal =
            subInput.gradePoint !== undefined &&
            subInput.gradePoint !== null &&
            subInput.gradePoint !== ""
              ? Number(subInput.gradePoint)
              : details.points;

          const finalPctVal =
            subInput.finalPercentage !== undefined &&
            subInput.finalPercentage !== null &&
            subInput.finalPercentage !== ""
              ? Number(subInput.finalPercentage)
              : subInput.pct !== undefined &&
                  subInput.pct !== null &&
                  subInput.pct !== ""
                ? Number(subInput.pct)
                : details.pct;

          const bulkStatusVal =
            subInput.status &&
            [
              "completed",
              "in_progress",
              "reappear",
              "backlog",
              "incomplete",
              "withheld_result",
            ].includes(subInput.status)
              ? subInput.status
              : gradeVal || finalPctVal !== null || subInput.marksObtained !== null
                ? "completed"
                : "in_progress";

          await SubjectModel.create({
            user: userId,
            semester: semesterObj._id,
            name: subInput.name.trim(),
            code: (subInput.code || "").trim(),
            credits: Number(subInput.credits) || 3,
            colorTag: "#6366f1",
            targetGrade: gradeVal || "A",
            grade: gradeVal || details.letter,
            gradePoint: gradePointVal,
            status: bulkStatusVal,
            marksObtained:
              subInput.marksObtained !== undefined &&
              subInput.marksObtained !== null &&
              subInput.marksObtained !== ""
                ? Number(subInput.marksObtained)
                : null,
            maxMarks:
              subInput.maxMarks !== undefined &&
              subInput.maxMarks !== null &&
              subInput.maxMarks !== ""
                ? Number(subInput.maxMarks)
                : null,
            finalPercentage: finalPctVal,
            assessments: Array.isArray(subInput.assessments)
              ? subInput.assessments
              : [],
            marks: subInput.marks || {},
          });
        }
      }

      const formatted = await formatSemester(semesterObj, scale);
      savedSemesters.push(formatted);
    }

    // CGPA belongs to the user profile rather than an individual semester.
    // Preserve the last valid CGPA value the user confirmed in the editable preview.
    const latestCgpa = [...semesters]
      .sort((a, b) => Number(b.semester || 0) - Number(a.semester || 0))
      .map((semester) => Number(semester.cgpa))
      .find((value) => Number.isFinite(value) && value >= 0 && value <= 10);

    if (latestCgpa !== undefined) user.currentCgpa = latestCgpa;
    if (typeof university === "string" && university.trim())
      user.college = university.trim().slice(0, 150);
    if (typeof program === "string" && program.trim())
      user.course = program.trim().slice(0, 150);
    if (
      latestCgpa !== undefined ||
      (typeof university === "string" && university.trim()) ||
      (typeof program === "string" && program.trim())
    ) {
      await user.save();
    }
    res.status(200).json({
      message: `Successfully saved ${savedSemesters.length} semester records to database.`,
      savedSemesters,
      university,
      program,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/semesters/:id/finalize
 * @desc    Finalize an active current semester, locking its SGPA, moving it to CompletedSemesters,
 *          and initializing a new active current semester.
 * @access  Private
 */
const finalizeSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!semester) {
      res.status(404);
      throw new Error("Semester not found");
    }

    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    const subjects = await SubjectModel.find({
      semester: semester._id,
      user: req.user._id,
    });
    const fakeSem = { finalizedSgpa: null, subjects };
    const computedSgpa = calculateSgpa(fakeSem, scale);

    const finalSgpa =
      req.body.finalizedSgpa !== undefined &&
      req.body.finalizedSgpa !== null &&
      req.body.finalizedSgpa !== ""
        ? Number(req.body.finalizedSgpa)
        : computedSgpa !== null
          ? computedSgpa
          : 8.0;

    semester.isCurrent = false;
    semester.finalizedSgpa = Math.round(finalSgpa * 100) / 100;
    await semester.save();

    // Determine name for the new current semester
    const match = (semester.name || "").match(/\d+/);
    const semNum = match ? parseInt(match[0], 10) : 1;
    const newSemName = `Semester ${semNum + 1}`;

    const newCurrent = await Semester.create({
      user: req.user._id,
      name: newSemName,
      isCurrent: true,
      credits: 20,
    });

    const formattedFinalized = await formatSemester(semester, scale);
    const formattedNew = await formatSemester(newCurrent, scale);

    res.status(200).json({
      message: `Successfully finalized ${semester.name}. It is now in CompletedSemesters.`,
      finalizedSemester: formattedFinalized,
      newCurrentSemester: formattedNew,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSemester,
  getSemesters,
  updateSemester,
  updateFullSemester,
  deleteSemester,
  bulkSaveTranscript,
  finalizeSemester,
};
