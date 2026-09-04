"use strict";

const mongoose = require("mongoose");

/**
 * GitHubLink — stores which repos are linked, starred, or featured.
 */
const githubLinkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    repoFullName: {
      type: String,
      required: true, // e.g., "riagupta240619/gradeyourself"
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
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    primaryLanguage: {
      type: String,
      default: "",
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
      default: null,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      index: true,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    repoDescription: {
      type: String,
      default: "",
    },
    stars: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

githubLinkSchema.index({ user: 1, repoFullName: 1 });

module.exports = mongoose.model("GitHubLink", githubLinkSchema);