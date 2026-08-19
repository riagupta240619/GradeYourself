"use strict";

const mongoose = require("mongoose");

/**
 * StudyMaterial — stores user-uploaded study materials (PDFs, PPTs, images, notes).
 * Each material is associated with a subject and optionally a semester.
 * Supports public/private visibility for sharing.
 */
const studyMaterialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Associations
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
    // Material metadata
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    // Storage path - represents the folder/prefix in the storage service
    // e.g., "semester-4/data-structures/lecture-1.pdf"
    path: {
      type: String,
      required: [true, "Storage path is required"],
    },
    // File characteristics
    fileType: {
      type: String,
      enum: ["pdf", "ppt", "image", "text", "other"],
      default: "other",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    // Visibility & sharing
    isPublic: {
      type: Boolean,
      default: false,
    },
    // Engagement metrics
    downloadCount: {
      type: Number,
      default: 0,
    },
    // Categorization
    tags: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
      default: "",
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

// Index for fast subject/semester lookups
studyMaterialSchema.index({ user: 1, subjectId: 1, semesterId: 1 });
studyMaterialSchema.index({ user: 1, isPublic: 1, createdAt: -1 });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);