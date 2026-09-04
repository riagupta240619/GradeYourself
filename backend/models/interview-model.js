"use strict";

const mongoose = require("mongoose");

const starResponseSchema = new mongoose.Schema(
  {
    situation: { type: String, trim: true, default: "" },
    task: { type: String, trim: true, default: "" },
    action: { type: String, trim: true, default: "" },
    result: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const interviewQuestionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
      default: "",
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Data Structures",
        "Algorithms",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "OOP",
        "System Design",
        "Projects",
        "Behavioral",
        "General",
      ],
      default: "Data Structures",
      index: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    company: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    role: {
      type: String,
      trim: true,
      default: "Software Engineer",
      index: true,
    },
    type: {
      type: String,
      enum: ["technical", "behavioral", "coding", "project"],
      default: "technical",
      index: true,
    },
    starResponse: {
      type: starResponseSchema,
      default: () => ({}),
    },
    source: {
      type: String,
      trim: true,
      default: "Personal",
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: "",
    },
    problemUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["not_started", "practicing", "confident"],
      default: "not_started",
      index: true,
    },
    isPracticed: {
      type: Boolean,
      default: false,
    },
    isConfident: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    isPersonal: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ user: 1, type: 1, category: 1 });
interviewQuestionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("InterviewQuestion", interviewQuestionSchema);
