"use strict";

const mongoose = require("mongoose");

/**
 * CentralResource — unified resource model for all content types.
 * Evolves from StudyMaterial to support: PDFs, PPTs, Markdown, Notes, External Links,
 * GitHub Files/Repos, YouTube Videos/Playlists, Practice Problems, Quizzes, Flashcards.
 * 
 * Resource ID becomes the universal identifier across all modules.
 * Different modules reference the same resource without duplicating data.
 */
const centralResourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Associations (optional - for academic-linked resources)
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
    // Core metadata
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Resource type discrimination
    type: {
      type: String,
      enum: [
        "pdf",
        "ppt",
        "markdown",
        "note",
        "external_link",
        "github_file",
        "github_repo",
        "youtube_video",
        "youtube_playlist",
        "practice_problem",
        "quiz",
        "flashcard_set",
      ],
      default: "pdf",
      index: true,
    },
    // Source of the resource
    source: {
      type: String,
      enum: ["user_upload", "github", "youtube", "external_url", "platform_generated", "platform_content"],
      default: "user_upload",
      index: true,
    },
    // Visibility & access control
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "private",
      index: true,
    },
    // Storage / external references
    fileName: {
      type: String,
      trim: true,
      default: "",
    },
    path: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      enum: ["pdf", "ppt", "image", "text", "other"],
      default: "other",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    externalUrl: {
      type: String,
      trim: true,
      default: "",
    },
    // GitHub specific
    githubFullName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    githubPath: {
      type: String,
      trim: true,
      default: "",
    },
    // YouTube specific
    youtubeId: {
      type: String,
      trim: true,
      default: "",
    },
    youtubePlaylistId: {
      type: String,
      trim: true,
      default: "",
    },
    // Engagement metrics
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Categorization
    tags: [{
      type: String,
      trim: true,
    }],
    // Metadata for learning/practice/quiz modules
    metadata: {
      subject: { type: String, default: "" },
      topic: { type: String, default: "" },
      semester: { type: String, default: "" },
      difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
      estimatedMinutes: { type: Number, default: 0 },
      pageCount: { type: Number, default: 0 },
      generatedFrom: { type: String, default: "" }, // e.g., "quiz_from_resource"
      // For quiz resources
      questionCount: { type: Number, default: 0 },
      questionTypes: [{ type: String }], // MCQ, True/False, Short Answer
      // For practice problems
      platform: { type: String, default: "" }, // LeetCode, Codeforces, etc.
      problemId: { type: String, default: "" },
      // For learning path modules
      moduleId: { type: String, default: "" },
      learningPathId: { type: String, default: "" },
      order: { type: Number, default: 0 },
    },
    // Audit
    uploader: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns
centralResourceSchema.index({ user: 1, subjectId: 1, semesterId: 1 });
centralResourceSchema.index({ user: 1, visibility: 1, createdAt: -1 });
centralResourceSchema.index({ user: 1, type: 1, source: 1 });
centralResourceSchema.index({ visibility: 1, type: 1, source: 1 }); // Public browsing
centralResourceSchema.index({ githubFullName: 1, githubPath: 1 });
centralResourceSchema.index({ "metadata.subject": 1, "metadata.topic": 1 });

module.exports = mongoose.model("CentralResource", centralResourceSchema);