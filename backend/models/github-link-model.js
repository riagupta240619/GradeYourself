"use strict";

const mongoose = require("mongoose");

/**
 * GitHubLink — stores which repos are linked to which subjects/semesters.
 * A user can link multiple repos across different subjects/semesters.
 */
const githubLinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // Which repo is linked
  repoFullName: {
    type: String,
    required: true, // e.g., "riagupta240619/course-notes"
    index: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  htmlUrl: {
    type: String,
    required: true,
  },
  // Linking metadata
  linkedAt: {
    type: Date,
    default: Date.now,
  },
  // Which subject/semester this repo is associated with
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    index: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    index: true,
  },
  // Visibility control
  isPublic: {
    type: Boolean,
    default: false,
  },
  // Cached repo info
  repoDescription: {
    type: String,
    default: "",
  },
  stars: {
    type: Number,
    default: 0,
  },
});

// Compound index to ensure a repo isn't linked twice to the same subject/semester
githubLinkSchema.index({ user: 1, repoFullName: 1, subjectId: 1, semesterId: 1 }, { unique: true });

module.exports = mongoose.model("GitHubLink", githubLinkSchema);