"use strict";

const mongoose = require("mongoose");

/**
 * Semester — belongs to exactly one User.
 *
 * Subjects are stored in the standalone Subject collection (not embedded here).
 * This removes the split-brain duplication identified in the Step 3A audit.
 *
 * For past/finalized semesters, `finalizedSgpa` holds the permanent SGPA value.
 * For the current semester, SGPA is calculated live by the grading engine using
 * Subject records.
 *
 * Index:
 *   { user } — all semesters for a user
 */
const semesterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Semester name is required"],
      trim: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    // Stores the locked/finalized SGPA for past semesters.
    // null means semester is active (SGPA calculated live).
    finalizedSgpa: {
      type: Number,
      default: null,
    },
    // Stores the official CGPA value associated with this semester snapshot.
    // This is optional and may be computed on demand when absent.
    cgpa: {
      type: Number,
      default: null,
    },
    // Total credits for the semester (used for CGPA weighting).
    // Overridden by the sum of Subject.credits when subjects exist.
    credits: {
      type: Number,
      default: 20,
    },
  },
  {
    timestamps: true,
  },
);

const Semester = mongoose.model("Semester", semesterSchema);

module.exports = Semester;
