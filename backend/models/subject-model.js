"use strict";

const mongoose = require("mongoose");

const assessmentTypeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  weightPct: { type: Number, required: true },
});

/**
 * Subject — authoritative single representation of a subject.
 *
 * Ownership chain:  Subject → Semester → User
 *
 * Every subject belongs to exactly one authenticated user and exactly one
 * semester owned by that user.  The `user` field is denormalized for fast
 * ownership queries without joining through Semester.
 *
 * Indexes:
 *   { user }           — all subjects for a user  (GET /api/subjects)
 *   { user, semester } — subjects for a specific semester (dashboard, analytics)
 */
const subjectSchema = new mongoose.Schema(
  {
    // ── Ownership ────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
      index: true,
    },

    // ── Identity ─────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Credits is required"],
      min: [1, "Credits must be at least 1"],
      max: [10, "Credits cannot exceed 10"],
      default: 3,
    },
    colorTag: {
      type: String,
      default: "#3b82f6",
    },
    targetGrade: {
      type: String,
      default: "A",
    },

    // ── Marks ─────────────────────────────────────────────────────────────────
    // Flexible map: assessmentType.id → mark value
    // e.g. { a1: 18, m1: 26, f1: 45 }
    marks: {
      type: Map,
      of: Number,
      default: {},
    },

    // Legacy scalar fields kept for backward compatibility with existing records
    // and the existing frontend write path (PUT /api/subjects sends these)
    internalMarks: {
      type: Number,
      default: 0,
      min: [0, "Internal marks cannot be negative"],
      max: [100, "Internal marks cannot exceed 100"],
    },
    externalMarks: {
      type: Number,
      default: 0,
      min: [0, "External marks cannot be negative"],
      max: [100, "External marks cannot exceed 100"],
    },

    // ── Assessment Scheme ─────────────────────────────────────────────────────
    scheme: {
      assessmentTypes: {
        type: [assessmentTypeSchema],
        default: [
          { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
          { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
          { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
        ],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for the most common query pattern: subjects by user + semester
subjectSchema.index({ user: 1, semester: 1 });

const SubjectModel = mongoose.model("Subject", subjectSchema);

module.exports = SubjectModel;
