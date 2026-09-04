"use strict";

const mongoose = require("mongoose");

/**
 * AcademicProfile — optional academic profile linked to User.
 * Created when user opts into Academic module (CGPA/SGPA, transcript, etc.).
 * Keeps User model lean; academic data is additive, not mandatory.
 */
const academicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    college: {
      type: String,
      default: "",
      trim: true,
    },
    course: {
      type: String,
      default: "",
      trim: true,
    },
    branch: {
      type: String,
      default: "",
      trim: true,
    },
    semesterSystem: {
      type: String,
      default: "",
      trim: true,
    },
    currentSemester: {
      type: String,
      default: "",
      trim: true,
    },
    academicSession: {
      type: String,
      default: "",
      trim: true,
    },
    currentCgpa: {
      type: Number,
      default: null,
    },
    academicStatus: {
      type: String,
      default: "",
      trim: true,
    },
    targetCgpa: {
      type: Number,
      default: 9.0,
    },
    totalDegreeCredits: {
      type: Number,
      default: 160,
    },
    transcriptStatus: {
      type: String,
      enum: ["pending", "uploaded", "verified", "parsed"],
      default: "pending",
    },
    transcriptFileUrl: {
      type: String,
      default: "",
    },
    transcriptParsedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

academicProfileSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const AcademicProfile = mongoose.model("AcademicProfile", academicProfileSchema);

module.exports = AcademicProfile;